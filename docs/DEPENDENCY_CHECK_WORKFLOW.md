# Dependency Security Check Workflow

## Overview

The Dependency Security Check workflow is a comprehensive automated security and infrastructure management system that provides:

- **Automated Security Audits**: Scans Node.js and Python dependencies for vulnerabilities
- **Infrastructure Provisioning**: Sets up complete service stacks (Node.js, Python, Java)
- **Branch Management**: Auto-creates feature branches for security updates
- **Service Deployment**: Deploys and tests services using Docker
- **Resource Management**: Monitors and reports system resource usage

## Workflow Triggers

### Automatic Triggers

1. **Scheduled Weekly Scan**: Every Monday at 03:00 UTC
2. **Pull Request**: When dependency files are modified
3. **Push to Main**: When dependency files are pushed to main branch

### Manual Triggers (workflow_dispatch)

Use the "Actions" tab in GitHub to manually trigger the workflow with these options:

- **provision_infrastructure**: Set to `true` to provision full infrastructure stack
- **create_branches**: Set to `true` to auto-create feature branches
- **deploy_services**: Set to `true` to deploy services after checks

## Jobs Description

### 1. Infrastructure Provisioning

**When**: Manual trigger with `provision_infrastructure = true`

**What it does**:
- Creates comprehensive directory structure
- Downloads/generates service configuration files
- Installs Node.js, Python, and Java service stacks
- Sets up virtual server environments
- Generates SSL certificates
- Creates Docker images and templates

**Artifacts Generated**:
- `infrastructure-provisioning-{run_number}`: Contains all provisioned resources

### 2. Branch Management

**When**: Manual trigger with `create_branches = true`

**What it does**:
- Creates timestamped feature branches for each service type
- Branch naming: `security-update/{service}-{timestamp}`
- Services: nodejs, python, java, security-updates

**Artifacts Generated**:
- `branch-management-{run_number}`: Branch creation report

### 3. Node.js Security Check

**When**: All workflow triggers

**What it does**:
- Scans Node.js projects: `anthropic-cost-tracker/nodejs`, `mcp-hello-js`, `mcp-fs`
- Runs `npm audit` with vulnerability severity tracking
- Reports high and critical vulnerabilities

**Artifacts Generated**:
- `npm-audit-{run_number}-{project}`: Detailed audit JSON reports

### 4. Python Security Check

**When**: All workflow triggers

**What it does**:
- Scans Python projects: `anthropic-cost-tracker/python`, `mcp-hello-py`, `mcp-python-server`, `mcp-apache-server`, root directory
- Runs `pip-audit`, `safety check`, and `bandit` security tools
- Reports vulnerabilities and security issues

**Artifacts Generated**:
- `python-audit-{run_number}-{project}`: pip-audit, safety, and bandit reports

### 5. Dependency Review

**When**: Pull requests only

**What it does**:
- Uses GitHub's dependency review action
- Fails on moderate or higher severity vulnerabilities
- Posts comments in PR when vulnerabilities found

### 6. Service Deployment

**When**: Manual trigger with `deploy_services = true` AND infrastructure provisioning succeeds

**What it does**:
- Builds Docker images for Node.js, Python, and Java services
- Deploys services using docker-compose
- Runs health checks on deployed services
- Tests service endpoints
- Generates deployment reports

**Artifacts Generated**:
- `service-deployment-{run_number}`: Deployment logs and docker-compose configuration

### 7. Resource Management

**When**: Manual trigger (workflow_dispatch)

**What it does**:
- Monitors system CPU, memory, disk usage
- Checks Docker resource usage
- Generates resource allocation plan
- Estimates infrastructure costs

**Artifacts Generated**:
- `resource-management-{run_number}`: Resource reports and allocation plans

### 8. Create Issue on Weekly Failure

**When**: Scheduled runs that fail

**What it does**:
- Creates GitHub issue for failed security checks
- Labels: `security`, `dependency-check`, `automated`
- Avoids duplicate issues

### 9. Final Summary

**When**: Always runs at the end

**What it does**:
- Aggregates results from all jobs
- Generates comprehensive summary report
- Posts summary to workflow job output

**Artifacts Generated**:
- `final-summary-{run_number}`: Complete workflow execution report

## Usage Examples

