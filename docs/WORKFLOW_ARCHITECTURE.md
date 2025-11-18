# Dependency Security Check - Workflow Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY SECURITY CHECK WORKFLOW                    │
│                           (dependency-check.yml)                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              TRIGGER EVENTS                              │
├─────────────────────────────────────────────────────────────────────────┤
│  • Schedule: Weekly (Monday 03:00 UTC)                                  │
│  • Pull Request: On dependency file changes                             │
│  • Push: To main branch with dependency changes                         │
│  • Workflow Dispatch: Manual trigger with options                       │
│    - provision_infrastructure (boolean)                                 │
│    - create_branches (boolean)                                          │
│    - deploy_services (boolean)                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              WORKFLOW JOBS                               │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│ 1. INFRASTRUCTURE PROVISIONING│
├──────────────────────────────┤
│ Trigger: workflow_dispatch    │
│ Condition: provision=true     │
│                              │
│ Steps:                       │
│ • Create directory structure │
│ • Generate service configs   │
│ • Setup virtual environments │
│ • Install Node.js 20.x       │
│ • Install Python 3.11        │
│ • Install Java 17            │
│ • Generate SSL certificates  │
│ • Pull Docker base images    │
│ • Upload artifacts           │
│                              │
│ Output: provision_status     │
└──────────────────────────────┘
            │
            ├───────────────────────────────┐
            │                               │
            ▼                               ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ 2. BRANCH MANAGEMENT         │  │ 3. NODE.JS SECURITY          │
├──────────────────────────────┤  ├──────────────────────────────┤
│ Trigger: workflow_dispatch   │  │ Trigger: all events          │
│ Condition: create_branches   │  │ Matrix: 3 projects           │
│                              │  │                              │
│ Steps:                       │  │ Steps:                       │
│ • Configure Git              │  │ • Check package.json exists  │
│ • Create feature branches:   │  │ • Setup Node.js 20           │
│   - nodejs-{timestamp}       │  │ • Install dependencies       │
│   - python-{timestamp}       │  │ • Run npm audit              │
│   - java-{timestamp}         │  │ • Count vulnerabilities      │
│   - security-updates-{ts}    │  │ • Upload audit artifacts     │
│ • Push branches to remote    │  │                              │
│ • Generate branch report     │  │ Artifacts:                   │
│                              │  │ • npm-audit-{run}-{project}  │
│ Artifacts:                   │  └──────────────────────────────┘
│ • branch-management-{run}    │              │
└──────────────────────────────┘              │
            │                                 │
            │                                 ▼
            │                  ┌──────────────────────────────┐
            │                  │ 4. PYTHON SECURITY           │
            │                  ├──────────────────────────────┤
            │                  │ Trigger: all events          │
            │                  │ Matrix: 5 projects           │
            │                  │                              │
            │                  │ Steps:                       │
            │                  │ • Check requirements.txt     │
            │                  │ • Setup Python 3.11          │
            │                  │ • Install security tools:    │
            │                  │   - pip-audit                │
            │                  │   - safety                   │
            │                  │   - bandit                   │
            │                  │ • Run all security scans     │
            │                  │ • Upload audit artifacts     │
            │                  │                              │
            │                  │ Artifacts:                   │
            │                  │ • python-audit-{run}-{proj}  │
            │                  └──────────────────────────────┘
            │                              │
            │                              ▼
            │                  ┌──────────────────────────────┐
            │                  │ 5. DEPENDENCY REVIEW         │
            │                  ├──────────────────────────────┤
            │                  │ Trigger: pull_request only   │
            │                  │                              │
            │                  │ Steps:                       │
            │                  │ • Run GitHub dependency      │
            │                  │   review action              │
            │                  │ • Fail on moderate+ severity │
            │                  │ • Comment in PR on failure   │
            │                  └──────────────────────────────┘
            │                              │
            ▼                              ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ 6. DEPLOY SERVICES           │  │ 7. CREATE ISSUE ON FAILURE   │
