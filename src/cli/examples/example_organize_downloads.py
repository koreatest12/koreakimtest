"""
예시: Downloads 폴더 자동 정리 스크립트

이 스크립트를 스케줄러에 등록하면 매일 자동으로 Downloads 폴더를 정리합니다.

스케줄 등록:
    python task_scheduler.py schedule example_organize_downloads.py --interval daily --time 00:00
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from file_organizer import organize_by_type, cleanup_old_files, deduplicate_files
import os


def main():
    # Downloads 폴더 경로 (환경에 맞게 수정)
    downloads_dir = Path.home() / "Downloads"

    if not downloads_dir.exists():
        print(f"❌ Downloads 폴더를 찾을 수 없습니다: {downloads_dir}")
        return

    print("=" * 70)
    print("📦 Downloads 폴더 자동 정리 시작")
    print(f"   경로: {downloads_dir}")
    print("=" * 70)

    # 1단계: 파일 타입별 정리
    print("\n[1/3] 파일 타입별 정리 중...")
    stats_organize = organize_by_type(downloads_dir, dry_run=False)

    # 2단계: 30일 이상 된 임시 파일 삭제
    print("\n[2/3] 30일 이상 된 임시 파일 삭제 중...")
    others_dir = downloads_dir / "others"
    if others_dir.exists():
        stats_cleanup = cleanup_old_files(
            others_dir,
            older_than_days=30,
            pattern="*",
            dry_run=False
        )
    else:
        stats_cleanup = {"deleted": 0, "total_size_mb": 0}

    # 3단계: 이미지 폴더 중복 제거
    print("\n[3/3] 이미지 중복 파일 제거 중...")
    images_dir = downloads_dir / "images"
    if images_dir.exists():
        stats_dedup = deduplicate_files(
            images_dir,
            by="hash",
            dry_run=False
        )
    else:
        stats_dedup = {"duplicates_found": 0, "space_saved_mb": 0}

    # 요약 리포트
    print("\n" + "=" * 70)
    print("✅ Downloads 폴더 정리 완료")
    print("=" * 70)
    print(f"\n📊 정리 결과:")
    print(f"   파일 분류: {sum(stats_organize.values())}개")
    print(f"   오래된 파일 삭제: {stats_cleanup['deleted']}개 ({stats_cleanup['total_size_mb']} MB)")
    print(f"   중복 파일 제거: {stats_dedup['duplicates_found']}개 ({stats_dedup['space_saved_mb']} MB)")

    total_space_saved = stats_cleanup['total_size_mb'] + stats_dedup['space_saved_mb']
    print(f"\n💾 총 확보된 공간: {total_space_saved:.2f} MB")
    print("=" * 70)


if __name__ == "__main__":
    main()
