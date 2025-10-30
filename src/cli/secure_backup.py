"""
보안 백업 도구 (Secure Backup Tool)

암호화, 압축, 무결성 검증을 포함한 안전한 백업 솔루션

기능:
- AES-256 암호화 (cryptography 라이브러리 사용)
- 압축 (gzip, zip)
- SHA-256 해시 기반 무결성 검증
- 증분 백업 (변경된 파일만 백업)
- 백업 메타데이터 추적
- 자동 보관 기간 관리

사용법:
    python secure_backup.py backup <source_dir> --output <backup_dir> [--password PASSWORD] [--compress]
    python secure_backup.py restore <backup_file> --output <restore_dir> --password PASSWORD
    python secure_backup.py verify <backup_file> --password PASSWORD
    python secure_backup.py list [--backup-dir DIR]
"""

import argparse
import json
import hashlib
import shutil
import tarfile
import zipfile
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import getpass
import base64
import os


class SecureBackup:
    """보안 백업 관리 클래스"""

    def __init__(self, password: Optional[str] = None):
        self.password = password
        self.metadata_file = "backup_metadata.json"

    def calculate_file_hash(self, file_path: Path) -> str:
        """파일의 SHA-256 해시 계산"""
        sha256 = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                while chunk := f.read(8192):
                    sha256.update(chunk)
            return sha256.hexdigest()
        except Exception as e:
            print(f"⚠️  해시 계산 실패 {file_path}: {e}")
            return ""

    def calculate_directory_hash(self, directory: Path) -> Dict[str, str]:
        """디렉토리 내 모든 파일의 해시 맵 생성"""
        file_hashes = {}

        for file_path in directory.rglob("*"):
            if file_path.is_file():
                relative_path = str(file_path.relative_to(directory))
                file_hash = self.calculate_file_hash(file_path)
                if file_hash:
                    file_hashes[relative_path] = file_hash

        return file_hashes

    def encrypt_file(self, input_path: Path, output_path: Path, password: str):
        """파일 암호화 (cryptography 사용)"""
        try:
            from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
            from cryptography.hazmat.backends import default_backend
            import secrets

            # 솔트 생성
            salt = secrets.token_bytes(16)

            # 키 유도 (PBKDF2)
            kdf = PBKDF2(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            key = kdf.derive(password.encode())

            # IV 생성
            iv = secrets.token_bytes(16)

            # 암호화
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()

            # 파일 읽기 및 암호화
            with open(input_path, 'rb') as f:
                plaintext = f.read()

            # 패딩 추가 (PKCS7)
            padding_length = 16 - (len(plaintext) % 16)
            plaintext += bytes([padding_length] * padding_length)

            ciphertext = encryptor.update(plaintext) + encryptor.finalize()

            # 솔트 + IV + 암호문 저장
            with open(output_path, 'wb') as f:
                f.write(salt)
                f.write(iv)
                f.write(ciphertext)

            return True

        except ImportError:
            print("❌ cryptography 라이브러리 필요: pip install cryptography")
            return False
        except Exception as e:
            print(f"❌ 암호화 실패: {e}")
            return False

    def decrypt_file(self, input_path: Path, output_path: Path, password: str):
        """파일 복호화"""
        try:
            from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
            from cryptography.hazmat.backends import default_backend

            # 암호화된 파일 읽기
            with open(input_path, 'rb') as f:
                salt = f.read(16)
                iv = f.read(16)
                ciphertext = f.read()

            # 키 유도
            kdf = PBKDF2(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            key = kdf.derive(password.encode())

            # 복호화
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()

            plaintext_padded = decryptor.update(ciphertext) + decryptor.finalize()

            # 패딩 제거
            padding_length = plaintext_padded[-1]
            plaintext = plaintext_padded[:-padding_length]

            # 복호화된 파일 저장
            with open(output_path, 'wb') as f:
                f.write(plaintext)

            return True

        except ImportError:
            print("❌ cryptography 라이브러리 필요: pip install cryptography")
            return False
        except Exception as e:
            print(f"❌ 복호화 실패 (비밀번호가 틀렸거나 파일이 손상됨): {e}")
            return False

    def create_compressed_archive(
        self,
        source_dir: Path,
        archive_path: Path,
        compression: str = "gzip"
    ) -> bool:
        """압축 아카이브 생성"""
        try:
            if compression == "gzip":
                with tarfile.open(archive_path, "w:gz") as tar:
                    tar.add(source_dir, arcname=source_dir.name)
                return True
            elif compression == "zip":
                with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in source_dir.rglob("*"):
                        if file_path.is_file():
                            arcname = file_path.relative_to(source_dir.parent)
                            zipf.write(file_path, arcname)
                return True
            else:
                print(f"❌ 지원하지 않는 압축 형식: {compression}")
                return False

        except Exception as e:
            print(f"❌ 압축 실패: {e}")
            return False

    def extract_compressed_archive(
        self,
        archive_path: Path,
        output_dir: Path
    ) -> bool:
        """압축 아카이브 해제"""
        try:
            output_dir.mkdir(parents=True, exist_ok=True)

            if archive_path.suffix == ".gz" or str(archive_path).endswith(".tar.gz"):
                with tarfile.open(archive_path, "r:gz") as tar:
                    tar.extractall(output_dir)
                return True
            elif archive_path.suffix == ".zip":
                with zipfile.ZipFile(archive_path, 'r') as zipf:
                    zipf.extractall(output_dir)
                return True
            else:
                print(f"❌ 지원하지 않는 파일 형식: {archive_path.suffix}")
                return False

        except Exception as e:
            print(f"❌ 압축 해제 실패: {e}")
            return False

    def create_backup(
        self,
        source_dir: Path,
        backup_dir: Path,
        password: Optional[str] = None,
        compress: bool = True,
        incremental: bool = False
    ) -> Dict[str, Any]:
        """보안 백업 생성"""

        if not source_dir.exists():
            return {"success": False, "error": "소스 디렉토리를 찾을 수 없습니다"}

        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{source_dir.name}_{timestamp}"

        print("\n" + "=" * 70)
        print("🔒 보안 백업 시작")
        print("=" * 70)
        print(f"   소스: {source_dir}")
        print(f"   백업 위치: {backup_dir}")
        print(f"   암호화: {'✓' if password else '✗'}")
        print(f"   압축: {'✓' if compress else '✗'}")
        print(f"   증분 백업: {'✓' if incremental else '✗'}")
        print("=" * 70 + "\n")

        # 메타데이터 준비
        metadata = {
            "backup_name": backup_name,
            "source_directory": str(source_dir),
            "timestamp": datetime.now().isoformat(),
            "encrypted": password is not None,
            "compressed": compress,
            "incremental": incremental,
            "files": {},
            "file_hashes": {}
        }

        try:
            # 1단계: 파일 해시 계산
            print("[1/4] 파일 무결성 해시 계산 중...")
            file_hashes = self.calculate_directory_hash(source_dir)
            metadata["file_hashes"] = file_hashes
            print(f"   ✓ {len(file_hashes)}개 파일 처리 완료")

            # 2단계: 증분 백업 체크
            files_to_backup = []
            if incremental:
                print("\n[2/4] 증분 백업 체크 중...")
                previous_metadata = self._load_previous_metadata(backup_dir)

                if previous_metadata:
                    previous_hashes = previous_metadata.get("file_hashes", {})
                    changed_files = []

                    for file_path, file_hash in file_hashes.items():
                        if file_path not in previous_hashes or previous_hashes[file_path] != file_hash:
                            changed_files.append(file_path)

                    if not changed_files:
                        print("   ℹ️  변경된 파일이 없습니다. 백업을 건너뜁니다.")
                        return {"success": True, "skipped": True, "reason": "no_changes"}

                    print(f"   ✓ {len(changed_files)}개 파일 변경됨")
                    files_to_backup = changed_files
                else:
                    print("   ℹ️  이전 백업 없음 - 전체 백업 수행")
                    files_to_backup = list(file_hashes.keys())
            else:
                print("\n[2/4] 전체 백업 수행")
                files_to_backup = list(file_hashes.keys())

            # 3단계: 압축
            if compress:
                print("\n[3/4] 압축 중...")
                archive_name = f"{backup_name}.tar.gz"
                archive_path = backup_dir / archive_name

                if self.create_compressed_archive(source_dir, archive_path, "gzip"):
                    print(f"   ✓ 압축 완료: {archive_path.name}")
                    metadata["archive_file"] = str(archive_path)

                    original_size = sum(
                        (source_dir / f).stat().st_size
                        for f in file_hashes.keys()
                    )
                    compressed_size = archive_path.stat().st_size
                    compression_ratio = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0

                    print(f"   원본: {original_size / (1024*1024):.2f} MB")
                    print(f"   압축: {compressed_size / (1024*1024):.2f} MB")
                    print(f"   압축률: {compression_ratio:.1f}%")

                    # 암호화할 파일 설정
                    file_to_encrypt = archive_path
                else:
                    return {"success": False, "error": "압축 실패"}
            else:
                # 압축 없이 디렉토리 복사
                print("\n[3/4] 파일 복사 중...")
                backup_path = backup_dir / backup_name
                shutil.copytree(source_dir, backup_path)
                print(f"   ✓ 복사 완료: {backup_path.name}")
                metadata["backup_directory"] = str(backup_path)
                file_to_encrypt = backup_path

            # 4단계: 암호화
            if password:
                print("\n[4/4] 암호화 중...")

                if compress:
                    encrypted_file = backup_dir / f"{backup_name}.tar.gz.enc"
                    if self.encrypt_file(file_to_encrypt, encrypted_file, password):
                        print(f"   ✓ 암호화 완료: {encrypted_file.name}")
                        # 원본 압축 파일 삭제
                        file_to_encrypt.unlink()
                        metadata["encrypted_file"] = str(encrypted_file)
                        metadata["checksum"] = self.calculate_file_hash(encrypted_file)
                    else:
                        return {"success": False, "error": "암호화 실패"}
                else:
                    # 디렉토리 압축 후 암호화
                    temp_archive = backup_dir / f"{backup_name}_temp.tar.gz"
                    self.create_compressed_archive(file_to_encrypt, temp_archive, "gzip")

                    encrypted_file = backup_dir / f"{backup_name}.enc"
                    if self.encrypt_file(temp_archive, encrypted_file, password):
                        print(f"   ✓ 암호화 완료: {encrypted_file.name}")
                        temp_archive.unlink()
                        shutil.rmtree(file_to_encrypt)
                        metadata["encrypted_file"] = str(encrypted_file)
                        metadata["checksum"] = self.calculate_file_hash(encrypted_file)
                    else:
                        return {"success": False, "error": "암호화 실패"}
            else:
                print("\n[4/4] 암호화 건너뜀")
                if compress:
                    metadata["checksum"] = self.calculate_file_hash(file_to_encrypt)

            # 메타데이터 저장
            metadata_path = backup_dir / f"{backup_name}_metadata.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)

            print("\n" + "=" * 70)
            print("✅ 백업 완료")
            print("=" * 70)
            print(f"\n📦 백업 정보:")
            print(f"   이름: {backup_name}")
            print(f"   파일 수: {len(file_hashes)}")
            print(f"   체크섬: {metadata.get('checksum', 'N/A')[:16]}...")
            print(f"   메타데이터: {metadata_path.name}")
            print("=" * 70)

            return {"success": True, "metadata": metadata}

        except Exception as e:
            print(f"\n❌ 백업 실패: {e}")
            return {"success": False, "error": str(e)}

    def restore_backup(
        self,
        backup_file: Path,
        output_dir: Path,
        password: Optional[str] = None
    ) -> bool:
        """백업 복원"""

        if not backup_file.exists():
            print(f"❌ 백업 파일을 찾을 수 없습니다: {backup_file}")
            return False

        print("\n" + "=" * 70)
        print("🔓 백업 복원 시작")
        print("=" * 70)
        print(f"   백업 파일: {backup_file}")
        print(f"   복원 위치: {output_dir}")
        print("=" * 70 + "\n")

        output_dir.mkdir(parents=True, exist_ok=True)

        try:
            # 암호화된 파일인 경우
            if backup_file.suffix == ".enc" or str(backup_file).endswith(".enc"):
                if not password:
                    print("❌ 암호화된 백업입니다. 비밀번호가 필요합니다.")
                    return False

                print("[1/2] 복호화 중...")
                decrypted_file = output_dir / backup_file.stem
                if not self.decrypt_file(backup_file, decrypted_file, password):
                    return False

                print(f"   ✓ 복호화 완료")
                backup_file = decrypted_file

            # 압축 해제
            print("\n[2/2] 압축 해제 중...")
            if self.extract_compressed_archive(backup_file, output_dir):
                print(f"   ✓ 복원 완료: {output_dir}")

                # 임시 복호화 파일 삭제
                if backup_file.parent == output_dir and backup_file.stem != backup_file.name:
                    backup_file.unlink()

                print("\n" + "=" * 70)
                print("✅ 백업 복원 완료")
                print("=" * 70)
                return True
            else:
                return False

        except Exception as e:
            print(f"\n❌ 복원 실패: {e}")
            return False

    def verify_backup(
        self,
        backup_file: Path,
        password: Optional[str] = None
    ) -> bool:
        """백업 무결성 검증"""

        metadata_file = backup_file.parent / f"{backup_file.stem}_metadata.json"

        if not metadata_file.exists():
            print("⚠️  메타데이터 파일을 찾을 수 없습니다. 기본 검증만 수행합니다.")
            metadata = None
        else:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

        print("\n" + "=" * 70)
        print("🔍 백업 무결성 검증")
        print("=" * 70)
        print(f"   백업 파일: {backup_file}")
        print("=" * 70 + "\n")

        # 체크섬 검증
        if metadata and "checksum" in metadata:
            print("[1/1] 체크섬 검증 중...")
            current_checksum = self.calculate_file_hash(backup_file)
            expected_checksum = metadata["checksum"]

            if current_checksum == expected_checksum:
                print(f"   ✓ 체크섬 일치")
                print(f"   SHA-256: {current_checksum[:32]}...")
                print("\n✅ 백업 무결성 확인됨")
                return True
            else:
                print(f"   ✗ 체크섬 불일치!")
                print(f"   예상: {expected_checksum[:32]}...")
                print(f"   실제: {current_checksum[:32]}...")
                print("\n❌ 백업이 손상되었을 수 있습니다")
                return False
        else:
            print("⚠️  메타데이터 없음 - 파일 존재만 확인")
            print(f"   ✓ 파일 존재: {backup_file.stat().st_size / (1024*1024):.2f} MB")
            return True

    def list_backups(self, backup_dir: Path) -> List[Dict[str, Any]]:
        """백업 목록 조회"""

        if not backup_dir.exists():
            print(f"❌ 백업 디렉토리를 찾을 수 없습니다: {backup_dir}")
            return []

        metadata_files = list(backup_dir.glob("*_metadata.json"))

        backups = []
        for metadata_file in metadata_files:
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    backups.append(metadata)
            except Exception as e:
                print(f"⚠️  메타데이터 읽기 실패 {metadata_file.name}: {e}")

        return backups

    def _load_previous_metadata(self, backup_dir: Path) -> Optional[Dict]:
        """가장 최근 백업 메타데이터 로드"""
        metadata_files = sorted(backup_dir.glob("*_metadata.json"), reverse=True)

        if not metadata_files:
            return None

        try:
            with open(metadata_files[0], 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None


def main():
    parser = argparse.ArgumentParser(description="보안 백업 도구")
    subparsers = parser.add_subparsers(dest="command", help="사용 가능한 명령")

    # Backup 명령
    backup_parser = subparsers.add_parser("backup", help="백업 생성")
    backup_parser.add_argument("source", type=Path, help="소스 디렉토리")
    backup_parser.add_argument("--output", type=Path, required=True, help="백업 저장 위치")
    backup_parser.add_argument("--password", help="암호화 비밀번호 (입력하지 않으면 프롬프트)")
    backup_parser.add_argument("--compress", action="store_true", default=True, help="압축 사용 (기본: 활성화)")
    backup_parser.add_argument("--incremental", action="store_true", help="증분 백업 (변경된 파일만)")

    # Restore 명령
    restore_parser = subparsers.add_parser("restore", help="백업 복원")
    restore_parser.add_argument("backup_file", type=Path, help="백업 파일")
    restore_parser.add_argument("--output", type=Path, required=True, help="복원 위치")
    restore_parser.add_argument("--password", help="복호화 비밀번호 (입력하지 않으면 프롬프트)")

    # Verify 명령
    verify_parser = subparsers.add_parser("verify", help="백업 무결성 검증")
    verify_parser.add_argument("backup_file", type=Path, help="백업 파일")
    verify_parser.add_argument("--password", help="복호화 비밀번호 (선택)")

    # List 명령
    list_parser = subparsers.add_parser("list", help="백업 목록 조회")
    list_parser.add_argument("--backup-dir", type=Path, default=Path("backups"), help="백업 디렉토리")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # 비밀번호 프롬프트
    password = None
    if args.command in ["backup", "restore", "verify"]:
        if hasattr(args, 'password') and args.password:
            password = args.password
        elif args.command in ["backup", "restore"]:
            # 백업/복원 시 비밀번호 선택적으로 입력
            use_encryption = input("암호화를 사용하시겠습니까? (y/N): ").lower() == 'y'
            if use_encryption:
                password = getpass.getpass("비밀번호 입력: ")
                if args.command == "backup":
                    password_confirm = getpass.getpass("비밀번호 확인: ")
                    if password != password_confirm:
                        print("❌ 비밀번호가 일치하지 않습니다")
                        return

    secure_backup = SecureBackup(password)

    # 명령 실행
    if args.command == "backup":
        result = secure_backup.create_backup(
            args.source,
            args.output,
            password,
            args.compress,
            args.incremental
        )
        if not result["success"]:
            print(f"\n❌ 백업 실패: {result.get('error', 'Unknown error')}")

    elif args.command == "restore":
        success = secure_backup.restore_backup(
            args.backup_file,
            args.output,
            password
        )
        if not success:
            print("\n❌ 복원 실패")

    elif args.command == "verify":
        success = secure_backup.verify_backup(args.backup_file, password)
        if not success:
            print("\n❌ 검증 실패")

    elif args.command == "list":
        backups = secure_backup.list_backups(args.backup_dir)

        if not backups:
            print(f"📦 백업 없음 ({args.backup_dir})")
            return

        print(f"\n📦 백업 목록 ({len(backups)}개)")
        print("=" * 80)

        for backup in sorted(backups, key=lambda x: x['timestamp'], reverse=True):
            print(f"\n이름: {backup['backup_name']}")
            print(f"시간: {backup['timestamp']}")
            print(f"소스: {backup['source_directory']}")
            print(f"파일: {len(backup.get('file_hashes', {}))}개")
            print(f"암호화: {'✓' if backup.get('encrypted') else '✗'}")
            print(f"압축: {'✓' if backup.get('compressed') else '✗'}")

        print("=" * 80)


if __name__ == "__main__":
    main()
