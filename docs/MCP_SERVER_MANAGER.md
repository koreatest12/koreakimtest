# MCP Server Manager

MCP Server Manager는 Model Context Protocol (MCP) 서버를 쉽게 설치, 업그레이드, 관리할 수 있는 CLI 도구입니다.

## 기능

- 📦 **설치**: npm 또는 Python 기반 MCP 서버 설치
- 🔄 **업그레이드**: 기존 MCP 서버 업그레이드
- 📋 **목록**: 설치된 모든 MCP 서버 확인
- 🔍 **확인**: 업데이트 가능 여부 확인 (npm)
- ❌ **제거**: MCP 서버 구성에서 제거
- ℹ️ **정보**: 특정 MCP 서버 상세 정보 조회

## 사용법

### MCP 서버 목록 보기

```bash
npm run mcp-list
```

현재 `.mcp.json`에 설정된 모든 MCP 서버를 표시합니다.

출력 예시:
```
📋 Configured MCP Servers:

──────────────────────────────────────────────────────────────────────
📦 filesystem-home (npm)
   Package: server-filesystem

🐍 python-utils (python)
   Path: C:\Users\kwonn\mcp-python-server\server_mcp.py

──────────────────────────────────────────────────────────────────────
Total: 2 server(s)
```

### MCP 서버 설치

#### npm 기반 MCP 서버 설치

```bash
npm run mcp-install npm <서버이름> <패키지명> [경로]
```

예시:
```bash
# 파일시스템 MCP 서버 설치
npm run mcp-install npm filesystem-docs @modelcontextprotocol/server-filesystem C:\\Users\\kwonn\\Documents

# 경로 없이 설치
npm run mcp-install npm my-server @my-org/mcp-server
```

#### Python 기반 MCP 서버 설치

```bash
npm run mcp-install python <서버이름> <스크립트경로> [requirements경로]
```

예시:
```bash
# Python MCP 서버 설치 (requirements 포함)
npm run mcp-install python my-python-server ./mcp-server/server.py ./mcp-server/requirements.txt

# requirements 없이 설치
npm run mcp-install python simple-server ./server.py
```

**참고사항:**
- npm 서버는 자동으로 `npx -y`를 사용하여 실행됩니다
- Python 서버는 스크립트 디렉토리에 자동으로 `.venv` 가상 환경을 생성합니다
- Python 서버는 자동으로 `PYTHONUNBUFFERED=1` 환경 변수가 설정됩니다

### MCP 서버 업그레이드

#### npm 기반 MCP 서버 업그레이드

```bash
npm run mcp-upgrade <서버이름> <패키지명>
```

예시:
```bash
npm run mcp-upgrade filesystem-home @modelcontextprotocol/server-filesystem
```

#### Python 기반 MCP 서버 업그레이드

```bash
npm run mcp-upgrade <서버이름> <스크립트경로> [requirements경로]
```

예시:
```bash
npm run mcp-upgrade python-utils ./mcp-python-server/server.py ./mcp-python-server/requirements.txt
```

**업그레이드 과정:**
- npm: 최신 버전으로 패키지 업데이트
- Python: pip 및 requirements.txt의 모든 의존성 업그레이드

### 업데이트 확인 (npm 전용)

```bash
npm run mcp-check <패키지명>
```

예시:
```bash
npm run mcp-check @modelcontextprotocol/server-filesystem
```

출력 예시:
```
Checking for updates: @modelcontextprotocol/server-filesystem

╔════════════════════════════════════════╗
║     UPDATE AVAILABLE                   ║
╚════════════════════════════════════════╝

Current version: 2025.8.20
Latest version:  2025.8.21

To update, run:
  npm run mcp-upgrade filesystem-home @modelcontextprotocol/server-filesystem
```

### MCP 서버 정보 조회

```bash
npm run mcp-info <서버이름>
```

예시:
```bash
npm run mcp-info filesystem-home
```

출력 예시:
```
📊 MCP Server Information

──────────────────────────────────────────────────
Name:    filesystem-home
Type:    npm
Package: server-filesystem
──────────────────────────────────────────────────
```

### MCP 서버 제거

```bash
npm run mcp-remove <서버이름>
```

예시:
```bash
npm run mcp-remove old-server
```

**주의:** 이 명령은 `.mcp.json`에서 서버 구성만 제거합니다. npm 패키지나 Python 의존성은 자동으로 제거되지 않습니다.

## 지원되는 서버 타입

