# MCP Server Upgrade Copilot Notes

이 문서는 `🚀 MCP Server Install & Copilot Sync` GitHub Actions 워크플로우에서 생성되는 산출물과 디렉터리 구조를 Copilot이 이해하도록 도와줍니다.

## 주요 워크플로우 개요
- 파이썬 MCP 서버 의존성 설치 (`mcp-python-server/requirements.txt`).
- `pytest` 기반 기본 스모크 테스트 실행.
- Node.js 환경을 구성하여 MCP CLI 도구 설치.
- `.github/mcp-workspace` 내부에 로그, 설정, 스냅샷, 템플릿 디렉터리 생성.
- 부트스트랩 설정 파일(`bootstrap.json`)과 Copilot 요약 파일을 생성 후 아티팩트로 업로드.

## 생성되는 경로
```
.github/
  mcp-workspace/
    artifacts/
    config/
      bootstrap.json
      templates/
      snapshots/
      logs/
  copilot/
    mcp-server-upgrade-summary.md
```

## 활용 방법
- Copilot Chat에서 MCP 관련 자동화를 진행할 때 위 경로를 참조하면 됩니다.
- `bootstrap.json`에는 실행 중 사용된 서버 엔트리 포인트와 설명이 기록됩니다.
- 워크플로우 요약은 GitHub Step Summary와 업로드된 아티팩트에서도 확인할 수 있습니다.

이 노트는 워크플로우가 추가로 확장될 때 업데이트되어야 하며, 생성된 아티팩트는 7일 동안 보관됩니다.
