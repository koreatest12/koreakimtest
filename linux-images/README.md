# Linux Image Automation Workspace

이 디렉터리는 `docs/LINUX_IMAGE_AUTOMATION_WORKFLOW.md` 문서에 정의된 구조를 코드로 옮긴 것으로,
우분투/레드햇/칼리 이미지를 자동으로 생성하고 ISO, QCOW2 디스크, 메타데이터를 수집하는 데 필요한
리소스를 위한 표준 위치를 제공합니다.

- `packer/<os>/` : 각 배포판 별 Packer 템플릿과 자동 응답 파일을 둡니다.
- `ansible/roles/common-services/` : 공통 서비스 설치 롤과 태스크를 둡니다.
- `artifacts/iso`, `artifacts/disks` : CI 실행 결과물(ISO, QCOW2, manifest 등)을 저장합니다.
- `logs/` : 다운로드/검증 기록을 남기는 위치입니다.
- `config/directories.txt` : 대량 디렉터리 생성을 위한 입력 목록입니다.

실제 빌드 명령은 `scripts/linux_image_workflow.sh`와 GitHub Actions 워크플로우
`.github/workflows/linux-image-factory.yml`에서 호출됩니다.
