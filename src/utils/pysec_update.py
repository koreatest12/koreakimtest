#!/usr/bin/env python3
"""
Python Security Update Tool
============================

Comprehensive Python dependency security auditing and upgrade utility.

Features:
- Security vulnerability scanning (pip-audit, safety)
- Static code analysis (bandit)
- Dependency upgrades (conservative or aggressive)
- Requirements compilation (pip-tools)
- Detailed security reports

Usage:
    # Basic: Conservative upgrade + audit report
    python pysec_update.py

    # With requirements file + bandit + freeze
    python pysec_update.py --req requirements.txt --bandit --freeze

    # Compile from .in + aggressive upgrade
    python pysec_update.py --req requirements.in --upgrade all

    # Custom report location
    python pysec_update.py --reports .github/echo_security

    # Custom venv path
    python pysec_update.py --venv .venv-py312
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Literal, Optional

# Email notification support (optional)
try:
    from security_notifier import send_security_alert
    EMAIL_AVAILABLE = True
except ImportError:
    EMAIL_AVAILABLE = False


class Colors:
    """ANSI color codes for terminal output"""
    RESET = "\033[0m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"


class SecurityUpdater:
    """Python security update and audit manager"""

    def __init__(
        self,
        req_file: Optional[Path] = None,
        venv_path: Optional[Path] = None,
        reports_dir: Optional[Path] = None,
        upgrade_mode: Literal["conservative", "all", "none"] = "conservative",
        run_bandit: bool = False,
        create_freeze: bool = False,
        verbose: bool = False,
        notify: bool = False,
        notify_threshold: int = 1,
    ):
        self.req_file = req_file
        self.venv_path = venv_path or Path(".venv")
        self.reports_dir = reports_dir or Path("reports/security")
        self.upgrade_mode = upgrade_mode
        self.run_bandit = run_bandit
        self.create_freeze = create_freeze
        self.verbose = verbose
        self.notify = notify
        self.notify_threshold = notify_threshold

        # Ensure reports directory exists
        self.reports_dir.mkdir(parents=True, exist_ok=True)

        # Detect Python executable
        if sys.platform == "win32":
            self.python = self.venv_path / "Scripts" / "python.exe"
            self.pip = self.venv_path / "Scripts" / "pip.exe"
        else:
            self.python = self.venv_path / "bin" / "python"
            self.pip = self.venv_path / "bin" / "pip"

        # Fallback to system python if venv doesn't exist
        if not self.python.exists():
            self.python = Path(sys.executable)
            self.pip = "pip"
            self.log_warn(f"Virtual environment not found at {self.venv_path}, using system Python")

        self.timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        self.report_data = {
            "timestamp": self.timestamp,
            "python_version": self._get_python_version(),
            "venv_path": str(self.venv_path),
            "results": {},
        }

    def log_info(self, msg: str) -> None:
        """Log info message"""
        print(f"{Colors.CYAN}[INFO]{Colors.RESET} {msg}")

    def log_success(self, msg: str) -> None:
        """Log success message"""
        print(f"{Colors.GREEN}[OK]{Colors.RESET} {msg}")

    def log_warn(self, msg: str) -> None:
        """Log warning message"""
        print(f"{Colors.YELLOW}[WARN]{Colors.RESET} {msg}")

    def log_error(self, msg: str) -> None:
        """Log error message"""
        print(f"{Colors.RED}[FAIL]{Colors.RESET} {msg}")

    def log_section(self, title: str) -> None:
        """Log section header"""
        print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'='*70}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.MAGENTA}{title.center(70)}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.MAGENTA}{'='*70}{Colors.RESET}\n")

    def _run_command(
        self,
        cmd: list[str],
        capture: bool = True,
        check: bool = False,
    ) -> subprocess.CompletedProcess:
        """Run shell command and return result"""
        if self.verbose:
            self.log_info(f"Running: {' '.join(str(c) for c in cmd)}")

        try:
            result = subprocess.run(
                cmd,
                capture_output=capture,
                text=True,
                check=check,
            )
            return result
        except subprocess.CalledProcessError as e:
            self.log_error(f"Command failed: {e}")
            if self.verbose:
                print(e.stderr)
            return e

    def _get_python_version(self) -> str:
        """Get Python version"""
        result = self._run_command([str(self.python), "--version"])
        return result.stdout.strip() if result.returncode == 0 else "unknown"

    def ensure_tools_installed(self) -> None:
        """Ensure required security tools are installed"""
        self.log_section("Checking Security Tools")

        tools = {
            "pip-audit": "pip-audit",
            "safety": "safety",
            "pip-tools": "pip-compile",
        }

        if self.run_bandit:
            tools["bandit"] = "bandit"

        for tool_name, command in tools.items():
            result = self._run_command([str(self.pip), "show", tool_name])
            if result.returncode != 0:
                self.log_warn(f"{tool_name} not installed, installing...")
                self._run_command([str(self.pip), "install", tool_name], capture=False)
                self.log_success(f"{tool_name} installed")
            else:
                self.log_success(f"{tool_name} already installed")

    def pip_audit(self) -> dict:
        """Run pip-audit vulnerability scanner"""
        self.log_section("Running pip-audit")

        cmd = [str(self.python), "-m", "pip_audit", "--format", "json"]
        if self.req_file:
            cmd.extend(["--requirement", str(self.req_file)])

        result = self._run_command(cmd)

        if result.returncode == 0:
            self.log_success("No vulnerabilities found")
            audit_data = {"vulnerabilities": [], "status": "clean"}
        else:
            try:
                audit_data = json.loads(result.stdout) if result.stdout else {}
                vuln_count = len(audit_data.get("vulnerabilities", []))
                if vuln_count > 0:
                    self.log_warn(f"Found {vuln_count} vulnerabilities")
                    self._print_vulnerabilities(audit_data.get("vulnerabilities", []))
                else:
                    self.log_success("No vulnerabilities found")
            except json.JSONDecodeError:
                self.log_error("Failed to parse pip-audit output")
                audit_data = {"error": "parse_failed", "output": result.stdout}

        # Save report
        report_file = self.reports_dir / f"pip-audit-{self.timestamp}.json"
        report_file.write_text(json.dumps(audit_data, indent=2), encoding="utf-8")
        self.log_info(f"Report saved: {report_file}")

        return audit_data

    def safety_check(self) -> dict:
        """Run safety vulnerability scanner"""
        self.log_section("Running Safety Check")

        cmd = [str(self.python), "-m", "safety", "check", "--json"]
        if self.req_file:
            cmd.extend(["--file", str(self.req_file)])

        result = self._run_command(cmd)

        try:
            safety_data = json.loads(result.stdout) if result.stdout else []
            vuln_count = len(safety_data)

            if vuln_count == 0:
                self.log_success("No vulnerabilities found")
            else:
                self.log_warn(f"Found {vuln_count} vulnerabilities")

            # Save report
            report_file = self.reports_dir / f"safety-{self.timestamp}.json"
            report_file.write_text(json.dumps(safety_data, indent=2), encoding="utf-8")
            self.log_info(f"Report saved: {report_file}")

            return {"vulnerabilities": safety_data, "count": vuln_count}

        except json.JSONDecodeError:
            self.log_error("Failed to parse safety output")
            return {"error": "parse_failed"}

    def bandit_scan(self) -> dict:
        """Run bandit static security analysis"""
        if not self.run_bandit:
            return {"skipped": True}

        self.log_section("Running Bandit Static Analysis")

        # Scan src/ directory by default
        scan_path = Path("src") if Path("src").exists() else Path(".")

        cmd = [
            str(self.python), "-m", "bandit",
            "-r", str(scan_path),
            "-f", "json",
            "-o", str(self.reports_dir / f"bandit-{self.timestamp}.json"),
        ]

        result = self._run_command(cmd, capture=False)

        if result.returncode == 0:
            self.log_success("Bandit scan completed (no issues)")
        else:
            self.log_warn("Bandit found potential security issues")

        # Read report
        report_file = self.reports_dir / f"bandit-{self.timestamp}.json"
        if report_file.exists():
            bandit_data = json.loads(report_file.read_text(encoding="utf-8"))
            issue_count = len(bandit_data.get("results", []))
            self.log_info(f"Found {issue_count} issues")
            return bandit_data
        else:
            return {"error": "report_not_found"}

    def upgrade_dependencies(self) -> dict:
        """Upgrade dependencies based on mode"""
        if self.upgrade_mode == "none":
            self.log_info("Skipping upgrades (mode: none)")
            return {"skipped": True}

        self.log_section(f"Upgrading Dependencies (mode: {self.upgrade_mode})")

        if self.req_file and self.req_file.suffix == ".in":
            # pip-compile workflow
            return self._compile_requirements()
        else:
            # Direct pip upgrade
            return self._pip_upgrade()

    def _compile_requirements(self) -> dict:
        """Compile requirements.in using pip-compile"""
        self.log_info(f"Compiling {self.req_file} with pip-compile...")

        output_file = self.req_file.with_suffix(".txt")
        cmd = [
            str(self.python), "-m", "piptools", "compile",
            str(self.req_file),
            "--output-file", str(output_file),
        ]

        if self.upgrade_mode == "all":
            cmd.append("--upgrade")

        result = self._run_command(cmd, capture=False, check=False)

        if result.returncode == 0:
            self.log_success(f"Compiled requirements to {output_file}")

            # pip-sync to install
            self.log_info("Syncing environment with compiled requirements...")
            sync_result = self._run_command(
                [str(self.python), "-m", "piptools", "sync", str(output_file)],
                capture=False,
            )

            if sync_result.returncode == 0:
                self.log_success("Environment synced")
                return {"compiled": True, "synced": True, "output": str(output_file)}
            else:
                self.log_warn("Sync had issues")
                return {"compiled": True, "synced": False}
        else:
            self.log_error("Compilation failed")
            return {"compiled": False}

    def _pip_upgrade(self) -> dict:
        """Upgrade packages using pip"""
        if self.upgrade_mode == "all":
            self.log_info("Upgrading all packages...")
            cmd = [str(self.pip), "list", "--outdated", "--format", "json"]
            result = self._run_command(cmd)

            if result.returncode == 0 and result.stdout:
                outdated = json.loads(result.stdout)
                upgraded = []

                for pkg in outdated:
                    pkg_name = pkg["name"]
                    self.log_info(f"Upgrading {pkg_name}...")
                    upgrade_result = self._run_command(
                        [str(self.pip), "install", "--upgrade", pkg_name],
                        capture=not self.verbose,
                    )
                    if upgrade_result.returncode == 0:
                        upgraded.append(pkg_name)

                self.log_success(f"Upgraded {len(upgraded)} packages")
                return {"upgraded": upgraded, "count": len(upgraded)}
            else:
                self.log_info("No outdated packages found")
                return {"upgraded": [], "count": 0}

        elif self.upgrade_mode == "conservative":
            self.log_info("Running conservative upgrade (security patches only)...")
            # Use pip-audit --fix
            cmd = [str(self.python), "-m", "pip_audit", "--fix"]
            if self.req_file:
                cmd.extend(["--requirement", str(self.req_file)])

            result = self._run_command(cmd, capture=False, check=False)

            if result.returncode == 0:
                self.log_success("Security patches applied")
                return {"mode": "conservative", "applied": True}
            else:
                self.log_warn("Some patches could not be applied")
                return {"mode": "conservative", "applied": False}

        return {"mode": self.upgrade_mode}

    def create_requirements_freeze(self) -> dict:
        """Create pip freeze output"""
        if not self.create_freeze:
            return {"skipped": True}

        self.log_section("Creating Requirements Freeze")

        freeze_file = self.reports_dir / f"requirements-freeze-{self.timestamp}.txt"
        result = self._run_command([str(self.pip), "freeze"])

        if result.returncode == 0:
            freeze_file.write_text(result.stdout, encoding="utf-8")
            self.log_success(f"Freeze saved: {freeze_file}")
            return {"saved": True, "file": str(freeze_file)}
        else:
            self.log_error("Failed to create freeze")
            return {"saved": False}

    def _print_vulnerabilities(self, vulnerabilities: list[dict]) -> None:
        """Print vulnerability details"""
        for vuln in vulnerabilities[:5]:  # Show first 5
            print(f"\n  {Colors.RED}●{Colors.RESET} {vuln.get('name', 'unknown')}")
            print(f"    ID: {vuln.get('id', 'N/A')}")
            print(f"    Description: {vuln.get('description', 'N/A')[:100]}...")
            print(f"    Fix: {vuln.get('fix_versions', 'unknown')}")

        if len(vulnerabilities) > 5:
            print(f"\n  ... and {len(vulnerabilities) - 5} more")

    def generate_summary_report(self) -> None:
        """Generate comprehensive summary report"""
        self.log_section("Generating Summary Report")

        summary = {
            "timestamp": self.timestamp,
            "python_version": self.report_data["python_version"],
            "venv_path": str(self.venv_path),
            "upgrade_mode": self.upgrade_mode,
            "results": self.report_data["results"],
        }

        # Save JSON
        json_file = self.reports_dir / f"security-summary-{self.timestamp}.json"
        json_file.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        self.log_success(f"JSON report: {json_file}")

        # Save Markdown
        md_file = self.reports_dir / f"security-summary-{self.timestamp}.md"
        md_content = self._generate_markdown_report(summary)
        md_file.write_text(md_content, encoding="utf-8")
        self.log_success(f"Markdown report: {md_file}")

    def _generate_markdown_report(self, summary: dict) -> str:
        """Generate markdown report"""
        lines = [
            "# Python Security Audit Report",
            "",
            f"**Date:** {summary['timestamp']}  ",
            f"**Python:** {summary['python_version']}  ",
            f"**Venv:** {summary['venv_path']}  ",
            f"**Upgrade Mode:** {summary['upgrade_mode']}  ",
            "",
            "## Summary",
            "",
        ]

        results = summary.get("results", {})

        # pip-audit summary
        if "pip_audit" in results:
            vuln_count = len(results["pip_audit"].get("vulnerabilities", []))
            status = "✅ Clean" if vuln_count == 0 else f"⚠️ {vuln_count} vulnerabilities"
            lines.append(f"- **pip-audit:** {status}")

        # safety summary
        if "safety" in results:
            vuln_count = results["safety"].get("count", 0)
            status = "✅ Clean" if vuln_count == 0 else f"⚠️ {vuln_count} vulnerabilities"
            lines.append(f"- **safety:** {status}")

        # bandit summary
        if "bandit" in results and not results["bandit"].get("skipped"):
            issue_count = len(results["bandit"].get("results", []))
            lines.append(f"- **bandit:** {issue_count} issues found")

        # upgrade summary
        if "upgrade" in results and not results["upgrade"].get("skipped"):
            if "count" in results["upgrade"]:
                lines.append(f"- **Upgrades:** {results['upgrade']['count']} packages upgraded")
            else:
                lines.append(f"- **Upgrades:** Applied ({results['upgrade'].get('mode', 'unknown')} mode)")

        lines.extend([
            "",
            "## Recommendations",
            "",
            "1. Review vulnerability reports in detail",
            "2. Update affected packages to patched versions",
            "3. Consider refactoring code flagged by bandit",
            "4. Run tests after upgrades to ensure compatibility",
            "",
        ])

        return "\n".join(lines)

    def run(self) -> dict:
        """Run complete security update workflow"""
        self.log_section("Python Security Update Tool")
        self.log_info(f"Python: {self.report_data['python_version']}")
        self.log_info(f"Venv: {self.venv_path}")
        self.log_info(f"Reports: {self.reports_dir}")

        # 1. Ensure tools installed
        self.ensure_tools_installed()

        # 2. Run pip-audit
        self.report_data["results"]["pip_audit"] = self.pip_audit()

        # 3. Run safety
        self.report_data["results"]["safety"] = self.safety_check()

        # 4. Run bandit (optional)
        if self.run_bandit:
            self.report_data["results"]["bandit"] = self.bandit_scan()

        # 5. Upgrade dependencies
        self.report_data["results"]["upgrade"] = self.upgrade_dependencies()

        # 6. Create freeze (optional)
        if self.create_freeze:
            self.report_data["results"]["freeze"] = self.create_requirements_freeze()

        # 7. Generate summary
        self.generate_summary_report()

        # 8. Send email notification (optional)
        if self.notify and EMAIL_AVAILABLE:
            self._send_notification()

        self.log_section("Security Audit Complete")
        self.log_success("All reports saved to: " + str(self.reports_dir))

        return self.report_data

    def _send_notification(self) -> None:
        """Send email notification if vulnerabilities exceed threshold"""
        results = self.report_data.get("results", {})
        pip_vulns = len(results.get("pip_audit", {}).get("vulnerabilities", []))
        safety_vulns = results.get("safety", {}).get("count", 0)
        total_vulns = pip_vulns + safety_vulns

        if total_vulns >= self.notify_threshold:
            self.log_info(f"Sending email notification ({total_vulns} vulnerabilities)...")
            try:
                success = send_security_alert(
                    summary_data=self.report_data,
                    attach_reports=True,
                    reports_dir=self.reports_dir,
                )
                if success:
                    self.log_success("Email notification sent")
                else:
                    self.log_warn("Failed to send email notification")
            except Exception as e:
                self.log_error(f"Email notification error: {e}")
        else:
            self.log_info(f"No notification sent (vulnerabilities: {total_vulns}, threshold: {self.notify_threshold})")


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Python Security Update and Audit Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic: Conservative upgrade + audit
  python pysec_update.py

  # With requirements file + bandit + freeze
  python pysec_update.py --req requirements.txt --bandit --freeze

  # Compile from .in + aggressive upgrade
  python pysec_update.py --req requirements.in --upgrade all

  # Custom report location
  python pysec_update.py --reports .github/echo_security

  # Custom venv path
  python pysec_update.py --venv .venv-py312
        """,
    )

    parser.add_argument(
        "--req",
        type=Path,
        help="Requirements file (supports .txt or .in for pip-compile)",
    )
    parser.add_argument(
        "--venv",
        type=Path,
        default=Path(".venv"),
        help="Virtual environment path (default: .venv)",
    )
    parser.add_argument(
        "--reports",
        type=Path,
        default=Path("reports/security"),
        help="Reports output directory (default: reports/security)",
    )
    parser.add_argument(
        "--upgrade",
        choices=["conservative", "all", "none"],
        default="conservative",
        help="Upgrade mode: conservative (security only), all, or none (default: conservative)",
    )
    parser.add_argument(
        "--bandit",
        action="store_true",
        help="Run bandit static code analysis",
    )
    parser.add_argument(
        "--freeze",
        action="store_true",
        help="Create pip freeze snapshot",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Verbose output",
    )
    parser.add_argument(
        "--notify",
        action="store_true",
        help="Send email notification if vulnerabilities found",
    )
    parser.add_argument(
        "--notify-threshold",
        type=int,
        default=1,
        help="Minimum vulnerabilities to trigger notification (default: 1)",
    )

    args = parser.parse_args()

    # Check email availability
    if args.notify and not EMAIL_AVAILABLE:
        print(f"{Colors.YELLOW}[WARN]{Colors.RESET} Email notifications requested but security_notifier module not available")
        print(f"{Colors.YELLOW}[WARN]{Colors.RESET} Install with: pip install python-dotenv")

    # Run security updater
    updater = SecurityUpdater(
        req_file=args.req,
        venv_path=args.venv,
        reports_dir=args.reports,
        upgrade_mode=args.upgrade,
        run_bandit=args.bandit,
        create_freeze=args.freeze,
        verbose=args.verbose,
        notify=args.notify,
        notify_threshold=args.notify_threshold,
    )

    try:
        updater.run()
        sys.exit(0)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Interrupted by user{Colors.RESET}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}Error: {e}{Colors.RESET}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
