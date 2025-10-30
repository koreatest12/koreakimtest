"""
예시: 사진 대량 변환 및 최적화 스크립트

PNG/BMP 이미지를 용량 효율적인 WEBP 또는 JPG로 변환합니다.

사용법:
    python example_photo_converter.py <photos_dir> [--format webp|jpg] [--quality 85]

스케줄 등록:
    python task_scheduler.py schedule example_photo_converter.py --interval weekly --time 03:00
"""

import sys
from pathlib import Path
import argparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from bulk_converter import convert_image


def convert_photos(
    photos_dir: Path,
    target_format: str = "webp",
    quality: int = 85,
    delete_originals: bool = False
):
    """
    사진을 대량 변환하고 최적화합니다.

    Args:
        photos_dir: 사진 디렉토리
        target_format: 변환할 형식 (webp, jpg)
        quality: 변환 품질 (1-100)
        delete_originals: 원본 파일 삭제 여부
    """
    if not photos_dir.exists():
        print(f"❌ 폴더를 찾을 수 없습니다: {photos_dir}")
        return

    # 변환할 원본 형식들
    source_formats = ["png", "bmp", "tiff"]

    output_dir = photos_dir / f"{target_format}_converted"
    output_dir.mkdir(exist_ok=True)

    print("=" * 70)
    print(f"📸 사진 변환 시작")
    print(f"   입력 폴더: {photos_dir}")
    print(f"   출력 폴더: {output_dir}")
    print(f"   변환 형식: {target_format.upper()}")
    print(f"   품질: {quality}")
    print("=" * 70 + "\n")

    stats = {
        "total": 0,
        "success": 0,
        "failed": 0,
        "space_saved_mb": 0
    }

    for source_format in source_formats:
        pattern = f"*.{source_format}"
        files = list(photos_dir.glob(pattern))

        if not files:
            continue

        print(f"\n🔄 {source_format.upper()} → {target_format.upper()} 변환 중 ({len(files)}개)...")

        for file_path in files:
            output_path = output_dir / f"{file_path.stem}.{target_format}"

            # 변환
            if convert_image(file_path, output_path, quality):
                original_size = file_path.stat().st_size / (1024 * 1024)
                converted_size = output_path.stat().st_size / (1024 * 1024)
                space_saved = original_size - converted_size

                print(f"   ✓ {file_path.name}")
                print(f"     {original_size:.2f}MB → {converted_size:.2f}MB (절감: {space_saved:.2f}MB)")

                stats["success"] += 1
                stats["space_saved_mb"] += space_saved

                # 원본 삭제 (옵션)
                if delete_originals:
                    file_path.unlink()
                    print(f"     🗑️  원본 삭제됨")

            else:
                print(f"   ✗ {file_path.name} - 변환 실패")
                stats["failed"] += 1

            stats["total"] += 1

    # 결과 요약
    print("\n" + "=" * 70)
    print("✅ 사진 변환 완료")
    print("=" * 70)
    print(f"\n📊 변환 결과:")
    print(f"   총 파일: {stats['total']}개")
    print(f"   ✓ 성공: {stats['success']}개")
    print(f"   ✗ 실패: {stats['failed']}개")
    print(f"\n💾 절감된 공간: {stats['space_saved_mb']:.2f} MB")
    print(f"   출력 위치: {output_dir}")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="사진 대량 변환 및 최적화")
    parser.add_argument("photos_dir", type=Path, help="사진 디렉토리")
    parser.add_argument(
        "--format",
        choices=["webp", "jpg"],
        default="webp",
        help="변환할 형식 (기본: webp)"
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=85,
        help="변환 품질 1-100 (기본: 85)"
    )
    parser.add_argument(
        "--delete-originals",
        action="store_true",
        help="원본 파일 삭제"
    )

    args = parser.parse_args()

    convert_photos(
        args.photos_dir,
        args.format,
        args.quality,
        args.delete_originals
    )


if __name__ == "__main__":
    main()
