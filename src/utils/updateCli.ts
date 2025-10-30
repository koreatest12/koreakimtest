#!/usr/bin/env node

import {
  checkForUpdates,
  performUpdate,
  runAutoUpdate,
  displayConfig,
  configureUpdate,
} from "./autoUpdate.js";

const args = process.argv.slice(2);
const command = args[0];

async function main(): Promise<void> {
  try {
    switch (command) {
      case "check":
        // Manual check for updates
        await handleCheck();
        break;

      case "update":
      case "install":
        // Perform update
        await handleUpdate();
        break;

      case "auto":
        // Run auto-update (respects configuration)
        await handleAuto();
        break;

      case "config":
        // Configure auto-update settings
        await handleConfig();
        break;

      case "status":
        // Display current configuration
        await displayConfig();
        break;

      case "enable":
        // Enable auto-update
        await configureUpdate({ enabled: true });
        break;

      case "disable":
        // Disable auto-update
        await configureUpdate({ enabled: false });
        break;

      case "help":
      case "--help":
      case "-h":
        displayHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        displayHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

async function handleCheck(): Promise<void> {
  const packageName = args[1]; // Optional package name
  console.log("Checking for updates...\n");

  const versionInfo = await checkForUpdates(packageName);

  if (versionInfo.updateAvailable) {
    console.log("╔════════════════════════════════════════╗");
    console.log("║     UPDATE AVAILABLE                   ║");
    console.log("╚════════════════════════════════════════╝\n");
    console.log(`Current version: ${versionInfo.current}`);
    console.log(`Latest version:  ${versionInfo.latest}`);

    if (versionInfo.releaseNotes) {
      console.log(`\nRelease notes:\n${versionInfo.releaseNotes}`);
    }

    console.log("\nTo update, run:");
    console.log("  npm run update");
    console.log("  or: npm install <package-name>@latest");
  } else {
    console.log(`✓ You are using the latest version (${versionInfo.current})`);
  }
}

async function handleUpdate(): Promise<void> {
  const packageName = args[1];

  if (!packageName) {
    console.error("Error: Package name is required for update");
    console.log("Usage: npm run update <package-name>");
    process.exit(1);
  }

  console.log(`Updating ${packageName}...\n`);
  await performUpdate(packageName);
}

async function handleAuto(): Promise<void> {
  const packageName = args[1]; // Optional package name
  await runAutoUpdate(packageName);
}

async function handleConfig(): Promise<void> {
  const option = args[1];
  const value = args[2];

  if (!option || !value) {
    console.log("Current configuration:");
    await displayConfig();
    console.log("\nTo change settings, use:");
    console.log("  npm run update-config -- config <option> <value>");
    console.log("\nAvailable options:");
    console.log("  enabled <true|false>");
    console.log("  checkInterval <hours>");
    console.log("  autoInstall <true|false>");
    console.log("  notifyOnly <true|false>");
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {};

  switch (option) {
    case "enabled":
    case "autoInstall":
    case "notifyOnly":
      config[option] = value === "true";
      break;

    case "checkInterval":
      config[option] = parseInt(value, 10);
      if (isNaN(config[option])) {
        console.error("Error: checkInterval must be a number");
        process.exit(1);
      }
      break;

    default:
      console.error(`Unknown option: ${option}`);
      process.exit(1);
  }

  await configureUpdate(config);
}

function displayHelp(): void {
  console.log(`
╔════════════════════════════════════════╗
║   AUTO-UPDATE CLI                      ║
╚════════════════════════════════════════╝

Usage: npm run <command> [options]

Commands:
  check [package]           Check for available updates
  update <package>          Update to the latest version
  auto [package]            Run auto-update (respects configuration)
  config <option> <value>   Configure auto-update settings
  status                    Display current configuration
  enable                    Enable auto-update
  disable                   Disable auto-update
  help                      Display this help message

Examples:
  npm run update-check
  npm run update-install my-package
  npm run update-config -- config enabled true
  npm run update-config -- config checkInterval 24
  npm run update-status

Configuration Options:
  enabled        Enable/disable auto-update (true/false)
  checkInterval  Hours between update checks (number)
  autoInstall    Automatically install updates (true/false)
  notifyOnly     Only notify, don't install (true/false)

For more information, visit: https://github.com/your-repo
  `);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { main };
