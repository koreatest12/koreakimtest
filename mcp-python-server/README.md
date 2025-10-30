# Python MCP Server - Utility Tools

A custom Model Context Protocol (MCP) server written in Python with FastMCP, providing useful utility functions.

## Features

### 📁 File Operations
- **calculate_file_hash**: Calculate MD5, SHA1, SHA256, or SHA512 hash of files
- **get_directory_size**: Get total size and file count of directories
- **count_words_in_file**: Count words, lines, and characters in text files
- **search_in_files**: Search for terms across multiple files

### 🖥️ System Information
- **get_system_info**: Get detailed system and platform information
- **get_environment_variables**: List and filter environment variables

### 📝 JSON Operations
- **format_json**: Format and prettify JSON strings
- **validate_json**: Validate JSON syntax and get error details

### 🔢 Math & Utilities
- **calculate**: Safely evaluate mathematical expressions
- **get_current_time**: Get current time and date information

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Test the server:
```bash
python server.py
```

## Configuration for Claude Code

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "python-utils": {
      "command": "python",
      "args": ["C:\\Users\\kwonn\\mcp-python-server\\server.py"]
    }
  }
}
```

Then restart Claude Code to load the server.

## Usage Examples

### Calculate File Hash
```python
calculate_file_hash("C:\\path\\to\\file.txt", "sha256")
```

### Get Directory Size
```python
get_directory_size("C:\\Users\\kwonn\\Documents")
```

### Search in Files
```python
search_in_files("C:\\projects", "TODO", ".py")
```

### Format JSON
```python
format_json('{"name":"John","age":30}', indent=4)
```

### Calculate Math Expression
```python
calculate("2 + 2 * 3 + pow(2, 3)")
```

## License

MIT
