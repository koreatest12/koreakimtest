# CLI Automation Tools

터미널 기반 자동화 도구 모음 - 파일 정리, 대량 변환, 크론 작업 래핑

## 📦 설치

```bash
# 필수 의존성 설치 (기본 파일 작업은 표준 라이브러리만 사용)
pip install -r requirements-cli.txt

# 선택적 기능별 설치
pip install Pillow                    # 이미지 변환
pip install pandas openpyxl PyYAML    # 데이터 변환
pip install markdown                  # 마크다운 변환
```

## 🚀 사용법

### 방법 1: 통합 인터페이스 사용

```bash
# 메인 CLI를 통해 모든 도구 접근
python cli_main.py <tool> <command> [options]

# 도움말
python cli_main.py --help
python cli_main.py files --help
```

### 방법 2: 개별 스크립트 직접 실행

```bash
python file_organizer.py <command> [options]
python bulk_converter.py <command> [options]
python task_scheduler.py <command> [options]
```

---

## 🗂️ 도구 1: 파일 정리 (file_organizer.py)

### 기능

1. **파일 타입별 정리** - 확장자에 따라 자동 분류
2. **날짜별 정리** - 수정 날짜 기준 폴더 생성
3. **오래된 파일 정리** - N일 이상 된 파일 삭제
4. **중복 파일 제거** - 해시 또는 이름 기준 중복 탐지

### 사용 예시

#### 1. 파일 타입별 정리

```bash
# Downloads 폴더를 파일 종류별로 정리 (미리보기)
python file_organizer.py organize C:\Users\kwonn\Downloads --by type --dry-run

# 실제 실행
python file_organizer.py organize C:\Users\kwonn\Downloads --by type

# 파일 분류 결과:
# Downloads/
# ├── images/        (jpg, png, gif, ...)
# ├── videos/        (mp4, avi, mkv, ...)
# ├── documents/     (pdf, docx, txt, ...)
# ├── code/          (py, js, java, ...)
# └── others/        (기타)
```

#### 2. 날짜별 정리

```bash
# 수정 날짜 기준으로 YYYY-MM 폴더 생성
python file_organizer.py organize ./photos --by date

# 결과:
# photos/
# ├── 2024-10/
# ├── 2024-11/
# └── 2025-01/
```

#### 3. 확장자별 정리

```bash
# 확장자별로 폴더 생성
python file_organizer.py organize ./documents --by extension

# 결과:
# documents/
# ├── pdf/
# ├── docx/
# └── txt/
```

#### 4. 오래된 파일 삭제

```bash
# 30일 이상 된 파일 삭제 (미리보기)
python file_organizer.py cleanup ./temp --older-than 30 --dry-run

# 특정 패턴만 삭제
python file_organizer.py cleanup ./logs --older-than 7 --pattern "*.log"

# 실제 실행
python file_organizer.py cleanup ./temp --older-than 30
```

#### 5. 중복 파일 제거

```bash
# 해시 기반 중복 제거 (내용이 동일한 파일)
python file_organizer.py deduplicate ./photos --by hash --dry-run

# 이름 기반 중복 제거 (가장 최신 파일만 유지)
python file_organizer.py deduplicate ./backup --by name --dry-run

# 실제 실행
python file_organizer.py deduplicate ./photos --by hash
```

---

## 🔄 도구 2: 대량 파일 변환 (bulk_converter.py)

### 지원 형식

| 카테고리 | 변환 가능 형식 |
|---------|---------------|
| **이미지** | PNG ↔ JPG ↔ WEBP ↔ BMP |
| **데이터** | CSV ↔ JSON ↔ Excel (XLSX) ↔ YAML |
| **문서** | Markdown → HTML |
| **오디오/비디오** | MP3, WAV, MP4, AVI (ffmpeg 필요) |

### 사용 예시

#### 1. 이미지 대량 변환

```bash
# PNG → JPG 변환 (품질 90)
python bulk_converter.py images ./photos --from png --to jpg --quality 90

# JPG → WEBP 변환 (고품질)
python bulk_converter.py images ./photos --from jpg --to webp --quality 95

# 출력 폴더 지정
python bulk_converter.py images ./input --from png --to jpg --output-dir ./output
```

