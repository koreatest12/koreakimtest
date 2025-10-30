"""
File Organizer CLI - Organize files by type, date, or custom rules.

Usage:
    python file_organizer.py organize <directory> [--by type|date|extension] [--dry-run]
    python file_organizer.py cleanup <directory> [--older-than DAYS] [--pattern GLOB] [--dry-run]
    python file_organizer.py deduplicate <directory> [--by hash|name] [--dry-run]
"""

import argparse
import shutil
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Set
import json


# File type categories
FILE_CATEGORIES = {
    "images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico"],
    "videos": [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"],
    "audio": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"],
    "documents": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".md"],
    "spreadsheets": [".xls", ".xlsx", ".csv", ".ods"],
    "presentations": [".ppt", ".pptx", ".odp"],
    "archives": [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"],
    "code": [".py", ".js", ".ts", ".java", ".cpp", ".c", ".h", ".go", ".rs", ".rb"],
    "web": [".html", ".css", ".scss", ".jsx", ".tsx", ".vue"],
    "data": [".json", ".xml", ".yaml", ".yml", ".sql", ".db", ".sqlite"],
    "executables": [".exe", ".msi", ".dmg", ".app", ".deb", ".rpm"],
}


def get_file_category(file_path: Path) -> str:
    """Determine the category of a file based on its extension."""
    ext = file_path.suffix.lower()
    for category, extensions in FILE_CATEGORIES.items():
        if ext in extensions:
            return category
    return "others"


def calculate_file_hash(file_path: Path, chunk_size: int = 8192) -> str:
    """Calculate SHA256 hash of a file."""
    sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            while chunk := f.read(chunk_size):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception as e:
        print(f"⚠️  Error hashing {file_path}: {e}")
        return ""


def organize_by_type(source_dir: Path, dry_run: bool = False) -> Dict[str, int]:
    """Organize files into subdirectories by file type."""
    stats = defaultdict(int)

    print(f"\n📁 Organizing files in: {source_dir}")
    print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")

    for file_path in source_dir.iterdir():
        if not file_path.is_file():
            continue

        category = get_file_category(file_path)
        target_dir = source_dir / category
        target_path = target_dir / file_path.name

        # Handle name conflicts
        counter = 1
        while target_path.exists():
            stem = file_path.stem
            suffix = file_path.suffix
            target_path = target_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        stats[category] += 1

        if dry_run:
            print(f"   [DRY] {file_path.name} → {category}/{target_path.name}")
        else:
            target_dir.mkdir(exist_ok=True)
            shutil.move(str(file_path), str(target_path))
            print(f"   ✓ {file_path.name} → {category}/{target_path.name}")

    return dict(stats)


def organize_by_date(source_dir: Path, dry_run: bool = False) -> Dict[str, int]:
    """Organize files into subdirectories by modification date (YYYY-MM format)."""
    stats = defaultdict(int)

    print(f"\n📅 Organizing files by date in: {source_dir}")
    print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")

    for file_path in source_dir.iterdir():
        if not file_path.is_file():
            continue

        # Get modification time
        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
        date_folder = mtime.strftime("%Y-%m")

        target_dir = source_dir / date_folder
        target_path = target_dir / file_path.name

        # Handle name conflicts
        counter = 1
        while target_path.exists():
            stem = file_path.stem
            suffix = file_path.suffix
            target_path = target_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        stats[date_folder] += 1

        if dry_run:
            print(f"   [DRY] {file_path.name} → {date_folder}/{target_path.name}")
        else:
            target_dir.mkdir(exist_ok=True)
            shutil.move(str(file_path), str(target_path))
            print(f"   ✓ {file_path.name} → {date_folder}/{target_path.name}")

    return dict(stats)


