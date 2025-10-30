# Python Security Update Tool Guide

Comprehensive Python dependency security auditing and upgrade utility.

## Features

- **🔍 Vulnerability Scanning**
  - `pip-audit` - Official PyPA security scanner
  - `safety` - Database of known security vulnerabilities

- **🔒 Static Code Analysis**
  - `bandit` - Security linting for Python code

- **⬆️ Dependency Management**
  - Conservative upgrades (security patches only)
  - Aggressive upgrades (all packages)
  - pip-tools integration (compile/sync workflow)

- **📊 Comprehensive Reports**
  - JSON reports (machine-readable)
  - Markdown summaries (human-readable)
  - Requirements freeze snapshots

## Installation

### Required Tools

```bash
pip install pip-audit safety bandit pip-tools
```

Or install from project requirements:

```bash
pip install -r requirements-security.txt
```

## Usage

### Basic Usage

**1. Conservative Upgrade + Audit (Default)**

```bash
python src/utils/pysec_update.py
```

- Scans for vulnerabilities with `pip-audit` and `safety`
- Applies security patches only (conservative mode)
- Generates reports in `reports/security/`

**2. Specify Requirements File**

```bash
python src/utils/pysec_update.py --req requirements.txt
```

**3. Include Bandit Code Analysis**

```bash
python src/utils/pysec_update.py --bandit
```

Scans `src/` directory for security issues in your code.

**4. Create Requirements Freeze**

```bash
python src/utils/pysec_update.py --freeze
```

Saves a `pip freeze` snapshot with timestamp.

### Advanced Usage

**5. Compile from requirements.in (pip-tools workflow)**

```bash
python src/utils/pysec_update.py --req requirements.in --upgrade all
```

- Compiles `requirements.in` → `requirements.txt`
- Applies all upgrades (`--upgrade` flag to pip-compile)
- Syncs environment with `pip-sync`

**6. Custom Report Directory**

```bash
python src/utils/pysec_update.py --reports .github/echo_security
```

Save reports to custom location (e.g., for CI/CD archiving).

**7. Custom Virtual Environment**

```bash
python src/utils/pysec_update.py --venv .venv-py312
```

Use a specific virtual environment.

**8. Aggressive Upgrade Mode**

```bash
python src/utils/pysec_update.py --upgrade all
```

Upgrades **all** outdated packages (not just security patches).

**9. No Upgrades (Audit Only)**

```bash
python src/utils/pysec_update.py --upgrade none
```

**10. Full Audit with All Features**

```bash
python src/utils/pysec_update.py --req requirements.txt --bandit --freeze --upgrade all -v
```

## Command-Line Options

| Option | Argument | Default | Description |
|--------|----------|---------|-------------|
| `--req` | FILE | None | Requirements file (.txt or .in) |
| `--venv` | PATH | `.venv` | Virtual environment path |
| `--reports` | PATH | `reports/security` | Report output directory |
| `--upgrade` | MODE | `conservative` | Upgrade mode: `conservative`, `all`, `none` |
| `--bandit` | - | False | Run bandit static analysis |
| `--freeze` | - | False | Create pip freeze snapshot |
| `-v, --verbose` | - | False | Verbose output |

## Upgrade Modes

### Conservative (Default)

```bash
--upgrade conservative
```

- Uses `pip-audit --fix`
- Only applies **security patches**
- Safest option for production
- Minimal risk of breaking changes

### All (Aggressive)

```bash
--upgrade all
```

- Upgrades **all outdated packages**
- For pip-tools: uses `--upgrade` flag
- For direct pip: iterates through `pip list --outdated`
- Higher risk of compatibility issues
- **Recommended**: Run tests after upgrade

### None (Audit Only)

```bash
--upgrade none
```

- Scans only, no modifications
- Useful for CI/CD checks
- Generates reports without changing environment

## Report Files

All reports are saved with timestamps: `YYYYMMDD-HHMMSS`

### Generated Files

**1. pip-audit Report**
```
reports/security/pip-audit-20250123-143022.json
```

**2. Safety Report**
```
reports/security/safety-20250123-143022.json
```

**3. Bandit Report** (if `--bandit` used)
```
reports/security/bandit-20250123-143022.json
```

**4. Summary Report** (always generated)
```
reports/security/security-summary-20250123-143022.json
reports/security/security-summary-20250123-143022.md
```

**5. Requirements Freeze** (if `--freeze` used)
```
reports/security/requirements-freeze-20250123-143022.txt
```

