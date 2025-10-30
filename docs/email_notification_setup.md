# Email Notification Setup Guide

Complete guide to setting up email notifications for Python security audits.

## Overview

The security notification system sends automated email alerts when vulnerabilities are detected in your Python dependencies. It includes:

- **HTML email templates** with color-coded severity levels
- **Attachment support** for detailed reports (JSON, Markdown)
- **Configurable thresholds** to avoid alert fatigue
- **Multiple SMTP providers** support (Gmail, Outlook, SendGrid, etc.)

---

## Quick Start

### 1. Install Dependencies

```bash
pip install python-dotenv
```

The notifier module is standalone and only requires `python-dotenv` for environment variable loading.

### 2. Configure Email Settings

**Copy the example environment file:**

```bash
cp .env.example .env
```

**Edit `.env` with your SMTP credentials:**

```bash
# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM=your-email@gmail.com

# Recipients (comma-separated)
NOTIFY_EMAILS=security@company.com,devops@company.com
```

### 3. Run Security Audit with Notifications

```bash
python src/utils/pysec_update.py --notify
```

**Example with all options:**

```bash
python src/utils/pysec_update.py \
  --req requirements.txt \
  --bandit \
  --freeze \
  --notify \
  --notify-threshold 3
```

---

## Email Provider Setup

### Gmail

**Requirements:**
- Gmail account with 2-Step Verification enabled
- App Password (not your regular Gmail password)

**Steps:**

1. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Turn on "2-Step Verification"

2. **Generate App Password:**
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Python Security Alerts"
   - Copy the 16-character password

3. **Configure `.env`:**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # App Password from step 2
SMTP_FROM=your-email@gmail.com
NOTIFY_EMAILS=recipient1@company.com,recipient2@company.com
```

### Outlook / Hotmail

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
NOTIFY_EMAILS=recipient@company.com
```

**Note:** Outlook may require app-specific passwords for accounts with 2FA enabled.

### Office 365

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-password
SMTP_FROM=your-email@company.com
NOTIFY_EMAILS=security@company.com
```

### SendGrid (Recommended for Production)

SendGrid offers reliable transactional email with high deliverability.

**Setup:**

1. Sign up at https://sendgrid.com/
2. Create an API key (Settings → API Keys)
3. Configure:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxx  # Your SendGrid API key
SMTP_FROM=noreply@yourcompany.com
NOTIFY_EMAILS=security@yourcompany.com
```

### Mailgun

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.yourcompany.com
SMTP_PASS=your-mailgun-smtp-password
SMTP_FROM=security@yourcompany.com
NOTIFY_EMAILS=team@yourcompany.com
```

---

## Configuration Options

### Command-Line Arguments

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `--notify` | flag | False | Enable email notifications |
| `--notify-threshold` | int | 1 | Minimum vulnerabilities to trigger email |

### Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | Yes | `587` | SMTP server port (usually 587 for TLS) |
| `SMTP_USER` | Yes | `user@example.com` | SMTP username |
| `SMTP_PASS` | Yes | `app-password` | SMTP password or app password |
| `SMTP_FROM` | No | `SMTP_USER` | From email address (defaults to SMTP_USER) |
| `NOTIFY_EMAILS` | Yes | `a@co.com,b@co.com` | Comma-separated recipient list |

---

## Usage Examples

### Example 1: Basic Notification

```bash
# Send email if ANY vulnerabilities found
python src/utils/pysec_update.py --notify
```

### Example 2: Threshold-Based Notification

```bash
# Only send email if 5+ vulnerabilities found
python src/utils/pysec_update.py --notify --notify-threshold 5
```

### Example 3: Full Audit + Notification

```bash
# Complete security audit with email alert
python src/utils/pysec_update.py \
  --req requirements.txt \
  --bandit \
  --freeze \
  --upgrade conservative \
  --notify \
  --notify-threshold 1 \
  --verbose
```

### Example 4: CI/CD Integration

```bash
# Weekly audit in GitHub Actions
python src/utils/pysec_update.py \
  --req requirements.txt \
  --upgrade none \
  --bandit \
  --notify \
  --reports .github/echo_security
