#!/usr/bin/env python3
"""
Custom Python MCP Server with Useful Tools (Pure MCP SDK)
Provides various utility functions for file operations, text processing, system info, and secure backups
"""

import asyncio
import os
import json
import hashlib
import datetime
import platform
import tarfile
import tempfile
import shutil
from pathlib import Path
from typing import Any, Optional
from tabulate import tabulate
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, CallToolResult

# Create server instance
server = Server("python-utils")


# ============================================================================
# Secure Backup Helper Functions
# ============================================================================

def encrypt_data(data: bytes, password: str) -> bytes:
    """Encrypt data using AES-256 (requires cryptography library)"""
    try:
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
        from cryptography.hazmat.backends import default_backend
        import secrets

        # Generate salt and IV
        salt = secrets.token_bytes(16)
        iv = secrets.token_bytes(16)

        # Derive key using PBKDF2
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = kdf.derive(password.encode())

        # Add PKCS7 padding
        padding_length = 16 - (len(data) % 16)
        data += bytes([padding_length] * padding_length)

        # Encrypt
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(data) + encryptor.finalize()

        # Return salt + IV + ciphertext
        return salt + iv + ciphertext

    except ImportError:
        raise ImportError("cryptography library required: pip install cryptography")


def decrypt_data(encrypted_data: bytes, password: str) -> bytes:
    """Decrypt data using AES-256"""
    try:
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
        from cryptography.hazmat.backends import default_backend

        # Extract salt, IV, and ciphertext
        salt = encrypted_data[:16]
        iv = encrypted_data[16:32]
        ciphertext = encrypted_data[32:]

        # Derive key
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = kdf.derive(password.encode())

        # Decrypt
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        plaintext_padded = decryptor.update(ciphertext) + decryptor.finalize()

        # Remove padding
        padding_length = plaintext_padded[-1]
        plaintext = plaintext_padded[:-padding_length]

        return plaintext

    except ImportError:
        raise ImportError("cryptography library required: pip install cryptography")


