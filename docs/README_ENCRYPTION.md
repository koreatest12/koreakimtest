# MCP 설정 암호화 시스템

## 개요

MCP (Model Context Protocol) 설정 파일의 정보 유출을 방지하기 위한 AES-256-GCM 암호화 시스템입니다.

## 주요 기능

### 🔐 보안 기능
- **AES-256-GCM 암호화**: 산업 표준 암호화 알고리즘
- **PBKDF2 키 유도**: 100,000 iterations로 강화된 키 생성
- **인증 태그**: 데이터 무결성 검증
- **환경변수 키 관리**: 안전한 키 저장

### 🛠️ 편의 기능
- **자동 백업**: 암호화 전 자동 백업 생성
- **CLI 도구**: 간편한 명령어 인터페이스
- **설정 검증**: 암호화된 설정 유효성 검사
- **민감정보 마스킹**: 출력 시 자동 마스킹

## 빠른 시작

```bash
# 1. 설치
npm install

# 2. 암호화 키 생성 및 설정
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo "MCP_ENCRYPTION_KEY=<생성된키>" >> .env

# 3. 암호화
npm run mcp-encrypt

# 4. 확인
npm run mcp-status
```

자세한 내용은 [빠른 시작 가이드](./QUICKSTART_ENCRYPTION.md) 참조

## 사용 가능한 명령어

### 암호화 관련
```bash
npm run mcp-encrypt     # MCP 설정 암호화
npm run mcp-decrypt     # MCP 설정 복호화 (테스트용)
npm run mcp-load        # 메모리에서 설정 로드
npm run mcp-restore     # 백업에서 복원
npm run mcp-status      # 암호화 상태 확인
```

### MCP 로더
```bash
npm run mcp-loader list              # 서버 목록
npm run mcp-loader get <name>        # 서버 정보
npm run mcp-loader show              # 전체 설정 (마스킹)
npm run mcp-loader validate          # 설정 검증
```

## 파일 구조

```
C:\Users\kwonn\
├── .env                      # 암호화 키 (Git 제외)
├── .env.example              # 환경변수 템플릿
├── .gitignore               # Git 제외 파일 목록
├── .mcp.json                 # 원본 MCP 설정 (삭제 권장)
├── .mcp.json.encrypted       # 암호화된 설정
├── .mcp.json.backup          # 백업 파일
├── package.json              # NPM 스크립트
├── tsconfig.json             # TypeScript 설정
├── src/
│   └── utils/
│       ├── encryption.ts            # 암호화 유틸리티
│       ├── mcpConfigEncryption.ts   # MCP 암호화 CLI
│       └── secureMcpLoader.ts       # 안전한 MCP 로더
└── docs/
    ├── MCP_ENCRYPTION_GUIDE.md      # 전체 가이드
    ├── QUICKSTART_ENCRYPTION.md     # 빠른 시작
    └── README_ENCRYPTION.md         # 이 문서
```

## 보안 사양

### 암호화
- **알고리즘**: AES-256-GCM
- **키 길이**: 256비트
- **IV 길이**: 128비트
- **인증 태그**: 128비트 (AEAD)

### 키 유도
- **알고리즘**: PBKDF2-SHA256
- **반복 횟수**: 100,000
- **Salt**: 32바이트 랜덤

## API 사용 예제

### TypeScript/JavaScript

```typescript
import { loadMCPConfig, getMCPServer } from './src/utils/secureMcpLoader.js';

// 전체 설정 로드 (자동으로 암호화된 파일 처리)
const config = await loadMCPConfig();

// 특정 서버 정보 가져오기
const server = await getMCPServer('python-utils');
console.log(server.command);
console.log(server.args);

// 암호화/복호화
import { encryptJSON, decryptJSON } from './src/utils/encryption.js';

const data = { sensitive: 'data' };
const encrypted = encryptJSON(data, 'your-password');
const decrypted = decryptJSON(encrypted, 'your-password');
```

## 보안 권장사항

### ✅ DO
- 최소 32자 이상의 강력한 키 사용
- 환경변수로 키 관리
- `.env` 파일을 `.gitignore`에 포함
- 암호화 키를 안전한 곳에 백업
- 정기적으로 키 로테이션
- 암호화 후 원본 파일 삭제

### ❌ DON'T
- 키를 코드에 하드코딩
- `.env` 파일을 Git에 커밋
- 암호화 키를 공유 문서에 저장
- 짧거나 예측 가능한 키 사용
- 복호화된 파일을 장시간 보관

## 문제 해결

### 환경변수 오류
```bash
# 환경변수 확인
echo $env:MCP_ENCRYPTION_KEY  # Windows PowerShell
echo $MCP_ENCRYPTION_KEY       # Linux/Mac

# .env 파일 확인
type .env  # Windows
cat .env   # Linux/Mac
```

### 복호화 실패
```bash
# 백업 확인
npm run mcp-status

# 백업에서 복원
npm run mcp-restore

# 재암호화
npm run mcp-encrypt
```

### 파일 권한 오류
```powershell
# Windows: 파일 권한 확인
icacls .mcp.json.encrypted

# 권한 수정 (현재 사용자만 접근)
icacls .mcp.json.encrypted /inheritance:r /grant:r "%USERNAME%:F"
```

## 성능

- **암호화 속도**: ~1ms for 1KB config
- **복호화 속도**: ~1ms for 1KB config
- **메모리 사용**: Minimal (config loaded in memory only)
- **파일 크기 증가**: ~100 bytes (metadata overhead)

## 테스트

```bash
# 암호화 테스트
npm run mcp-encrypt
npm run mcp-status

# 복호화 테스트
npm run mcp-decrypt

# 로더 테스트
npm run mcp-loader validate

# 설정 검증
npm run mcp-loader show
```

## 호환성

- **Node.js**: 18.0.0 이상
- **TypeScript**: 5.3.0 이상
- **OS**: Windows, Linux, macOS
- **MCP Protocol**: 모든 버전 호환

## 라이선스

MIT License

## 지원

- **문서**: `docs/MCP_ENCRYPTION_GUIDE.md`
- **빠른 시작**: `docs/QUICKSTART_ENCRYPTION.md`
- **이슈 보고**: GitHub Issues
- **보안 이슈**: 비공개 보고 권장

## 향후 계획

- [ ] GUI 도구 개발
- [ ] 키 로테이션 자동화
- [ ] 멀티 키 지원
- [ ] 클라우드 KMS 통합
- [ ] 감사 로그 추가
- [ ] 성능 최적화

## 참고 자료

- [AES-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

**버전**: 1.0.0
**최종 업데이트**: 2025-10-30
**작성자**: MCP Security Team
