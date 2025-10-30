#!/usr/bin/env python3
"""
Custom Python MCP Server with Useful Tools
Provides various utility functions for file operations, text processing, and system info
"""

from fastmcp import FastMCP
import os
import sys
import json
import hashlib
import datetime
import platform
from pathlib import Path
from typing import List, Dict, Any
from tabulate import tabulate
import requests
from bs4 import BeautifulSoup
import numpy as np
from scipy import stats
from PIL import Image
import cv2
import schedule
import psutil

# Create MCP server instance
mcp = FastMCP("python-utils")


# ===== File Operations =====

@mcp.tool()
def calculate_file_hash(file_path: str, algorithm: str = "sha256") -> Dict[str, str]:
    """
    Calculate hash of a file

    Args:
        file_path: Path to the file
        algorithm: Hash algorithm (md5, sha1, sha256, sha512)

    Returns:
        Dictionary with file path, algorithm, and hash value
    """
    try:
        algorithms = {
            "md5": hashlib.md5,
            "sha1": hashlib.sha1,
            "sha256": hashlib.sha256,
            "sha512": hashlib.sha512
        }

        if algorithm not in algorithms:
            return {"error": f"Unsupported algorithm. Use: {', '.join(algorithms.keys())}"}

        hash_func = algorithms[algorithm]()

        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_func.update(chunk)

        return {
            "file_path": file_path,
            "algorithm": algorithm,
            "hash": hash_func.hexdigest(),
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def get_directory_size(directory_path: str) -> Dict[str, Any]:
    """
    Calculate total size of a directory

    Args:
        directory_path: Path to the directory

    Returns:
        Dictionary with size information
    """
    try:
        total_size = 0
        file_count = 0
        dir_count = 0

        for dirpath, dirnames, filenames in os.walk(directory_path):
            dir_count += len(dirnames)
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                if os.path.exists(file_path):
                    total_size += os.path.getsize(file_path)
                    file_count += 1

        # Convert to human-readable format
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if total_size < 1024.0:
                size_str = f"{total_size:.2f} {unit}"
                break
            total_size /= 1024.0

        return {
            "directory": directory_path,
            "total_size": size_str,
            "file_count": file_count,
            "directory_count": dir_count,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


# ===== Text Processing =====

@mcp.tool()
def count_words_in_file(file_path: str) -> Dict[str, Any]:
    """
    Count words, lines, and characters in a text file

    Args:
        file_path: Path to the text file

    Returns:
        Dictionary with count statistics
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')
        words = content.split()
        chars = len(content)
        chars_no_spaces = len(content.replace(' ', '').replace('\n', '').replace('\t', ''))

        return {
            "file_path": file_path,
            "lines": len(lines),
            "words": len(words),
            "characters": chars,
            "characters_no_whitespace": chars_no_spaces,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def search_in_files(directory: str, search_term: str, file_extension: str = ".txt") -> List[Dict[str, Any]]:
    """
    Search for a term in all files with specific extension in a directory

    Args:
        directory: Directory to search in
        search_term: Term to search for
        file_extension: File extension to filter (e.g., .txt, .py, .md)

    Returns:
        List of matches with file path and line numbers
    """
    try:
        results = []

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(file_extension):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            for line_num, line in enumerate(f, 1):
                                if search_term.lower() in line.lower():
                                    results.append({
                                        "file": file_path,
                                        "line_number": line_num,
                                        "content": line.strip()
                                    })
                    except Exception:
                        continue

        return results
    except Exception as e:
        return [{"error": str(e)}]


# ===== System Information =====

@mcp.tool()
def get_system_info() -> Dict[str, Any]:
    """
    Get detailed system information

    Returns:
        Dictionary with system details
    """
    try:
        return {
            "platform": platform.system(),
            "platform_release": platform.release(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "python_version": sys.version,
            "hostname": platform.node(),
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def get_environment_variables(filter_term: str = "") -> Dict[str, str]:
    """
    Get environment variables, optionally filtered by a term

    Args:
        filter_term: Optional term to filter variable names (case-insensitive)

    Returns:
        Dictionary of environment variables
    """
    try:
        env_vars = dict(os.environ)

        if filter_term:
            env_vars = {
                k: v for k, v in env_vars.items()
                if filter_term.lower() in k.lower()
            }

        return env_vars
    except Exception as e:
        return {"error": str(e)}


# ===== JSON Operations =====

@mcp.tool()
def format_json(json_string: str, indent: int = 2) -> str:
    """
    Format a JSON string with proper indentation

    Args:
        json_string: JSON string to format
        indent: Number of spaces for indentation

    Returns:
        Formatted JSON string
    """
    try:
        data = json.loads(json_string)
        return json.dumps(data, indent=indent, ensure_ascii=False)
    except Exception as e:
        return f"Error: {str(e)}"


@mcp.tool()
def validate_json(json_string: str) -> Dict[str, Any]:
    """
    Validate if a string is valid JSON

    Args:
        json_string: String to validate

    Returns:
        Dictionary with validation result and error message if invalid
    """
    try:
        json.loads(json_string)
        return {
            "valid": True,
            "message": "JSON is valid"
        }
    except json.JSONDecodeError as e:
        return {
            "valid": False,
            "error": str(e),
            "line": e.lineno,
            "column": e.colno
        }


# ===== Math & Utilities =====

@mcp.tool()
def calculate(expression: str) -> Dict[str, Any]:
    """
    Safely evaluate a mathematical expression

    Args:
        expression: Mathematical expression (e.g., "2 + 2 * 3")

    Returns:
        Dictionary with result or error
    """
    try:
        # Only allow safe mathematical operations
        allowed_names = {
            "abs": abs, "round": round, "min": min, "max": max,
            "sum": sum, "pow": pow
        }

        # Evaluate in restricted environment
        result = eval(expression, {"__builtins__": {}}, allowed_names)

        return {
            "expression": expression,
            "result": result,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "expression": expression,
            "error": str(e)
        }


@mcp.tool()
def get_current_time(timezone: str = "local") -> Dict[str, str]:
    """
    Get current time information

    Args:
        timezone: Timezone (currently only 'local' supported)

    Returns:
        Dictionary with time information
    """
    now = datetime.datetime.now()
    return {
        "datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "day_of_week": now.strftime("%A"),
        "timestamp": now.timestamp()
    }


@mcp.tool()
def create_table(
    data: List[List[Any]],
    headers: List[str] | None = None,
    table_format: str = "grid",
    show_index: bool = False,
    num_align: str = "right"
) -> str:
    """
    Create formatted ASCII/Unicode text table from data

    Args:
        data: Array of arrays representing table rows
        headers: Optional array of column headers. If not provided, first row is used as headers
        table_format: Table format style (plain, simple, github, grid, fancy_grid, pipe, orgtbl, jira, presto, pretty, psql, rst, mediawiki, html, latex)
        show_index: Show row index numbers
        num_align: Alignment for numeric columns (left, right, center, decimal)

    Returns:
        Formatted table string
    """
    try:
        if not data or len(data) == 0:
            return "Error: Data array cannot be empty"

        # If headers not provided, use first row as headers
        table_data = data
        if headers is None:
            if len(data) > 0:
                headers = data[0]
                table_data = data[1:] if len(data) > 1 else []

        # Create the table
        if show_index:
            table_str = tabulate(
                table_data,
                headers=headers,
                tablefmt=table_format,
                showindex="always",
                numalign=num_align
            )
        else:
            table_str = tabulate(
                table_data,
                headers=headers,
                tablefmt=table_format,
                numalign=num_align
            )

        return table_str
    except Exception as e:
        return f"Error creating table: {str(e)}"


# ===== Web Scraping =====

@mcp.tool()
def fetch_webpage(url: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Fetch webpage content with status code and headers

    Args:
        url: URL to fetch
        timeout: Request timeout in seconds

    Returns:
        Dictionary with status, headers, and content
    """
    try:
        response = requests.get(url, timeout=timeout)
        return {
            "url": url,
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "content": response.text[:10000],  # Limit to first 10k chars
            "content_length": len(response.text),
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "url": url}


@mcp.tool()
def parse_html(html: str, selector: str = None) -> Dict[str, Any]:
    """
    Parse HTML content and extract elements using CSS selectors

    Args:
        html: HTML content to parse
        selector: Optional CSS selector to filter elements

    Returns:
        Dictionary with parsed content
    """
    try:
        soup = BeautifulSoup(html, 'lxml')

        if selector:
            elements = soup.select(selector)
            result = {
                "selector": selector,
                "count": len(elements),
                "elements": [{"text": elem.get_text(strip=True), "html": str(elem)[:500]} for elem in elements[:50]]
            }
        else:
            result = {
                "title": soup.title.string if soup.title else None,
                "text_content": soup.get_text(strip=True)[:5000],
                "links": [{"href": a.get('href'), "text": a.get_text(strip=True)} for a in soup.find_all('a')[:50]],
                "images": [img.get('src') for img in soup.find_all('img')[:50]]
            }

        return result
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def scrape_website(url: str, css_selector: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Fetch and parse webpage in one step

    Args:
        url: URL to scrape
        css_selector: CSS selector to extract elements
        timeout: Request timeout in seconds

    Returns:
        Dictionary with scraped data
    """
    try:
        response = requests.get(url, timeout=timeout)
        soup = BeautifulSoup(response.text, 'lxml')
        elements = soup.select(css_selector)

        return {
            "url": url,
            "selector": css_selector,
            "status_code": response.status_code,
            "found_count": len(elements),
            "data": [{"text": elem.get_text(strip=True), "html": str(elem)[:500]} for elem in elements[:100]],
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e), "url": url}


# ===== Data Analysis =====

@mcp.tool()
def analyze_array(data: List[float]) -> Dict[str, Any]:
    """
    Perform statistical analysis on numerical array

    Args:
        data: List of numbers

    Returns:
        Dictionary with statistical measures
    """
    try:
        arr = np.array(data)

        return {
            "count": len(arr),
            "mean": float(np.mean(arr)),
            "median": float(np.median(arr)),
            "std": float(np.std(arr)),
            "variance": float(np.var(arr)),
            "min": float(np.min(arr)),
            "max": float(np.max(arr)),
            "q25": float(np.percentile(arr, 25)),
            "q75": float(np.percentile(arr, 75)),
            "sum": float(np.sum(arr)),
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def correlation_analysis(x: List[float], y: List[float]) -> Dict[str, Any]:
    """
    Calculate correlation between two arrays

    Args:
        x: First array of numbers
        y: Second array of numbers

    Returns:
        Dictionary with correlation statistics
    """
    try:
        arr_x = np.array(x)
        arr_y = np.array(y)

        pearson_corr, pearson_p = stats.pearsonr(arr_x, arr_y)
        spearman_corr, spearman_p = stats.spearmanr(arr_x, arr_y)

        return {
            "sample_size": len(arr_x),
            "pearson_correlation": float(pearson_corr),
            "pearson_p_value": float(pearson_p),
            "spearman_correlation": float(spearman_corr),
            "spearman_p_value": float(spearman_p),
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def linear_regression(x: List[float], y: List[float]) -> Dict[str, Any]:
    """
    Perform linear regression analysis

    Args:
        x: Independent variable (predictor)
        y: Dependent variable (response)

    Returns:
        Dictionary with regression results
    """
    try:
        arr_x = np.array(x)
        arr_y = np.array(y)

        slope, intercept, r_value, p_value, std_err = stats.linregress(arr_x, arr_y)

        return {
            "slope": float(slope),
            "intercept": float(intercept),
            "r_squared": float(r_value ** 2),
            "p_value": float(p_value),
            "std_error": float(std_err),
            "equation": f"y = {slope:.4f}x + {intercept:.4f}",
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


# ===== Image Processing =====

@mcp.tool()
def analyze_image(image_path: str) -> Dict[str, Any]:
    """
    Analyze image properties and statistics

    Args:
        image_path: Path to image file

    Returns:
        Dictionary with image analysis
    """
    try:
        # Read with Pillow
        img_pil = Image.open(image_path)

        # Read with OpenCV for additional analysis
        img_cv = cv2.imread(image_path)

        result = {
            "path": image_path,
            "format": img_pil.format,
            "mode": img_pil.mode,
            "size": img_pil.size,
            "width": img_pil.width,
            "height": img_pil.height,
            "aspect_ratio": round(img_pil.width / img_pil.height, 2),
            "file_size_bytes": os.path.getsize(image_path),
            "timestamp": datetime.datetime.now().isoformat()
        }

        if img_cv is not None:
            result["channels"] = img_cv.shape[2] if len(img_cv.shape) == 3 else 1
            result["mean_color"] = [float(x) for x in cv2.mean(img_cv)[:3]]

        return result
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def resize_image(image_path: str, output_path: str, width: int = None, height: int = None, keep_aspect: bool = True) -> Dict[str, Any]:
    """
    Resize image to specified dimensions

    Args:
        image_path: Path to input image
        output_path: Path to save resized image
        width: Target width (optional)
        height: Target height (optional)
        keep_aspect: Maintain aspect ratio

    Returns:
        Dictionary with operation result
    """
    try:
        img = Image.open(image_path)
        original_size = img.size

        if width and height and not keep_aspect:
            new_size = (width, height)
        elif width:
            ratio = width / img.width
            new_size = (width, int(img.height * ratio))
        elif height:
            ratio = height / img.height
            new_size = (int(img.width * ratio), height)
        else:
            return {"error": "Must specify width or height"}

        img_resized = img.resize(new_size, Image.LANCZOS)
        img_resized.save(output_path)

        return {
            "original_size": original_size,
            "new_size": new_size,
            "output_path": output_path,
            "success": True,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def detect_edges(image_path: str, output_path: str, threshold1: int = 100, threshold2: int = 200) -> Dict[str, Any]:
    """
    Detect edges in image using Canny edge detection

    Args:
        image_path: Path to input image
        output_path: Path to save edge-detected image
        threshold1: First threshold for hysteresis
        threshold2: Second threshold for hysteresis

    Returns:
        Dictionary with operation result
    """
    try:
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, threshold1, threshold2)

        cv2.imwrite(output_path, edges)

        return {
            "input_path": image_path,
            "output_path": output_path,
            "threshold1": threshold1,
            "threshold2": threshold2,
            "success": True,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


# ===== System Monitoring & Automation =====

@mcp.tool()
def get_system_metrics() -> Dict[str, Any]:
    """
    Get real-time system resource usage

    Returns:
        Dictionary with CPU, memory, disk metrics
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "cpu": {
                "percent": cpu_percent,
                "count": psutil.cpu_count(),
                "count_logical": psutil.cpu_count(logical=True)
            },
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "percent": memory.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "percent": disk.percent
            },
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def list_processes(limit: int = 20) -> Dict[str, Any]:
    """
    List running processes with resource usage

    Args:
        limit: Maximum number of processes to return

    Returns:
        Dictionary with process information
    """
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # Sort by CPU usage
        processes.sort(key=lambda x: x.get('cpu_percent', 0) or 0, reverse=True)

        return {
            "process_count": len(processes),
            "top_processes": processes[:limit],
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def get_network_stats() -> Dict[str, Any]:
    """
    Get network I/O statistics

    Returns:
        Dictionary with network statistics
    """
    try:
        net_io = psutil.net_io_counters()

        return {
            "bytes_sent_mb": round(net_io.bytes_sent / (1024**2), 2),
            "bytes_recv_mb": round(net_io.bytes_recv / (1024**2), 2),
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv,
            "errin": net_io.errin,
            "errout": net_io.errout,
            "dropin": net_io.dropin,
            "dropout": net_io.dropout,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}


# Run the server
if __name__ == "__main__":
    print("Starting Python MCP Server...")
    print("\nAvailable tools:")
    print("\n[File Operations]")
    print("  - calculate_file_hash: Calculate hash of a file")
    print("  - get_directory_size: Get size of a directory")
    print("  - count_words_in_file: Count words in a text file")
    print("  - search_in_files: Search for text in files")
    print("\n[System Information]")
    print("  - get_system_info: Get system information")
    print("  - get_environment_variables: Get environment variables")
    print("  - get_current_time: Get current time information")
    print("\n[JSON & Data]")
    print("  - format_json: Format JSON with proper indentation")
    print("  - validate_json: Validate JSON syntax")
    print("  - create_table: Create formatted ASCII/Unicode text tables")
    print("\n[Math & Calculations]")
    print("  - calculate: Evaluate mathematical expressions")
    print("\n[Web Scraping]")
    print("  - fetch_webpage: Fetch webpage content")
    print("  - parse_html: Parse HTML and extract elements")
    print("  - scrape_website: Fetch and parse in one step")
    print("\n[Data Analysis]")
    print("  - analyze_array: Statistical analysis on numerical arrays")
    print("  - correlation_analysis: Calculate correlation between arrays")
    print("  - linear_regression: Perform linear regression")
    print("\n[Image Processing]")
    print("  - analyze_image: Analyze image properties")
    print("  - resize_image: Resize images")
    print("  - detect_edges: Canny edge detection")
    print("\n[System Monitoring]")
    print("  - get_system_metrics: Real-time CPU, memory, disk metrics")
    print("  - list_processes: List running processes")
    print("  - get_network_stats: Network I/O statistics")
    print("\nServer starting...\n")

    mcp.run()
