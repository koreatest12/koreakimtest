# MCP Python Server - 보안 백업 기능

MCP Python Utility 서버에 추가된 보안 백업 도구 사용 가이드

## 🔒 새로운 백업 도구

MCP 서버에 4개의 보안 백업 도구가 추가되었습니다:

1. **`create_secure_backup`** - 암호화 백업 생성
2. **`restore_secure_backup`** - 백업 복원
3. **`verify_secure_backup`** - 백업 무결성 검증
4. **`list_backups`** - 백업 목록 조회

---

## 📋 필수 의존성

```bash
# MCP 서버 의존성 + 암호화 라이브러리
pip install mcp cryptography tabulate

# 또는 requirements.txt 사용
pip install -r requirements.txt
```

---

## 🚀 MCP 서버 시작

```bash
# 가상환경 활성화
cd mcp-python-server
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# 서버 실행
python server_mcp.py
```

---

## 🔧 도구 사용법

### 1. create_secure_backup

암호화 및 압축된 백업을 생성합니다.

**파라미터:**
- `source_directory` (필수): 백업할 디렉토리
- `output_directory` (필수): 백업 파일 저장 위치
- `password` (선택): 암호화 비밀번호 (강력히 권장)
- `backup_name` (선택): 커스텀 백업 이름

**Claude에서 사용 예시:**

```
Please create a secure backup of my Documents folder
- Source: C:/Users/kwonn/Documents
- Output: C:/Backups
- Password: MySecurePassword123
```

**반환 값:**
```json
{
  "success": true,
  "backup_file": "C:/Backups/backup_Documents_20251023_143022.tar.gz.enc",
  "metadata_file": "C:/Backups/backup_Documents_20251023_143022_metadata.json",
  "file_count": 1234,
  "original_size_mb": 567.89,
  "backup_size_mb": 234.56,
  "compression_ratio": 58.7,
  "encrypted": true,
  "checksum": "a1b2c3d4e5f6g7h8...",
  "timestamp": "2025-10-23T14:30:22"
}
```

---

### 2. restore_secure_backup

암호화된 백업을 복원합니다.

**파라미터:**
- `backup_file` (필수): 백업 파일 경로
- `output_directory` (필수): 복원할 위치
- `password` (조건부 필수): 암호화된 백업인 경우 필요

**Claude에서 사용 예시:**

```
Please restore my backup:
- Backup file: C:/Backups/backup_Documents_20251023_143022.tar.gz.enc
- Restore to: C:/Restored
- Password: MySecurePassword123
```

**반환 값:**
```json
{
  "success": true,
  "backup_file": "C:/Backups/backup_Documents_20251023_143022.tar.gz.enc",
  "restored_to": "C:/Restored",
  "encrypted": true,
  "timestamp": "2025-10-23T15:00:00"
}
```

---

### 3. verify_secure_backup

백업 파일의 무결성을 SHA-256 체크섬으로 검증합니다.

**파라미터:**
- `backup_file` (필수): 백업 파일 경로
- `metadata_file` (선택): 메타데이터 파일 (자동 감지됨)

**Claude에서 사용 예시:**

```
Please verify the integrity of my backup:
C:/Backups/backup_Documents_20251023_143022.tar.gz.enc
```

**반환 값 (정상):**
```json
{
  "valid": true,
  "backup_file": "C:/Backups/backup_Documents_20251023_143022.tar.gz.enc",
  "metadata_file": "C:/Backups/backup_Documents_20251023_143022_metadata.json",
  "expected_checksum": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "current_checksum": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "file_count": 1234,
  "timestamp": "2025-10-23T14:30:22",
  "message": "Backup integrity verified"
}
```

**반환 값 (손상):**
```json
{
  "valid": false,
  "message": "Backup may be corrupted (checksum mismatch)"
}
```

---

### 4. list_backups

백업 디렉토리의 모든 백업 목록을 조회합니다.

**파라미터:**
- `backup_directory` (필수): 백업 디렉토리

**Claude에서 사용 예시:**

```
Please list all backups in C:/Backups
```

**반환 값:**
```json
{
  "backup_count": 3,
  "backup_directory": "C:/Backups",
  "backups": [
    {
      "name": "backup_Documents_20251023_143022",
      "timestamp": "2025-10-23T14:30:22",
      "source": "C:/Users/kwonn/Documents",
      "file_count": 1234,
      "size_mb": 234.56,
      "encrypted": true,
      "compressed": true,
      "compression_ratio": 58.7,
      "backup_file": "C:/Backups/backup_Documents_20251023_143022.tar.gz.enc"
    },
    {
      "name": "backup_IdeaProjects_20251022_020000",
      "timestamp": "2025-10-22T02:00:00",
      "source": "C:/Users/kwonn/IdeaProjects",
      "file_count": 5678,
      "size_mb": 1234.56,
      "encrypted": true,
      "compressed": true,
      "compression_ratio": 62.3,
      "backup_file": "C:/Backups/backup_IdeaProjects_20251022_020000.tar.gz.enc"
    }
  ]
}
```

