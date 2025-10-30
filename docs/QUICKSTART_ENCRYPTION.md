# MCP 암호화 빠른 시작 가이드

## 5분 안에 MCP 설정 암호화하기

### 1단계: 의존성 설치 (1분)

```bash
cd C:\Users\kwonn
npm install
```

### 2단계: 암호화 키 생성 (1분)

**Windows PowerShell에서 실행:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

출력된 키를 복사합니다. 예: `XyZ123AbC...`

### 3단계: 환경변수 설정 (1분)

`.env` 파일을 열고 (없으면 생성):

```bash
notepad .env
```

다음 내용 추가:
```env
MCP_ENCRYPTION_KEY=여기에-복사한-키-붙여넣기
```

저장하고 닫기.

### 4단계: 현재 상태 확인 (30초)

```bash
npm run mcp-status
```

출력 확인:
```
📊 MCP Configuration Status
────────────────────────────────────────────────────────────
✓ Main Config           1.23 KB (plaintext)
✗ Encrypted Config      Not found
✓ Backup               1.23 KB (plaintext)
────────────────────────────────────────────────────────────
🔑 MCP_ENCRYPTION_KEY: ✓ Set
```

### 5단계: MCP 설정 암호화 (30초)

```bash
npm run mcp-encrypt
```

성공 메시지 확인:
```
✅ Encryption completed successfully!
```

### 6단계: 검증 (1분)

```bash
# 암호화 상태 재확인
npm run mcp-status

# 서버 목록 확인
npm run mcp-loader list

# 설정 검증
npm run mcp-loader validate
```

### 완료!

이제 MCP 설정이 암호화되었습니다.

**다음 단계:**
- 원본 `.mcp.json` 파일 삭제 (선택사항)
- 암호화 키를 안전한 곳에 백업
- `.gitignore`에 민감한 파일 추가 확인

## 자주 사용하는 명령어

```bash
# 상태 확인
npm run mcp-status

# 서버 목록
npm run mcp-loader list

# 특정 서버 정보
npm run mcp-loader get python-utils

# 설정 검증
npm run mcp-loader validate

# 백업 복원
npm run mcp-restore
```

## 문제 해결

### "MCP_ENCRYPTION_KEY not set" 오류

```bash
# .env 파일 확인
type .env

# 키 생성 다시 실행
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 암호화 실패

```bash
# 백업에서 복원
npm run mcp-restore

# 다시 시도
npm run mcp-encrypt
```

### 자세한 가이드

전체 문서는 `docs/MCP_ENCRYPTION_GUIDE.md` 참조

## 보안 체크리스트

- [ ] 암호화 키 생성 완료
- [ ] `.env` 파일에 키 저장
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] MCP 설정 암호화 완료
- [ ] 암호화 검증 완료
- [ ] 암호화 키 백업 완료 (안전한 장소)
- [ ] 원본 파일 삭제 고려
