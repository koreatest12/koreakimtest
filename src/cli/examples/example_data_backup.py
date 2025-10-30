"""
예시: 데이터 자동 백업 스크립트

매일 실행하여 데이터를 수집하고 CSV/JSON으로 저장합니다.
오래된 백업은 자동으로 정리합니다.

스케줄 등록:
    python task_scheduler.py schedule example_data_backup.py \\
        --interval daily --time 18:00 \\
        --timeout 600 --lock-file ./locks/backup.lock
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from file_organizer import cleanup_old_files


def collect_sample_data():
    """
    실제 환경에서는 이 함수를 데이터베이스 쿼리, API 호출 등으로 대체하세요.

    예시:
        - 데이터베이스에서 일별 통계 수집
        - API에서 사용량 데이터 가져오기
        - 로그 파일 분석 결과
    """
    # 샘플 데이터
    data = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "total_users": 1234,
            "active_users": 567,
            "transactions": 89,
            "revenue": 123456.78
        },
        "status": "success"
    }

    return data


def backup_data(backup_dir: Path, retention_days: int = 30):
    """
    데이터를 백업하고 오래된 백업을 정리합니다.

    Args:
        backup_dir: 백업 디렉토리
        retention_days: 백업 보관 기간 (일)
    """
    backup_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("💾 데이터 백업 시작")
    print(f"   백업 위치: {backup_dir}")
    print(f"   보관 기간: {retention_days}일")
    print("=" * 70 + "\n")

    # 1단계: 데이터 수집
    print("[1/3] 데이터 수집 중...")
    try:
        data = collect_sample_data()
        print(f"   ✓ 데이터 수집 완료")
    except Exception as e:
        print(f"   ✗ 데이터 수집 실패: {e}")
        return

    # 2단계: 백업 파일 저장
    print("\n[2/3] 백업 파일 저장 중...")

    date_str = datetime.now().strftime("%Y%m%d")
    timestamp_str = datetime.now().strftime("%H%M%S")

    # JSON 백업
    json_file = backup_dir / f"backup_{date_str}_{timestamp_str}.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"   ✓ JSON 저장: {json_file.name}")

    # CSV 백업 (pandas 사용 가능한 경우)
    try:
        import pandas as pd

        # 메트릭을 평면화하여 DataFrame 생성
        flat_data = {
            "date": data["date"],
            "timestamp": data["timestamp"],
            **data["metrics"]
        }

        df = pd.DataFrame([flat_data])
        csv_file = backup_dir / f"backup_{date_str}_{timestamp_str}.csv"
        df.to_csv(csv_file, index=False, encoding='utf-8-sig')
        print(f"   ✓ CSV 저장: {csv_file.name}")

    except ImportError:
        print(f"   ⚠️  pandas 미설치 - CSV 백업 건너뜀")

    # 3단계: 오래된 백업 정리
    print(f"\n[3/3] {retention_days}일 이상 된 백업 정리 중...")
    cleanup_stats = cleanup_old_files(
        backup_dir,
        older_than_days=retention_days,
        pattern="backup_*",
        dry_run=False
    )

    # 결과 요약
    print("\n" + "=" * 70)
    print("✅ 데이터 백업 완료")
    print("=" * 70)
    print(f"\n📊 백업 결과:")
    print(f"   백업 파일: {json_file.name}")
    print(f"   데이터 수: {len(data['metrics'])}개 메트릭")
    print(f"\n🗑️  정리 결과:")
    print(f"   삭제된 파일: {cleanup_stats['deleted']}개")
    print(f"   확보된 공간: {cleanup_stats['total_size_mb']} MB")

    # 현재 백업 개수
    current_backups = len(list(backup_dir.glob("backup_*.json")))
    print(f"\n📦 현재 백업 개수: {current_backups}개")
    print("=" * 70)


def main():
    # 백업 디렉토리 (환경에 맞게 수정)
    backup_dir = Path(__file__).parent.parent.parent.parent / "backups"

    # 백업 실행 (30일 보관)
    backup_data(backup_dir, retention_days=30)


if __name__ == "__main__":
    main()
