# 🔒 보안 백업 도구 (Secure Backup Tool)

Python 기반 암호화 백업 솔루션 - AES-256 암호화, 압축, 무결성 검증 지원

## 📋 목차

- [기능 소개](#기능-소개)
- [설치](#설치)
- [빠른 시작](#빠른-시작)
- [기본 사용법](#기본-사용법)
- [고급 기능](#고급-기능)
- [자동화](#자동화)
- [보안 모범 사례](#보안-모범-사례)
- [문제 해결](#문제-해결)

---

## 🎯 기능 소개

### 핵심 기능

✅ **AES-256 암호화**
- PBKDF2 키 유도 함수 (100,000 반복)
- 안전한 솔트 및 IV 생성
- cryptography 라이브러리 기반

✅ **압축**
- gzip (기본, 높은 압축률)
- zip (호환성 우수)

✅ **무결성 검증**
- SHA-256 해시 체크섬
- 파일별 해시 추적
- 백업 후 자동 검증

✅ **증분 백업**
- 변경된 파일만 백업
- 스토리지 절약
- 빠른 백업 속도

✅ **보관 정책**
- 일별/주별/월별 백업 자동 관리
- 오래된 백업 자동 삭제
- 스토리지 공간 효율화

✅ **자동화**
- YAML 설정 파일 지원
- 스케줄러 통합
- 여러 백업 대상 관리

---

## 📦 설치

### 필수 의존성

```bash
# cryptography 라이브러리 (암호화)
pip install cryptography

# PyYAML (설정 파일)
pip install PyYAML

# (선택) keyring (비밀번호 안전 저장)
pip install keyring
```

### 전체 설치

```bash
pip install -r requirements-secure-backup.txt
```

---

## 🚀 빠른 시작

### 1. 간단한 백업 (암호화 없음)

```bash
# 문서 폴더를 백업 (압축만)
python secure_backup.py backup ./Documents --output ./backups
```

### 2. 암호화 백업

```bash
# 암호화 + 압축 백업
python secure_backup.py backup ./Documents --output ./backups --password "mySecurePassword123"

# 비밀번호 프롬프트로 입력
python secure_backup.py backup ./Documents --output ./backups
# 암호화를 사용하시겠습니까? (y/N): y
# 비밀번호 입력: ****
# 비밀번호 확인: ****
```

### 3. 백업 복원

```bash
# 암호화된 백업 복원
python secure_backup.py restore ./backups/backup_Documents_20251023_143022.tar.gz.enc \
    --output ./restored \
    --password "mySecurePassword123"
```

### 4. 백업 검증

```bash
# 무결성 확인
python secure_backup.py verify ./backups/backup_Documents_20251023_143022.tar.gz.enc
```

---

## 📖 기본 사용법

### 백업 생성

#### 전체 백업 (암호화 + 압축)

```bash
python secure_backup.py backup <source_dir> \
    --output <backup_dir> \
    --password "강력한비밀번호" \
    --compress
```

**예시:**
```bash
python secure_backup.py backup C:\Users\kwonn\Documents \
    --output C:\Backups \
    --password "MySecure@Pass123"
```

#### 증분 백업 (변경된 파일만)

```bash
python secure_backup.py backup <source_dir> \
    --output <backup_dir> \
    --password "비밀번호" \
    --incremental
```

**장점:**
- 빠른 백업 속도
- 스토리지 절약
- 변경 이력 추적

**동작:**
- 이전 백업과 파일 해시 비교
- 변경/추가된 파일만 백업
- 변경 없으면 백업 건너뜀

### 백업 복원

```bash
python secure_backup.py restore <backup_file> \
    --output <restore_dir> \
    --password "비밀번호"
```

**예시:**
```bash
python secure_backup.py restore \
    C:\Backups\backup_Documents_20251023_143022.tar.gz.enc \
    --output C:\Restored \
    --password "MySecure@Pass123"
```

### 백업 검증

```bash
python secure_backup.py verify <backup_file> --password "비밀번호"
```

**검증 항목:**
- SHA-256 체크섬 일치 여부
- 파일 무결성
- 메타데이터 정합성

### 백업 목록 조회

```bash
python secure_backup.py list --backup-dir <backup_dir>
```

**출력 예시:**
```
📦 백업 목록 (5개)
================================================================================

이름: backup_Documents_20251023_143022
시간: 2025-10-23T14:30:22
소스: C:\Users\kwonn\Documents
파일: 1234개
암호화: ✓
압축: ✓
```

---

## 🎓 고급 기능

### 1. 설정 파일 기반 백업 (권장)

#### 설정 파일 생성 (`backup_config.yaml`)

```yaml
backup_targets:
  - name: "중요 문서"
    source: "C:/Users/kwonn/Documents"
    enabled: true
    exclude_patterns:
      - "*.tmp"
      - "~$*"

  - name: "프로젝트 코드"
    source: "C:/Users/kwonn/IdeaProjects"
    enabled: true
    exclude_patterns:
      - "node_modules/"
      - ".venv/"
      - "__pycache__/"

backup_destination: "C:/Backups"

encryption:
  enabled: true

compression:
  enabled: true
  format: "gzip"

retention:
  keep_recent: 7
  keep_daily: 30
  keep_weekly: 12
  keep_monthly: 12

incremental_backup:
  enabled: true
  full_backup_interval_days: 7
```

#### 설정 기반 백업 실행

```bash
# 환경 변수로 비밀번호 설정
export BACKUP_PASSWORD="MySecure@Pass123"

# 백업 실행
python backup_manager.py run --config backup_config.yaml

# 백업 상태 확인
python backup_manager.py status --config backup_config.yaml

# 보관 정책 적용 (오래된 백업 삭제)
python backup_manager.py rotate --config backup_config.yaml
```

### 2. 보관 정책 (Retention Policy)

자동으로 오래된 백업을 삭제하여 스토리지 관리:

- **최근 N개 유지**: 가장 최근 백업 7개 유지
- **일별 백업**: 최근 30일 이내 백업 모두 유지
- **주별 백업**: 최근 12주 이내 주별 대표 백업 유지
- **월별 백업**: 최근 12개월 이내 월별 대표 백업 유지

```bash
# 보관 정책 수동 적용
python backup_manager.py rotate --config backup_config.yaml
```

### 3. 증분 백업 전략

**전체 백업 vs 증분 백업:**

```
Day 1: 전체 백업 (Full)    - 10GB
Day 2: 증분 백업            - 100MB (변경된 파일만)
Day 3: 증분 백업            - 50MB
Day 4: 증분 백업            - 200MB
Day 5: 증분 백업            - 150MB
Day 6: 증분 백업            - 80MB
Day 7: 증분 백업            - 120MB
Day 8: 전체 백업 (Full)    - 10.5GB (주기적 전체 백업)
```

**설정:**
```yaml
incremental_backup:
  enabled: true
  full_backup_interval_days: 7  # 7일마다 전체 백업
```

### 4. 비밀번호 안전 관리

#### 방법 1: 환경 변수 (권장)

```bash
# Windows
set BACKUP_PASSWORD=MySecure@Pass123

# Linux/Mac
export BACKUP_PASSWORD="MySecure@Pass123"

# 백업 실행 (비밀번호 입력 불필요)
python backup_manager.py run --config backup_config.yaml
```

#### 방법 2: 시스템 키링 (고급)

```bash
# keyring 설치
pip install keyring

# 비밀번호 저장
python -c "import keyring; keyring.set_password('secure_backup', 'main', 'MySecure@Pass123')"
```

**설정 파일:**
```yaml
encryption:
  enabled: true
  use_keyring: true  # 시스템 키링에서 비밀번호 읽기
```

---

## ⚙️ 자동화

### 일일 백업 스케줄 설정

#### Windows Task Scheduler

```bash
# 매일 오전 2시 자동 백업
python task_scheduler.py schedule backup_manager.py run --config backup_config.yaml \
    --interval daily \
    --time 02:00
```

#### Linux/Mac Cron

```bash
# crontab 편집
crontab -e

# 매일 오전 2시 백업 (추가)
0 2 * * * export BACKUP_PASSWORD="MySecure@Pass123" && cd /path/to/cli && python backup_manager.py run --config backup_config.yaml >> /var/log/backup.log 2>&1
```

### 백업 + 검증 + 보관 정책 스크립트

**`auto_backup.py`:**
```python
import subprocess
import sys

# 1. 백업 실행
result = subprocess.run([
    sys.executable, "backup_manager.py", "run",
    "--config", "backup_config.yaml"
])

if result.returncode != 0:
    print("❌ 백업 실패")
    sys.exit(1)

# 2. 최신 백업 검증
# (생략 - 실제로는 최신 백업 파일 찾아서 verify)

# 3. 보관 정책 적용
subprocess.run([
    sys.executable, "backup_manager.py", "rotate",
    "--config", "backup_config.yaml"
])

print("✅ 자동 백업 완료")
```

```bash
# 스케줄 등록
python task_scheduler.py schedule auto_backup.py --interval daily --time 02:00
```

---

## 🔐 보안 모범 사례

### 1. 강력한 비밀번호 사용

✅ **좋은 예:**
```
MySecure@Backup#2025!
P@ssw0rd_Ver¥_Strong_123
Backup$2025#Korea!Secure
```

❌ **나쁜 예:**
```
password
123456
backup2025
```

### 2. 비밀번호 보관

✅ **권장:**
- 비밀번호 관리자 사용 (1Password, Bitwarden)
- 시스템 키링 사용 (`keyring`)
- 환경 변수 (임시)

❌ **비권장:**
- 평문으로 스크립트에 하드코딩
- 공유 문서에 저장
- 이메일/메신저로 전송

### 3. 백업 저장 위치

✅ **3-2-1 백업 규칙:**
- **3개 복사본**: 원본 + 로컬 백업 + 외부 백업
- **2개 다른 매체**: 로컬 HDD + 외장 HDD
- **1개 오프사이트**: 클라우드 또는 다른 물리적 위치

**예시:**
```yaml
# 로컬 백업
backup_destination: "D:/Backups"

# 추가로 클라우드 동기화 (수동)
# D:/Backups → Google Drive / OneDrive
```

### 4. 정기적인 복원 테스트

**매월 1회 복원 테스트 권장:**

```bash
# 1. 최신 백업 복원
python secure_backup.py restore <backup_file> --output ./test_restore --password "..."

# 2. 파일 무결성 확인
# 3. 중요 파일 열어보기
# 4. 테스트 폴더 삭제
```

### 5. 로그 모니터링

```bash
# 백업 로그 확인
python backup_manager.py status --config backup_config.yaml

# 최근 백업 시간 확인
# 백업 크기 추이 확인
# 실패한 백업 확인
```

---

## 🔧 문제 해결

### 문제 1: "cryptography 라이브러리 필요"

**증상:**
```
❌ cryptography 라이브러리 필요: pip install cryptography
```

**해결:**
```bash
pip install cryptography
```

### 문제 2: "복호화 실패 (비밀번호가 틀렸거나 파일이 손상됨)"

**원인:**
1. 잘못된 비밀번호
2. 백업 파일 손상
3. 암호화되지 않은 파일을 복호화 시도

**해결:**
```bash
# 1. 비밀번호 다시 확인
# 2. 백업 무결성 검증
python secure_backup.py verify <backup_file> --password "..."

# 3. 다른 백업 파일 시도
python secure_backup.py list --backup-dir ./backups
```

### 문제 3: "압축 해제 실패"

**원인:**
- 지원하지 않는 압축 형식
- 손상된 아카이브

**해결:**
```bash
# 백업 파일 확장자 확인
# .tar.gz 또는 .zip 지원

# 수동 압축 해제 테스트
tar -tzf backup_file.tar.gz  # 목록 확인
tar -xzf backup_file.tar.gz  # 압축 해제
```

### 문제 4: "증분 백업이 전체 백업으로 실행됨"

**원인:**
- 이전 메타데이터 파일 없음
- 파일 해시 변경

**확인:**
```bash
# 백업 목록에서 이전 백업 확인
python secure_backup.py list --backup-dir ./backups

# 메타데이터 파일 존재 확인
ls ./backups/*_metadata.json
```

### 문제 5: "메모리 부족"

**원인:**
- 대용량 파일 처리 시 메모리 사용량 증가

**해결:**
```python
# secure_backup.py 수정
# 청크 크기 조정
chunk_size = 8192 * 8  # 더 큰 청크로 처리 속도 향상
```

---

## 📊 사용 예시

### 예시 1: 개인 문서 백업

```bash
# 1. 첫 백업 (전체)
python secure_backup.py backup ~/Documents \
    --output ~/Backups \
    --password "MySecurePass123"

# 2. 증분 백업 (매일)
python secure_backup.py backup ~/Documents \
    --output ~/Backups \
    --password "MySecurePass123" \
    --incremental

# 3. 백업 목록 확인
python secure_backup.py list --backup-dir ~/Backups

# 4. 복원 (필요시)
python secure_backup.py restore ~/Backups/backup_Documents_20251023.tar.gz.enc \
    --output ~/Restored \
    --password "MySecurePass123"
```

### 예시 2: 프로젝트 코드 백업

```yaml
# backup_config.yaml
backup_targets:
  - name: "프로젝트"
    source: "C:/Users/kwonn/IdeaProjects"
    enabled: true
    exclude_patterns:
      - "node_modules/"
      - ".venv/"
      - "__pycache__/"
      - "*.pyc"
      - ".git/"
      - "target/"
      - "build/"
      - "dist/"

backup_destination: "D:/CodeBackups"

encryption:
  enabled: true

incremental_backup:
  enabled: true
  full_backup_interval_days: 7
```

```bash
export BACKUP_PASSWORD="CodeBackup@2025"
python backup_manager.py run --config backup_config.yaml
```

### 예시 3: 데이터베이스 백업

```bash
# 1. 데이터베이스 덤프
mysqldump -u root -p mydb > /tmp/mydb_backup.sql

# 2. 덤프 파일 암호화 백업
python secure_backup.py backup /tmp \
    --output /backups/db \
    --password "DBBackup@Secure2025"

# 3. 원본 덤프 파일 삭제
rm /tmp/mydb_backup.sql
```

---

## 📚 추가 리소스

### 관련 문서

- [cryptography 문서](https://cryptography.io/)
- [PyYAML 문서](https://pyyaml.org/)
- [Task Scheduler 사용법](../README.md)

### 보안 가이드

- [NIST 비밀번호 가이드라인](https://pages.nist.gov/800-63-3/)
- [3-2-1 백업 전략](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)

---

## 🆘 지원

문제가 발생하면:

1. 이 문서의 [문제 해결](#문제-해결) 섹션 확인
2. 로그 파일 확인 (`logs/` 디렉토리)
3. GitHub Issues 제출 (해당하는 경우)

---

## 📄 라이선스

이 도구는 개인 및 상업적 용도로 자유롭게 사용 가능합니다.
