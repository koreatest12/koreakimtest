# 레드햇/우분투 서버 설치 및 정보 수집 워크플로우

다음 워크플로우는 레드햇 엔터프라이즈 리눅스(RHEL)과 우분투 서버 환경을 구축하고, 필수 디렉토리를 생성하며, 정식 이미지를 사용해 빌드 및 정보 수집 서버를 구성하기 위한 단계별 안내서입니다.

## 1. 공통 사전 준비
1. **하드웨어 및 가상화 플랫폼 결정**: Bare metal, KVM/Libvirt, VMware, Hyper-V, 클라우드 인스턴스 중 선택합니다.
2. **네트워크 계획 수립**: 관리용 VLAN, 서비스 VLAN, 보안 그룹/방화벽 정책 정의.
3. **공유 아티팩트 저장소 준비**: ISO/이미지, Kickstart/Cloud-Init, 설정 스크립트를 저장할 Git 저장소와 오브젝트 스토리지(S3, NFS 등) 확보.
4. **관리 노드 준비**: Ansible, Terraform, Packer 등 자동화 도구를 사용할 관리용 리눅스 노드를 마련합니다.

## 2. 공식 이미지 다운로드 경로
- **RHEL**: [https://access.redhat.com/downloads](https://access.redhat.com/downloads)
  - 고객 포털 계정이 필요하며, ISO 또는 클라우드 이미지(AMI/VHD/VMDK)를 선택합니다.
- **Ubuntu Server**: [https://ubuntu.com/download/server](https://ubuntu.com/download/server)
  - LTS 버전 ISO, Live Server ISO, 또는 [https://cloud-images.ubuntu.com/](https://cloud-images.ubuntu.com/)에서 클라우드 이미지를 가져올 수 있습니다.

## 3. RHEL 설치 및 업데이트 워크플로우
1. **ISO/이미지 확보**: 고객 포털에서 원하는 버전의 RHEL ISO(예: rhel-9.x-x86_64-dvd.iso)를 다운로드합니다.
2. **부팅 및 설치**: 
   - 물리/가상 머신에 ISO를 마운트 후 Anaconda 설치 진행.
   - Kickstart 자동 설치가 필요한 경우 `ks.cfg`에 파티션/네트워크/패키지 구성을 정의하고, `inst.ks=` 커널 파라미터로 전달합니다.
3. **필수 디렉토리 생성**: 설치 직후 다음과 같은 표준 디렉토리를 구성합니다.
   ```bash
   sudo mkdir -p /srv/{apps,backup,logs} /data/{raw,archive}
   sudo chown -R root:root /srv /data
   ```
4. **시스템 업데이트**:
   ```bash
   sudo subscription-manager register --username <ACCOUNT> --password <PASSWORD>
   sudo subscription-manager attach --auto
   sudo dnf update -y
   ```
5. **이미지 빌드**:
   - **Packer** 예시: `packer build -var 'iso_url=<RHEL_ISO_URL>' rhel.pkr.hcl`
   - **virt-install**를 이용한 템플릿 생성: 설치 완료 후 `virt-sysprep` + `virt-sparsify`로 골든 이미지를 만들고 Glance/VM 템플릿에 업로드합니다.
6. **정보 수집 서버 세팅**:
   - `sosreport`, `insights-client`, `subscription-manager facts`를 통해 시스템 정보를 수집.
   - Log forwarding: `rsyslog` 또는 `systemd-journal-remote`를 이용해 중앙 로그 서버로 전송.

## 4. Ubuntu 설치 및 업데이트 워크플로우
1. **ISO/이미지 확보**: LTS Live Server ISO 또는 `cloud-images.ubuntu.com`에서 원하는 버전을 다운로드합니다.
2. **부팅 및 설치**:
   - Subiquity 설치 마법사 또는 자동 설치용 `autoinstall` Cloud-Init 파일(`user-data`, `meta-data`)을 준비합니다.
3. **필수 디렉토리 생성**:
   ```bash
   sudo mkdir -p /srv/{apps,backup,logs} /var/opt/ingest /data/{raw,archive}
   sudo chown -R root:root /srv /data
   ```
4. **시스템 업데이트**:
   ```bash
   sudo apt update
   sudo apt full-upgrade -y
   sudo apt install -y ubuntu-advantage-tools
   sudo ua attach <TOKEN>   # 필요 시 Pro 구독 연결
   ```
5. **이미지 빌드**:
   - **Cloud Image 커스터마이즈**: `cloud-localds seed.img user-data meta-data`로 초기화 후 `virt-install`.
   - **Packer**: `packer build -var 'iso_url=<UBUNTU_ISO_URL>' ubuntu.pkr.hcl`.
   - **LXD**: `lxc image import`로 템플릿 관리.
6. **정보 수집 서버 세팅**:
   - `landscape-client` 또는 `canonical-livepatch`로 인벤토리 및 업데이트 상태 관리.
   - `journalbeat`/`filebeat`로 Elastic Stack에 로그 전송.

## 5. 공통 자동화 및 모니터링
1. **구성 관리**: Ansible 플레이북 또는 Puppet/Chef로 사용자, 패키지, 서비스 상태를 선언적으로 관리합니다.
2. **CI/CD 통합**: GitHub Actions, GitLab CI, Jenkins 등으로 이미지 빌드/테스트 파이프라인을 생성하고, Packer + Ansible을 묶어 Golden Image를 주기적으로 갱신합니다.
3. **보안 업데이트 파이프라인**: `dnf-automatic`, `unattended-upgrades`를 활성화하고, CVE 피드/보안 대시보드를 운영합니다.
4. **모니터링/정보 수집**:
   - 메트릭: Prometheus Node Exporter, Red Hat Insights, Canonical Landscape.
   - 로그: 중앙 syslog, ELK/EFK, OpenSearch.
   - 자산 관리: CMDB(예: NetBox)와 연동하여 서버 메타데이터를 자동으로 업데이트합니다.

## 6. 디렉토리 및 스토리지 정책
| 디렉토리 | 용도 | 백업 주기 |
|----------|------|-----------|
| `/srv/apps` | 애플리케이션 배포 | 일일 스냅샷 |
| `/srv/logs` | 서비스 로그 | 중앙 로그 서버로 스트리밍 + 7일 로컬 보관 |
| `/srv/backup` | 구성 백업/스냅샷 | 주간 풀, 일간 증분 |
| `/data/raw` | 원본 데이터 적재 | 업무 요구에 따라 별도 정책 |
| `/data/archive` | 장기 보관 | 월간 풀 백업 + 오프사이트 |

## 7. 네트워크 및 보안 점검 체크리스트
- SSH 키 기반 인증 + `sshd_config` 강화 (PermitRootLogin prohibit-password 등).
- SELinux(RHEL) Enforcing, AppArmor/SELinux(Ubuntu) 정책 검토.
- 방화벽: `firewalld`(RHEL) 또는 `ufw`/`nftables`(Ubuntu) 기본 정책 설정.
- 정기 취약점 스캔과 CIS Benchmarks 자동 검사(OpenSCAP, Lynis).

## 8. 정보 수집/감사 로그 보존 전략
1. **중앙 수집 서버 구축**: syslog-ng/rsyslog/Fluent Bit를 설치해 `/srv/logs` -> 중앙 서버로 전송.
2. **지표 대시보드**: Grafana/Red Hat Insights/Ubuntu Landscape에서 CPU/메모리/패키지 상태 시각화.
3. **감사(Auditd)**: `auditd` 규칙을 활성화하고, 레드햇/우분투 모두 `/var/log/audit/audit.log`를 중앙으로 집계.

## 9. 운영 워크플로우 예시
1. Git 저장소에 Kickstart/Autoinstall/Ansible 코드를 커밋.
2. CI 파이프라인이 최신 ISO URL을 확인해 Packer 빌드 실행.
3. 빌드된 이미지를 Glance(오픈스택)나 vCenter 템플릿 저장소에 업로드.
4. Terraform/Ansible로 서버를 배포하고, 초기 부팅 시 디렉토리 생성 및 정보 수집 에이전트 설치.
5. 모니터링 및 로그 서버가 신규 노드를 자동 등록하고, CMDB 업데이트.
6. 정기적으로 `dnf update`/`apt upgrade`와 이미지 재빌드를 수행하여 보안 패치를 반영합니다.

이 워크플로우를 적용하면 레드햇과 우분투 서버 환경을 표준화하고, 공식 이미지 소스를 기반으로 신뢰할 수 있는 빌드/정보 수집 파이프라인을 운영할 수 있습니다.

## 10. 단계별 통합 워크플로우 (Flow)

```text
[요구사항 정의]
     │
     ▼
[공식 ISO/이미지 수집]
     │  ├─ RHEL: access.redhat.com/downloads
     │  └─ Ubuntu: ubuntu.com/download/server
     ▼
[자동 설치 파일 준비]
     │  ├─ Kickstart (RHEL)
     │  └─ Autoinstall/Cloud-Init (Ubuntu)
     ▼
[Packer/virt-install 빌드 단계]
     │  ├─ OS 설치 및 기본 패키지 구성
     │  └─ /srv, /data 디렉토리 생성
     ▼
[CI 파이프라인 테스트]
     │  ├─ Ansible Lint / ShellCheck
     │  └─ VM 부팅 검증, 보안 스캔(OpenSCAP, Lynis)
     ▼
[템플릿/이미지 저장소 배포]
     │  ├─ Glance, vCenter, Proxmox, LXD
     │  └─ 버전 태깅 (예: rhel-9.2-20240201)
     ▼
[프로비저닝 자동화]
     │  ├─ Terraform으로 인프라 생성
     │  └─ Ansible로 서비스/계정/에이전트 설정
     ▼
[정보 수집 및 모니터링]
     │  ├─ sosreport/landscape-client 수집
     │  └─ Prometheus, ELK/EFK, CMDB 업데이트
     ▼
[운영/보안 업데이트]
     │  ├─ dnf update / apt full-upgrade
     │  └─ 정기 이미지 재빌드 + 감사 로그 검토
     ▼
[개선 사항 피드백 반영]
```

위 Flow를 바탕으로, 요구사항이 들어오면 공식 이미지 확보 → 자동화 스크립트 준비 → CI 검증 → 템플릿 배포 → 서버 운영까지의 경로가 명확해집니다. 조직별 필요 사항(예: 특정 백업 소프트웨어, 보안 에이전트 등)은 각 단계의 `Ansible Role` 또는 `Terraform module`에 추가하면 됩니다.
