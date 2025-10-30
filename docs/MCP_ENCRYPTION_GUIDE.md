# MCP Configuration Encryption Guide

## 개요

MCP (Model Context Protocol) 설정 파일에는 민감한 정보(API 키, 파일 경로, 환경변수 등)가 포함될 수 있습니다. 이 가이드는 MCP 설정을 암호화하여 정보 유출을 방지하는 방법을 설명합니다.

## 보안 기능

### 암호화 사양
- **알고리즘**: AES-256-GCM (Galois/Counter Mode)
- **키 길이**: 256비트 (32바이트)
- **IV 길이**: 128비트 (16바이트)
- **인증 태그**: 128비트 (AEAD - Authenticated Encryption with Associated Data)
- **키 유도**: PBKDF2-SHA256 (100,000 iterations)

### 주요 특징
- ✅ 강력한 AES-256-GCM 암호화
- ✅ 환경변수 기반 키 관리
- ✅ 자동 백업 생성
- ✅ 인증 태그로 무결성 검증
- ✅ Salt와 IV로 재사용 공격 방지
- ✅ 민감정보 자동 마스킹
- ✅ 설정 검증 기능

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

필요한 패키지:
- `tsx`: TypeScript 직접 실행
- `typescript`: TypeScript 컴파일러
- `@types/node`: Node.js 타입 정의

### 2. 암호화 키 생성

강력한 암호화 키를 생성합니다 (최소 16자, 권장 32자 이상):

**Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. 환경변수 설정

`.env` 파일을 생성하고 암호화 키를 설정합니다:

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일에 암호화 키를 추가:
```env
MCP_ENCRYPTION_KEY=your-generated-key-here
```

**중요**: `.env` 파일은 절대 Git에 커밋하지 마세요!

## 사용 방법

### MCP 설정 상태 확인

```bash
npm run mcp-status
```

출력 예시:
```
📊 MCP Configuration Status

────────────────────────────────────────────────────────────
✓ Main Config           1.23 KB (plaintext)
✗ Encrypted Config      Not found
✓ Backup               1.23 KB (plaintext)
────────────────────────────────────────────────────────────

🔑 MCP_ENCRYPTION_KEY: ✓ Set
```

### MCP 설정 암호화

```bash
npm run mcp-encrypt
```

실행 과정:
1. `.mcp.json` 파일 읽기
2. `.mcp.json.backup` 백업 생성
3. `.mcp.json.encrypted` 암호화 파일 생성
4. 원본 파일은 유지 (수동 삭제 권장)

출력 예시:
```
🔒 Encrypting MCP configuration...

✓ Backup created at: C:\Users\kwonn\.mcp.json.backup
✓ Encrypted configuration saved to: C:\Users\kwonn\.mcp.json.encrypted

⚠️  Original unencrypted file still exists at: C:\Users\kwonn\.mcp.json
   Consider deleting it after verifying the encrypted version works.
   Backup is available at: C:\Users\kwonn\.mcp.json.backup

✅ Encryption completed successfully!
```

### MCP 설정 복호화 (테스트용)

```bash
npm run mcp-decrypt
```

복호화된 파일은 `.mcp.json.decrypted`로 저장됩니다.

**주의**: 복호화된 파일은 사용 후 즉시 삭제하세요!

### 암호화된 설정 로드 (메모리 전용)

```bash
npm run mcp-load
```

디스크에 복호화 파일을 쓰지 않고 메모리에서만 복호화하여 출력합니다.

### 백업에서 복원

```bash
npm run mcp-restore
```

`.mcp.json.backup` 파일을 `.mcp.json`으로 복원합니다.

## MCP 로더 사용

### 서버 목록 확인

```bash
npm run mcp-loader list
```

출력 예시:
```
Found 7 MCP servers:

  1. hello-mcp-js
  2. hello-mcp-py
  3. filesystem-home
  4. filesystem-documents
  5. filesystem-downloads
  6. filesystem-ideaprojects
  7. python-utils
```

### 특정 서버 설정 확인

```bash
npm run mcp-loader get python-utils
```

### 전체 설정 확인 (민감정보 마스킹)

```bash
npm run mcp-loader show
```

민감한 정보(API 키, 토큰 등)는 자동으로 `[REDACTED]`로 표시됩니다.

### 설정 검증

```bash
npm run mcp-loader validate
```

모든 MCP 서버 설정의 유효성을 검사합니다.

## 프로그래밍 인터페이스

### TypeScript/JavaScript에서 사용

```typescript
import { loadMCPConfig, getMCPServer, listMCPServers } from './src/utils/secureMcpLoader.js';

// 전체 설정 로드
const config = await loadMCPConfig();

// 특정 서버 가져오기
const pythonUtils = await getMCPServer('python-utils');

// 서버 목록
const servers = await listMCPServers();
```

### 암호화/복호화 API

