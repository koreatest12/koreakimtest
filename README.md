# 🚀 Korea Test Repository

## Project Overview

This repository is a comprehensive monorepo for Anthropic API cost tracking, Model Context Protocol (MCP) server development, and various infrastructure automation tools.

## 🛡️ Security & Automation

### Dependency Security Check Workflow ⭐ NEW

The repository now includes a comprehensive dependency security check workflow with advanced features:

- **Automated Security Audits**: Node.js and Python dependency vulnerability scanning
- **Infrastructure Provisioning**: Full stack setup for Node.js, Python, and Java services
- **Branch Management**: Auto-create feature branches for security updates
- **Service Deployment**: Docker-based service deployment with health checks
- **Resource Management**: System resource monitoring and allocation planning

**Quick Start**: See [docs/DEPENDENCY_CHECK_QUICK_START.md](docs/DEPENDENCY_CHECK_QUICK_START.md)

**Full Documentation**: See [docs/DEPENDENCY_CHECK_WORKFLOW.md](docs/DEPENDENCY_CHECK_WORKFLOW.md)

### Other Security Features

- **CodeQL Analysis**: Advanced security scanning for code vulnerabilities
- **Dependabot**: Automated dependency updates
- **Security Policies**: See [SECURITY.md](SECURITY.md)

## 📦 Key Projects

### 1. Anthropic Cost Tracker
Track and estimate Anthropic API costs with dual-language implementation (Node.js and Python).

**Locations**:
- Node.js: `anthropic-cost-tracker/nodejs/`
- Python: `anthropic-cost-tracker/python/`

### 2. MCP Servers
Multiple Model Context Protocol servers for Claude integration:

- **Python Utilities** (`mcp-python-server/`): Comprehensive utilities including file operations, system info, JSON tools
- **JavaScript Hello** (`mcp-hello-js/`): Basic MCP server example
- **Python Hello** (`mcp-hello-py/`): Example Python MCP server
- **Apache Server** (`mcp-apache-server/`): Apache-related MCP tools
- **Java Server** (`mcp-hello-java/`): Java MCP implementation
- **Filesystem** (`mcp-fs/`): Filesystem access via MCP

### 3. Infrastructure & DevOps

- **Docker Images**: Custom container images in `linux-images/`, `docker/`
- **Deployment Scripts**: Automated deployment in `deploy/`
- **CI/CD Workflows**: 25+ GitHub Actions workflows for various automation tasks

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Java 17+
- Docker & Docker Compose
- Git

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/koreatest12/koreakimtest.git
cd koreakimtest

# Install Node.js dependencies (for Node projects)
cd anthropic-cost-tracker/nodejs
npm install

# Setup Python environment (for Python projects)
cd ../python
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 📚 Documentation

- [Dependency Security Check Workflow](docs/DEPENDENCY_CHECK_WORKFLOW.md)
- [Quick Start Guide](docs/DEPENDENCY_CHECK_QUICK_START.md)
- [Claude.md](CLAUDE.md) - Repository instructions for Claude Code
- [Security Policy](SECURITY.md)
- [Security Setup](SECURITY_SETUP.md)

## 🔧 Available Workflows

The repository includes 25+ GitHub Actions workflows for various tasks:

| Workflow | Purpose |
|----------|---------|
| `dependency-check.yml` | **Comprehensive security & infrastructure management** |
| `codeql.yml` | Security code analysis |
| `docker-build-and-deploy.yml` | Docker image building and deployment |
| `infra-provision.yml` | Infrastructure provisioning |
| `main.yml` | Main CI/CD pipeline |
| `security-audit.yml` | Security auditing |
| And 20+ more... | Various automation tasks |

## 🤝 Contributing

1. Check security scan results before submitting PRs
2. Follow existing code style and patterns
3. Update documentation for new features
4. Run local tests before pushing

## 📊 Project Status

- **Security Scanning**: ✅ Automated weekly scans
- **Dependency Updates**: ✅ Dependabot enabled
- **Infrastructure**: ✅ Automated provisioning available
- **Documentation**: ✅ Comprehensive guides available

## 📝 License

See [LICENSE](LICENSE) file for details.

## 📧 Support

- **Issues**: Create issue with appropriate label
- **Security**: Follow [SECURITY.md](SECURITY.md) for security issues
- **Workflows**: See individual workflow documentation

---

**Last Updated**: 2025-11-18
**Maintained by**: GitHub Actions & Contributors