## Example Workflows

### Daily Security Check (CI/CD)

```bash
# .github/workflows/security-audit.yml
python src/utils/pysec_update.py --upgrade none --bandit --reports .github/echo_security
```

### Weekly Maintenance

```bash
# Apply security patches
python src/utils/pysec_update.py --req requirements.txt --freeze
```

### Monthly Full Upgrade

```bash
# Upgrade all packages + full audit
python src/utils/pysec_update.py --req requirements.in --upgrade all --bandit --freeze
# Then run test suite
pytest
```

### Pre-Deployment Check

```bash
# Audit without changes
python src/utils/pysec_update.py --req requirements.txt --upgrade none --bandit
# Review reports before deployment
```

## Understanding Reports

### pip-audit JSON Structure

```json
{
  "vulnerabilities": [
    {
      "name": "package-name",
      "version": "1.0.0",
      "id": "PYSEC-2024-123",
      "description": "Vulnerability description",
      "fix_versions": ["1.0.1", "1.1.0"]
    }
  ]
}
```

### Safety JSON Structure

```json
[
  {
    "package": "package-name",
    "installed": "1.0.0",
    "vulnerable_spec": "<1.0.1",
    "advisory": "Advisory text",
    "vulnerability_id": "CVE-2024-1234"
  }
]
```

### Bandit JSON Structure

```json
{
  "results": [
    {
      "code": "vulnerable code snippet",
      "filename": "src/example.py",
      "issue_severity": "HIGH",
      "issue_text": "Issue description",
      "line_number": 42
    }
  ],
  "metrics": {
    "severity.HIGH": 1,
    "severity.MEDIUM": 3,
    "severity.LOW": 5
  }
}
```

### Summary Markdown Example

```markdown
# Python Security Audit Report

**Date:** 20250123-143022
**Python:** Python 3.11.0
**Venv:** .venv
**Upgrade Mode:** conservative

## Summary

- **pip-audit:** ⚠️ 2 vulnerabilities
- **safety:** ✅ Clean
- **bandit:** 3 issues found
- **Upgrades:** Applied (conservative mode)

## Recommendations

1. Review vulnerability reports in detail
2. Update affected packages to patched versions
3. Consider refactoring code flagged by bandit
4. Run tests after upgrades to ensure compatibility
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Python Security Audit

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2 AM
  workflow_dispatch:

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pip-audit safety bandit pip-tools

      - name: Run security audit
        run: |
          python src/utils/pysec_update.py \
            --req requirements.txt \
            --upgrade none \
            --bandit \
            --reports .github/echo_security

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: .github/echo_security/

      - name: Check for vulnerabilities
        run: |
          # Fail if vulnerabilities found
          if grep -q "vulnerabilities" .github/echo_security/security-summary-*.json; then
            echo "Vulnerabilities detected!"
            exit 1
          fi
```

## Troubleshooting

### Issue: Tools not found

**Error:** `ModuleNotFoundError: No module named 'pip_audit'`

**Solution:**
```bash
# Activate venv first
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install tools
pip install pip-audit safety bandit pip-tools
```

### Issue: Permission denied on Windows

**Error:** `Access denied` when upgrading packages

**Solution:**
```bash
# Run with administrator privileges or use --user flag
python src/utils/pysec_update.py --upgrade none  # Audit only
```

### Issue: pip-compile fails

**Error:** `Could not find a version that matches...`

**Solution:**
```bash
# Check requirements.in for incompatible constraints
# Use conservative mode instead
python src/utils/pysec_update.py --req requirements.txt --upgrade conservative
```

## Best Practices

1. **Run weekly audits** - Set up automated CI/CD checks
2. **Review before applying** - Use `--upgrade none` first to see what would change
3. **Test after upgrades** - Always run test suite after applying upgrades
4. **Keep reports** - Archive security reports for compliance
5. **Fix high-severity issues immediately** - Don't delay patching critical vulnerabilities
6. **Use pip-tools** - Maintain `requirements.in` for reproducible builds
7. **Pin critical dependencies** - Use exact versions for production

## Related Documentation

- [pip-audit documentation](https://github.com/pypa/pip-audit)
- [Safety documentation](https://github.com/pyupio/safety)
- [Bandit documentation](https://bandit.readthedocs.io/)
- [pip-tools documentation](https://github.com/jazzband/pip-tools)

## License

MIT
