"""Self-introduction workflow assistant CLI.

This module operationalises the guidance captured in
``docs/PROGRAMMING_SELF_DEVELOPMENT_SELF_INTRO_WORKFLOW.md`` by
providing:

* a structured, machine-readable representation of every workflow step
  and check-list item;
* commands to list the workflow, run through each stage interactively
  (or in a non-interactive, log-style mode), and
* generation of the recommended markdown template used during the
  drafting stage.

The implementation avoids any external dependencies and keeps IO simple
so that the tool can be invoked either directly or through the
``cli_main.py`` dispatcher.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List


@dataclass(frozen=True)
class ChecklistItem:
    """Single checklist item within a workflow sub-step."""

    description: str


@dataclass(frozen=True)
class WorkflowSection:
    """High level workflow section (e.g. 준비 단계)."""

    title: str
    summary: str
    checklist: List[ChecklistItem]


WORKFLOW: List[WorkflowSection] = [
    WorkflowSection(
        title="1. 준비 단계",
        summary="목표 독자, 경험, 역량을 정리하여 핵심 메시지의 토대를 만듭니다.",
        checklist=[
            ChecklistItem("지원 대상의 핵심 가치와 인재상을 조사했다."),
            ChecklistItem("채용 공고와 자료를 통해 요구 역량을 분석했다."),
            ChecklistItem("프로젝트, 인턴십, 오픈소스 등의 경험 타임라인을 정리했다."),
            ChecklistItem("각 경험의 역할, 사용 기술, 기여도, 성과를 정리했다."),
            ChecklistItem("핵심 역량 키워드를 선정하고 근거 사례를 연결했다."),
        ],
    ),
    WorkflowSection(
        title="2. 구조 설계 단계",
        summary="아웃라인을 작성하고 스토리텔링 요소와 근거 자료를 준비합니다.",
        checklist=[
            ChecklistItem("도입, 본문, 결론 구조로 아웃라인을 작성했다."),
            ChecklistItem("STAR/CAR 등 프레임워크로 단락별 핵심 메시지를 정리했다."),
            ChecklistItem("레포지터리, 블로그 등 참고 자료 링크를 수집했다."),
            ChecklistItem("성과 지표와 사용자 피드백 등 객관적 근거를 확보했다."),
        ],
    ),
    WorkflowSection(
        title="3. 작성 단계",
        summary="초안을 작성하고 차별화 요소와 톤을 다듬습니다.",
        checklist=[
            ChecklistItem("아웃라인에 맞춰 단락별 초안을 완성했다."),
            ChecklistItem("문제 해결 방식과 학습 전략 등 차별화 요소를 구체화했다."),
            ChecklistItem("학습/커뮤니티 활동 등 자기 개발 사례를 포함했다."),
            ChecklistItem("진정성 있는 톤으로 가독성을 점검했다."),
        ],
    ),
    WorkflowSection(
        title="4. 검토 및 피드백 단계",
        summary="체크리스트와 피드백을 통해 문서를 개선합니다.",
        checklist=[
            ChecklistItem("흐름, 중복, 오탈자 등 자체 검토 체크리스트를 완료했다."),
            ChecklistItem("멘토/동료 등에게 피드백을 받고 반영했다."),
            ChecklistItem("버전 관리 기록을 정리하고 맞춤형 버전을 분리했다."),
        ],
    ),
    WorkflowSection(
        title="5. 최종 제출 준비 단계",
        summary="제출 형식과 부속 자료를 정리하고 마감을 확인합니다.",
        checklist=[
            ChecklistItem("제출 플랫폼 요구 형식에 맞춰 문서를 정리했다."),
            ChecklistItem("이력서, 포트폴리오 등 부속 자료와의 일관성을 점검했다."),
            ChecklistItem("제출 마감과 수신 확인 등 최종 절차를 완료했다."),
        ],
    ),
]


TEMPLATE_CONTENT = """# 자기소개서 제목 (지원 포지션 명시)

## 1. 소개 및 비전
- 현재 역할 및 주요 관심 기술
- 개발자로서의 목표와 가치관

## 2. 핵심 프로젝트 경험
- 프로젝트명 / 기간
- 상황 및 도전 과제
- 수행한 역할과 사용 기술
- 정량/정성 성과 및 배운 점

## 3. 자기 개발 및 습 활동
- 최근 학습한 기술 혹은 자격증 준비 현황
- 스터디, 커뮤니티, 오픈소스 기여 사례
- 학습 결과를 실무에 적용한 사례

## 4. 협업 및 커뮤니케이션
- 팀 내 협업 경험과 역할 분담
- 갈등 조정, 코드 리뷰, 문서화 등 협업 역량 사례

## 5. 향후 성장 계획
- 입사 후 기여하고 싶은 영역
- 중장기적인 커리어 목표와 실행 계획

## 부록 (선택)
- 포트폴리오 링크, GitHub, 블로그, 발표 자료 등
"""


def _format_section(section: WorkflowSection) -> str:
    lines = [f"### {section.title}", section.summary, ""]
    for item in section.checklist:
        lines.append(f"- [ ] {item.description}")
    return "\n".join(lines)


def _print_sections(sections: Iterable[WorkflowSection]) -> None:
    for section in sections:
        print(_format_section(section))
        print()


def list_workflow() -> None:
    """Print the entire workflow as a checklist."""

    print("# 프로그래밍 자기 개발 자기소개서 워크플로우 체크리스트\n")
    _print_sections(WORKFLOW)


def run_workflow(non_interactive: bool = False) -> None:
    """Guide the user through each workflow section."""

    divider = "=" * 72
    for idx, section in enumerate(WORKFLOW, start=1):
        print(divider)
        print(f"Step {idx}: {section.title}")
        print(section.summary)
        print(divider)

        for item_idx, item in enumerate(section.checklist, start=1):
            print(f"  [{item_idx}] {item.description}")
            if not non_interactive:
                input("    └─ 완료 시 Enter 키를 눌러 다음 항목으로 이동하세요...")
        print()


def generate_template(output: Path | None) -> Path:
    """Create the recommended markdown template at the requested path."""

    target = output or Path("self_intro_template.md")
    target.write_text(TEMPLATE_CONTENT, encoding="utf-8")
    return target


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "프로그래밍 자기 개발 자기소개서 워크플로우 도구 — "
            "워크플로우 단계 확인, 실행, 템플릿 생성을 지원합니다."
        )
    )

    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="워크플로우 체크리스트를 출력합니다.")

    run_parser = subparsers.add_parser(
        "run", help="워크플로우를 순차적으로 실행합니다."
    )
    run_parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="사용자 입력 없이 로그 형태로 단계를 출력합니다.",
    )

    template_parser = subparsers.add_parser(
        "generate-template", help="추천 마크다운 템플릿을 생성합니다."
    )
    template_parser.add_argument(
        "--output",
        type=Path,
        help="템플릿을 저장할 파일 경로 (기본값: ./self_intro_template.md)",
    )

    return parser


def main(argv: List[str] | None = None) -> None:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "list":
        list_workflow()
    elif args.command == "run":
        run_workflow(non_interactive=getattr(args, "non_interactive", False))
    elif args.command == "generate-template":
        result = generate_template(getattr(args, "output", None))
        print(f"✅ 템플릿이 생성되었습니다: {result}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