### Example 1: Full Infrastructure Setup and Deployment

1. Go to Actions tab
2. Select "Dependency Security Check"
3. Click "Run workflow"
4. Set inputs:
   - `provision_infrastructure`: ✓ true
   - `create_branches`: ✓ true  
   - `deploy_services`: ✓ true
5. Click "Run workflow"

This will:
- Provision all services
- Create feature branches
- Run security audits
- Deploy services
- Generate comprehensive reports

### Example 2: Security Audit Only

Just wait for scheduled run or push dependency changes to trigger automatic security audits.

### Example 3: Branch Creation for Security Updates

1. Go to Actions tab
2. Select "Dependency Security Check"
3. Click "Run workflow"
4. Set inputs:
   - `create_branches`: ✓ true
5. Click "Run workflow"

## Artifacts Reference

All artifacts are retained for 30-90 days and can be downloaded from the workflow run page.

| Artifact Name | Contents | Retention |
|--------------|----------|-----------|
| `infrastructure-provisioning-*` | Service configs, Dockerfiles, scripts, certificates | 30 days |
| `branch-management-*` | Branch creation reports | 30 days |
| `npm-audit-*` | Node.js vulnerability reports (JSON) | 30 days |
| `python-audit-*` | Python security scan results | 30 days |
| `service-deployment-*` | Deployment logs and configs | 30 days |
| `resource-management-*` | Resource monitoring reports | 30 days |
| `final-summary-*` | Complete workflow summary | 90 days |

## Directory Structure Created

When infrastructure provisioning runs, it creates:

```
.github/
├── sec_report/
│   ├── logs/          # Execution logs
│   ├── artifacts/     # Generated artifacts
│   └── helpers.sh     # Helper scripts
├── services/
│   ├── nodejs/        # Node.js service files
│   ├── python/        # Python service files
│   └── java/          # Java service files
├── resources/
│   ├── templates/     # Dockerfile templates
│   ├── scripts/       # Deployment scripts
│   ├── keys/          # SSH keys (if any)
│   └── certificates/  # SSL certificates
├── virtual-servers/
│   └── servers.json   # Virtual server definitions
├── deployments/       # Deployment configs
├── configs/           # Service configs
└── branches/          # Branch tracking
```

## Environment Variables

The workflow uses these environment variables:

- `TZ`: Asia/Seoul
- `REPORT_DIR`: .github/sec_report
- `LOG_DIR`: .github/sec_report/logs
- `ARTIFACT_DIR`: .github/sec_report/artifacts
- `SERVICE_DIR`: .github/services
- `RESOURCE_DIR`: .github/resources
- `BRANCH_PREFIX`: security-update

## Security Considerations

1. **Secrets**: The workflow requires `GITHUB_TOKEN` (automatically provided)
2. **Permissions**: Requires `contents: write`, `pull-requests: write`, `security-events: read`, `id-token: write`, `packages: write`
3. **SSL Certificates**: Self-signed certificates are generated for testing only
4. **Docker Images**: Images are built locally and not pushed to registry
5. **Resource Cleanup**: Deployed services are cleaned up after testing

## Troubleshooting

### Issue: Infrastructure provisioning fails

**Solution**: Check that all required packages can be installed. Ubuntu runners should have access to install docker, nodejs, python, etc.

### Issue: Branch creation fails

**Solution**: Ensure workflow has `contents: write` permission and branches don't already exist.

### Issue: Service deployment fails

**Solution**: Check that infrastructure provisioning succeeded first. Deploy services depends on provisioning artifacts.

### Issue: Security audits find many vulnerabilities

**Solution**: This is expected! Review the artifacts and update dependencies. High/critical vulnerabilities should be addressed ASAP.

## Contributing

To modify this workflow:

1. Edit `.github/workflows/dependency-check.yml`
2. Test changes using `workflow_dispatch` trigger
3. Validate YAML syntax before committing
4. Update this documentation if adding new features

## Related Workflows

- `docker-build-and-deploy.yml`: Docker image building and deployment
- `infra-provision.yml`: Infrastructure provisioning
- `security-audit.yml`: Security scanning

## Support

For issues or questions:
1. Check workflow run logs and artifacts
2. Review job summaries in GitHub Actions
3. Check created issues for scheduled failure reports
