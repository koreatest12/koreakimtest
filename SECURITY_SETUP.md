# 🔐 Security Setup Guide

## ✅ Completed Security Actions

1. **Removed exposed credentials** from `.env` file
2. **Verified `.gitignore`** includes `.env` files (already configured)
3. **Git status confirmed** - `.env` file is NOT tracked by git

## 📋 Next Steps for Gmail SMTP Configuration

### Option 1: Use Gmail App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Name it "Claude Code SMTP"
   - Copy the 16-character password

3. **Update your `.env` file**:
   ```bash
   SMTP_USER=kwonny1302@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # 16-character App Password
   SMTP_FROM=kwonny1302@gmail.com
   NOTIFY_EMAILS=kwonny1302@gmail.com
   ```

### Option 2: Use Alternative Email Service

Consider using a dedicated email service for notifications:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (pay-as-you-go)

## 🔑 Anthropic API Keys Setup

### Get Your API Keys

1. **Regular API Key**:
   - Visit: https://console.anthropic.com/
   - Navigate to Settings → API Keys
   - Create a new key
   - Update `ANTHROPIC_API_KEY` in `anthropic-cost-tracker/.env`

2. **Admin API Key** (for organization accounts only):
   - Visit: https://console.anthropic.com/settings/admin-api
   - Create an Admin API key
   - Update `ANTHROPIC_ADMIN_API_KEY` in `anthropic-cost-tracker/.env`

## 🛡️ Security Best Practices

### ✅ Already Implemented
- `.env` files in `.gitignore`
- `.mcp.json` files in `.gitignore`
- MCP encryption key generated

### 🔒 Additional Recommendations

1. **Never commit sensitive files**:
   ```bash
   git add .
   git status  # Always check before committing
   ```

2. **Use environment-specific .env files**:
   - `.env.development`
   - `.env.production`
   - `.env.test`

3. **Rotate credentials regularly**:
   - Change passwords every 90 days
   - Regenerate API keys if exposed

4. **Use secret management tools** (for production):
   - **Windows**: Windows Credential Manager
   - **Cross-platform**: HashiCorp Vault, AWS Secrets Manager

## 📝 Current Status

| Item | Status | Action Required |
|------|--------|-----------------|
| `.env` credentials removed | ✅ | Update with App Password |
| `.gitignore` configured | ✅ | None |
| MCP encryption key | ✅ | None |
| Anthropic API keys | ⚠️ | Add complete keys |

## 🚨 Emergency Actions

### If Credentials Were Committed to Git

```bash
# Remove sensitive file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (use with caution!)
git push origin --force --all
```

### If Gmail Password Was Exposed

1. **Immediately change your Gmail password**: https://myaccount.google.com/security
2. **Review recent account activity**: https://myaccount.google.com/device-activity
3. **Enable 2-Factor Authentication** if not already enabled
4. **Generate and use App Password** instead

## 📞 Support Resources

- **Anthropic Support**: https://support.anthropic.com
- **Gmail Security**: https://support.google.com/mail/answer/7036019
- **Git Security**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure

---

**Last Updated**: 2025-10-30
**Status**: Security remediation completed ✅
