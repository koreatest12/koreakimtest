# Auto-Update Feature Documentation

## Overview

The auto-update feature automatically checks for new versions of your packages and can optionally install them. This ensures your project stays up-to-date with the latest features, bug fixes, and security patches.

## Features

- **Automatic version checking**: Periodically checks npm registry for new versions
- **Configurable intervals**: Set how often to check for updates (default: 24 hours)
- **Manual or automatic updates**: Choose to be notified only or auto-install
- **Release notes**: View what's new in the latest version
- **CLI commands**: Full command-line interface for managing updates

## Quick Start

### Enable Auto-Update

```bash
npm run update-enable
```

### Check for Updates Manually

```bash
npm run update-check
```

### Check Update Status

```bash
npm run update-status
```

## Available Commands

### Check for Updates

Check if a new version is available:

```bash
npm run update-check [package-name]
```

**Example:**
```bash
npm run update-check
npm run update-check mcp-security
```

### Install Updates

Install the latest version of a package:

```bash
npm run update-install <package-name>
```

**Example:**
```bash
npm run update-install mcp-security
```

### Run Auto-Update

Run the auto-update process (respects your configuration):

```bash
npm run update-auto [package-name]
```

This command:
1. Checks if auto-update is enabled
2. Verifies if enough time has passed since last check
3. Checks for updates
4. Installs updates (if `autoInstall` is enabled) or notifies you

### Configure Settings

View or modify auto-update configuration:

```bash
# View current configuration
npm run update-config

# Change a setting
npm run update-config -- config <option> <value>
```

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable auto-update |
| `checkInterval` | number | `24` | Hours between update checks |
| `autoInstall` | boolean | `false` | Automatically install updates |
| `notifyOnly` | boolean | `true` | Only notify, don't auto-install |

**Examples:**
```bash
# Enable auto-update
npm run update-config -- config enabled true

# Check every 12 hours
npm run update-config -- config checkInterval 12

# Enable auto-installation
npm run update-config -- config autoInstall true

# Disable notifications only (allow auto-install)
npm run update-config -- config notifyOnly false
```

### View Status

Display current configuration:

```bash
npm run update-status
```

### Enable/Disable

Quick commands to enable or disable auto-update:

```bash
# Enable
npm run update-enable

# Disable
npm run update-disable
```

## Configuration File

Auto-update settings are stored in `.auto-update.json` at the project root:

```json
{
  "enabled": true,
  "checkInterval": 24,
  "autoInstall": false,
  "notifyOnly": true
}
```

You can manually edit this file or use the CLI commands.

## Update Workflow

### Notification Only (Default)

1. Auto-update checks for new versions every 24 hours
2. If an update is found, you're notified with:
   - Current version
   - Latest version
   - Release notes
3. You manually install the update when ready

**Configuration:**
```bash
npm run update-config -- config autoInstall false
npm run update-config -- config notifyOnly true
```

### Automatic Installation

1. Auto-update checks for new versions every 24 hours
2. If an update is found, it's automatically installed
3. You're notified of the successful installation

**Configuration:**
```bash
npm run update-config -- config autoInstall true
npm run update-config -- config notifyOnly false
```

## Integration Examples

### Add to Startup Script

Add auto-update check to your application startup:

```typescript
import { runAutoUpdate } from './src/utils/autoUpdate.js';

async function startup() {
  // Run auto-update check
  await runAutoUpdate('mcp-security');

  // Your application code...
}

startup();
```

### Scheduled Updates

Use with task schedulers for periodic updates:

**Windows Task Scheduler:**
- Task: Run `npm run update-auto` daily

**Cron (Linux/Mac):**
```bash
# Check for updates daily at 3 AM
0 3 * * * cd /path/to/project && npm run update-auto
```

### CI/CD Pipeline

Add update checks to your CI/CD pipeline:

```yaml
# .github/workflows/auto-update.yml
name: Auto Update
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run update-check
```

## How It Works

### Version Checking

1. Reads current version from `package.json`
2. Queries npm registry for latest published version
3. Compares versions using semantic versioning
4. Retrieves release notes if available