def organize_by_extension(source_dir: Path, dry_run: bool = False) -> Dict[str, int]:
    """Organize files into subdirectories by file extension."""
    stats = defaultdict(int)

    print(f"\n📂 Organizing files by extension in: {source_dir}")
    print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")

    for file_path in source_dir.iterdir():
        if not file_path.is_file():
            continue

        ext = file_path.suffix.lower().lstrip('.') or "no_extension"
        target_dir = source_dir / ext
        target_path = target_dir / file_path.name

        # Handle name conflicts
        counter = 1
        while target_path.exists():
            stem = file_path.stem
            suffix = file_path.suffix
            target_path = target_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        stats[ext] += 1

        if dry_run:
            print(f"   [DRY] {file_path.name} → {ext}/{target_path.name}")
        else:
            target_dir.mkdir(exist_ok=True)
            shutil.move(str(file_path), str(target_path))
            print(f"   ✓ {file_path.name} → {ext}/{target_path.name}")

    return dict(stats)


def cleanup_old_files(
    source_dir: Path,
    older_than_days: int,
    pattern: str = "*",
    dry_run: bool = False
) -> Dict[str, int]:
    """Delete or archive files older than specified days."""
    cutoff_date = datetime.now() - timedelta(days=older_than_days)
    stats = {"deleted": 0, "total_size_mb": 0}

    print(f"\n🗑️  Cleaning up files older than {older_than_days} days")
    print(f"   Directory: {source_dir}")
    print(f"   Pattern: {pattern}")
    print(f"   Cutoff date: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")

    for file_path in source_dir.rglob(pattern):
        if not file_path.is_file():
            continue

        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
        if mtime < cutoff_date:
            size_mb = file_path.stat().st_size / (1024 * 1024)
            stats["total_size_mb"] += size_mb

            if dry_run:
                print(f"   [DRY] Would delete: {file_path} ({size_mb:.2f} MB, modified: {mtime.strftime('%Y-%m-%d')})")
            else:
                file_path.unlink()
                print(f"   ✓ Deleted: {file_path} ({size_mb:.2f} MB)")
                stats["deleted"] += 1

    stats["total_size_mb"] = round(stats["total_size_mb"], 2)
    return stats


def deduplicate_files(
    source_dir: Path,
    by: str = "hash",
    dry_run: bool = False
) -> Dict[str, int]:
    """Find and remove duplicate files."""
    stats = {"duplicates_found": 0, "space_saved_mb": 0}

    print(f"\n🔍 Finding duplicates by {by} in: {source_dir}")
    print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")

    if by == "hash":
        file_hashes: Dict[str, List[Path]] = defaultdict(list)

        # Build hash index
        for file_path in source_dir.rglob("*"):
            if not file_path.is_file():
                continue
            file_hash = calculate_file_hash(file_path)
            if file_hash:
                file_hashes[file_hash].append(file_path)

        # Find duplicates
        for file_hash, paths in file_hashes.items():
            if len(paths) > 1:
                # Keep the first file, delete the rest
                original = paths[0]
                duplicates = paths[1:]

                print(f"\n   Duplicate group (hash: {file_hash[:16]}...):")
                print(f"   ✓ KEEP: {original}")

                for dup_path in duplicates:
                    size_mb = dup_path.stat().st_size / (1024 * 1024)
                    stats["space_saved_mb"] += size_mb
                    stats["duplicates_found"] += 1

                    if dry_run:
                        print(f"   [DRY] Would delete: {dup_path} ({size_mb:.2f} MB)")
                    else:
                        dup_path.unlink()
                        print(f"   ✗ Deleted: {dup_path} ({size_mb:.2f} MB)")

    elif by == "name":
        file_names: Dict[str, List[Path]] = defaultdict(list)

        # Build name index
        for file_path in source_dir.rglob("*"):
            if not file_path.is_file():
                continue
            file_names[file_path.name].append(file_path)

        # Find duplicates
        for name, paths in file_names.items():
            if len(paths) > 1:
                # Keep the newest file
                paths_sorted = sorted(paths, key=lambda p: p.stat().st_mtime, reverse=True)
                newest = paths_sorted[0]
                duplicates = paths_sorted[1:]

                print(f"\n   Duplicate group (name: {name}):")
                print(f"   ✓ KEEP (newest): {newest}")

                for dup_path in duplicates:
                    size_mb = dup_path.stat().st_size / (1024 * 1024)
                    stats["space_saved_mb"] += size_mb
                    stats["duplicates_found"] += 1

                    if dry_run:
                        print(f"   [DRY] Would delete: {dup_path} ({size_mb:.2f} MB)")
                    else:
                        dup_path.unlink()
                        print(f"   ✗ Deleted: {dup_path} ({size_mb:.2f} MB)")

    stats["space_saved_mb"] = round(stats["space_saved_mb"], 2)
    return stats


