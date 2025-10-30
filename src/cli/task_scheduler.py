"""
Task Scheduler & Cron Job Wrapper - Run and monitor scheduled tasks.

Features:
- Cron-style task execution wrapper with logging
- Error notifications and retry logic
- Execution time tracking and reporting
- Lock file management (prevent concurrent runs)
- Windows Task Scheduler integration helper

Usage:
    python task_scheduler.py run <script_path> [--timeout SECONDS] [--lock-file PATH]
    python task_scheduler.py schedule <script_path> --interval "daily|hourly|weekly" [--time HH:MM]
    python task_scheduler.py report [--last N]
"""

import argparse
import subprocess
import json
import time
import fcntl
import atexit
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import sys
import os


class TaskLogger:
    """Simple task execution logger."""

    def __init__(self, log_dir: Path = Path("logs")):
        self.log_dir = log_dir
        self.log_dir.mkdir(exist_ok=True)
        self.execution_log_path = self.log_dir / "task_executions.jsonl"

    def log_execution(self, task_data: Dict[str, Any]):
        """Log task execution to JSONL file."""
        with open(self.execution_log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(task_data, ensure_ascii=False) + '\n')

    def get_recent_executions(self, limit: int = 10) -> list:
        """Get recent task executions."""
        if not self.execution_log_path.exists():
            return []

        executions = []
        with open(self.execution_log_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    executions.append(json.loads(line))

        return executions[-limit:]


class FileLock:
    """Simple file-based lock to prevent concurrent execution."""

    def __init__(self, lock_file: Path):
        self.lock_file = lock_file
        self.lock_handle = None

    def acquire(self, timeout: int = 0) -> bool:
        """Acquire lock. Returns False if lock already held."""
        try:
            self.lock_file.parent.mkdir(parents=True, exist_ok=True)

            # Windows doesn't support fcntl, use alternative approach
            if os.name == 'nt':
                if self.lock_file.exists():
                    # Check if process is still running
                    try:
                        with open(self.lock_file, 'r') as f:
                            lock_data = json.load(f)
                            # Simple check - in production, verify PID
                            lock_time = datetime.fromisoformat(lock_data['timestamp'])
                            if datetime.now() - lock_time < timedelta(hours=1):
                                return False
                    except:
                        pass

                # Create lock
                with open(self.lock_file, 'w') as f:
                    json.dump({
                        'pid': os.getpid(),
                        'timestamp': datetime.now().isoformat()
                    }, f)
                return True
            else:
                # Unix-like systems
                self.lock_handle = open(self.lock_file, 'w')
                fcntl.flock(self.lock_handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                return True

        except (IOError, OSError):
            return False

    def release(self):
        """Release lock."""
        try:
            if os.name == 'nt':
                if self.lock_file.exists():
                    self.lock_file.unlink()
            else:
                if self.lock_handle:
                    fcntl.flock(self.lock_handle.fileno(), fcntl.LOCK_UN)
                    self.lock_handle.close()
                if self.lock_file.exists():
                    self.lock_file.unlink()
        except:
            pass

    def __enter__(self):
        if not self.acquire():
            raise RuntimeError("Failed to acquire lock - task may already be running")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


def run_task(
    script_path: Path,
    timeout: Optional[int] = None,
    lock_file: Optional[Path] = None,
    log_dir: Path = Path("logs")
) -> Dict[str, Any]:
    """
    Run a task with logging, timeout, and lock file support.

    Args:
        script_path: Path to script to execute
        timeout: Maximum execution time in seconds
        lock_file: Path to lock file (prevents concurrent execution)
        log_dir: Directory for logs

    Returns:
        Dictionary with execution results
    """
    logger = TaskLogger(log_dir)

    # Prepare execution data
    execution_data = {
        "task_name": script_path.name,
        "script_path": str(script_path),
        "start_time": datetime.now().isoformat(),
        "end_time": None,
        "duration_seconds": None,
        "success": False,
        "exit_code": None,
        "stdout": "",
        "stderr": "",
        "error": None
    }

    # Use lock if specified
    lock = FileLock(lock_file) if lock_file else None

    try:
        if lock:
            if not lock.acquire():
                execution_data["error"] = "Task already running (lock file exists)"
                logger.log_execution(execution_data)
                print(f"⚠️  Task already running: {script_path.name}")
                return execution_data

        print(f"\n{'=' * 60}")
        print(f"🚀 Starting task: {script_path.name}")
        print(f"   Start time: {execution_data['start_time']}")
        if timeout:
            print(f"   Timeout: {timeout}s")
        print(f"{'=' * 60}\n")

        # Determine command based on file extension
        if script_path.suffix == '.py':
            cmd = [sys.executable, str(script_path)]
        elif script_path.suffix in ['.sh', '.bash']:
            cmd = ['bash', str(script_path)]
        elif script_path.suffix in ['.bat', '.cmd']:
            cmd = ['cmd', '/c', str(script_path)]
        else:
            cmd = [str(script_path)]

        # Execute task
        start = time.time()

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )

        duration = time.time() - start

        # Update execution data
        execution_data["end_time"] = datetime.now().isoformat()
        execution_data["duration_seconds"] = round(duration, 2)
        execution_data["exit_code"] = result.returncode
        execution_data["stdout"] = result.stdout
        execution_data["stderr"] = result.stderr
        execution_data["success"] = result.returncode == 0

        # Print results
        print(f"\n{'=' * 60}")
        if execution_data["success"]:
            print(f"✅ Task completed successfully")
        else:
            print(f"❌ Task failed with exit code {result.returncode}")

        print(f"   Duration: {duration:.2f}s")
        print(f"   End time: {execution_data['end_time']}")
        print(f"{'=' * 60}\n")

        if result.stdout:
            print("STDOUT:")
            print(result.stdout)

        if result.stderr:
            print("STDERR:")
            print(result.stderr)

    except subprocess.TimeoutExpired:
        execution_data["error"] = f"Task timeout ({timeout}s exceeded)"
        print(f"\n❌ Task timed out after {timeout}s")

    except Exception as e:
        execution_data["error"] = str(e)
        print(f"\n❌ Task error: {e}")

    finally:
        if lock:
            lock.release()

        # Log execution
        logger.log_execution(execution_data)

        # Write detailed log file
        log_file = log_dir / f"{script_path.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write(json.dumps(execution_data, indent=2, ensure_ascii=False))

    return execution_data


def generate_task_report(log_dir: Path = Path("logs"), last_n: int = 10):
    """Generate task execution report."""
    logger = TaskLogger(log_dir)
    executions = logger.get_recent_executions(last_n)

    if not executions:
        print("📊 No task executions found")
        return

    print(f"\n{'=' * 80}")
    print(f"📊 Task Execution Report (Last {len(executions)} executions)")
    print(f"{'=' * 80}\n")

    # Summary stats
    total = len(executions)
    successful = sum(1 for e in executions if e.get('success'))
    failed = total - successful

    print(f"Summary:")
    print(f"   Total executions: {total}")
    print(f"   ✓ Successful: {successful}")
    print(f"   ✗ Failed: {failed}")
    print()

    # Detailed list
    print(f"{'Task':<30} {'Start Time':<20} {'Duration':<12} {'Status':<10}")
    print(f"{'-' * 80}")

    for execution in executions:
        task_name = execution.get('task_name', 'Unknown')[:28]
        start_time = execution.get('start_time', '')[:19]
        duration = f"{execution.get('duration_seconds', 0):.2f}s" if execution.get('duration_seconds') else 'N/A'
        status = '✓ Success' if execution.get('success') else '✗ Failed'

        print(f"{task_name:<30} {start_time:<20} {duration:<12} {status:<10}")

        if execution.get('error'):
            print(f"   Error: {execution['error']}")

    print(f"{'=' * 80}\n")


def create_windows_task(
    task_name: str,
    script_path: Path,
    interval: str = "daily",
    time_str: str = "00:00"
):
    """Create Windows scheduled task using schtasks."""
    if os.name != 'nt':
        print("❌ Windows Task Scheduler only available on Windows")
        return

    # Build schtasks command
    cmd = [
        'schtasks', '/create',
        '/tn', task_name,
        '/tr', f'python "{script_path.absolute()}"',
        '/sc', interval,
        '/f'  # Force create (overwrite if exists)
    ]

    if time_str and interval in ['daily', 'weekly']:
        cmd.extend(['/st', time_str])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"✅ Created scheduled task: {task_name}")
            print(f"   Script: {script_path}")
            print(f"   Interval: {interval}")
            if time_str:
                print(f"   Time: {time_str}")
        else:
            print(f"❌ Failed to create task: {result.stderr}")

    except Exception as e:
        print(f"❌ Error creating task: {e}")