### Update Installation

1. Executes `npm install <package>@latest`
2. Updates `package.json` and `package-lock.json`
3. Installs updated dependencies
4. Verifies installation success

### Timing Control

- Last check timestamp stored in `.last-update-check`
- Prevents excessive API calls
- Configurable check interval (default: 24 hours)

## Best Practices

1. **Start with notifications only**: Test the feature before enabling auto-install
   ```bash
   npm run update-config -- config notifyOnly true
   ```

2. **Review release notes**: Check what's changed before updating
   ```bash
   npm run update-check
   ```

3. **Set appropriate intervals**: Balance between staying updated and avoiding disruptions
   ```bash
   npm run update-config -- config checkInterval 168  # Weekly
   ```

4. **Test in development**: Enable auto-install in dev, notifications only in production
   ```bash
   # Development
   npm run update-config -- config autoInstall true

   # Production
   npm run update-config -- config notifyOnly true
   ```

5. **Monitor update logs**: Keep track of when updates occur and any issues

## Troubleshooting

### Updates Not Checking

**Problem**: Auto-update doesn't seem to run

**Solutions**:
1. Verify auto-update is enabled:
   ```bash
   npm run update-status
   ```

2. Check last update time in `.last-update-check`

3. Manually trigger update:
   ```bash
   npm run update-auto
   ```

### Installation Failures

**Problem**: Update check succeeds but installation fails

**Solutions**:
1. Check npm permissions
2. Verify network connectivity
3. Try manual installation:
   ```bash
   npm install <package>@latest
   ```

4. Check for dependency conflicts:
   ```bash
   npm list <package>
   ```

### Version Comparison Issues

**Problem**: Incorrect version comparison

**Solutions**:
1. Verify `package.json` format
2. Ensure version follows semantic versioning (e.g., `1.2.3`)
3. Check npm registry availability:
   ```bash
   npm view <package> version
   ```

## Security Considerations

1. **Verify package source**: Only update from trusted npm registry
2. **Review changes**: Check release notes before auto-installing
3. **Test updates**: Use staging environment before production
4. **Lock critical versions**: Consider disabling auto-update for production-critical packages

## API Reference

### Functions

#### `checkForUpdates(packageName?: string): Promise<VersionInfo>`

Check if an update is available.

**Returns:**
```typescript
{
  current: string;      // Current version
  latest: string;       // Latest version
  updateAvailable: boolean;
  releaseNotes?: string;
}
```

#### `performUpdate(packageName: string): Promise<void>`

Install the latest version of a package.

#### `runAutoUpdate(packageName?: string): Promise<void>`

Run full auto-update workflow with configuration respect.

#### `loadConfig(): Promise<UpdateConfig>`

Load current auto-update configuration.

#### `saveConfig(config: UpdateConfig): Promise<void>`

Save auto-update configuration.

#### `configureUpdate(options: Partial<UpdateConfig>): Promise<void>`

Update specific configuration options.

## Examples

### Programmatic Usage

```typescript
import {
  checkForUpdates,
  performUpdate,
  configureUpdate,
} from './src/utils/autoUpdate.js';

// Check for updates
const info = await checkForUpdates('mcp-security');
if (info.updateAvailable) {
  console.log(`Update available: ${info.current} → ${info.latest}`);
}

// Configure auto-update
await configureUpdate({
  enabled: true,
  checkInterval: 12,
  autoInstall: false,
});

// Perform update
await performUpdate('mcp-security');
```

### Custom Update Logic

```typescript
import { checkForUpdates, performUpdate } from './src/utils/autoUpdate.js';

async function customUpdateLogic() {
  const info = await checkForUpdates('mcp-security');

  if (info.updateAvailable) {
    // Custom decision logic
    const shouldUpdate = await askUserPermission();

    if (shouldUpdate) {
      await performUpdate('mcp-security');
      console.log('Update completed!');
    }
  }
}
```

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section above

## License

This feature is part of the mcp-security project and follows the same license.
