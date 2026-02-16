# CLAUDE.md - Project Instructions

## Project Overview
MCP(Model Context Protocol) 서버 모음 프로젝트. Claude Code에서 사용하는 커스텀 도구들을 개발/관리한다.

- **Repository**: https://github.com/koreatest12/koreakimtest
- **Branch**: main
- **Platform**: Windows 11, Node.js (ESM)

## Project Structure

```
C:\Users\kwonn\
├── money-mcp/          # 금융 계산 MCP 서버
│   └── index.js        # 급여, 대출, 투자, 저축, 환율, 부가세, 퇴직금, 전월세 등
├── crypto-mcp/         # 암호화 MCP 서버
│   └── index.js        # AES-256-GCM 암복호화, 해시, Base64, 비밀번호 생성
├── chrome-mcp/         # Chrome DevTools MCP 서버
│   └── index.js        # 스크린샷, DOM 조회, 네트워크 모니터링, 콘솔 로그
└── .mcp.json           # MCP 서버 등록 설정
```

## Tech Stack

- **Runtime**: Node.js (ESM modules, `"type": "module"`)
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.0.0
- **Transport**: StdioServerTransport
- **Additional**: `xlsx` (money-mcp), `chrome-remote-interface` (chrome-mcp)

## Coding Conventions

- 언어: JavaScript (ESM, `import`/`export` 사용)
- 모든 MCP 서버는 단일 `index.js` 파일로 구성
- 도구 등록: `ListToolsRequestSchema` / `CallToolRequestSchema` 핸들러 패턴 사용
- 한국어 description 사용 (한국 사용자 대상 도구)
- 금액 단위: 원(KRW) 기본
- 2026년 기준 세율/보험료율 적용

## MCP Server Details

### money-mcp
금융/돈 관련 계산 도구 모음:
- `money_calculator` - 사칙연산, 세금, 할인, 환율
- `salary_calculator` - 급여 실수령액 (4대보험 + 소득세)
- `loan_calculator` - 대출 상환 계산
- `savings_calculator` - 적금/복리 계산
- `installment_calculator` - 할부 계산
- `dutch_pay` - 더치페이 (N빵)
- `vat_calculator` - 부가세 계산
- `minimum_wage` - 최저임금 계산
- `retirement_pay` - 퇴직금 계산
- `rent_converter` - 전월세 전환
- `investment_return` - 투자 수익률 계산
- `currency_formatter` - 통화 포맷
- `excel_savings_analyzer` - 엑셀 기반 저축 분석
- `excel_savings_plan` - 엑셀 저축 플랜 생성
- `security_news` - KISA 보호나라 보안공지
- `kisec_exam_schedule` - 정보보안기사 시험일정

### crypto-mcp
암호화/보안 도구 모음:
- `encrypt_text` / `decrypt_text` - 텍스트 AES-256-GCM 암복호화
- `encrypt_file` / `decrypt_file` - 파일 암복호화
- `hash_text` / `hash_file` - 해시 생성 (SHA-256, SHA-512, MD5)
- `generate_password` - 랜덤 비밀번호 생성
- `base64_encode` / `base64_decode` - Base64 인코딩/디코딩

### chrome-mcp
Chrome 브라우저 제어 도구 (DevTools Protocol):
- `chrome_connect` - DevTools 연결
- `chrome_navigate` - URL 이동
- `chrome_screenshot` - 스크린샷 캡처
- `chrome_evaluate` - JavaScript 실행
- `chrome_dom_query` - DOM 요소 검색
- `chrome_console_logs` - 콘솔 로그 수집
- `chrome_network_monitor` - 네트워크 모니터링
- `chrome_performance` - 성능 메트릭
- `chrome_cookies` - 쿠키 관리
- `chrome_page_info` - 페이지 정보

## Development Guidelines

1. 새 도구 추가 시 해당 MCP 서버의 `index.js`에 직접 추가
2. `ListToolsRequestSchema` 핸들러에 도구 스키마 등록
3. `CallToolRequestSchema` 핸들러에 실행 로직 추가
4. 테스트: `node index.js`로 서버 실행 후 Claude Code에서 도구 호출로 검증
5. 커밋 메시지: 영문, 변경 내용을 명확히 기술

## Important Notes

- Chrome MCP 사용 시 Chrome을 `--remote-debugging-port=9222` 옵션으로 실행 필요
- money-mcp의 세율/보험료율은 연도별 업데이트 필요 (현재 2026년 기준)
- 파일 경로는 Windows 형식 (`C:\Users\kwonn\...`) 사용