```typescript
import { encryptJSON, decryptJSON } from './src/utils/encryption.js';

// 데이터 암호화
const encrypted = encryptJSON({ key: 'value' }, 'your-password');

// 데이터 복호화
const decrypted = decryptJSON(encrypted, 'your-password');
```

## 보안 권장사항

### 1. 암호화 키 관리
- ✅ 최소 32자 이상의 랜덤 키 사용
- ✅ 환경변수로 키 관리 (`MCP_ENCRYPTION_KEY`)
- ✅ 키를 Git에 커밋하지 않음 (`.gitignore`에 `.env` 추가)
- ✅ 키를 안전한 위치에 백업 (password manager 등)
- ❌ 하드코딩된 키 사용 금지
- ❌ 키를 코드에 포함 금지

### 2. 파일 관리
- ✅ 암호화 후 원본 `.mcp.json` 삭제
- ✅ 백업 파일 안전한 곳에 보관
- ✅ 복호화된 파일 사용 후 즉시 삭제
- ✅ `.gitignore`에 민감한 파일 추가:
  ```
  .env
  .mcp.json
  .mcp.json.backup
  .mcp.json.decrypted
  ```

### 3. 접근 제어
- ✅ 파일 권한 제한 (Windows: 사용자만 읽기/쓰기)
- ✅ 암호화된 파일도 접근 권한 제한
- ✅ 프로덕션 환경에서는 암호화된 버전만 사용

### 4. 운영 환경
- ✅ CI/CD에서 환경변수로 키 주입
- ✅ 키 로테이션 정기적 수행
- ✅ 접근 로그 모니터링
- ✅ 키 유출 시 즉시 재암호화

## 암호화된 설정 파일 구조

암호화된 파일은 다음과 같은 JSON 구조를 가집니다:

```json
{
  "version": "1.0",
  "algorithm": "aes-256-gcm",
  "encrypted": "hex-encoded-ciphertext",
  "salt": "hex-encoded-salt",
  "iv": "hex-encoded-initialization-vector",
  "authTag": "hex-encoded-authentication-tag"
}
```

## 트러블슈팅

### 오류: "MCP_ENCRYPTION_KEY environment variable not set"

**원인**: 환경변수가 설정되지 않음

**해결**:
```bash
# .env 파일 확인
cat .env

# 환경변수가 설정되었는지 확인
echo $env:MCP_ENCRYPTION_KEY  # Windows PowerShell
echo $MCP_ENCRYPTION_KEY       # Linux/Mac

# .env 파일을 로드하는 경우
npm install dotenv
# 스크립트에 추가: require('dotenv').config()
```

### 오류: "MCP_ENCRYPTION_KEY must be at least 16 characters long"

**원인**: 키가 너무 짧음

**해결**: 최소 16자 (권장 32자) 이상의 키 생성

### 오류: "Decryption failed"

**원인**: 잘못된 키 또는 손상된 파일

**해결**:
1. 올바른 키를 사용하는지 확인
2. 백업에서 복원: `npm run mcp-restore`
3. 파일 무결성 확인

### 암호화된 파일이 로드되지 않음

**확인사항**:
1. `.mcp.json.encrypted` 파일 존재 확인
2. 환경변수 설정 확인
3. 파일 권한 확인
4. 로그 확인: `npm run mcp-status`

## 예제 워크플로우

### 최초 설정 시

```bash
# 1. 암호화 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 2. .env 파일 설정
echo "MCP_ENCRYPTION_KEY=<generated-key>" >> .env

# 3. 현재 상태 확인
npm run mcp-status

# 4. MCP 설정 암호화
npm run mcp-encrypt

# 5. 암호화 확인
npm run mcp-status

# 6. 복호화 테스트
npm run mcp-decrypt

# 7. 원본 파일 삭제 (선택사항)
rm .mcp.json

# 8. 설정 로드 테스트
npm run mcp-loader list
```

### 설정 업데이트 시

```bash
# 1. 백업에서 복원
npm run mcp-restore

# 2. 설정 수정
code .mcp.json

# 3. 재암호화
npm run mcp-encrypt

# 4. 검증
npm run mcp-loader validate
```

## 참고 자료

- [AES-GCM 암호화](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [PBKDF2 키 유도](https://en.wikipedia.org/wiki/PBKDF2)
- [Node.js Crypto 모듈](https://nodejs.org/api/crypto.html)
- [MCP 프로토콜](https://modelcontextprotocol.io/)

## 라이선스

이 암호화 시스템은 MIT 라이선스를 따릅니다.

## 지원

문제가 발생하거나 질문이 있으시면:
1. GitHub Issues 생성
2. 보안 관련 이슈는 비공개로 보고
3. 문서 개선 제안 환영

---

**⚠️ 보안 경고**: 이 시스템은 로컬 파일 암호화를 위한 것입니다. 프로덕션 환경에서는 추가 보안 계층(HSM, KMS 등)을 고려하세요.
