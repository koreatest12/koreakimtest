"""
예시: 보안 백업 자동화 스크립트

중요 데이터를 암호화하여 안전하게 백업하고 보관 정책을 적용합니다.

스케줄 등록:
    python task_scheduler.py schedule example_secure_backup.py \\
        --interval daily --time 02:00 \\
        --timeout 3600 --lock-file ./locks/secure_backup.lock
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from secure_backup import SecureBackup


def get_backup_password() -> str:
    """
    환경 변수에서 백업 비밀번호 가져오기

    실제 환경에서는:
    1. 환경 변수 설정: set BACKUP_PASSWORD=YourSecurePassword
    2. 또는 시스템 키링 사용 (keyring 라이브러리)
    """
    password = os.getenv("BACKUP_PASSWORD")

    if not password:
        # 환경 변수 없으면 기본값 사용 (테스트용만!)
        print("⚠️  환경 변수 BACKUP_PASSWORD가 설정되지 않았습니다")
        print("   테스트용 기본 비밀번호를 사용합니다")
        password = "TestBackupPassword123!"

    return password


def main():
    """메인 백업 실행 함수"""

    # 백업 설정
    backup_targets = [
        {
            "name": "Documents",
            "path": Path.home() / "Documents",
            "enabled": True
        },
        {
            "name": "IdeaProjects",
            "path": Path.home() / "IdeaProjects",
            "enabled": True
        },
        {
            "name": "Config",
            "path": Path.home() / ".config",
            "enabled": False  # 예시로 비활성화
        }
    ]

    backup_dir = Path.home() / "backups" / "secure"
    backup_dir.mkdir(parents=True, exist_ok=True)

    # 비밀번호 가져오기
    password = get_backup_password()

    print("=" * 80)
    print("🔒 보안 백업 자동화")
    print("=" * 80)
    print(f"   실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   백업 위치: {backup_dir}")
    print(f"   암호화: ✓ (AES-256)")
    print("=" * 80 + "\n")

    results = []

    # 각 대상별 백업 수행
    for target in backup_targets:
        if not target["enabled"]:
            print(f"⏭️  건너뜀: {target['name']} (비활성화)\n")
            continue

        if not target["path"].exists():
            print(f"⚠️  건너뜀: {target['name']} (경로 없음: {target['path']})\n")
            continue

        print(f"{'=' * 80}")
        print(f"📦 백업: {target['name']}")
        print(f"{'=' * 80}\n")

        # SecureBackup 인스턴스 생성
        secure_backup = SecureBackup(password)

        # 백업 실행 (증분 백업)
        result = secure_backup.create_backup(
            source_dir=target["path"],
            backup_dir=backup_dir,
            password=password,
            compress=True,
            incremental=True  # 증분 백업
        )

        results.append({
            "name": target["name"],
            "success": result.get("success", False),
            "skipped": result.get("skipped", False),
            "error": result.get("error")
        })

        print()

    # 결과 요약
    print("=" * 80)
    print("📊 백업 완료 요약")
    print("=" * 80)

    total = len([r for r in results if not r.get("skipped")])
    success = sum(1 for r in results if r["success"] and not r.get("skipped"))
    skipped = sum(1 for r in results if r.get("skipped"))
    failed = total - success

    print(f"\n   총 대상: {len(results)}개")
    print(f"   ✓ 백업 성공: {success}개")
    print(f"   ⏭️  건너뜀: {skipped}개 (변경 없음)")
    print(f"   ✗ 백업 실패: {failed}개")

    print(f"\n   상세:")
    for result in results:
        if result.get("skipped"):
            status = "⏭️  건너뜀 (변경 없음)"
        elif result["success"]:
            status = "✓ 성공"
        else:
            status = f"✗ 실패 ({result.get('error', 'Unknown')})"

        print(f"      {result['name']}: {status}")

    print("\n" + "=" * 80)

    # 보관 정책 적용 (예시)
    print("\n🗑️  보관 정책 적용 (30일 이상 된 백업 삭제)...")

    # 실제로는 backup_manager.py의 apply_retention_policy() 사용
    # 여기서는 간단한 예시만 표시
    print("   ℹ️  보관 정책 적용은 backup_manager.py를 사용하세요")
    print("   예: python backup_manager.py rotate --config backup_config.yaml")

    print("\n✅ 자동 백업 완료")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ 백업 실패: {e}")
        sys.exit(1)
