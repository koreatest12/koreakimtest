# 리눅스 통합 이미지/ISO 생성 워크플로우

## 개요
본 문서는 우분투, 레드햇, 칼리 리눅스 배포판을 대상으로 **이미지 다운로드 → 커스터마이징 → ISO/디스크 생성 → 대량 디렉터리 구성 → 서비스 기본 설치** 흐름을 표준화하기 위한 절차를 정의합니다. 모든 단계는 자동화를 전제로 하며, Git 기반으로 이력을 추적하고 CI 파이프라인으로 상시 실행합니다.

## 1. 공통 준비
1. **관리 권한**: 빌드 호스트는 `sudo`/root 권한을 가진 CI Runner(예: GitHub Actions self-hosted, GitLab Runner)이어야 하며, 가상화 기능(KVM)과 100GB 이상의 여유 디스크를 확보합니다.
2. **도구 세트**:
   - HashiCorp Packer ≥ 1.9
   - QEMU/KVM, `virt-install`, `qemu-img`
   - `xorriso` (ISO 작성), `isohybrid` (BIOS/UEFI 겸용)
   - `ansible` 또는 `cloud-init` 스크립트
   - 해시 검증 도구: `sha256sum`, `gpg`
3. **보안 정책**: 공용 네트워크에서 이미지 다운로드 시 프록시/미러를 명시하고, 해시·서명 검증 로그를 남깁니다.

## 2. 디렉터리 및 저장소 구조
```
linux-images/
├── packer/
│   ├── ubuntu/
│   ├── rhel/
│   └── kali/
├── ansible/
│   ├── roles/common-services/
│   └── group_vars/
├── artifacts/
│   ├── iso/
│   └── disks/
├── workspaces/
│   └── <os>/<relative-paths>
└── ci/
    └── workflows/
```
- `artifacts` 디렉터리는 CI 단계에서 날짜/빌드 번호로 자동 생성합니다. (`artifacts/iso/2024-04-15/ubuntu-server.iso` 등)
- 메타데이터(`artifacts/manifest.json`)에 OS, 커널, 커밋 해시, SHA-256을 기록합니다.
- `workspaces/`는 `config/directories.txt`에 정의된 대량 디렉터리 템플릿을 OS별로 풀어놓은 결과가 들어가는 위치이며, `logs/directories-*.md`에 생성 결과가 요약됩니다.

