# CLAUDE.md - Project Instructions

## Project Overview
MCP(Model Context Protocol) 단일 통합 서버 프로젝트. 모든 커스텀 도구가 filesystem 서버 하나로 통합되어 있다.

- **Repository**: https://github.com/koreatest12/koreakimtest
- **Branch**: main
- **Platform**: Windows 11, Node.js (ESM)

## Project Structure

```
C:\Users\kwonn\
├── .codex\mcp-servers\filesystem\   # 통합 MCP 서버 (유일한 서버)
│   ├── dist\index.js                # 컴파일된 서버 파일 (직접 편집)
│   └── package.json                 # 의존성: xlsx, chrome-remote-interface 포함
└── .mcp.json                        # MCP 서버 등록 설정 (filesystem만 등록)
```

## Tech Stack

- **Runtime**: Node.js (ESM modules, `"type": "module"`)
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.25.2
- **Transport**: StdioServerTransport
- **Additional**: `xlsx`, `chrome-remote-interface`, `diff`, `glob`, `minimatch`, `zod-to-json-schema`

## Coding Conventions

- 언어: JavaScript (ESM, `import`/`export` 사용)
- 단일 서버 파일: `C:\Users\kwonn\.codex\mcp-servers\filesystem\dist\index.js`
- 도구 등록: `server.registerTool(name, { title, description, inputSchema (Zod), annotations }, handler)` 패턴
- 한국어 description 사용 (한국 사용자 대상 도구)
- 금액 단위: 원(KRW) 기본
- 2026년 기준 세율/보험료율 적용

## MCP Server Details

### filesystem (통합 서버)
`C:\Users\kwonn\.codex\mcp-servers\filesystem\dist\index.js`

**파일시스템 도구:**
- `read_file` / `read_text_file` / `read_media_file` - 파일 읽기
- `read_multiple_files` - 여러 파일 동시 읽기
- `write_file` / `edit_file` - 파일 쓰기/편집
- `create_directory` - 디렉토리 생성
- `list_directory` / `list_directory_with_sizes` / `directory_tree` - 디렉토리 조회
- `move_file` - 파일/폴더 이동
- `search_files` - 파일 검색
- `get_file_info` - 파일 정보
- `predict_capacity` - 용량 예측
- `list_allowed_directories` - 허용 디렉토리 목록

**암호화 도구:**
- `encrypt_text` / `decrypt_text` - 텍스트 AES-256-GCM 암복호화
- `encrypt_file` / `decrypt_file` - 파일 암복호화
- `hash_text` / `hash_file` - 해시 생성 (SHA-256, SHA-512, MD5)
- `generate_password` - 랜덤 비밀번호 생성
- `base64_encode` / `base64_decode` - Base64 인코딩/디코딩

**금융 계산 도구:**
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
- `stock_tax_calculator` - 주식 세금 계산 (국내 증권거래세, 해외 양도소득세, 배당소득세)

**Chrome 브라우저 제어 도구 (DevTools Protocol):**
- `chrome_connect` - DevTools 연결
- `chrome_list_tabs` - 열린 탭 목록 조회
- `chrome_navigate` - URL 이동
- `chrome_screenshot` - 스크린샷 캡처
- `chrome_evaluate` - JavaScript 실행
- `chrome_dom_query` - DOM 요소 검색
- `chrome_console_logs` - 콘솔 로그 수집
- `chrome_network_monitor` - 네트워크 모니터링
- `chrome_performance` - 성능 메트릭
- `chrome_cookies` - 쿠키 관리
- `chrome_page_info` - 페이지 정보
- `file_server_start` - HTTP 파일 공유 서버 시작
- `file_server_stop` - 파일 공유 서버 중지
- `file_server_list` - 공유 파일 목록 및 다운로드 URL 조회
- `file_server_upload` - 로컬 파일을 공유 폴더에 복사
- `file_server_info` - 서버 상태 및 접속 URL 조회

**파일시스템 분석 도구:**
- `analyze_directory` - 디렉토리 종합 분석
- `find_large_files` - 큰 파일 탐색 (기본 10MB 이상)
- `find_duplicate_files` - MD5 해시 기반 중복 파일 탐지
- `disk_usage_report` - 폴더별 디스크 사용량 리포트
- `find_old_files` - 오래 수정되지 않은 파일 탐색 (기본 365일 이상)
- `find_empty_dirs` - 빈 디렉토리 탐색
- `analyze_code_files` - 코드 파일 통계 (언어별)
- `search_by_pattern` - 정규식 패턴으로 파일/폴더 이름 검색