```

### Example 5: Test Notification (Manual)

```bash
# Test email setup with existing report
python src/utils/security_notifier.py \
  --summary reports/security/security-summary-20250123-143022.json \
  --reports-dir reports/security \
  --attach
```

---

## Email Templates

### Severity Levels

The notification system automatically assigns severity based on vulnerability count:

| Vulnerabilities | Severity | Color | Emoji |
|----------------|----------|-------|-------|
| 0 | Info | Blue | ℹ️ |
| 1-4 | Warning | Orange | ⚠️ |
| 5+ | Critical | Red | 🚨 |

### Email Subject Lines

- **No vulnerabilities:** `ℹ️ Python Security Audit - All Clear`
- **With vulnerabilities:** `⚠️ Python Security Alert - 3 Vulnerabilities Detected`
- **Critical:** `🚨 Python Security Alert - 12 Vulnerabilities Detected`

### Email Content

**HTML Email Includes:**

1. **Header** - Color-coded by severity
2. **Summary Box** - Audit results overview
3. **Vulnerability Details** - First 10 vulnerabilities listed
4. **Action Items** - Recommended next steps
5. **Attachments** - Detailed JSON/Markdown reports

**Plain Text Fallback:**

All emails include a plain text version for email clients that don't support HTML.

---

## Troubleshooting

### Issue: "SMTP credentials not configured"

**Error:**
```
ValueError: SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables
```

**Solution:**
- Ensure `.env` file exists in project root
- Check that `SMTP_USER` and `SMTP_PASS` are set
- Verify you're running from the correct directory

### Issue: "Authentication failed"

**Error:**
```
smtplib.SMTPAuthenticationError: (535, b'5.7.8 Username and Password not accepted')
```

**Solutions:**

**For Gmail:**
- Use App Password, not regular password
- Enable 2-Step Verification first
- Regenerate App Password if needed

**For Other Providers:**
- Double-check username/password
- Verify account is not locked
- Check if app-specific password is required

### Issue: "Connection refused"

**Error:**
```
ConnectionRefusedError: [Errno 111] Connection refused
```

**Solutions:**
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- Verify firewall allows outbound SMTP (port 587)
- Try port 465 (SSL) or 25 (non-secure)

### Issue: "TLS/SSL Error"

**Error:**
```
ssl.SSLError: [SSL: WRONG_VERSION_NUMBER] wrong version number
```

**Solutions:**
- Ensure using port 587 for STARTTLS
- Port 465 requires SSL/TLS from start
- Check provider's documentation for correct port

### Issue: "No recipients configured"

**Error:**
```
ValueError: No recipients configured. Set NOTIFY_EMAILS environment variable
```

**Solution:**
```bash
# Add to .env
NOTIFY_EMAILS=email1@company.com,email2@company.com
```

### Issue: "Email sent but not received"

**Possible Causes:**

1. **Spam folder** - Check recipient's spam/junk folder
2. **SPF/DKIM** - Email provider may block unauthenticated emails
3. **Rate limiting** - Provider may throttle outbound emails

**Solutions:**
- Add sender to safe senders list
- Use dedicated email service (SendGrid, Mailgun)
- Check provider's sent mail folder

---

## Advanced Configuration

### Custom Email Templates

To customize the HTML email template, edit `src/utils/security_notifier.py`:

```python
def _generate_html_body(self, summary_data: dict, severity: str) -> str:
    # Modify HTML template here
    pass
```

### Multiple Recipients by Severity

Modify `.env` to define severity-based routing:

```bash
# Critical alerts go to security team
NOTIFY_EMAILS_CRITICAL=security@company.com,cto@company.com

# Warnings go to dev team
NOTIFY_EMAILS_WARNING=devops@company.com

# Info goes to monitoring
NOTIFY_EMAILS_INFO=monitoring@company.com
```

Then update `security_notifier.py` to use appropriate list based on severity.

### Webhook Integration (Slack, Teams)

For webhook-based notifications (Slack, Microsoft Teams), modify `send_notification()`:

```python
# Add webhook support
import requests