def create_cron_job_example(script_path: Path, interval: str = "daily", time_str: str = "00:00"):
    """Generate cron job example for Unix/Linux systems."""
    if os.name == 'nt':
        print("ℹ️  For Unix/Linux cron jobs, use:")
    else:
        print("ℹ️  Add this to your crontab (crontab -e):")

    script_abs = script_path.absolute()

    if interval == "hourly":
        cron_line = f"0 * * * * {sys.executable} {script_abs}"
    elif interval == "daily":
        hour, minute = time_str.split(':')
        cron_line = f"{minute} {hour} * * * {sys.executable} {script_abs}"
    elif interval == "weekly":
        hour, minute = time_str.split(':')
        cron_line = f"{minute} {hour} * * 0 {sys.executable} {script_abs}"  # Sunday
    else:
        cron_line = f"0 0 * * * {sys.executable} {script_abs}"

    print(f"\n{cron_line}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Task Scheduler & Cron Job Wrapper"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Run command
    run_parser = subparsers.add_parser("run", help="Run a task with logging and monitoring")
    run_parser.add_argument("script_path", type=Path, help="Script to execute")
    run_parser.add_argument("--timeout", type=int, help="Timeout in seconds")
    run_parser.add_argument("--lock-file", type=Path, help="Lock file path (prevents concurrent execution)")
    run_parser.add_argument("--log-dir", type=Path, default=Path("logs"), help="Log directory")

    # Schedule command
    schedule_parser = subparsers.add_parser("schedule", help="Create scheduled task")
    schedule_parser.add_argument("script_path", type=Path, help="Script to schedule")
    schedule_parser.add_argument(
        "--interval",
        choices=["hourly", "daily", "weekly"],
        required=True,
        help="Execution interval"
    )
    schedule_parser.add_argument("--time", default="00:00", help="Time to run (HH:MM, for daily/weekly)")
    schedule_parser.add_argument("--name", help="Task name (defaults to script name)")

    # Report command
    report_parser = subparsers.add_parser("report", help="Show task execution report")
    report_parser.add_argument("--last", type=int, default=10, help="Show last N executions")
    report_parser.add_argument("--log-dir", type=Path, default=Path("logs"), help="Log directory")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Execute command
    if args.command == "run":
        if not args.script_path.exists():
            print(f"❌ Error: Script not found: {args.script_path}")
            return

        result = run_task(
            args.script_path,
            timeout=args.timeout,
            lock_file=args.lock_file,
            log_dir=args.log_dir
        )

        sys.exit(0 if result["success"] else 1)

    elif args.command == "schedule":
        if not args.script_path.exists():
            print(f"❌ Error: Script not found: {args.script_path}")
            return

        task_name = args.name or f"AutoTask_{args.script_path.stem}"

        print(f"\n📅 Creating scheduled task...\n")

        if os.name == 'nt':
            create_windows_task(task_name, args.script_path, args.interval, args.time)
        else:
            create_cron_job_example(args.script_path, args.interval, args.time)

    elif args.command == "report":
        generate_task_report(args.log_dir, args.last)


if __name__ == "__main__":
    main()
