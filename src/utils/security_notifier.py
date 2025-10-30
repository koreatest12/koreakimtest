#!/usr/bin/env python3
"""
Security Notification System
=============================

Email notification system for Python security audit results.

Supports:
- SMTP email sending (Gmail, Outlook, custom)
- HTML email templates
- Severity-based filtering
- Multiple recipients
- Attachment support (reports)

Configuration via .env or command-line arguments.
"""

from __future__ import annotations

import json
import os
import smtplib
from datetime import datetime
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Literal, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv optional


class SecurityNotifier:
    """Email notification system for security audit results"""

    def __init__(
        self,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        smtp_user: Optional[str] = None,
        smtp_pass: Optional[str] = None,
        from_email: Optional[str] = None,
        to_emails: Optional[list[str]] = None,
        use_tls: bool = True,
    ):
        # Load from environment if not provided
        self.smtp_host = smtp_host or os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = smtp_port or int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = smtp_user or os.getenv("SMTP_USER", "")
        self.smtp_pass = smtp_pass or os.getenv("SMTP_PASS", "")
        self.from_email = from_email or os.getenv("SMTP_FROM", self.smtp_user)
        self.use_tls = use_tls

        # Parse recipients
        to_env = os.getenv("NOTIFY_EMAILS", "")
        if to_emails:
            self.to_emails = to_emails
        elif to_env:
            self.to_emails = [e.strip() for e in to_env.split(",")]
        else:
            self.to_emails = []

        # Validate configuration
        self._validate_config()

    def _validate_config(self) -> None:
        """Validate SMTP configuration"""
        if not self.smtp_user or not self.smtp_pass:
            raise ValueError(
                "SMTP credentials not configured. Set SMTP_USER and SMTP_PASS "
                "environment variables or pass them as arguments."
            )
        if not self.to_emails:
            raise ValueError(
                "No recipients configured. Set NOTIFY_EMAILS environment variable "
                "or pass to_emails argument."
            )

    def send_notification(
        self,
        summary_data: dict,
        severity: Literal["info", "warning", "critical"] = "warning",
        attach_reports: bool = False,
        reports_dir: Optional[Path] = None,
    ) -> bool:
        """
        Send security notification email

        Args:
            summary_data: Security audit summary data
            severity: Email severity level
            attach_reports: Whether to attach report files
            reports_dir: Directory containing report files

        Returns:
            True if email sent successfully
        """
        try:
            # Create email
            msg = MIMEMultipart("alternative")
            msg["From"] = self.from_email
            msg["To"] = ", ".join(self.to_emails)
            msg["Subject"] = self._generate_subject(summary_data, severity)

            # Generate email body
            html_body = self._generate_html_body(summary_data, severity)
            text_body = self._generate_text_body(summary_data, severity)

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Attach reports if requested
            if attach_reports and reports_dir:
                self._attach_reports(msg, reports_dir, summary_data["timestamp"])

            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)

            print(f"✅ Security notification sent to {len(self.to_emails)} recipient(s)")
            return True

        except Exception as e:
            print(f"❌ Failed to send notification: {e}")
            return False

    def _generate_subject(
        self,
        summary_data: dict,
        severity: str,
    ) -> str:
        """Generate email subject line"""
        results = summary_data.get("results", {})

        # Count vulnerabilities
        pip_audit_vulns = len(results.get("pip_audit", {}).get("vulnerabilities", []))
        safety_vulns = results.get("safety", {}).get("count", 0)
        total_vulns = pip_audit_vulns + safety_vulns

        # Severity emoji
        emoji_map = {
            "info": "ℹ️",
            "warning": "⚠️",
            "critical": "🚨",
        }
        emoji = emoji_map.get(severity, "📊")

        if total_vulns == 0:
            return f"{emoji} Python Security Audit - All Clear"
        else:
            return f"{emoji} Python Security Alert - {total_vulns} Vulnerabilities Detected"

    def _generate_text_body(
        self,
        summary_data: dict,
        severity: str,
    ) -> str:
        """Generate plain text email body"""
        lines = []
        lines.append("=" * 70)
        lines.append("Python Security Audit Report")
        lines.append("=" * 70)
        lines.append("")
        lines.append(f"Timestamp: {summary_data['timestamp']}")
        lines.append(f"Python: {summary_data.get('python_version', 'unknown')}")
        lines.append(f"Severity: {severity.upper()}")
        lines.append("")

        results = summary_data.get("results", {})

        # pip-audit results
        if "pip_audit" in results:
            pip_vulns = results["pip_audit"].get("vulnerabilities", [])
            lines.append(f"pip-audit: {len(pip_vulns)} vulnerabilities")
            if pip_vulns:
                lines.append("")
                lines.append("Vulnerabilities:")
                for vuln in pip_vulns[:5]:
                    lines.append(f"  - {vuln.get('name', 'unknown')}: {vuln.get('id', 'N/A')}")
                if len(pip_vulns) > 5:
                    lines.append(f"  ... and {len(pip_vulns) - 5} more")
            lines.append("")

        # safety results
        if "safety" in results:
            safety_count = results["safety"].get("count", 0)
            lines.append(f"safety: {safety_count} vulnerabilities")
            lines.append("")

        # bandit results
        if "bandit" in results and not results["bandit"].get("skipped"):
            issue_count = len(results["bandit"].get("results", []))
            lines.append(f"bandit: {issue_count} security issues")
            lines.append("")

        lines.append("=" * 70)
        lines.append("Review the attached reports for detailed information.")
        lines.append("")
        lines.append("To resolve:")
        lines.append("1. Review vulnerability details")
        lines.append("2. Update affected packages")
        lines.append("3. Run tests to ensure compatibility")
        lines.append("4. Re-run security audit")
        lines.append("")

        return "\n".join(lines)

    def _generate_html_body(
        self,
        summary_data: dict,
        severity: str,
    ) -> str:
        """Generate HTML email body"""
        results = summary_data.get("results", {})

        # Count vulnerabilities
        pip_vulns = results.get("pip_audit", {}).get("vulnerabilities", [])
        safety_vulns = results.get("safety", {}).get("vulnerabilities", [])
        bandit_issues = results.get("bandit", {}).get("results", []) if not results.get("bandit", {}).get("skipped") else []

        # Severity colors
        color_map = {
            "info": "#0066cc",
            "warning": "#ff9900",
            "critical": "#cc0000",
        }
        severity_color = color_map.get(severity, "#333333")

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: {severity_color};
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .content {{
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #ddd;
            border-top: none;
        }}
        .summary-box {{
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid {severity_color};
        }}
        .summary-item {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        .summary-item:last-child {{
            border-bottom: none;
        }}
        .label {{
            font-weight: 600;
            color: #555;
        }}
        .value {{
            color: #333;
        }}
        .value.danger {{
            color: #cc0000;
            font-weight: 600;
        }}
        .value.success {{
            color: #00aa00;
            font-weight: 600;
        }}
        .vulnerability-list {{
            background: white;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }}
        .vuln-item {{
            padding: 12px;
            border-left: 3px solid #ff6b6b;
            background: #fff5f5;
            margin: 10px 0;
            border-radius: 4px;
        }}
        .vuln-title {{
            font-weight: 600;
            color: #c92a2a;
            margin-bottom: 5px;
        }}
        .vuln-detail {{
            font-size: 14px;
            color: #666;
        }}
        .actions {{
            background: #e7f5ff;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #0066cc;
        }}
        .actions h3 {{
            margin-top: 0;
            color: #0066cc;
        }}
        .actions ol {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        .actions li {{
            margin: 8px 0;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #999;
            font-size: 12px;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge-danger {{
            background: #fee;
            color: #c00;
        }}
        .badge-success {{
            background: #efe;
            color: #0a0;
        }}
        .badge-warning {{
            background: #ffe;
            color: #f90;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Python Security Audit Report</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">
            {summary_data['timestamp']} | Severity: {severity.upper()}
        </p>
    </div>

    <div class="content">
        <div class="summary-box">
            <h2 style="margin-top: 0; color: #333;">📊 Audit Summary</h2>
            <div class="summary-item">
                <span class="label">Python Version</span>
                <span class="value">{summary_data.get('python_version', 'unknown')}</span>
            </div>
            <div class="summary-item">
                <span class="label">Virtual Environment</span>
                <span class="value">{summary_data.get('venv_path', 'N/A')}</span>
            </div>
            <div class="summary-item">
                <span class="label">pip-audit Vulnerabilities</span>
                <span class="value {'danger' if len(pip_vulns) > 0 else 'success'}">
                    {len(pip_vulns)}
                    {f'<span class="badge badge-danger">{len(pip_vulns)} found</span>' if len(pip_vulns) > 0 else '<span class="badge badge-success">Clean</span>'}
                </span>
            </div>
            <div class="summary-item">
                <span class="label">safety Vulnerabilities</span>
                <span class="value {'danger' if len(safety_vulns) > 0 else 'success'}">
                    {len(safety_vulns)}
                    {f'<span class="badge badge-danger">{len(safety_vulns)} found</span>' if len(safety_vulns) > 0 else '<span class="badge badge-success">Clean</span>'}
                </span>
            </div>
            {'<div class="summary-item"><span class="label">bandit Issues</span><span class="value ' + ('warning' if len(bandit_issues) > 0 else 'success') + '">' + str(len(bandit_issues)) + ('</span></div>' if not results.get("bandit", {}).get("skipped") else '')}
        </div>
"""

        # Add vulnerability details
        if pip_vulns:
            html += """
        <div class="vulnerability-list">
            <h3 style="margin-top: 0; color: #c92a2a;">🚨 pip-audit Vulnerabilities</h3>
"""
            for vuln in pip_vulns[:10]:  # Show first 10
                html += f"""
            <div class="vuln-item">
                <div class="vuln-title">{vuln.get('name', 'unknown')} - {vuln.get('id', 'N/A')}</div>
                <div class="vuln-detail">
                    <strong>Description:</strong> {vuln.get('description', 'No description')[:150]}...
                </div>
                <div class="vuln-detail">
                    <strong>Fix:</strong> Update to {', '.join(vuln.get('fix_versions', ['unknown']))}
                </div>
            </div>
"""
            if len(pip_vulns) > 10:
                html += f"<p><em>... and {len(pip_vulns) - 10} more vulnerabilities</em></p>"

            html += """
        </div>
"""

        # Add action items
        html += """
        <div class="actions">
            <h3>📝 Recommended Actions</h3>
            <ol>
                <li>Review the attached detailed reports</li>
                <li>Update affected packages to patched versions</li>
                <li>Run your test suite after updates</li>
                <li>Re-run security audit to confirm fixes</li>
                <li>Consider using <code>pip-audit --fix</code> for automatic patching</li>
            </ol>
        </div>

        <div class="footer">
            <p>Generated by Python Security Update Tool</p>
            <p>This is an automated notification. For questions, contact your DevOps team.</p>
        </div>
    </div>
</body>
</html>
"""
        return html

    def _attach_reports(
        self,
        msg: MIMEMultipart,
        reports_dir: Path,
        timestamp: str,
    ) -> None:
        """Attach report files to email"""
        report_files = [
            f"security-summary-{timestamp}.json",
            f"security-summary-{timestamp}.md",
            f"pip-audit-{timestamp}.json",
            f"safety-{timestamp}.json",
        ]

        for filename in report_files:
            filepath = reports_dir / filename
            if filepath.exists():
                with open(filepath, "rb") as f:
                    part = MIMEApplication(f.read(), Name=filename)
                part["Content-Disposition"] = f'attachment; filename="{filename}"'
                msg.attach(part)


def send_security_alert(
    summary_data: dict,
    smtp_host: Optional[str] = None,
    smtp_port: Optional[int] = None,
    smtp_user: Optional[str] = None,
    smtp_pass: Optional[str] = None,
    from_email: Optional[str] = None,
    to_emails: Optional[list[str]] = None,
    attach_reports: bool = True,
    reports_dir: Optional[Path] = None,
) -> bool:
    """
    Convenience function to send security alert

    Args:
        summary_data: Security audit summary
        smtp_host: SMTP server host
        smtp_port: SMTP server port
        smtp_user: SMTP username
        smtp_pass: SMTP password
        from_email: From email address
        to_emails: List of recipient emails
        attach_reports: Whether to attach report files
        reports_dir: Directory containing reports

    Returns:
        True if sent successfully
    """
    # Determine severity
    results = summary_data.get("results", {})
    pip_vulns = len(results.get("pip_audit", {}).get("vulnerabilities", []))
    safety_vulns = results.get("safety", {}).get("count", 0)
    total_vulns = pip_vulns + safety_vulns

    if total_vulns == 0:
        severity = "info"
    elif total_vulns < 5:
        severity = "warning"
    else:
        severity = "critical"

    notifier = SecurityNotifier(
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_user=smtp_user,
        smtp_pass=smtp_pass,
        from_email=from_email,
        to_emails=to_emails,
    )

    return notifier.send_notification(
        summary_data=summary_data,
        severity=severity,
        attach_reports=attach_reports,
        reports_dir=reports_dir,
    )


if __name__ == "__main__":
    # Test with dummy data
    import argparse

    parser = argparse.ArgumentParser(description="Test security notification")
    parser.add_argument("--summary", type=Path, required=True, help="Path to summary JSON")
    parser.add_argument("--reports-dir", type=Path, help="Reports directory")
    parser.add_argument("--attach", action="store_true", help="Attach reports")
    args = parser.parse_args()

    with open(args.summary, encoding="utf-8") as f:
        summary = json.load(f)

    success = send_security_alert(
        summary_data=summary,
        attach_reports=args.attach,
        reports_dir=args.reports_dir,
    )

    if success:
        print("✅ Test notification sent successfully")
    else:
        print("❌ Failed to send test notification")