├──────────────────────────────┤  ├──────────────────────────────┤
│ Trigger: workflow_dispatch   │  │ Trigger: schedule only       │
│ Needs: provisioning success  │  │ Condition: job failures      │
│ Condition: deploy=true       │  │                              │
│                              │  │ Steps:                       │
│ Steps:                       │  │ • Check for existing issues  │
│ • Download artifacts         │  │ • Create issue if none found │
│ • Setup Docker environment   │  │ • Include run details link   │
│ • Build service images:      │  │ • Add labels:                │
│   - Node.js (port 3000)      │  │   - security                 │
│   - Python (port 8000)       │  │   - dependency-check         │
│   - Java (port 8080)         │  │   - automated                │
│ • Deploy with docker-compose │  └──────────────────────────────┘
│ • Run health checks          │              │
│ • Test endpoints             │              │
│ • Generate deployment report │              │
│ • Cleanup containers         │              │
│                              │              │
│ Artifacts:                   │              │
│ • service-deployment-{run}   │              │
└──────────────────────────────┘              │
            │                                 │
            ▼                                 │
┌──────────────────────────────┐              │
│ 8. RESOURCE MANAGEMENT       │              │
├──────────────────────────────┤              │
│ Trigger: workflow_dispatch   │              │
│                              │              │
│ Steps:                       │              │
│ • Monitor system resources   │              │
│ • Check Docker usage         │              │
│ • Generate allocation plan   │              │
│ • Estimate costs             │              │
│                              │              │
│ Artifacts:                   │              │
│ • resource-management-{run}  │              │
└──────────────────────────────┘              │
            │                                 │
            └─────────────────┬───────────────┘
                              │
                              ▼
            ┌──────────────────────────────┐
            │ 9. FINAL SUMMARY             │
            ├──────────────────────────────┤
            │ Trigger: always              │
            │ Needs: all other jobs        │
            │                              │
            │ Steps:                       │
            │ • Collect job results        │
            │ • Generate summary report    │
            │ • List all artifacts         │
            │ • Post to step summary       │
            │                              │
            │ Artifacts:                   │
            │ • final-summary-{run}        │
            └──────────────────────────────┘
```

## Job Dependencies

```
infrastructure-provisioning (optional)
    ├─> branch-management (optional)
    └─> deploy-services (optional, requires provisioning success)

node-security (always runs)
    └─> create-issue-on-weekly-failure (schedule only)

python-security (always runs)
    └─> create-issue-on-weekly-failure (schedule only)

dependency-review (PR only)

resource-management (optional)

final-summary (always runs, waits for all)
```

## Conditional Execution Matrix

| Job | Trigger Type | Additional Conditions |
|-----|--------------|----------------------|
| infrastructure-provisioning | workflow_dispatch | inputs.provision_infrastructure == true |
| branch-management | workflow_dispatch | inputs.create_branches == true |
| node-security | all | none |
| python-security | all | none |
| dependency-review | pull_request | none |
| create-issue-on-weekly-failure | schedule | failure() of security jobs |
| deploy-services | workflow_dispatch | inputs.deploy_services == true AND provisioning success |
| resource-management | workflow_dispatch | none |
| final-summary | all | always() |

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        ARTIFACTS FLOW                             │
└──────────────────────────────────────────────────────────────────┘

infrastructure-provisioning
    │
    ├─> .github/services/         (service files)
    ├─> .github/resources/        (templates, scripts)
    ├─> .github/virtual-servers/  (server configs)
    └─> provision-summary.txt
            │
            ▼
        [upload-artifact]
            │
            ▼
        deploy-services
            │
            ├─> [download-artifact]
            ├─> Build Docker images
            ├─> Deploy with docker-compose
            └─> Generate deployment report
                    │
                    ▼
                [upload-artifact]

node-security (matrix: 3 projects)
    └─> audit.json per project → [upload-artifact]

python-security (matrix: 5 projects)
    └─> pip-audit.json, safety.json, bandit.json → [upload-artifact]

resource-management
    └─> resource-report.txt, resource-allocation.json → [upload-artifact]

final-summary
    └─> Aggregates all results → [upload-artifact] (90 days)
```

## Environment Variables

```yaml
TZ: Asia/Seoul                          # Timezone
REPORT_DIR: .github/sec_report          # Main report directory
LOG_DIR: .github/sec_report/logs        # Log files
ARTIFACT_DIR: .github/sec_report/artifacts  # Artifacts
SERVICE_DIR: .github/services           # Service files
RESOURCE_DIR: .github/resources         # Resource templates
BRANCH_PREFIX: security-update          # Branch naming prefix
```