### 📦 npm 서버
- Node.js 기반 MCP 서버
- npm 레지스트리에서 설치
- `npx -y`를 통해 실행

### 🐍 Python 서버
- Python 기반 MCP 서버
- 자동 가상 환경 생성 (`.venv`)
- requirements.txt를 통한 의존성 관리
- `PYTHONUNBUFFERED=1` 환경 변수 자동 설정

### ☕ Java 서버
- Java 기반 MCP 서버 감지 지원
- 현재 자동 설치/업그레이드 미지원 (수동 구성 필요)

## 구성 파일

MCP Server Manager는 프로젝트 루트의 `.mcp.json` 파일을 사용합니다:

```json
{
  "mcpServers": {
    "filesystem-home": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\kwonn"],
      "env": {}
    },
    "python-utils": {
      "command": "C:\\Users\\kwonn\\mcp-python-server\\.venv\\Scripts\\python.exe",
      "args": ["C:\\Users\\kwonn\\mcp-python-server\\server_mcp.py"],
      "env": { "PYTHONUNBUFFERED": "1" }
    }
  }
}
```

## 작업 흐름 예시

### 새 npm MCP 서버 추가

```bash
# 1. 설치
npm run mcp-install npm my-server @my-org/mcp-server

# 2. 확인
npm run mcp-list

# 3. 나중에 업데이트 확인
npm run mcp-check @my-org/mcp-server

# 4. 업그레이드
npm run mcp-upgrade my-server @my-org/mcp-server
```

### 새 Python MCP 서버 추가

```bash
# 1. 서버 코드와 requirements.txt 준비
# 2. 설치
npm run mcp-install python my-python-server ./path/to/server.py ./path/to/requirements.txt

# 3. 확인
npm run mcp-list

# 4. 나중에 업그레이드
npm run mcp-upgrade my-python-server ./path/to/server.py ./path/to/requirements.txt
```

## 문제 해결

### Python 가상 환경 문제

Python 서버 설치 시 가상 환경 생성에 실패하면:

```bash
# 수동으로 가상 환경 생성
cd ./path/to/server
python -m venv .venv

# 의존성 수동 설치
.venv/Scripts/python.exe -m pip install -r requirements.txt  # Windows
# 또는
.venv/bin/python -m pip install -r requirements.txt  # Linux/Mac
```

### npm 패키지 설치 문제

npm 패키지 설치 실패 시:

```bash
# npm 캐시 정리
npm cache clean --force

# 다시 시도
npm run mcp-install npm <서버이름> <패키지명>
```

### 서버가 목록에 나타나지 않음

`.mcp.json` 파일이 올바른 위치에 있는지 확인:

```bash
# 상태 확인
npm run mcp-status

# 파일 존재 여부 확인
ls -la .mcp.json  # Linux/Mac
dir .mcp.json     # Windows
```

## 보안 고려사항

MCP Server Manager는 기존 MCP 암호화 기능과 함께 사용할 수 있습니다:

```bash
# MCP 구성 암호화
npm run mcp-encrypt

# 상태 확인
npm run mcp-status
```

자세한 내용은 [README_ENCRYPTION.md](./README_ENCRYPTION.md)를 참조하세요.

## API 참조

프로그래밍 방식으로 사용하려면:

```typescript
import {
  listMCPServers,
  installNpmMCPServer,
  installPythonMCPServer,
  upgradeNpmMCPServer,
  upgradePythonMCPServer,
  checkNpmPackageUpdate,
  removeMCPServer,
  getMCPServerInfo,
} from "./src/utils/mcpServerManager.js";

// 서버 목록 조회
const servers = await listMCPServers();

// npm 서버 설치
await installNpmMCPServer(
  "@modelcontextprotocol/server-filesystem",
  "filesystem-home",
  "/home/user"
);

// Python 서버 설치
await installPythonMCPServer(
  "./mcp-server/server.py",
  "my-server",
  "./mcp-server/requirements.txt"
);

// 업데이트 확인
const updateInfo = await checkNpmPackageUpdate("@my-org/mcp-server");
console.log(`Update available: ${updateInfo.updateAvailable}`);
```

## 기여

이 기능은 `mcp-security` 프로젝트의 일부이며 동일한 라이선스를 따릅니다.

버그 리포트 또는 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 관련 문서

- [README_ENCRYPTION.md](./README_ENCRYPTION.md) - MCP 구성 암호화
- [AUTO_UPDATE.md](./AUTO_UPDATE.md) - 자동 업데이트 기능
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 공식 문서