#### 2. 데이터 파일 변환

```bash
# CSV → JSON 변환
python bulk_converter.py data ./data --from csv --to json

# JSON → CSV 변환 (배열 형태의 JSON 필요)
python bulk_converter.py data ./api_responses --from json --to csv

# CSV → Excel 변환
python bulk_converter.py data ./reports --from csv --to xlsx

# JSON → YAML 변환
python bulk_converter.py data ./configs --from json --to yaml
```

#### 3. 마크다운 → HTML 변환

```bash
# 마크다운 파일을 HTML로 변환 (스타일 포함)
python bulk_converter.py markdown ./docs

# 출력 폴더 지정
python bulk_converter.py markdown ./docs --output-dir ./html_output
```

---

## ⏰ 도구 3: 작업 스케줄러 (task_scheduler.py)

### 기능

1. **스크립트 실행 및 로깅** - 실행 시간, 결과, 에러 기록
2. **타임아웃 설정** - 무한 실행 방지
3. **락 파일** - 중복 실행 방지
4. **스케줄 작업 생성** - Windows Task Scheduler / Cron 설정
5. **실행 리포트** - 작업 이력 조회

### 사용 예시

#### 1. 스크립트 실행 및 로깅

```bash
# 기본 실행 (로그 자동 생성)
python task_scheduler.py run my_script.py

# 타임아웃 설정 (300초 = 5분)
python task_scheduler.py run long_task.py --timeout 300

# 락 파일로 중복 실행 방지
python task_scheduler.py run daily_backup.py --lock-file ./locks/backup.lock

# 로그 디렉토리 지정
python task_scheduler.py run my_script.py --log-dir ./custom_logs
```

#### 2. Windows 스케줄 작업 생성

```bash
# 매일 자정 실행
python task_scheduler.py schedule backup.py --interval daily --time 00:00

# 매시간 실행
python task_scheduler.py schedule sync.py --interval hourly

# 매주 일요일 오전 3시 실행
python task_scheduler.py schedule weekly_report.py --interval weekly --time 03:00

# 작업 이름 지정
python task_scheduler.py schedule cleanup.py --interval daily --name "DailyCleanup"
```

#### 3. Linux/Mac Cron 작업 (예시 생성)

```bash
# Cron 설정 예시를 출력 (직접 crontab에 추가)
python task_scheduler.py schedule my_script.py --interval daily --time 02:00

# 출력 예시:
# 0 2 * * * /usr/bin/python3 /path/to/my_script.py
```

#### 4. 실행 리포트 조회

```bash
# 최근 10개 작업 실행 이력
python task_scheduler.py report

# 최근 50개 이력
python task_scheduler.py report --last 50

# 커스텀 로그 디렉토리
python task_scheduler.py report --log-dir ./custom_logs
```

---

## 🎯 실전 활용 예시

### 예시 1: 다운로드 폴더 자동 정리

```bash
# 1. 파일 타입별 정리
python file_organizer.py organize C:\Users\kwonn\Downloads --by type

# 2. 30일 이상 된 임시 파일 삭제
python file_organizer.py cleanup C:\Users\kwonn\Downloads\others --older-than 30

# 3. 스케줄 등록 (매일 자정 실행)
# organize_downloads.py 스크립트 생성 후:
python task_scheduler.py schedule organize_downloads.py --interval daily --time 00:00
```

### 예시 2: 사진 정리 및 변환

```bash
# 1. 날짜별 정리
python file_organizer.py organize ./photos --by date

# 2. PNG를 용량 작은 WEBP로 변환
python bulk_converter.py images ./photos --from png --to webp --quality 85

# 3. 중복 사진 제거
python file_organizer.py deduplicate ./photos --by hash
```

### 예시 3: 데이터 백업 자동화

