"""
Apache Web Server Management MCP Server
Provides tools for managing Apache HTTP Server on Windows
"""

import os
import subprocess
import psutil
from pathlib import Path
from typing import Dict, List, Optional
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("apache-manager")

# Common Apache paths on Windows
APACHE_PATHS = [
    r"C:\Apache24",
    r"C:\Program Files\Apache Software Foundation\Apache2.4",
    r"C:\xampp\apache",
    r"C:\wamp\bin\apache",
]

def find_apache_root() -> Optional[Path]:
    """Find Apache installation directory"""
    for path_str in APACHE_PATHS:
        path = Path(path_str)
        if path.exists():
            return path
    return None

def find_httpd_exe() -> Optional[Path]:
    """Find httpd.exe executable"""
    apache_root = find_apache_root()
    if not apache_root:
        return None

    httpd_path = apache_root / "bin" / "httpd.exe"
    if httpd_path.exists():
        return httpd_path
    return None

@mcp.tool()
def check_apache_status() -> Dict:
    """
    Check if Apache HTTP Server is running

    Returns:
        Dictionary with Apache status information
    """
    try:
        # Check for Apache processes
        apache_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
            try:
                if 'httpd' in proc.info['name'].lower() or 'apache' in proc.info['name'].lower():
                    apache_processes.append({
                        'pid': proc.info['pid'],
                        'name': proc.info['name'],
                        'memory_mb': round(proc.info['memory_info'].rss / 1024 / 1024, 2),
                        'cpu_percent': proc.info['cpu_percent']
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        apache_root = find_apache_root()
        httpd_exe = find_httpd_exe()

        return {
            'running': len(apache_processes) > 0,
            'process_count': len(apache_processes),
            'processes': apache_processes,
            'apache_root': str(apache_root) if apache_root else 'Not found',
            'httpd_exe': str(httpd_exe) if httpd_exe else 'Not found'
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def get_apache_version() -> Dict:
    """
    Get Apache HTTP Server version information

    Returns:
        Dictionary with Apache version details
    """
    try:
        httpd_exe = find_httpd_exe()
        if not httpd_exe:
            return {'error': 'Apache httpd.exe not found'}

        result = subprocess.run(
            [str(httpd_exe), '-v'],
            capture_output=True,
            text=True,
            timeout=10
        )

        return {
            'version_output': result.stdout,
            'httpd_path': str(httpd_exe)
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def test_apache_config() -> Dict:
    """
    Test Apache configuration for syntax errors

    Returns:
        Dictionary with configuration test results
    """
    try:
        httpd_exe = find_httpd_exe()
        if not httpd_exe:
            return {'error': 'Apache httpd.exe not found'}

        result = subprocess.run(
            [str(httpd_exe), '-t'],
            capture_output=True,
            text=True,
            timeout=10
        )

        return {
            'syntax_ok': result.returncode == 0,
            'output': result.stdout + result.stderr,
            'return_code': result.returncode
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def list_apache_modules() -> Dict:
    """
    List all compiled and loaded Apache modules

    Returns:
        Dictionary with Apache modules information
    """
    try:
        httpd_exe = find_httpd_exe()
        if not httpd_exe:
            return {'error': 'Apache httpd.exe not found'}

        result = subprocess.run(
            [str(httpd_exe), '-M'],
            capture_output=True,
            text=True,
            timeout=10
        )

        modules = []
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and not line.startswith('Loaded') and not line.startswith('Compiled'):
                modules.append(line)

        return {
            'modules': modules,
            'full_output': result.stdout
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def get_apache_config_path() -> Dict:
    """
    Get Apache configuration file paths

    Returns:
        Dictionary with configuration file locations
    """
    try:
        apache_root = find_apache_root()
        if not apache_root:
            return {'error': 'Apache installation not found'}

        conf_dir = apache_root / "conf"
        httpd_conf = conf_dir / "httpd.conf"
        extra_dir = conf_dir / "extra"

        return {
            'apache_root': str(apache_root),
            'conf_dir': str(conf_dir),
            'httpd_conf': str(httpd_conf),
            'httpd_conf_exists': httpd_conf.exists(),
            'extra_dir': str(extra_dir),
            'extra_dir_exists': extra_dir.exists()
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def read_apache_config(config_file: str = "httpd.conf", max_lines: int = 100) -> Dict:
    """
    Read Apache configuration file

    Args:
        config_file: Configuration file name (default: httpd.conf)
        max_lines: Maximum number of lines to return (default: 100)

    Returns:
        Dictionary with configuration file contents
    """
    try:
        apache_root = find_apache_root()
        if not apache_root:
            return {'error': 'Apache installation not found'}

        conf_path = apache_root / "conf" / config_file
        if not conf_path.exists():
            return {'error': f'Configuration file not found: {conf_path}'}

        with open(conf_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        return {
            'file_path': str(conf_path),
            'total_lines': len(lines),
            'lines_returned': min(len(lines), max_lines),
            'content': ''.join(lines[:max_lines])
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def search_apache_config(search_term: str, config_file: str = "httpd.conf") -> Dict:
    """
    Search for a term in Apache configuration file

    Args:
        search_term: Term to search for
        config_file: Configuration file name (default: httpd.conf)

    Returns:
        Dictionary with search results
    """
    try:
        apache_root = find_apache_root()
        if not apache_root:
            return {'error': 'Apache installation not found'}

        conf_path = apache_root / "conf" / config_file
        if not conf_path.exists():
            return {'error': f'Configuration file not found: {conf_path}'}

        matches = []
        with open(conf_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                if search_term.lower() in line.lower():
                    matches.append({
                        'line_number': line_num,
                        'content': line.strip()
                    })

        return {
            'file_path': str(conf_path),
            'search_term': search_term,
            'matches_found': len(matches),
            'matches': matches
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def get_apache_logs_info() -> Dict:
    """
    Get Apache log files information

    Returns:
        Dictionary with log files information
    """
    try:
        apache_root = find_apache_root()
        if not apache_root:
            return {'error': 'Apache installation not found'}

        logs_dir = apache_root / "logs"
        if not logs_dir.exists():
            return {'error': f'Logs directory not found: {logs_dir}'}

        log_files = []
        for log_file in logs_dir.glob("*.log"):
            stat = log_file.stat()
            log_files.append({
                'name': log_file.name,
                'path': str(log_file),
                'size_mb': round(stat.st_size / 1024 / 1024, 2),
                'modified': stat.st_mtime
            })

        return {
            'logs_dir': str(logs_dir),
            'log_count': len(log_files),
            'log_files': log_files
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def read_apache_log(log_file: str = "error.log", tail_lines: int = 50) -> Dict:
    """
    Read Apache log file (last N lines)

    Args:
        log_file: Log file name (default: error.log)
        tail_lines: Number of lines to read from the end (default: 50)

    Returns:
        Dictionary with log file contents
    """
    try:
        apache_root = find_apache_root()
        if not apache_root:
            return {'error': 'Apache installation not found'}

        log_path = apache_root / "logs" / log_file
        if not log_path.exists():
            return {'error': f'Log file not found: {log_path}'}

        with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        tail_content = lines[-tail_lines:] if len(lines) > tail_lines else lines

        return {
            'log_file': str(log_path),
            'total_lines': len(lines),
            'lines_returned': len(tail_content),
            'content': ''.join(tail_content)
        }
    except Exception as e:
        return {'error': str(e)}

@mcp.tool()
def get_apache_virtual_hosts() -> Dict:
    """
    List configured Apache virtual hosts

    Returns:
        Dictionary with virtual hosts information
    """
    try:
        httpd_exe = find_httpd_exe()
        if not httpd_exe:
            return {'error': 'Apache httpd.exe not found'}

        result = subprocess.run(
            [str(httpd_exe), '-S'],
            capture_output=True,
            text=True,
            timeout=10
        )

        return {
            'vhosts_output': result.stdout + result.stderr,
            'return_code': result.returncode
        }
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