---

## 💬 Claude와의 대화 예시

### 예시 1: 백업 생성

**User:**
```
Please create an encrypted backup of my Documents folder (C:/Users/kwonn/Documents)
and save it to D:/Backups. Use password "MySecure@Pass123"
```

**Claude:**
```
I'll create a secure encrypted backup for you using the create_secure_backup tool.

[Uses MCP tool: create_secure_backup]

✅ Backup created successfully!

Details:
- Backup file: D:/Backups/backup_Documents_20251023_143022.tar.gz.enc
- Original size: 567.89 MB
- Backup size: 234.56 MB (58.7% compression)
- Files: 1,234
- Encrypted: Yes
- Checksum: a1b2c3d4e5f6g7h8...

Metadata saved to: backup_Documents_20251023_143022_metadata.json
```

### 예시 2: 백업 목록 조회 및 검증

**User:**
```
Show me all my backups in D:/Backups and verify the latest one
```

**Claude:**
```
I'll list your backups and verify the most recent one.

[Uses MCP tool: list_backups]

You have 3 backups:

1. backup_Documents_20251023_143022 (234.56 MB)
   - Created: 2025-10-23 14:30:22
   - Files: 1,234
   - Encrypted ✓

2. backup_IdeaProjects_20251022_020000 (1234.56 MB)
   - Created: 2025-10-22 02:00:00
   - Files: 5,678
   - Encrypted ✓

[Uses MCP tool: verify_secure_backup on latest]

✅ Latest backup verified successfully!
- Checksum matches
- Integrity confirmed
```

### 예시 3: 백업 복원

**User:**
```
Restore my Documents backup to C:/Restored/Documents
Password is MySecure@Pass123
```

**Claude:**
```
I'll restore your encrypted backup.

[Uses MCP tool: restore_secure_backup]

✅ Backup restored successfully!

Restored to: C:/Restored/Documents
Files have been decrypted and extracted.
```

---

## 🔐 보안 모범 사례

### 1. 강력한 비밀번호 사용
- 최소 12자 이상
- 대소문자, 숫자, 특수문자 조합
- 추측 불가능한 비밀번호

### 2. 비밀번호 관리
- 비밀번호 관리자 사용 (1Password, Bitwarden 등)
- 평문으로 채팅 기록에 남지 않도록 주의
- 환경 변수 사용 고려

### 3. 정기적인 백업 검증
```
Claude, please verify all my backups in D:/Backups
```

### 4. 백업 보관
- 3-2-1 규칙: 3개 복사본, 2개 다른 매체, 1개 오프사이트
- 로컬 백업 + 외장 하드 + 클라우드

---

## 🎯 실전 활용 시나리오

### 시나리오 1: 일일 자동 백업

**User:**
```
Create a backup of my project folder every day.
Source: C:/Users/kwonn/IdeaProjects
Output: D:/Backups
Password: ProjectBackup@2025
```

### 시나리오 2: 백업 복원 테스트

**User:**
```
I want to test if my latest backup is working.
List all backups in D:/Backups, verify the latest one,
and restore it to C:/Temp/BackupTest
```

### 시나리오 3: 백업 정리

**User:**
```
Show me all my backups. I want to keep only the most recent 5 backups
and delete the rest to free up space.
```

---

## 🛠️ 문제 해결

### 문제 1: "cryptography library required"

**해결:**
```bash
pip install cryptography
```

### 문제 2: "Password required for encrypted backup"

암호화된 백업을 복원할 때는 반드시 비밀번호가 필요합니다.

### 문제 3: "Backup may be corrupted (checksum mismatch)"

백업 파일이 손상되었을 수 있습니다. 다른 백업을 사용하세요.

---

## 📊 기술 사양

### 암호화
- **알고리즘**: AES-256-CBC
- **키 유도**: PBKDF2 (100,000 iterations)
- **해시**: SHA-256

### 압축
- **형식**: gzip (.tar.gz)
- **압축률**: 평균 50-70%

### 무결성
- **체크섬**: SHA-256
- **파일별 해시**: 전체 파일 추적

---

## 🔄 MCP 서버 재시작

백업 기능이 추가된 MCP 서버를 사용하려면 Claude Desktop을 재시작하세요:

1. Claude Desktop 종료
2. Claude Desktop 재시작
3. 새 대화 시작
4. 백업 도구 사용 가능

---

## 📚 관련 문서

- [MCP Python Server 메인 README](./README.md)
- [보안 백업 CLI 도구](../src/cli/BACKUP_README.md)
- [cryptography 라이브러리 문서](https://cryptography.io/)

---

이제 Claude와 대화하면서 안전하게 백업을 생성, 복원, 검증할 수 있습니다! 🎉