def send_slack_notification(summary_data: dict) -> bool:
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    payload = {
        "text": f"Security Alert: {len(vulnerabilities)} vulnerabilities found",
        "attachments": [...]
    }
    response = requests.post(webhook_url, json=payload)
    return response.status_code == 200
```

---

## Security Best Practices

### 1. **Protect `.env` File**

```bash
# Add to .gitignore
echo ".env" >> .gitignore
```

Never commit `.env` to version control!

### 2. **Use App Passwords**

For Gmail/Outlook, always use app-specific passwords, not account passwords.

### 3. **Rotate Credentials**

Rotate SMTP passwords regularly (quarterly recommended).

### 4. **Limit Recipients**

Only send to necessary personnel to avoid alert fatigue.

### 5. **Use Dedicated Service**

For production, use dedicated email services (SendGrid, Mailgun) with:
- Better deliverability
- Rate limit management
- Analytics and tracking
- Bounce handling

### 6. **Secure Attachments**

Reports may contain sensitive info (package names, versions). Consider:
- Encrypting attachments
- Using secure file sharing links
- Limiting attachment details

---

## CI/CD Integration

### GitHub Actions with Email Notifications

Update `.github/workflows/security-audit.yml`:

```yaml
- name: Run security audit with notifications
  env:
    SMTP_HOST: ${{ secrets.SMTP_HOST }}
    SMTP_PORT: ${{ secrets.SMTP_PORT }}
    SMTP_USER: ${{ secrets.SMTP_USER }}
    SMTP_PASS: ${{ secrets.SMTP_PASS }}
    SMTP_FROM: ${{ secrets.SMTP_FROM }}
    NOTIFY_EMAILS: ${{ secrets.NOTIFY_EMAILS }}
  run: |
    python src/utils/pysec_update.py `
      --req requirements.txt `
      --upgrade none `
      --bandit `
      --notify `
      --notify-threshold 1
```

**Store secrets in GitHub:**
- Settings → Secrets and variables → Actions
- Add: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAILS`

### GitLab CI

```yaml
security_audit:
  script:
    - python src/utils/pysec_update.py --notify --req requirements.txt
  variables:
    SMTP_HOST: $SMTP_HOST
    SMTP_USER: $SMTP_USER
    SMTP_PASS: $SMTP_PASS
    NOTIFY_EMAILS: $NOTIFY_EMAILS
```

---

## Testing

### Test SMTP Connection

```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText("Test email from Python security tool")
msg["Subject"] = "Test"
msg["From"] = "your-email@gmail.com"
msg["To"] = "recipient@company.com"

with smtplib.SMTP("smtp.gmail.com", 587) as server:
    server.starttls()
    server.login("your-email@gmail.com", "app-password")
    server.send_message(msg)
    print("✅ Test email sent")
```

### Test Notification System

```bash
# Create dummy summary for testing
python src/utils/security_notifier.py \
  --summary reports/security/security-summary-LATEST.json \
  --attach
```

---

## FAQ

**Q: Can I send to multiple email addresses?**
A: Yes! Use comma-separated list in `NOTIFY_EMAILS`:
```bash
NOTIFY_EMAILS=dev@co.com,security@co.com,ops@co.com
```

**Q: How do I avoid spam folder?**
A: Use a reputable email service (SendGrid, Mailgun) with proper SPF/DKIM records.

**Q: Can I customize the email template?**
A: Yes, edit `_generate_html_body()` in `src/utils/security_notifier.py`.

**Q: What if I don't want attachments?**
A: Modify the code to call `send_notification(attach_reports=False)`.

**Q: How do I disable notifications temporarily?**
A: Simply omit the `--notify` flag when running the tool.

**Q: Can I integrate with Slack instead?**
A: Yes! See "Advanced Configuration → Webhook Integration" above.

---

## Related Documentation

- [pysec_update Guide](./pysec_update_guide.md)
- [Security Audit Workflow](.github/workflows/security-audit.yml)
- [Environment Variables](.env.example)

## Support

For issues with email notifications:
1. Check logs in `reports/security/`
2. Test SMTP connection manually
3. Verify `.env` configuration
4. Check provider's SMTP documentation

---

**Last Updated:** 2025-01-23
**Version:** 1.0.0