def calculate_directory_hash(directory: Path) -> dict:
    """Calculate SHA-256 hash for all files in directory"""
    file_hashes = {}
    for file_path in directory.rglob("*"):
        if file_path.is_file():
            relative_path = str(file_path.relative_to(directory))
            sha256 = hashlib.sha256()
            with open(file_path, 'rb') as f:
                while chunk := f.read(8192):
                    sha256.update(chunk)
            file_hashes[relative_path] = sha256.hexdigest()
    return file_hashes


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="get_system_info",
            description="Get detailed system information including platform, architecture, and Python version",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="get_current_time",
            description="Get current time and date information",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="calculate",
            description="Safely evaluate a mathematical expression (e.g., '2 + 2 * 3')",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate",
                    }
                },
                "required": ["expression"],
            },
        ),
        Tool(
            name="calculate_file_hash",
            description="Calculate hash of a file (MD5, SHA1, SHA256, or SHA512)",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the file",
                    },
                    "algorithm": {
                        "type": "string",
                        "description": "Hash algorithm (md5, sha1, sha256, sha512)",
                        "enum": ["md5", "sha1", "sha256", "sha512"],
                        "default": "sha256",
                    },
                },
                "required": ["file_path"],
            },
        ),
        Tool(
            name="get_directory_size",
            description="Calculate total size of a directory with file and directory counts",
            inputSchema={
                "type": "object",
                "properties": {
                    "directory_path": {
                        "type": "string",
                        "description": "Path to the directory",
                    }
                },
                "required": ["directory_path"],
            },
        ),
        Tool(
            name="count_words_in_file",
            description="Count words, lines, and characters in a text file",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the text file",
                    }
                },
                "required": ["file_path"],
            },
        ),
        Tool(
            name="format_json",
            description="Format a JSON string with proper indentation",
            inputSchema={
                "type": "object",
                "properties": {
                    "json_string": {
                        "type": "string",
                        "description": "JSON string to format",
                    },
                    "indent": {
                        "type": "number",
                        "description": "Number of spaces for indentation",
                        "default": 2,
                    },
                },
                "required": ["json_string"],
            },
        ),
        Tool(
            name="validate_json",
            description="Validate if a string is valid JSON",
            inputSchema={
                "type": "object",
                "properties": {
                    "json_string": {
                        "type": "string",
                        "description": "String to validate",
                    }
                },
                "required": ["json_string"],
            },
        ),
        Tool(
            name="create_table",
            description="Create formatted ASCII/Unicode text table from data. Supports multiple table formats (grid, simple, github, fancy_grid, etc.)",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "array",
                        "description": "Array of arrays representing table rows (including header row if headers not specified separately)",
                        "items": {
                            "type": "array"
                        }
                    },
                    "headers": {
                        "type": "array",
                        "description": "Optional array of column headers. If not provided, first row of data is used as headers",
                        "items": {
                            "type": "string"
                        }
                    },
                    "table_format": {
                        "type": "string",
                        "description": "Table format style",
                        "enum": ["plain", "simple", "github", "grid", "fancy_grid", "pipe", "orgtbl", "jira", "presto", "pretty", "psql", "rst", "mediawiki", "html", "latex"],
                        "default": "grid"
                    },
                    "show_index": {
                        "type": "boolean",
                        "description": "Show row index numbers",
                        "default": False
                    },
                    "num_align": {
                        "type": "string",
                        "description": "Alignment for numeric columns (left, right, center, decimal)",
                        "enum": ["left", "right", "center", "decimal"],
                        "default": "right"
                    }
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="create_secure_backup",
            description="Create encrypted and compressed backup of a directory with SHA-256 integrity verification. Returns backup metadata including file count, size, and checksum.",
            inputSchema={
                "type": "object",
                "properties": {
                    "source_directory": {
                        "type": "string",
                        "description": "Directory to backup",
                    },
                    "output_directory": {
                        "type": "string",
                        "description": "Directory to store backup file",
                    },
                    "password": {
                        "type": "string",
                        "description": "Encryption password (optional, but highly recommended)",
                    },
                    "backup_name": {
                        "type": "string",
                        "description": "Custom backup name (optional, auto-generated if not provided)",
                    }
                },
                "required": ["source_directory", "output_directory"],
            },
        ),
        Tool(
            name="restore_secure_backup",
            description="Restore encrypted backup to specified directory. Decrypts and extracts the backup archive.",
            inputSchema={
                "type": "object",
                "properties": {
                    "backup_file": {
                        "type": "string",
                        "description": "Path to backup file (.tar.gz.enc or .tar.gz)",
                    },
                    "output_directory": {
                        "type": "string",
                        "description": "Directory to restore files to",
                    },
                    "password": {
                        "type": "string",
                        "description": "Decryption password (required if backup is encrypted)",
                    }
                },
                "required": ["backup_file", "output_directory"],
            },
        ),
        Tool(
            name="verify_secure_backup",
            description="Verify backup integrity using SHA-256 checksum. Checks if backup file is intact and matches original metadata.",
            inputSchema={
                "type": "object",
                "properties": {
                    "backup_file": {
                        "type": "string",
                        "description": "Path to backup file",
                    },
                    "metadata_file": {
                        "type": "string",
                        "description": "Path to metadata JSON file (optional, auto-detected if in same directory)",
                    }
                },
                "required": ["backup_file"],
            },
        ),
        Tool(
            name="list_backups",
            description="List all backups in a directory with their metadata (name, timestamp, size, encryption status, file count)",
            inputSchema={
                "type": "object",
                "properties": {
                    "backup_directory": {
                        "type": "string",
                        "description": "Directory containing backups",
                    }
                },
                "required": ["backup_directory"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> CallToolResult:
    """Handle tool calls."""

    try:
        if name == "get_system_info":
            result = {
                "플랫폼": platform.system(),
                "플랫폼_릴리스": platform.release(),
                "플랫폼_버전": platform.version(),
                "아키텍처": platform.machine(),
                "프로세서": platform.processor(),
                "파이썬_버전": platform.python_version(),
                "호스트명": platform.node(),
                "타임스탬프": datetime.datetime.now().isoformat()
            }
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "get_current_time":
            now = datetime.datetime.now()
            result = {
                "일시": now.isoformat(),
                "날짜": now.strftime("%Y-%m-%d"),
                "시간": now.strftime("%H:%M:%S"),
                "요일": now.strftime("%A"),
                "타임스탬프": now.timestamp()
            }
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "calculate":
            expression = arguments.get("expression")
            allowed_names = {
                "abs": abs, "round": round, "min": min, "max": max,
                "sum": sum, "pow": pow
            }
            result = eval(expression, {"__builtins__": {}}, allowed_names)
            output = {
                "수식": expression,
                "결과": result,
                "타임스탬프": datetime.datetime.now().isoformat()
            }
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(output, indent=2, ensure_ascii=False))]
            )

        elif name == "calculate_file_hash":
            file_path = arguments.get("file_path")
            algorithm = arguments.get("algorithm", "sha256")

            algorithms = {
                "md5": hashlib.md5,
                "sha1": hashlib.sha1,
                "sha256": hashlib.sha256,
                "sha512": hashlib.sha512
            }

            if algorithm not in algorithms:
                raise ValueError(f"Unsupported algorithm. Use: {', '.join(algorithms.keys())}")

            hash_func = algorithms[algorithm]()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_func.update(chunk)

            result = {
                "파일_경로": file_path,
                "알고리즘": algorithm,
                "해시": hash_func.hexdigest(),
                "타임스탬프": datetime.datetime.now().isoformat()
            }
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "get_directory_size":
            directory_path = arguments.get("directory_path")
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
            size_bytes = total_size
            for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                if total_size < 1024.0:
                    size_str = f"{total_size:.2f} {unit}"
                    break
                total_size /= 1024.0

            result = {
                "디렉터리": directory_path,
                "전체_크기": size_str,
                "전체_바이트": size_bytes,
                "파일_개수": file_count,
                "디렉터리_개수": dir_count,
                "타임스탬프": datetime.datetime.now().isoformat()
            }
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "count_words_in_file":
            file_path = arguments.get("file_path")
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            lines = content.split('\n')
            words = content.split()
            chars = len(content)
            chars_no_spaces = len(content.replace(' ', '').replace('\n', '').replace('\t', ''))

            result = {
                "파일_경로": file_path,
                "줄_수": len(lines),
                "단어_수": len(words),
                "문자_수": chars,
                "공백_제외_문자_수": chars_no_spaces,
                "타임스탬프": datetime.datetime.now().isoformat()
            }
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "format_json":
            json_string = arguments.get("json_string")
            indent = arguments.get("indent", 2)
            data = json.loads(json_string)
            formatted = json.dumps(data, indent=indent, ensure_ascii=False)
            return CallToolResult(
                content=[TextContent(type="text", text=formatted)]
            )

        elif name == "validate_json":
            json_string = arguments.get("json_string")
            try:
                json.loads(json_string)
                result = {
                    "유효성": True,
                    "메시지": "유효한 JSON입니다"
                }
            except json.JSONDecodeError as e:
                result = {
                    "유효성": False,
                    "오류": str(e),
                    "줄": e.lineno,
                    "열": e.colno
                }
            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "create_table":
            data = arguments.get("data")
            headers = arguments.get("headers")
            table_format = arguments.get("table_format", "grid")
            show_index = arguments.get("show_index", False)
            num_align = arguments.get("num_align", "right")

            if not data or len(data) == 0:
                raise ValueError("Data array cannot be empty")

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

            return CallToolResult(
                content=[TextContent(type="text", text=table_str)]
            )

        elif name == "create_secure_backup":
            source_dir = Path(arguments.get("source_directory"))
            output_dir = Path(arguments.get("output_directory"))
            password = arguments.get("password")
            backup_name = arguments.get("backup_name")

            if not source_dir.exists():
                raise ValueError(f"Source directory not found: {source_dir}")

            output_dir.mkdir(parents=True, exist_ok=True)

            # Generate backup name
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            if not backup_name:
                backup_name = f"backup_{source_dir.name}_{timestamp}"

            # Calculate file hashes
            file_hashes = calculate_directory_hash(source_dir)

            # Create compressed archive
            archive_path = output_dir / f"{backup_name}.tar.gz"
            with tarfile.open(archive_path, "w:gz") as tar:
                tar.add(source_dir, arcname=source_dir.name)

            original_size = sum(
                (source_dir / f).stat().st_size
                for f in file_hashes.keys()
            )
            compressed_size = archive_path.stat().st_size

            # Encrypt if password provided
            if password:
                with open(archive_path, 'rb') as f:
                    archive_data = f.read()

                encrypted_data = encrypt_data(archive_data, password)

                encrypted_path = output_dir / f"{backup_name}.tar.gz.enc"
                with open(encrypted_path, 'wb') as f:
                    f.write(encrypted_data)

                # Remove unencrypted archive
                archive_path.unlink()
                final_path = encrypted_path
            else:
                final_path = archive_path

            # Calculate checksum
            sha256 = hashlib.sha256()
            with open(final_path, 'rb') as f:
                while chunk := f.read(8192):
                    sha256.update(chunk)
            checksum = sha256.hexdigest()

            # Create metadata
            metadata = {
                "backup_name": backup_name,
                "source_directory": str(source_dir),
                "timestamp": datetime.datetime.now().isoformat(),
                "encrypted": password is not None,
                "compressed": True,
                "file_count": len(file_hashes),
                "original_size_bytes": original_size,
                "backup_size_bytes": final_path.stat().st_size,
                "compression_ratio": round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0,
                "checksum": checksum,
                "file_hashes": file_hashes,
                "backup_file": str(final_path)
            }

            # Save metadata
            metadata_path = output_dir / f"{backup_name}_metadata.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)

            result = {
                "성공": True,
                "백업_파일": str(final_path),
                "메타데이터_파일": str(metadata_path),
                "파일_개수": len(file_hashes),
                "원본_크기_MB": round(original_size / (1024 * 1024), 2),
                "백업_크기_MB": round(final_path.stat().st_size / (1024 * 1024), 2),
                "압축률": metadata["compression_ratio"],
                "암호화됨": password is not None,
                "체크섬": checksum[:16] + "...",
                "타임스탬프": metadata["timestamp"]
            }

            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "restore_secure_backup":
            backup_file = Path(arguments.get("backup_file"))
            output_dir = Path(arguments.get("output_directory"))
            password = arguments.get("password")

            if not backup_file.exists():
                raise ValueError(f"Backup file not found: {backup_file}")

            output_dir.mkdir(parents=True, exist_ok=True)

            # Check if encrypted
            is_encrypted = backup_file.suffix == ".enc" or str(backup_file).endswith(".enc")

            if is_encrypted:
                if not password:
                    raise ValueError("Password required for encrypted backup")

                # Decrypt
                with open(backup_file, 'rb') as f:
                    encrypted_data = f.read()

                decrypted_data = decrypt_data(encrypted_data, password)

                # Save to temp file
                temp_archive = tempfile.NamedTemporaryFile(delete=False, suffix=".tar.gz")
                temp_archive.write(decrypted_data)
                temp_archive.close()
                archive_to_extract = Path(temp_archive.name)
            else:
                archive_to_extract = backup_file

            # Extract
            with tarfile.open(archive_to_extract, "r:gz") as tar:
                tar.extractall(output_dir)

            # Cleanup temp file
            if is_encrypted:
                archive_to_extract.unlink()

            result = {
                "성공": True,
                "백업_파일": str(backup_file),
                "복원_위치": str(output_dir),
                "암호화됨": is_encrypted,
                "타임스탬프": datetime.datetime.now().isoformat()
            }

            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "verify_secure_backup":
            backup_file = Path(arguments.get("backup_file"))
            metadata_file = arguments.get("metadata_file")

            if not backup_file.exists():
                raise ValueError(f"Backup file not found: {backup_file}")

            # Auto-detect metadata file
            if not metadata_file:
                backup_stem = backup_file.stem
                if backup_stem.endswith(".tar"):
                    backup_stem = backup_stem[:-4]
                if backup_stem.endswith(".gz"):
                    backup_stem = backup_stem[:-3]

                metadata_file = backup_file.parent / f"{backup_stem}_metadata.json"

            metadata_path = Path(metadata_file) if metadata_file else None

            if metadata_path and metadata_path.exists():
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)

                expected_checksum = metadata.get("checksum")

                # Calculate current checksum
                sha256 = hashlib.sha256()
                with open(backup_file, 'rb') as f:
                    while chunk := f.read(8192):
                        sha256.update(chunk)
                current_checksum = sha256.hexdigest()

                matches = current_checksum == expected_checksum

                result = {
                    "유효성": matches,
                    "백업_파일": str(backup_file),
                    "메타데이터_파일": str(metadata_path),
                    "예상_체크섬": expected_checksum[:32] + "...",
                    "현재_체크섬": current_checksum[:32] + "...",
                    "파일_개수": metadata.get("file_count"),
                    "타임스탬프": metadata.get("timestamp"),
                    "메시지": "백업 무결성 검증 완료" if matches else "백업이 손상되었을 수 있음 (체크섬 불일치)"
                }
            else:
                # No metadata, just check file exists
                result = {
                    "유효성": True,
                    "백업_파일": str(backup_file),
                    "메타데이터_파일": None,
                    "크기_MB": round(backup_file.stat().st_size / (1024 * 1024), 2),
                    "메시지": "백업 파일 존재함 (체크섬 검증을 위한 메타데이터 없음)"
                }

            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        elif name == "list_backups":
            backup_dir = Path(arguments.get("backup_directory"))

            if not backup_dir.exists():
                raise ValueError(f"Backup directory not found: {backup_dir}")

            metadata_files = sorted(
                backup_dir.glob("*_metadata.json"),
                key=lambda p: p.stat().st_mtime,
                reverse=True
            )

            backups = []
            for metadata_file in metadata_files:
                try:
                    with open(metadata_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)

                    backup_info = {
                        "이름": metadata.get("backup_name"),
                        "타임스탬프": metadata.get("timestamp"),
                        "원본": metadata.get("source_directory"),
                        "파일_개수": metadata.get("file_count"),
                        "크기_MB": round(metadata.get("backup_size_bytes", 0) / (1024 * 1024), 2),
                        "암호화됨": metadata.get("encrypted", False),
                        "압축됨": metadata.get("compressed", False),
                        "압축률": metadata.get("compression_ratio", 0),
                        "백업_파일": metadata.get("backup_file")
                    }
                    backups.append(backup_info)
                except Exception:
                    continue

            result = {
                "백업_개수": len(backups),
                "백업_목록": backups,
                "백업_디렉터리": str(backup_dir)
            }

            return CallToolResult(
                content=[TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]
            )

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        error_result = {
            "error": str(e),
            "tool": name,
            "timestamp": datetime.datetime.now().isoformat()
        }
        return CallToolResult(
            content=[TextContent(type="text", text=json.dumps(error_result, indent=2))],
            isError=True
        )


async def main():
    """Run the server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream, write_stream, server.create_initialization_options()
        )


if __name__ == "__main__":
    print("Starting Python Utility MCP Server...")
    asyncio.run(main())
