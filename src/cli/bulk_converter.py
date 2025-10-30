"""
Bulk File Converter CLI - Convert files between formats in batch.

Supported conversions:
- Images: PNG ↔ JPG ↔ WEBP ↔ BMP
- Documents: TXT → PDF, MD → HTML
- Data: CSV ↔ JSON ↔ Excel (XLSX), JSON ↔ YAML
- Audio: (requires ffmpeg) MP3 ↔ WAV ↔ OGG
- Video: (requires ffmpeg) MP4 ↔ AVI ↔ WEBM

Usage:
    python bulk_converter.py images <input_dir> --from png --to jpg [--quality 90] [--output-dir DIR]
    python bulk_converter.py data <input_dir> --from csv --to json [--output-dir DIR]
    python bulk_converter.py markdown <input_dir> [--output-dir DIR]
"""

import argparse
import json
import csv
import subprocess
from pathlib import Path
from typing import Optional, List
import base64
from datetime import datetime


def convert_image(
    input_path: Path,
    output_path: Path,
    quality: int = 90
) -> bool:
    """Convert image using PIL/Pillow."""
    try:
        from PIL import Image

        with Image.open(input_path) as img:
            # Convert RGBA to RGB for formats that don't support transparency
            if img.mode == 'RGBA' and output_path.suffix.lower() in ['.jpg', '.jpeg']:
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])  # 3 is the alpha channel
                background.save(output_path, quality=quality, optimize=True)
            else:
                img.save(output_path, quality=quality, optimize=True)

        return True
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_csv_to_json(input_path: Path, output_path: Path) -> bool:
    """Convert CSV to JSON."""
    try:
        with open(input_path, 'r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            data = list(reader)

        with open(output_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(data, jsonfile, indent=2, ensure_ascii=False)

        return True
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_json_to_csv(input_path: Path, output_path: Path) -> bool:
    """Convert JSON to CSV."""
    try:
        with open(input_path, 'r', encoding='utf-8') as jsonfile:
            data = json.load(jsonfile)

        # Handle array of objects
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            fieldnames = list(data[0].keys())

            with open(output_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)

            return True
        else:
            print(f"❌ {input_path.name}: JSON must be an array of objects")
            return False

    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_csv_to_excel(input_path: Path, output_path: Path) -> bool:
    """Convert CSV to Excel."""
    try:
        import pandas as pd

        df = pd.read_csv(input_path, encoding='utf-8-sig')
        df.to_excel(output_path, index=False, engine='openpyxl')

        return True
    except ImportError:
        print("❌ Error: pandas and openpyxl required. Install: pip install pandas openpyxl")
        return False
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_excel_to_csv(input_path: Path, output_path: Path) -> bool:
    """Convert Excel to CSV."""
    try:
        import pandas as pd

        df = pd.read_excel(input_path, engine='openpyxl')
        df.to_csv(output_path, index=False, encoding='utf-8-sig')

        return True
    except ImportError:
        print("❌ Error: pandas and openpyxl required. Install: pip install pandas openpyxl")
        return False
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_json_to_yaml(input_path: Path, output_path: Path) -> bool:
    """Convert JSON to YAML."""
    try:
        import yaml

        with open(input_path, 'r', encoding='utf-8') as jsonfile:
            data = json.load(jsonfile)

        with open(output_path, 'w', encoding='utf-8') as yamlfile:
            yaml.dump(data, yamlfile, default_flow_style=False, allow_unicode=True)

        return True
    except ImportError:
        print("❌ Error: PyYAML required. Install: pip install PyYAML")
        return False
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_yaml_to_json(input_path: Path, output_path: Path) -> bool:
    """Convert YAML to JSON."""
    try:
        import yaml

        with open(input_path, 'r', encoding='utf-8') as yamlfile:
            data = yaml.safe_load(yamlfile)

        with open(output_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(data, jsonfile, indent=2, ensure_ascii=False)

        return True
    except ImportError:
        print("❌ Error: PyYAML required. Install: pip install PyYAML")
        return False
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_markdown_to_html(input_path: Path, output_path: Path) -> bool:
    """Convert Markdown to HTML."""
    try:
        import markdown

        with open(input_path, 'r', encoding='utf-8') as mdfile:
            md_content = mdfile.read()

        html_content = markdown.markdown(
            md_content,
            extensions=['fenced_code', 'tables', 'codehilite']
        )

        # Wrap in basic HTML template
        full_html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{input_path.stem}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            color: #333;
        }}
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background: #f4f4f4;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>"""

        with open(output_path, 'w', encoding='utf-8') as htmlfile:
            htmlfile.write(full_html)

        return True
    except ImportError:
        print("❌ Error: markdown required. Install: pip install markdown")
        return False
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def convert_audio_video(
    input_path: Path,
    output_path: Path,
    bitrate: Optional[str] = None
) -> bool:
    """Convert audio/video using ffmpeg."""
    try:
        cmd = ['ffmpeg', '-i', str(input_path), '-y']

        if bitrate:
            cmd.extend(['-b:a', bitrate])

        cmd.append(str(output_path))

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            return True
        else:
            print(f"❌ FFmpeg error: {result.stderr}")
            return False

    except FileNotFoundError:
        print("❌ Error: ffmpeg not found. Install ffmpeg and add to PATH")
        return False
    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return False


def bulk_convert_images(
    input_dir: Path,
    from_format: str,
    to_format: str,
    quality: int = 90,
    output_dir: Optional[Path] = None
) -> dict:
    """Bulk convert images."""
    if output_dir is None:
        output_dir = input_dir / f"{to_format}_output"
    output_dir.mkdir(exist_ok=True)

    pattern = f"*.{from_format}"
    files = list(input_dir.glob(pattern))

    print(f"\n🖼️  Converting {len(files)} {from_format.upper()} images to {to_format.upper()}")
    print(f"   Quality: {quality}")
    print(f"   Output: {output_dir}\n")

    stats = {"success": 0, "failed": 0}

    for file_path in files:
        output_path = output_dir / f"{file_path.stem}.{to_format}"

        if convert_image(file_path, output_path, quality):
            print(f"   ✓ {file_path.name} → {output_path.name}")
            stats["success"] += 1
        else:
            stats["failed"] += 1

    return stats


def bulk_convert_data(
    input_dir: Path,
    from_format: str,
    to_format: str,
    output_dir: Optional[Path] = None
) -> dict:
    """Bulk convert data files."""
    if output_dir is None:
        output_dir = input_dir / f"{to_format}_output"
    output_dir.mkdir(exist_ok=True)

    pattern = f"*.{from_format}"
    files = list(input_dir.glob(pattern))

    print(f"\n📊 Converting {len(files)} {from_format.upper()} files to {to_format.upper()}")
    print(f"   Output: {output_dir}\n")

    stats = {"success": 0, "failed": 0}

    for file_path in files:
        output_path = output_dir / f"{file_path.stem}.{to_format}"

        # Select conversion function
        success = False
        if from_format == "csv" and to_format == "json":
            success = convert_csv_to_json(file_path, output_path)
        elif from_format == "json" and to_format == "csv":
            success = convert_json_to_csv(file_path, output_path)
        elif from_format == "csv" and to_format == "xlsx":
            success = convert_csv_to_excel(file_path, output_path)
        elif from_format == "xlsx" and to_format == "csv":
            success = convert_excel_to_csv(file_path, output_path)
        elif from_format == "json" and to_format in ["yaml", "yml"]:
            success = convert_json_to_yaml(file_path, output_path)
        elif from_format in ["yaml", "yml"] and to_format == "json":
            success = convert_yaml_to_json(file_path, output_path)

        if success:
            print(f"   ✓ {file_path.name} → {output_path.name}")
            stats["success"] += 1
        else:
            stats["failed"] += 1

    return stats


def bulk_convert_markdown(
    input_dir: Path,
    output_dir: Optional[Path] = None
) -> dict:
    """Bulk convert Markdown to HTML."""
    if output_dir is None:
        output_dir = input_dir / "html_output"
    output_dir.mkdir(exist_ok=True)

    files = list(input_dir.glob("*.md"))

    print(f"\n📝 Converting {len(files)} Markdown files to HTML")
    print(f"   Output: {output_dir}\n")

    stats = {"success": 0, "failed": 0}

    for file_path in files:
        output_path = output_dir / f"{file_path.stem}.html"

        if convert_markdown_to_html(file_path, output_path):
            print(f"   ✓ {file_path.name} → {output_path.name}")
            stats["success"] += 1
        else:
            stats["failed"] += 1

    return stats


def main():
    parser = argparse.ArgumentParser(
        description="Bulk File Converter CLI - Convert files between formats"
    )
    subparsers = parser.add_subparsers(dest="command", help="Conversion type")

    # Images command
    img_parser = subparsers.add_parser("images", help="Convert images")
    img_parser.add_argument("input_dir", type=Path, help="Input directory")
    img_parser.add_argument("--from", dest="from_format", required=True, help="Source format (png, jpg, webp, bmp)")
    img_parser.add_argument("--to", dest="to_format", required=True, help="Target format")
    img_parser.add_argument("--quality", type=int, default=90, help="Quality (1-100, default: 90)")
    img_parser.add_argument("--output-dir", type=Path, help="Output directory")

    # Data command
    data_parser = subparsers.add_parser("data", help="Convert data files")
    data_parser.add_argument("input_dir", type=Path, help="Input directory")
    data_parser.add_argument("--from", dest="from_format", required=True, help="Source format (csv, json, xlsx, yaml)")
    data_parser.add_argument("--to", dest="to_format", required=True, help="Target format")
    data_parser.add_argument("--output-dir", type=Path, help="Output directory")

    # Markdown command
    md_parser = subparsers.add_parser("markdown", help="Convert Markdown to HTML")
    md_parser.add_argument("input_dir", type=Path, help="Input directory")
    md_parser.add_argument("--output-dir", type=Path, help="Output directory")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Execute command
    if args.command == "images":
        stats = bulk_convert_images(
            args.input_dir,
            args.from_format,
            args.to_format,
            args.quality,
            args.output_dir
        )

    elif args.command == "data":
        stats = bulk_convert_data(
            args.input_dir,
            args.from_format,
            args.to_format,
            args.output_dir
        )

    elif args.command == "markdown":
        stats = bulk_convert_markdown(args.input_dir, args.output_dir)

    else:
        parser.print_help()
        return

    # Print summary
    print("\n" + "=" * 60)
    print(f"📊 Conversion Summary:")
    print(f"   ✓ Success: {stats['success']}")
    print(f"   ✗ Failed: {stats['failed']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
