name: "📄 Generate & Commit README.md"

on:
  push:
    branches: [ "main" ]
  # 수동 실행을 허용하여 필요할 때마다 README를 재생성할 수 있습니다.
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      # 파일 커밋 및 푸시를 위해 contents: write 권한이 필요합니다.
      contents: write
      
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        # 🚨 중요: 자동 커밋을 위해 full history를 가져옵니다.
        with:
          fetch-depth: 0 

      - name: Generate Dynamic README Content
        id: readme_content
        run: |
          # 🚨 NOTE: 여기서 README.md 파일 내용을 정의합니다.
          # 동적인 정보를 추가할 수 있습니다 (예: 현재 날짜, 리포지토리 이름).
          README_CONTENT="""
          # 🚀 ${{ github.repository }}

          ## 프로젝트 개요
          이 프로젝트는 GitHub Actions 워크플로우에 의해 자동으로 관리되고 분석됩니다.
          
          ## 🛡️ 보안 분석 (CodeQL)
          이 저장소는 **CodeQL Advanced SecureScan** 워크플로우를 통해 보안 취약점을 상시 스캔합니다.
          
          ## ⏰ 최종 업데이트
          **날짜:** $(date '+%Y-%m-%d %H:%M:%S KST')
          **커밋 SHA:** ${{ github.sha }}
          
          ---
          
          ## Dependabot 설정
          종속성 업데이트는 Dependabot에 의해 관리됩니다.
          """
          # 워크플로우 출력을 사용하여 콘텐츠를 다음 단계에 전달
          echo "content<<EOF" >> $GITHUB_OUTPUT
          echo "$README_CONTENT" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Overwrite README.md
        shell: bash
        # 이전 단계에서 생성한 콘텐츠로 README.md 파일 덮어쓰기
        run: echo "${{ steps.readme_content.outputs.content }}" > README.md

      - name: Commit and Push Changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          # 변경된 파일(README.md)만 커밋합니다.
          commit_message: "docs(readme): Update dynamic content via GitHub Actions"
          # 만약 변경 사항이 없으면 실패하지 않고 건너뜁니다.
          skip_dirty_check: false
          # 이 워크플로우 실행을 유발한 커밋을 무시하고 새로운 커밋을 생성합니다.
          commit_options: '--no-verify --allow-empty'
