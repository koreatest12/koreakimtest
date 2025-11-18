# Dependency Security Check - Quick Start Guide

## Quick Start

### 1. Run Security Audit Only (Default)

**No action needed!** The workflow automatically runs:
- Every Monday at 03:00 UTC
- On pull requests modifying dependencies
- On pushes to main with dependency changes

### 2. Full Stack Deployment (Manual)

```bash
# Via GitHub UI:
1. Go to: Actions → Dependency Security Check
2. Click: Run workflow
3. Select branch: main
4. Enable all options:
   ☑ provision_infrastructure
   ☑ create_branches
   ☑ deploy_services
5. Click: Run workflow
```

**Result**: Complete infrastructure with services deployed and tested

### 3. Just Create Security Update Branches

```bash
# Via GitHub UI:
1. Go to: Actions → Dependency Security Check
2. Click: Run workflow
3. Select branch: main
4. Enable only:
   ☑ create_branches
5. Click: Run workflow
```

**Result**: New branches created:
- `security-update/nodejs-20241118-133752`
- `security-update/python-20241118-133752`
- `security-update/java-20241118-133752`
- `security-update/security-updates-20241118-133752`

## Common Scenarios

### Scenario: Found Critical Vulnerability

1. **Automatic**: Workflow fails and creates issue
2. **Manual check**: Download `npm-audit-*` or `python-audit-*` artifacts
3. **Review**: Check the JSON reports for details
4. **Fix**: Update the vulnerable package
5. **Verify**: Run workflow again to confirm fix

### Scenario: Deploy Test Environment

1. Enable `provision_infrastructure` and `deploy_services`
2. Workflow builds and deploys:
   - Node.js service on port 3000
   - Python service on port 8000
   - Java service on port 8080
3. Services are tested automatically
4. Services are cleaned up after testing
5. Download `service-deployment-*` artifact for logs

### Scenario: Prepare for Major Update

1. Enable `create_branches` to create feature branches
2. Work on updates in separate branches per service
3. Run security checks on each branch via PR
4. Merge when all checks pass

## Artifact Quick Reference

| When you need... | Download this artifact |
|-----------------|----------------------|
| Vulnerability details | `npm-audit-*` or `python-audit-*` |
| Infrastructure setup info | `infrastructure-provisioning-*` |
| Deployment logs | `service-deployment-*` |
| Resource usage stats | `resource-management-*` |
| Complete summary | `final-summary-*` |

## CLI Commands for Local Testing

### Test Node.js dependencies locally:
```bash
cd anthropic-cost-tracker/nodejs
npm audit
npm audit --json > audit.json
```

### Test Python dependencies locally:
```bash
cd mcp-python-server
pip-audit -r requirements.txt
safety check -r requirements.txt
bandit -r .
```

### View service configurations:
```bash
# After workflow runs with provisioning
cat .github/services/services.json
cat .github/services/deployment-manifest.yml
```

### Test Docker deployment locally:
```bash
# After downloading service-deployment artifact
docker-compose -f docker-compose.deploy.yml up -d
docker-compose -f docker-compose.deploy.yml ps
docker-compose -f docker-compose.deploy.yml logs
docker-compose -f docker-compose.deploy.yml down
```

## Monitoring

### Check Weekly Scans
```bash
# Look for issues with these labels:
- security
- dependency-check
- automated
```

### View Workflow Status
```bash
# GitHub CLI
gh run list --workflow=dependency-check.yml
gh run view <run-id>
```

### Download Artifacts
```bash
# GitHub CLI
gh run download <run-id>
```

## Tips

✅ **DO**:
- Run full deployment in non-production environments only
- Review all high/critical vulnerabilities promptly
- Keep dependencies updated regularly
- Use branch creation for organized security updates

❌ **DON'T**:
- Deploy services to production via this workflow
- Ignore critical security vulnerabilities
- Skip reviewing audit artifacts
- Delete security branches before reviewing

## Notifications

You'll be notified via:
- GitHub issue (weekly scan failures)
- PR comments (dependency review failures)
- Email (if configured in GitHub)

## Emergency Response

### Critical Vulnerability Found

1. **Immediate**: Check `npm-audit-*` or `python-audit-*` artifacts
2. **Assess**: Determine impact on your services
3. **Fix**: Update vulnerable package immediately
4. **Test**: Run workflow to verify fix
5. **Deploy**: Use your regular deployment process

### Workflow Stuck or Failing

1. **Check logs**: View failed job logs in Actions tab
2. **Check artifacts**: Download available artifacts
3. **Re-run**: Use "Re-run failed jobs" button
4. **Report**: Create issue if problem persists

## Reference Links

- Full Documentation: [DEPENDENCY_CHECK_WORKFLOW.md](./DEPENDENCY_CHECK_WORKFLOW.md)
- Security Policy: [../SECURITY.md](../SECURITY.md)
- Workflow File: [../.github/workflows/dependency-check.yml](../.github/workflows/dependency-check.yml)

## Support Contacts

- Repository Issues: Create issue with label `workflow`
- Security Issues: Follow [SECURITY.md](../SECURITY.md) guidelines
