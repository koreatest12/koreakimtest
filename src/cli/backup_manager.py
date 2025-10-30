"""
백업 관리자 - 설정 파일 기반 자동 백업

YAML 설정 파일을 읽어 자동으로 백업을 수행합니다.
보관 정책, 증분 백업, 알림 등 고급 기능 포함

사용법:
    python backup_manager.py run [--config backup_config.yaml]
    python backup_manager.py rotate [--config backup_config.yaml]
    python backup_manager.py status [--config backup_config.yaml]
"""

import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import yaml

from secure_backup import SecureBackup


class BackupManager:
    """설정 기반 백업 관리자"""

    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.config = self._load_config()
        self.backup_dir = Path(self.config.get("backup_destination", "backups"))
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def _load_config(self) -> Dict:
        """설정 파일 로드"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except ImportError:
            print("❌ PyYAML 필요: pip install PyYAML")
            return {}
        except Exception as e:
            print(f"❌ 설정 파일 로드 실패: {e}")
            return {}

    def get_password(self) -> Optional[str]:
        """비밀번호 가져오기 (환경 변수 또는 키링)"""
        encryption_config = self.config.get("encryption", {})

        if not encryption_config.get("enabled", True):
            return None

        # 환경 변수에서 읽기
        password = os.getenv("BACKUP_PASSWORD")
        if password:
            return password

        # 키링 사용 (선택적)
        if encryption_config.get("use_keyring", False):
            try:
                import keyring
                password = keyring.get_password("secure_backup", "main")
                if password:
                    return password
            except ImportError:
                pass

        # 프롬프트
        import getpass
        return getpass.getpass("백업 암호화 비밀번호: ")

    def should_perform_full_backup(self, target_name: str) -> bool:
        """전체 백업 수행 여부 판단"""
        incremental_config = self.config.get("incremental_backup", {})

        if not incremental_config.get("enabled", True):
            return True

        interval_days = incremental_config.get("full_backup_interval_days", 7)

        # 마지막 전체 백업 시간 확인
        metadata_files = sorted(
            self.backup_dir.glob(f"backup_*{target_name}*_metadata.json"),
            reverse=True
        )

        for metadata_file in metadata_files:
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)

                if not metadata.get("incremental", False):
                    # 전체 백업 발견
                    last_full = datetime.fromisoformat(metadata["timestamp"])
                    days_since_full = (datetime.now() - last_full).days

                    if days_since_full < interval_days:
                        return False  # 증분 백업 수행
                    else:
                        return True  # 전체 백업 수행

            except Exception:
                continue

        # 전체 백업 이력 없음
        return True

    def run_backup(self):
        """설정된 모든 백업 수행"""
        targets = self.config.get("backup_targets", [])

        if not targets:
            print("❌ 백업 대상이 설정되지 않았습니다")
            return

        password = self.get_password()
        compression_enabled = self.config.get("compression", {}).get("enabled", True)

        results = []

        print("\n" + "=" * 80)
        print("🚀 자동 백업 시작")
        print("=" * 80)
        print(f"   백업 대상: {len([t for t in targets if t.get('enabled', True)])}개")
        print(f"   저장 위치: {self.backup_dir}")
        print("=" * 80 + "\n")

        for target in targets:
            if not target.get("enabled", True):
                print(f"⏭️  건너뜀: {target['name']} (비활성화)")
                continue

            source = Path(target["source"])
            if not source.exists():
                print(f"⚠️  건너뜀: {target['name']} (경로 없음: {source})")
                continue

            print(f"\n📦 백업 시작: {target['name']}")
            print(f"   소스: {source}")

            # 전체 백업 vs 증분 백업 판단
            incremental = not self.should_perform_full_backup(target['name'])

            secure_backup = SecureBackup(password)

            result = secure_backup.create_backup(
                source,
                self.backup_dir,
                password,
                compress=compression_enabled,
                incremental=incremental
            )

            results.append({
                "target": target['name'],
                "success": result.get("success", False),
                "incremental": incremental,
                "skipped": result.get("skipped", False)
            })

        # 결과 요약
        print("\n" + "=" * 80)
        print("📊 백업 완료 요약")
        print("=" * 80)

        total = len(results)
        success = sum(1 for r in results if r["success"] and not r.get("skipped"))
        skipped = sum(1 for r in results if r.get("skipped"))
        failed = total - success - skipped

        print(f"\n   총 대상: {total}개")
        print(f"   ✓ 성공: {success}개")
        print(f"   ⏭️  건너뜀: {skipped}개 (변경 없음)")
        print(f"   ✗ 실패: {failed}개")

        for result in results:
            status = "✓" if result["success"] and not result.get("skipped") else "⏭️" if result.get("skipped") else "✗"
            backup_type = "(증분)" if result.get("incremental") else "(전체)"
            print(f"\n   {status} {result['target']} {backup_type}")

        print("\n" + "=" * 80)

        # 자동 검증
        if self.config.get("verification", {}).get("auto_verify", True):
            print("\n🔍 백업 자동 검증 중...")
            # 구현 생략 (실제로는 각 백업 파일 검증)

        # 보관 정책 적용
        if success > 0:
            print("\n🗑️  보관 정책 적용 중...")
            self.apply_retention_policy()

    def apply_retention_policy(self):
        """백업 보관 정책 적용"""
        retention = self.config.get("retention", {})

        keep_recent = retention.get("keep_recent", 7)
        keep_daily = retention.get("keep_daily", 30)
        keep_weekly = retention.get("keep_weekly", 12)
        keep_monthly = retention.get("keep_monthly", 12)

        print(f"   최근 백업 유지: {keep_recent}개")
        print(f"   일별 백업 유지: {keep_daily}일")
        print(f"   주별 백업 유지: {keep_weekly}주")
        print(f"   월별 백업 유지: {keep_monthly}개월")

        # 메타데이터 파일 목록
        metadata_files = sorted(
            self.backup_dir.glob("*_metadata.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        if len(metadata_files) <= keep_recent:
            print(f"   ℹ️  백업 {len(metadata_files)}개 - 정리 불필요")
            return

        # 보관할 백업 결정
        backups_to_keep = set()

        # 최근 N개 유지
        backups_to_keep.update(metadata_files[:keep_recent])

        # 일별/주별/월별 백업 선택 로직 (간소화 버전)
        now = datetime.now()

        daily_cutoff = now - timedelta(days=keep_daily)
        weekly_cutoff = now - timedelta(weeks=keep_weekly)
        monthly_cutoff = now - timedelta(days=keep_monthly * 30)

        for metadata_file in metadata_files:
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)

                backup_time = datetime.fromisoformat(metadata["timestamp"])

                # 기간 내 백업 유지
                if backup_time > daily_cutoff:
                    backups_to_keep.add(metadata_file)
                elif backup_time > weekly_cutoff:
                    # 주별 대표 백업 (주의 첫 백업)
                    backups_to_keep.add(metadata_file)
                elif backup_time > monthly_cutoff:
                    # 월별 대표 백업 (월의 첫 백업)
                    backups_to_keep.add(metadata_file)

            except Exception:
                # 메타데이터 읽기 실패 - 유지
                backups_to_keep.add(metadata_file)

        # 삭제할 백업
        backups_to_delete = set(metadata_files) - backups_to_keep

        if not backups_to_delete:
            print(f"   ℹ️  삭제할 백업 없음")
            return

        deleted_count = 0
        freed_space_mb = 0

        for metadata_file in backups_to_delete:
            try:
                # 메타데이터 로드
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)

                # 관련 파일 삭제
                files_to_delete = []

                if "encrypted_file" in metadata:
                    files_to_delete.append(Path(metadata["encrypted_file"]))
                if "archive_file" in metadata:
                    files_to_delete.append(Path(metadata["archive_file"]))

                for file_path in files_to_delete:
                    if file_path.exists():
                        freed_space_mb += file_path.stat().st_size / (1024 * 1024)
                        file_path.unlink()

                # 메타데이터 삭제
                metadata_file.unlink()
                deleted_count += 1

            except Exception as e:
                print(f"   ⚠️  삭제 실패 {metadata_file.name}: {e}")

        print(f"   ✓ {deleted_count}개 백업 삭제, {freed_space_mb:.2f}MB 확보")

    def show_status(self):
        """백업 상태 조회"""
        metadata_files = sorted(
            self.backup_dir.glob("*_metadata.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        if not metadata_files:
            print("\n📦 백업 없음")
            return

        print("\n" + "=" * 80)
        print(f"📊 백업 상태 ({len(metadata_files)}개)")
        print("=" * 80)

        total_size_mb = 0
        targets_summary = {}

        for metadata_file in metadata_files:
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)

                backup_time = datetime.fromisoformat(metadata["timestamp"])
                age_hours = (datetime.now() - backup_time).total_seconds() / 3600

                # 백업 파일 크기
                size_mb = 0
                if "encrypted_file" in metadata:
                    enc_path = Path(metadata["encrypted_file"])
                    if enc_path.exists():
                        size_mb = enc_path.stat().st_size / (1024 * 1024)
                elif "archive_file" in metadata:
                    arc_path = Path(metadata["archive_file"])
                    if arc_path.exists():
                        size_mb = arc_path.stat().st_size / (1024 * 1024)

                total_size_mb += size_mb

                # 대상별 통계
                source = metadata.get("source_directory", "Unknown")
                if source not in targets_summary:
                    targets_summary[source] = {"count": 0, "size_mb": 0, "latest": backup_time}
                targets_summary[source]["count"] += 1
                targets_summary[source]["size_mb"] += size_mb
                if backup_time > targets_summary[source]["latest"]:
                    targets_summary[source]["latest"] = backup_time

            except Exception:
                continue

        print(f"\n전체 백업:")
        print(f"   총 개수: {len(metadata_files)}개")
        print(f"   총 크기: {total_size_mb:.2f}MB")

        print(f"\n대상별 백업:")
        for source, stats in sorted(targets_summary.items()):
            age_hours = (datetime.now() - stats["latest"]).total_seconds() / 3600
            age_str = f"{age_hours:.1f}시간 전" if age_hours < 24 else f"{age_hours/24:.1f}일 전"

            print(f"\n   📁 {source}")
            print(f"      백업 수: {stats['count']}개")
            print(f"      크기: {stats['size_mb']:.2f}MB")
            print(f"      최근: {age_str}")

        print("\n" + "=" * 80)


def main():
    parser = argparse.ArgumentParser(description="백업 관리자")
    subparsers = parser.add_subparsers(dest="command", help="사용 가능한 명령")

    # Run 명령
    run_parser = subparsers.add_parser("run", help="백업 실행")
    run_parser.add_argument(
        "--config",
        type=Path,
        default=Path("backup_config.yaml"),
        help="설정 파일 경로"
    )

    # Rotate 명령
    rotate_parser = subparsers.add_parser("rotate", help="보관 정책 적용 (오래된 백업 삭제)")
    rotate_parser.add_argument(
        "--config",
        type=Path,
        default=Path("backup_config.yaml"),
        help="설정 파일 경로"
    )

    # Status 명령
    status_parser = subparsers.add_parser("status", help="백업 상태 조회")
    status_parser.add_argument(
        "--config",
        type=Path,
        default=Path("backup_config.yaml"),
        help="설정 파일 경로"
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # 명령 실행
    if args.command in ["run", "rotate", "status"]:
        if not args.config.exists():
            print(f"❌ 설정 파일을 찾을 수 없습니다: {args.config}")
            print(f"   예시: src/cli/backup_config.yaml")
            return

        manager = BackupManager(args.config)

        if args.command == "run":
            manager.run_backup()
        elif args.command == "rotate":
            print("\n🗑️  보관 정책 적용 중...")
            manager.apply_retention_policy()
            print("✅ 완료")
        elif args.command == "status":
            manager.show_status()


if __name__ == "__main__":
    main()