**디스크 용량 도구:**
- `disk_drive_summary` - 드라이브 총용량/사용량/여유공간
- `disk_folder_usage` - 폴더별 사용량 요약
- `disk_largest_files` - 큰 파일 탐색

**모니터링 도구:**
- `monitoring_status` - MCP 서버 상태 확인
- `check_server_path` - 서버 파일 경로 검증
- `list_configured_mcp_servers` - 설정된 MCP 서버 목록

**NPM 캐시 도구:**
- `npm_cache_status` - npm 캐시 상태 조회
- `npm_cache_autoclean` - 오래된 npx 캐시 정리
- `npm_cache_remove_empty_dirs` - 빈 캐시 디렉토리 제거

**Git 도구:**
- `git_status` / `git_diff` / `git_diff_unstaged` / `git_diff_staged` - 변경사항 확인
- `git_log` - 커밋 로그
- `git_add` / `git_commit` / `git_reset` - 스테이징 및 커밋
- `git_branch` / `git_create_branch` / `git_checkout` - 브랜치 관리
- `git_show` - 커밋 상세 조회

**시간 도구:**
- `get_current_time` - 현재 시각 조회 (타임존 지원)
- `convert_time` - 시간대 변환

### claude.ai Google Calendar (원격 MCP)
Google Calendar 연동 도구 (OAuth 인증 완료):
- `gcal_list_calendars` / `gcal_list_events` / `gcal_get_event` - 캘린더/일정 조회
- `gcal_create_event` / `gcal_update_event` / `gcal_delete_event` - 일정 관리
- `gcal_respond_to_event` / `gcal_suggest_time` - 초대 응답/시간 제안

> 인증 방식: Claude Code OAuth (`/mcp` 명령으로 연결)
> `.mcp.json` 설정 불필요 (claude.ai 원격 서버)

### tmp-cleaner (로컬 MCP)
`C:\Users\kwonn\.mcp-servers\tmp-cleaner\index.js`

Claude, Codex tmp 파일 정기 정리 서버. 서버 시작 시 자동 정리 체크 (기본 7일 주기).

- `tmp_status` - tmp 디렉토리 상태 조회 (크기, 파일 수, 마지막 정리)
- `tmp_clean_preview` - 삭제 예정 항목 미리보기 (실제 삭제 없음)
- `tmp_clean` - tmp 정리 실행 (현재 Claude 세션 자동 보호)
- `tmp_set_interval` - 자동 정리 주기 설정 (일 단위)
- `tmp_schedule_setup` - Windows 작업 스케줄러 등록 (매일/매주)
- `tmp_schedule_status` - 스케줄러 상태 및 로그 확인
- `tmp_schedule_remove` - 스케줄러 작업 제거

**정리 대상:**
- `%TEMP%\claude` - Claude Code 세션 임시 파일
- `~/.codex/tmp` - Codex 작업 임시 파일
- `~/.codex/.tmp` - Codex 플러그인/마켓플레이스 캐시

## Development Guidelines

1. 새 도구 추가 시 `C:\Users\kwonn\.codex\mcp-servers\filesystem\dist\index.js` 직접 편집
2. `server.registerTool(name, { title, description, inputSchema, annotations }, handler)` 패턴 사용
3. `inputSchema`는 Zod 스키마 객체 사용 (예: `{ path: z.string().describe("...") }`)
4. 핸들러 반환값: `{ content: [{ type: "text", text: "..." }] }`
5. 테스트: `node "C:\Users\kwonn\.codex\mcp-servers\filesystem\dist\index.js" "C:\Users\kwonn"` 실행 확인
6. 커밋 메시지: 영문, 변경 내용을 명확히 기술

## Important Notes

- Chrome 도구 사용 시 Chrome을 `--remote-debugging-port=9222` 옵션으로 실행 필요
- 세율/보험료율은 연도별 업데이트 필요 (현재 2026년 기준)
- 파일 경로는 Windows 형식 (`C:\Users\kwonn\...`) 사용
- `dist\index.js`는 TypeScript 컴파일 없이 직접 편집 (원본 .ts 소스는 없음)
