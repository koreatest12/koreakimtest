# MCP Server Manager - Quick Start Guide

빠른 시작 가이드 for MCP 서버 관리 도구

## 기본 명령어

### 📋 설치된 서버 확인
```bash
npm run mcp-list
```

### ℹ️ 서버 정보 확인
```bash
npm run mcp-info <서버이름>
```

### 🔍 업데이트 확인
```bash
npm run mcp-check <패키지명>
```

### ❓ 도움말
```bash
npm run mcp-help
```

## 설치 예제

### npm 서버 설치
```bash
# 기본 설치
npm run mcp-install npm my-server @modelcontextprotocol/server-filesystem

# 경로 포함
npm run mcp-install npm filesystem-docs @modelcontextprotocol/server-filesystem C:\\Users\\kwonn\\Documents
```

### Python 서버 설치
```bash
# requirements.txt 포함
npm run mcp-install python my-server ./mcp-server/server.py ./mcp-server/requirements.txt

# requirements 없이
npm run mcp-install python simple-server ./server.py
```

## 업그레이드 예제

### npm 서버 업그레이드
```bash
npm run mcp-upgrade filesystem-home @modelcontextprotocol/server-filesystem
```

### Python 서버 업그레이드
```bash
npm run mcp-upgrade python-utils ./mcp-python-server/server.py ./mcp-python-server/requirements.txt
```

## 제거

```bash
npm run mcp-remove old-server
```

**주의**: 구성만 제거되며, 패키지는 수동으로 제거해야 합니다.

## 전체 워크플로우 예시

```bash
# 1. 현재 서버 확인
npm run mcp-list

# 2. 새 서버 설치
npm run mcp-install npm my-server @my-org/mcp-server

# 3. 설치 확인
npm run mcp-info my-server

# 4. 업데이트 확인 (나중에)
npm run mcp-check @my-org/mcp-server

# 5. 업그레이드
npm run mcp-upgrade my-server @my-org/mcp-server
```

## 트러블슈팅

### Python 가상 환경 오류
```bash
cd ./path/to/server
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt  # Windows
```

### npm 설치 오류
```bash
npm cache clean --force
npm run mcp-install npm <서버이름> <패키지명>
```

## 자세한 정보

전체 문서는 [MCP_SERVER_MANAGER.md](./MCP_SERVER_MANAGER.md)를 참조하세요.
