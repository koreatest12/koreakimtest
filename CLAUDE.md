# CLAUDE.md - Project Instructions

이 저장소(`C:\Users\kwonn`)는 사용자 홈 디렉터리 전체가 git 작업 트리입니다.
Claude Code는 아래 공통 정책(AGENTS.md)을 그대로 따릅니다.

@AGENTS.md

## Claude Code 적용 메모

- 사용자 응답은 한국어로 작성하고, 결론 → 근거 → 한계 순으로 보고합니다.
- 전역 하네스 규칙은 `~/.claude/CLAUDE.md`와 `~/.claude/rules/`에 있습니다.
  하네스 스크립트 실제 위치는 `~/.claude/scripts/harness/`
  (`verify.ps1`, `env_check.ps1`, `billing_guard.ps1`)입니다.
- AGENTS.md가 파일 쓰기·빌드·테스트 실행에 명시 승인을 요구하므로,
  하네스 명령(`/verify`, `npm test` 등)도 사용자가 요청·승인한 경우에만 실행합니다.
- 홈 디렉터리에는 `NTUSER.DAT`, `AppData`, `.ssh`, `Cookies` 등 시스템·비밀 파일이
  있습니다. 광범위한 `git add .`, 재귀 삭제, 전체 포맷팅을 하지 않습니다.

## 현재 구성 (2026-09-24 기준)

- `package.json` (`mcp-security`, ESM): TypeScript 유틸 스크립트
  - `npm test` = `lint` + `format:check` + `build`(tsc)
  - `npm run lint` / `npm run format:check`
- 하위 프로젝트: `money-mcp/`, `crypto-mcp/`, `mcp-python-server/`,
  `financial-core/`, `enterprise-app/`, `src/cli/`(Python) 등
- Codex 관련 문서: `docs/codex-approval-guide.md`, `docs/codex-local-workflow.md`,
  `docs/codex-document-map.md`
- 이전 버전 CLAUDE.md가 설명하던 `.mcp.json`, `.mcp-servers/tmp-cleaner`,
  `chrome-mcp`, `.codex/mcp-servers/filesystem`, claude.ai 원격 Google Calendar
  연동은 현재 작업 트리에서 삭제되었거나 AGENTS.md의 MCP 정책상 사용하지 않습니다.
