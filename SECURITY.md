# Security Policy

## Supported Versions

This repository contains multiple projects. Security updates are actively maintained for the following:

| Project | Status |
| ------- | ------ |
| Anthropic Cost Tracker (Node.js) | ✅ Actively maintained |
| Anthropic Cost Tracker (Python) | ✅ Actively maintained |
| MCP Servers | ✅ Actively maintained |
| Shared Utilities | ✅ Actively maintained |

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please report it responsibly:

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainers at: kwonny1302@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### What to Expect

- **Response time**: Within 48 hours of report
- **Status updates**: Every 5-7 days until resolution
- **Resolution timeline**: Critical vulnerabilities within 7 days, others within 30 days
- **Credit**: Security researchers will be credited (unless anonymity is requested)

## Security Best Practices

### API Key Management

**✅ Secure Practices Implemented:**

1. **Environment Variables**: All API keys are stored in environment variables, never hardcoded
   ```bash
   # Required environment variables
   ANTHROPIC_API_KEY=sk-ant-xxx
   ANTHROPIC_ADMIN_API_KEY=sk-ant-xxx
   ```

2. **.env Files**:
   - Real `.env` files are excluded via `.gitignore`
   - Only `.env.example` files are committed (no actual credentials)

3. **GitHub Secrets**: Workflows use GitHub secrets for sensitive data
   ```yaml
   # Example from workflows
   secrets.GITHUB_TOKEN
   ```

### Code Security

**Current Security Measures:**

1. **Input Validation**:
   - Date validation in Admin API calls
   - Type checking with TypeScript
   - Error handling for invalid inputs

2. **Dependency Management**:
   - Dependencies locked in `package-lock.json` and `requirements.txt`
   - Regular security updates via Dependabot
   - Vulnerability scanning enabled

3. **Access Control**:
   - MCP servers require explicit configuration
   - File operations restricted to allowed directories
   - Proper permission checks for bash commands

### MCP Server Security

**MCP (Model Context Protocol) servers require special attention:**

1. **stdio Communication**: MCP servers use stdin/stdout - ensure proper input sanitization
2. **Environment Variables**: Set `PYTHONUNBUFFERED=1` for Python MCP servers
3. **Tool Permissions**: Review and approve all MCP tool permissions before use
4. **Resource Access**: Limit filesystem access to necessary directories only

### Python Virtual Environments

**All Python projects use isolated virtual environments:**

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Unix
```

This prevents:
- System-wide package conflicts
- Unauthorized package installations
- Cross-project dependency issues

## Sensitive Files Protection

### Files Excluded from Repository

The following files/directories are protected via `.gitignore`:

```gitignore
# API Keys and sensitive files
*.env
.env.local
*.key
*.pem
.mcp.json.encrypted
.mcp.json.backup
.claude.json.backup

# Claude Code personal data
.claude/
.claude.json
.gitconfig
generated_password.txt

# Python virtual environments
.venv/

# Node.js dependencies
node_modules/

# User directories
AppData/
Documents/
Downloads/
```

### Encrypted Files

Some configuration files may be encrypted:
- `.mcp.json.encrypted` - Encrypted MCP server configurations
- `history.jsonl.encrypted` - Encrypted conversation history

**Never commit decrypted versions of these files!**

## Dependency Security

### Node.js Projects

- Review dependencies before installation: `npm audit`
- Update vulnerable packages: `npm audit fix`
- Check for outdated packages: `npm outdated`

### Python Projects

- Review dependencies: `pip list --outdated`
- Security scanning: `pip-audit` (if installed)
- Pin versions in `requirements.txt` for reproducibility

### GitHub Actions

- Dependabot enabled for automated dependency updates
- Security scanning on pull requests
- Workflow permissions follow principle of least privilege

## Known Security Considerations

### 1. Admin API Access

The Admin API key (`sk-ant-admin...`) has organization-level access:
- **Risk**: Unauthorized usage reports access
- **Mitigation**: Store in environment variables only, never commit
- **Access**: Limit to authorized personnel only

### 2. MCP Server Execution

MCP servers execute code on your local machine:
- **Risk**: Malicious MCP servers could execute arbitrary code
- **Mitigation**: Only use trusted MCP servers, review configuration before adding
- **Audit**: Regularly review `.mcp.json` for unauthorized servers

### 3. Bash Command Execution

Some tools can execute bash commands:
- **Risk**: Command injection vulnerabilities
- **Mitigation**: Input validation and sanitization implemented
- **Sandboxing**: Consider running in containerized environments for sensitive operations

### 4. File System Access

Tools have filesystem access:
- **Risk**: Unauthorized file access or modification
- **Mitigation**: Restrict to project directories, use permission checks
- **Monitoring**: Review file operation logs regularly

## Secure Development Workflow

### Before Committing

1. **Check for secrets**:
   ```bash
   git diff --cached
   ```
2. **Run security scan** (if available):
   ```bash
   npm audit  # Node.js
   pip-audit  # Python
   ```
3. **Review .gitignore**: Ensure sensitive files are excluded

### Before Pushing

1. **Review commit history**: Check for accidentally committed secrets
2. **Test in isolation**: Verify code works with environment variables only
3. **Update documentation**: Include security considerations in README

### Code Review Checklist

- [ ] No hardcoded credentials or API keys
- [ ] Environment variables used for sensitive data
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date
- [ ] .gitignore covers all sensitive files

## Security Audit Results

**Last Updated**: 2025-11-02

### Scan Results

✅ **No hardcoded API keys found**
✅ **Environment variables properly used**
✅ **.env files properly excluded**
✅ **GitHub secrets properly configured**
✅ **No SQL injection vulnerabilities detected**
✅ **No command injection vulnerabilities detected**
✅ **Personal data files excluded from repository**

### Recommendations

1. **Enable Branch Protection**: Require pull request reviews before merging
2. **Enable Secret Scanning**: GitHub's secret scanning for additional protection
3. **Enable Code Scanning**: GitHub's code scanning for vulnerability detection
4. **Regular Audits**: Quarterly security audits recommended
5. **Dependency Updates**: Monthly dependency update reviews

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Anthropic API Security](https://docs.anthropic.com/en/api/security)
- [MCP Security Guidelines](https://modelcontextprotocol.io/docs/security)

## License

This security policy is part of the repository and follows the same license terms.

---

**For security concerns or questions, contact: kwonny1302@gmail.com**
