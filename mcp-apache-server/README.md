# Apache MCP Server

Apache HTTP Server 관리를 위한 Model Context Protocol (MCP) 서버입니다.

## 기능

### 서버 상태 관리
- `check_apache_status` - Apache 서버 실행 상태 확인
- `get_apache_version` - Apache 버전 정보 조회
- `get_apache_virtual_hosts` - 가상 호스트 목록 조회

### 설정 관리
- `get_apache_config_path` - 설정 파일 경로 조회
- `read_apache_config` - 설정 파일 읽기
- `search_apache_config` - 설정 파일에서 특정 내용 검색
- `test_apache_config` - 설정 파일 문법 검사

### 모듈 관리
- `list_apache_modules` - 로드된 Apache 모듈 목록 조회

### 로그 관리
- `get_apache_logs_info` - 로그 파일 정보 조회
- `read_apache_log` - 로그 파일 읽기 (최근 N줄)

## 지원 환경

### Windows Apache 설치 경로
다음 경로에서 자동으로 Apache를 찾습니다:
- `C:\Apache24`
- `C:\Program Files\Apache Software Foundation\Apache2.4`
- `C:\xampp\apache`
- `C:\wamp\bin\apache`

## 설치

### 1. 가상환경 활성화
```bash
cd C:\Users\kwonn\mcp-apache-server
.venv\Scripts\activate
```

### 2. 의존성 설치
```bash
pip install -r requirements.txt
```

## 사용법

### 직접 실행 (테스트용)
```bash
python server.py
```

### Claude Code에서 사용

`.mcp.json` 파일에 다음 설정 추가:

```json
{
  "mcpServers": {
    "apache-manager": {
      "command": "C:\\Users\\kwonn\\mcp-apache-server\\.venv\\Scripts\\python.exe",
      "args": ["C:\\Users\\kwonn\\mcp-apache-server\\server.py"],
      "env": {
        "PYTHONUNBUFFERED": "1"
      }
    }
  }
}
```

## 도구 사용 예제

### Apache 상태 확인
```python
check_apache_status()
```

출력:
```json
{
  "running": true,
  "process_count": 2,
  "processes": [
    {
      "pid": 1234,
      "name": "httpd.exe",
      "memory_mb": 15.2,
      "cpu_percent": 0.5
    }
  ],
  "apache_root": "C:\\Apache24",
  "httpd_exe": "C:\\Apache24\\bin\\httpd.exe"
}
```

### 설정 파일 검색
```python
search_apache_config("DocumentRoot")
```

출력:
```json
{
  "file_path": "C:\\Apache24\\conf\\httpd.conf",
  "search_term": "DocumentRoot",
  "matches_found": 2,
  "matches": [
    {
      "line_number": 245,
      "content": "DocumentRoot \"C:/Apache24/htdocs\""
    }
  ]
}
```

### 로그 읽기
```python
read_apache_log("error.log", tail_lines=20)
```

## 보안 고려사항

- 읽기 전용 작업만 제공 (안전성)
- Apache 설정 파일 수정 기능 없음
- 서버 시작/중지 기능 없음 (의도적으로 제외)

## 요구사항

- Python 3.7+
- Windows OS
- Apache HTTP Server 설치됨

## 라이선스

MIT License
