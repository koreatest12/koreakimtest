# CLAUDE.md - Project Instructions

이 저장소(`C:\Users\kwonn`)는 사용자 홈 디렉터리 전체가 git 작업 트리입니다.
Claude Code는 아래 공통 정책(AGENTS.md)을 그대로 따릅니다.

@AGENTS.md

## Claude Code 적용 메모

- 홈 디렉터리에는 `NTUSER.DAT`, `AppData`, `.ssh`, `Cookies` 등 시스템·비밀 파일이
  있습니다. 광범위한 `git add .`, 재귀 삭제, 전체 포맷팅을 하지 않습니다.

## Claude Code 과금 방지 (Billing Guard)

AGENTS.md의 과금 방지 정책을 Claude Code 고유 도구에 다음과 같이 적용합니다.
아래 항목은 모두 "사용자가 현재 작업에서 정확한 서비스와 동작을 명시적으로 승인한
경우"에만 사용합니다. 승인 기준은 AGENTS.md의 "Explicit Approval Standard"를 따릅니다.

### 승인 없이는 사용하지 않는 도구

- **claude.ai 커넥터(원격 MCP)**: Gmail, Google Calendar, Google Drive, Notion,
  Claude Docs 등 `mcp__claude_ai_*` 도구 전체. 조회(read/search/list)도 포함합니다.
- **브라우저 자동화**: `mcp__claude-in-chrome__*` 도구 전체.
- **웹 접근**: `WebSearch`, `WebFetch`, `web-fetch` 에이전트, 온라인 문서 조회.
- **Artifact 게시**: `Artifact` publish/update/delete, `ArtifactData`,
  `ArtifactComments`. 결과물은 로컬 파일이나 터미널 응답으로 제공합니다.
- **클라우드·원격 실행**: `RemoteTrigger`, `schedule`(클라우드 루틴), `Agent`의
  `isolation: "remote"`, `/code-review ultra`(과금되는 클라우드 리뷰).
- **다중 에이전트 오케스트레이션**: `Workflow` 도구, 다수의 서브에이전트 병렬 실행.
  단일 서브에이전트도 로컬 읽기 전용 탐색으로 충분하면 직접 검색을 우선합니다.
- **반복·예약 실행**: `/loop`, `CronCreate`, `ScheduleWakeup` 등 모델 호출을
  반복시키는 기능.
- **외부 API 호출 코드 실행**: Anthropic/OpenAI/Gemini 등 API 키를 사용하는 스크립트,
  `anthropic-cost-tracker` 등 과금 API를 호출할 수 있는 프로젝트 스크립트.
- **GitHub**: `gh` 명령, `git fetch/pull/push/clone` 등 원격 접촉 명령.

### 기본 동작

- 로컬 파일 읽기, `Grep`/`Glob` 검색, 로컬 `git status/diff/log/show`를 우선합니다.
- 위 도구가 필요하다고 판단되면 실행하지 말고 먼저 다음을 한국어로 알립니다:
  서비스명, 정확한 동작, 필요한 이유, 쿼터·과금·자격증명 사용 가능성.
- 한 번의 승인은 해당 서비스·동작·작업에만 유효하며 다른 작업으로 이어지지 않습니다.
- 과금 여부가 불확실하면 과금된다고 가정하고 승인을 요청합니다.
- Claude Code 모델 사용 자체의 요금은 이 정책으로 막을 수 없습니다. 이 정책은
  추가 도구·커넥터·네트워크·원격 실행으로 인한 과금을 방지하기 위한 것입니다.
