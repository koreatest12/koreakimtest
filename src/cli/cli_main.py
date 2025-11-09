"""
CLI Tools Main Entry Point - Unified interface for all CLI utilities.

This provides a single entry point to access all CLI tools:
- File organization (organize, cleanup, deduplicate)
- Bulk file conversion (images, data, markdown)
- Task scheduling and cron job wrapping
- System utilities

Usage:
    python cli_main.py <tool> <command> [options]

Examples:
    python cli_main.py files organize ./downloads --by type --dry-run
    python cli_main.py convert images ./photos --from png --to jpg
    python cli_main.py schedule run my_script.py --timeout 300
"""

import sys
import argparse
from pathlib import Path
from typing import List


def print_banner():
    """Print CLI tools banner."""
    banner = """
╔═══════════════════════════════════════════════════════════════╗
║                     CLI Automation Tools                      ║
║                   Terminal-Based Utilities                    ║
╚═══════════════════════════════════════════════════════════════╝
"""
    print(banner)


def print_available_tools():
    """Print available tools and their descriptions."""
    tools = {
        "files": {
            "description": "File organization and cleanup utilities",
            "commands": [
                "organize <dir> [--by type|date|extension] [--dry-run]",
                "cleanup <dir> --older-than N [--pattern GLOB] [--dry-run]",
                "deduplicate <dir> [--by hash|name] [--dry-run]"
            ]
        },
        "convert": {
            "description": "Bulk file format conversion",
            "commands": [
                "images <dir> --from EXT --to EXT [--quality N]",
                "data <dir> --from EXT --to EXT",
                "markdown <dir> [--output-dir DIR]"
            ]
        },
        "schedule": {
            "description": "Task scheduling and cron job wrapper",
            "commands": [
                "run <script> [--timeout SEC] [--lock-file PATH]",
                "schedule <script> --interval daily|hourly|weekly [--time HH:MM]",
                "report [--last N]"
            ]
        },
        "selfintro": {
            "description": "Programming self-development self-introduction workflow assistant",
            "commands": [
                "list",
                "run [--non-interactive]",
                "generate-template [--output FILE]"
            ]
        }
    }

    print("\nAvailable Tools:\n")
    for tool_name, tool_info in tools.items():
        print(f"  {tool_name:12} - {tool_info['description']}")
        for cmd in tool_info['commands']:
            print(f"               └─ {cmd}")
        print()


def get_tool_module(tool_name: str):
    """Import and return the appropriate tool module."""
    if tool_name == "files":
        try:
            from . import file_organizer  # type: ignore
        except ImportError:  # pragma: no cover - fallback for script execution
            import file_organizer  # type: ignore
        return file_organizer
    elif tool_name == "convert":
        try:
            from . import bulk_converter  # type: ignore
        except ImportError:  # pragma: no cover
            import bulk_converter  # type: ignore
        return bulk_converter
    elif tool_name == "schedule":
        try:
            from . import task_scheduler  # type: ignore
        except ImportError:  # pragma: no cover
            import task_scheduler  # type: ignore
        return task_scheduler
    elif tool_name == "selfintro":
        try:
            from . import self_intro_workflow  # type: ignore
        except ImportError:  # pragma: no cover
            import self_intro_workflow  # type: ignore
        return self_intro_workflow
    else:
        return None


def main():
    """Main entry point for CLI tools."""

    # If no arguments, show help
    if len(sys.argv) == 1:
        print_banner()
        print_available_tools()
        print("Usage: python cli_main.py <tool> <command> [options]")
        print("       python cli_main.py <tool> --help  (for tool-specific help)")
        return

    # Parse tool name
    parser = argparse.ArgumentParser(
        description="CLI Automation Tools - Unified interface",
        add_help=False
    )
    parser.add_argument("tool", nargs='?', help="Tool to run (files, convert, schedule)")
    parser.add_argument("--help", "-h", action="store_true", help="Show help")

    # Parse only known args to get the tool name
    args, remaining = parser.parse_known_args()

    # Show general help
    if args.help and not args.tool:
        print_banner()
        print_available_tools()
        parser.print_help()
        return

    # Get tool module
    if args.tool:
        # Modify sys.argv to pass remaining args to tool
        sys.argv = [sys.argv[0]] + remaining

        module = get_tool_module(args.tool)
        if module and hasattr(module, "main"):
            module.main()
        else:
            print(f"❌ Unknown tool or missing entry point: {args.tool}")
            print_available_tools()
            sys.exit(1)
    else:
        print_banner()
        print_available_tools()


if __name__ == "__main__":
    main()