## Directory Structure Created

```
.github/
├── sec_report/
│   ├── logs/
│   ├── artifacts/
│   └── helpers.sh
├── services/
│   ├── nodejs/
│   │   ├── bin/
│   │   ├── lib/
│   │   ├── config/
│   │   ├── data/
│   │   ├── logs/
│   │   └── server.js
│   ├── python/
│   │   ├── bin/
│   │   ├── lib/
│   │   ├── config/
│   │   ├── data/
│   │   ├── logs/
│   │   └── server.py
│   ├── java/
│   │   ├── bin/
│   │   ├── lib/
│   │   ├── config/
│   │   ├── data/
│   │   ├── logs/
│   │   └── Server.java
│   ├── services.json
│   └── deployment-manifest.yml
├── resources/
│   ├── templates/
│   │   ├── Dockerfile.nodejs
│   │   ├── Dockerfile.python
│   │   ├── Dockerfile.java
│   │   └── docker-compose.yml
│   ├── scripts/
│   │   ├── deploy.sh
│   │   └── rollback.sh
│   ├── keys/
│   └── certificates/
│       ├── server.key
│       └── server.crt
├── virtual-servers/
│   └── servers.json
├── deployments/
├── configs/
└── branches/
```

## Service Ports & Endpoints

| Service | Port | Health Endpoint | Purpose |
|---------|------|----------------|---------|
| Node.js | 3000 | / | Security check service |
| Python | 8000 | / | Security check service |
| Java | 8080 | /health | Security check service |

## Artifact Retention

| Artifact Pattern | Retention | Purpose |
|-----------------|-----------|---------|
| infrastructure-provisioning-* | 30 days | Service configs and setup |
| branch-management-* | 30 days | Branch creation reports |
| npm-audit-* | 30 days | Node.js vulnerabilities |
| python-audit-* | 30 days | Python vulnerabilities |
| service-deployment-* | 30 days | Deployment logs |
| resource-management-* | 30 days | Resource monitoring |
| final-summary-* | 90 days | Complete execution report |

## Security Considerations

1. **Permissions Required**:
   - contents: write (for branch creation)
   - pull-requests: write (for PR comments)
   - security-events: read (for security scanning)
   - id-token: write (for authentication)
   - packages: write (for container registry)

2. **Secrets Used**:
   - GITHUB_TOKEN (automatically provided)

3. **Local vs Production**:
   - SSL certificates: self-signed (testing only)
   - Docker images: built locally (not pushed)
   - Services: cleaned up after testing

## Performance Metrics

| Aspect | Estimate |
|--------|----------|
| Full workflow run (all jobs) | ~30-45 minutes |
| Security audit only | ~10-15 minutes |
| Infrastructure provisioning | ~15-20 minutes |
| Service deployment | ~5-10 minutes |
| Maximum parallel jobs | 5 |

## Troubleshooting Guide

### Common Issues

1. **Infrastructure provisioning fails**
   - Check runner has sudo access
   - Verify package manager access
   - Check disk space availability

2. **Service deployment fails**
   - Ensure provisioning completed successfully
   - Check Docker is available
   - Verify artifact download succeeded

3. **Branch creation fails**
   - Check contents: write permission
   - Verify branches don't already exist
   - Check Git configuration

4. **Security audits find critical issues**
   - This is expected behavior
   - Review artifact reports
   - Update dependencies promptly

## Extension Points

### Adding New Services

1. Add to matrix in infrastructure-provisioning job
2. Create service directory structure
3. Add Dockerfile template
4. Add to docker-compose.yml
5. Update documentation

### Adding New Security Tools

1. Install tool in appropriate security job
2. Run scan and save output
3. Add to artifact upload
4. Update final summary logic

### Custom Resource Monitoring

1. Add steps to resource-management job
2. Generate custom reports
3. Include in artifact upload
4. Document new metrics

## Related Documentation

- [Full Workflow Guide](./DEPENDENCY_CHECK_WORKFLOW.md)
- [Quick Start Guide](./DEPENDENCY_CHECK_QUICK_START.md)
- [Main README](../README.md)
- [Security Policy](../SECURITY.md)
