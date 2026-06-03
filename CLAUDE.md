# CLAUDE.md - Project Instructions

## Project Overview
MCP(Model Context Protocol) 서버 프로젝트.

- **Repository**: https://github.com/koreatest12/koreakimtest
- **Branch**: main
- **Platform**: Windows 11, Node.js (ESM)

## Project Structure

```
C:\Users\kwonn\
├── .mcp-servers\
│   ├── account-vault\index.js   # 계정/토큰 보관 서버
│   └── tmp-cleaner\index.js     # 임시 파일 정리 서버
└── .mcp.json                    # MCP 서버 등록 설정
```

## MCP Server Details

### account-vault (로컬 MCP)
`C:\Users\kwonn\.mcp-servers\account-vault\index.js`

계정 정보 및 토큰 보관 서버.

- `vault_save_account` - 계정 저장
- `vault_get_account` - 계정 조회
- `vault_list_accounts` - 계정 목록
- `vault_delete_account` - 계정 삭제
- `vault_update_tokens` - 토큰 업데이트

### claude.ai Google Calendar (원격 MCP)
Google Calendar 연동 도구 (OAuth 인증 완료):
- `gcal_list_calendars` / `gcal_list_events` / `gcal_get_event` - 캘린더/일정 조회
- `gcal_create_event` / `gcal_update_event` / `gcal_delete_event` - 일정 관리
- `gcal_respond_to_event` / `gcal_suggest_time` - 초대 응답/시간 제안

> 인증 방식: Claude Code OAuth (`/mcp` 명령으로 연결)
> `.mcp.json` 설정 불필요 (claude.ai 원격 서버)

### tmp-cleaner (로컬 MCP)
`C:\Users\kwonn\.mcp-servers\tmp-cleaner\index.js`

Claude tmp 파일 정기 정리 서버. 서버 시작 시 자동 정리 체크 (기본 7일 주기).

- `tmp_status` - tmp 디렉토리 상태 조회 (크기, 파일 수, 마지막 정리)
- `tmp_clean_preview` - 삭제 예정 항목 미리보기 (실제 삭제 없음)
- `tmp_clean` - tmp 정리 실행 (현재 Claude 세션 자동 보호)
- `tmp_set_interval` - 자동 정리 주기 설정 (일 단위)
- `tmp_schedule_setup` - Windows 작업 스케줄러 등록 (매일/매주)
- `tmp_schedule_status` - 스케줄러 상태 및 로그 확인
- `tmp_schedule_remove` - 스케줄러 작업 제거

**정리 대상:**
- `%TEMP%\claude` - Claude Code 세션 임시 파일

## Important Notes

- 파일 경로는 Windows 형식 (`C:\Users\kwonn\...`) 사용
- 커밋 메시지: 영문, 변경 내용을 명확히 기술