def main():
    parser = argparse.ArgumentParser(
        description="File Organizer CLI - Organize, cleanup, and deduplicate files"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Organize command
    organize_parser = subparsers.add_parser("organize", help="Organize files into subdirectories")
    organize_parser.add_argument("directory", type=Path, help="Directory to organize")
    organize_parser.add_argument(
        "--by",
        choices=["type", "date", "extension"],
        default="type",
        help="Organization method (default: type)"
    )
    organize_parser.add_argument("--dry-run", action="store_true", help="Preview changes without applying")

    # Cleanup command
    cleanup_parser = subparsers.add_parser("cleanup", help="Delete old files")
    cleanup_parser.add_argument("directory", type=Path, help="Directory to clean")
    cleanup_parser.add_argument(
        "--older-than",
        type=int,
        required=True,
        help="Delete files older than N days"
    )
    cleanup_parser.add_argument("--pattern", default="*", help="File pattern (glob, default: *)")
    cleanup_parser.add_argument("--dry-run", action="store_true", help="Preview changes without applying")

    # Deduplicate command
    dedup_parser = subparsers.add_parser("deduplicate", help="Remove duplicate files")
    dedup_parser.add_argument("directory", type=Path, help="Directory to scan")
    dedup_parser.add_argument(
        "--by",
        choices=["hash", "name"],
        default="hash",
        help="Deduplication method (default: hash)"
    )
    dedup_parser.add_argument("--dry-run", action="store_true", help="Preview changes without applying")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Execute command
    if args.command == "organize":
        if not args.directory.exists():
            print(f"❌ Error: Directory not found: {args.directory}")
            return

        if args.by == "type":
            stats = organize_by_type(args.directory, args.dry_run)
        elif args.by == "date":
            stats = organize_by_date(args.directory, args.dry_run)
        elif args.by == "extension":
            stats = organize_by_extension(args.directory, args.dry_run)

        print("\n" + "=" * 60)
        print(f"📊 Summary: Organized {sum(stats.values())} files")
        for category, count in sorted(stats.items()):
            print(f"   {category}: {count} files")
        print("=" * 60)

    elif args.command == "cleanup":
        if not args.directory.exists():
            print(f"❌ Error: Directory not found: {args.directory}")
            return

        stats = cleanup_old_files(
            args.directory,
            args.older_than,
            args.pattern,
            args.dry_run
        )

        print("\n" + "=" * 60)
        print(f"📊 Summary: {'Would delete' if args.dry_run else 'Deleted'} {stats['deleted']} files")
        print(f"   Space {'that would be' if args.dry_run else ''} freed: {stats['total_size_mb']} MB")
        print("=" * 60)

    elif args.command == "deduplicate":
        if not args.directory.exists():
            print(f"❌ Error: Directory not found: {args.directory}")
            return

        stats = deduplicate_files(args.directory, args.by, args.dry_run)

        print("\n" + "=" * 60)
        print(f"📊 Summary: Found {stats['duplicates_found']} duplicates")
        print(f"   Space {'that would be' if args.dry_run else ''} saved: {stats['space_saved_mb']} MB")
        print("=" * 60)


if __name__ == "__main__":
    main()