```bash
# backup_data.py 스크립트 생성:
"""
import pandas as pd
from pathlib import Path

# 데이터 수집
data = collect_daily_data()

# CSV 저장
df = pd.DataFrame(data)
df.to_csv(f"backup_{datetime.now():%Y%m%d}.csv", index=False)
"""

# 스케줄 등록 (매일 오후 6시, 타임아웃 10분, 중복 실행 방지)
python task_scheduler.py schedule backup_data.py \
  --interval daily \
  --time 18:00 \
  --timeout 600 \
  --lock-file ./locks/backup.lock
```

### 예시 4: 로그 파일 관리

```bash
# 일주일 이상 된 로그 파일 압축 후 삭제
python file_organizer.py cleanup ./logs --older-than 7 --pattern "*.log"

# 매주 일요일 실행
python task_scheduler.py schedule cleanup_logs.py --interval weekly --time 03:00
```

---

## 📊 로그 및 결과

### 작업 로그 구조

```
logs/
├── task_executions.jsonl        # 전체 작업 이력 (JSONL)
├── my_script_20251023_143022.log  # 개별 작업 로그 (JSON)
└── my_script_20251023_150130.log
```

### 로그 파일 예시

```json
{
  "task_name": "backup_data.py",
  "script_path": "C:\\Users\\kwonn\\scripts\\backup_data.py",
  "start_time": "2025-10-23T14:30:22",
  "end_time": "2025-10-23T14:32:15",
  "duration_seconds": 113.45,
  "success": true,
  "exit_code": 0,
  "stdout": "Backup completed successfully\\nProcessed 1234 records",
  "stderr": "",
  "error": null
}
```

---

## 🛠️ 고급 기능

### 1. 커스텀 파일 분류 규칙

`file_organizer.py`의 `FILE_CATEGORIES` 딕셔너리를 수정하여 분류 규칙 커스터마이징:

```python
FILE_CATEGORIES = {
    "my_images": [".jpg", ".png", ".heic"],
    "my_videos": [".mp4", ".mov"],
    # ...
}
```

### 2. 변환 품질 최적화

```bash
# 웹용 이미지: 낮은 품질, 작은 용량
python bulk_converter.py images ./web --from png --to jpg --quality 75

# 인쇄용 이미지: 높은 품질
python bulk_converter.py images ./print --from png --to jpg --quality 95
```

### 3. 복잡한 스케줄 작업

```python
# complex_task.py
import subprocess

# 여러 작업을 순차 실행
tasks = [
    "python backup.py",
    "python cleanup.py",
    "python report.py"
]

for task in tasks:
    subprocess.run(task, shell=True)
```

```bash
# 통합 스크립트 스케줄 등록
python task_scheduler.py schedule complex_task.py --interval daily --time 02:00
```

---

## 🔍 문제 해결

### 이미지 변환 오류

```bash
# Pillow 설치 확인
pip install Pillow

# RGBA → RGB 변환 에러: 자동으로 흰 배경 추가됨
```

### 스케줄 작업이 실행 안됨

```bash
# Windows: 작업 스케줄러에서 확인
taskschd.msc

# Python 경로가 절대 경로인지 확인
# 스크립트 권한 확인
```

### 락 파일 남아있음

```bash
# 수동으로 락 파일 삭제
rm locks/*.lock
```

---

## 📝 추가 참고 사항

### Dry-run 모드 활용

모든 파일 작업에서 `--dry-run` 플래그로 미리보기 가능:

```bash
python file_organizer.py organize ./test --by type --dry-run
python file_organizer.py cleanup ./test --older-than 30 --dry-run
python file_organizer.py deduplicate ./test --by hash --dry-run
```

### 통합 인터페이스 사용

```bash
# cli_main.py를 통한 통합 사용
python cli_main.py files organize ./downloads --by type
python cli_main.py convert images ./photos --from png --to jpg
python cli_main.py schedule run backup.py --timeout 300
```

---

## 🎓 학습 리소스

- **Pillow 문서**: https://pillow.readthedocs.io/
- **pandas 문서**: https://pandas.pydata.org/docs/
- **Windows Task Scheduler**: `taskschd.msc`
- **Cron 문법**: https://crontab.guru/

---

## 📄 라이선스

이 도구들은 개인 및 상업적 용도로 자유롭게 사용 가능합니다.