## 3. 원본 이미지 다운로드 및 검증
1. **우분투**: [releases.ubuntu.com](https://releases.ubuntu.com)에서 LTS 서버 ISO를 `wget` 후 `SHA256SUMS`와 GPG 서명으로 검증합니다.
2. **레드햇**: 고객 포털에서 RHEL ISO를 `curl --remote-name`으로 내려받고, Red Hat GPG key로 서명 확인합니다.
3. **칼리**: [cdimage.kali.org](https://cdimage.kali.org)에서 최신 ISO/NetInstaller를 `aria2c`로 병렬 다운로드하고, `kali-rolling` 서명키로 검증합니다.
4. 검증 결과를 `logs/download-YYYYMMDD.md`에 기록합니다.

## 4. 공통 커스터마이징 절차
1. **Packer 템플릿**: 배포판별 `template.pkr.hcl`에서 공통 변수를 모듈화합니다.
   - 예) `variables.pkr.hcl`에 `vm_name`, `iso_url`, `kickstart_file` 정의.
2. **자동 응답 파일**:
   - Ubuntu: `autoinstall.yaml`
   - RHEL: `kickstart.cfg`
   - Kali: `preseed.cfg`
3. **서비스 및 패키지 세트**:
   - 공통: `openssh-server`, `fail2ban`, `auditd`, `chrony`, `python3`, `git`
   - 우분투: `ufw`, `snapd`
   - 레드햇: `firewalld`, `subscription-manager`
   - 칼리: `kali-linux-large`, `metasploit-framework`
4. **권한 구성**:
   - 초기 관리자 계정 `devops`를 생성하고 `NOPASSWD:ALL` 권한을 부여하되, CI 마지막 단계에서 `sudoers.d/devops` 파일을 `0440`으로 설정합니다.
   - SSH 공개키를 `cloud-init`로 삽입하고, 암호 로그인은 비활성화합니다.
5. **대량 디렉터리 생성**: `ansible` 플레이북에서 다음과 같이 실행합니다.
   ```yaml
   - name: create app directories
     file:
       path: "/srv/apps/{{ item }}"
       state: directory
       owner: root
       group: root
       mode: '0750'
     loop: "{{ lookup('file', 'config/directories.txt').splitlines() }}"
   ```
   - `directories.txt`에는 프로젝트 코드, 환경(prod/stage/dev)을 조합해 최대 수백 개까지 정의할 수 있습니다.
6. **CI 디렉터리 팩토리 연동**: `scripts/linux_image_workflow.sh`는 동일한 `directories.txt`를 사용해 `linux-images/workspaces/<os>/...` 구조를 한 번에 생성하고, `logs/directories-YYYYMMDDHHMMSS.md` 파일에 실제로 확장된 경로를 기록합니다. GitHub Actions 상시 워크플로우가 매 실행 시 해당 디렉터리 팩토리를 구동하여 “추가 대량 생성” 요구사항을 충족합니다.

## 5. ISO 재생성 워크플로우
1. Packer 빌드 후 `build/iso-root/`에 생성된 파일 시스템을 `xorriso`로 새 ISO로 패키징합니다.
2. EFI 및 BIOS 겸용을 위해 `isohybrid --uefi`를 적용하고, `implantisomd5`로 무결성 서명을 추가합니다.
3. `artifact_manifest.json`에 ISO 파일 크기, 해시, 생성 시간을 기록하고 Git LFS 혹은 외부 오브젝트 스토리지(S3 등)에 업로드합니다.
4. CI 파이프라인은 cron trigger (`workflow_dispatch` + schedule)를 활용해 **주간/월간 상시 빌드**를 수행합니다.

## 6. 가상 디스크 이미지(QCOW2/RAW) 생성
1. `packer build` 결과를 `qemu-img convert`로 변환합니다.
   ```bash
   qemu-img convert -O qcow2 output/ubuntu/packer-ubuntu qemu/ubuntu-server.qcow2
   qemu-img resize qemu/ubuntu-server.qcow2 80G
   ```
2. RHEL/Kali 역시 동일하게 처리하되, 클라우드 배포를 위한 `cloud-init` seed ISO를 함께 생성합니다.
3. 디스크 이미지별로 `virt-sysprep`을 실행해 호스트 키/로그를 제거하고, 재배포 시 충돌을 방지합니다.

## 7. 서비스 설치 및 검증 단계
1. `ansible-playbook site.yml -l ubuntu` 형태로 OS별 태그를 사용해 공통 서비스 설치를 실행합니다.
2. 서비스 목록 예시:
   - 보안: `selinux` 정책(Enforcing/RHEL), `apparmor`(Ubuntu/Kali)
   - 모니터링: `node-exporter`, `journalbeat`
   - 네트워크: `nginx`, `haproxy`, `isc-dhcp-server` (필요 시)
3. 설치가 완료되면 `molecule` 또는 `testinfra` 테스트로 포트, 서비스 상태, 파일 권한을 검증하고 결과를 CI 아티팩트로 보관합니다.

## 8. CI/CD 상시 실행 템플릿
- GitHub Actions 구현 (`.github/workflows/linux-image-factory.yml`):
  ```yaml
  name: Linux Image Factory
  on:
    workflow_dispatch:
    schedule:
      - cron: '0 2 * * 1'
  jobs:
    scaffold-images:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Run Linux image workflow scaffold
          run: bash scripts/linux_image_workflow.sh
        - name: Upload artifacts
          uses: actions/upload-artifact@v4
          with:
            name: linux-image-workflow-${{ github.run_id }}
            path: |
              linux-images/artifacts
              linux-images/logs
  ```
- 실패 시 Slack/Webhook 알림을 발송하고, ISO/디스크 해시는 `attestations/` 디렉터리에 기록합니다.
- 스크립트 구현은 `scripts/linux_image_workflow.sh`에 있으며, CI에서 동일한 스크립트를 호출해 구조를 검증하고 메타데이터
  아티팩트를 생성합니다.

## 9. 운영 및 권한 관리
1. CI Runner의 `vault` 혹은 `pass` 스토어에서 레드햇 서브스크립션, 내부 미러 자격 증명을 주입합니다.
2. 결과 이미지를 배포할 vSphere/OpenStack/Proxmox에 대해 RBAC 계정을 생성하고, 업로드 스크립트에서 토큰을 사용합니다.
3. 모든 로그(빌드, 다운로드, 테스트)는 90일 이상 보관하며, 민감정보는 암호화된 로그 저장소에 별도 관리합니다.

## 10. 유지보수 체크리스트
- 월 1회: 각 배포판의 보안 공지(USN, RHSA, Kali Security)를 확인하고 패키지 목록을 갱신합니다.
- 분기 1회: Packer/Ansible 버전을 최신으로 업데이트하고, CI Runner OS 패치를 적용합니다.
- 빌드 실패/성공률, 평균 소요시간, 아티팩트 용량을 대시보드(Grafana 등)로 시각화하여 용량 계획에 활용합니다.

> ✅ 위 절차를 통해 OS별 이미지 생성부터 ISO·디스크 제공, 대량 디렉터리 준비 및 서비스 설치까지 일관된 자동화 워크플로우를 상시 운용할 수 있습니다.
