#!/usr/bin/env node

import {
  listMCPServers,
  installNpmMCPServer,
  installPythonMCPServer,
  upgradeNpmMCPServer,
  upgradePythonMCPServer,
  checkNpmPackageUpdate,
  removeMCPServer,
  getMCPServerInfo,
} from "./mcpServerManager.js";

const args = process.argv.slice(2);
const command = args[0];

async function main(): Promise<void> {
  try {
    switch (command) {
      case "list":
        await handleList();
        break;

      case "install":
        await handleInstall();
        break;

      case "upgrade":
        await handleUpgrade();
        break;

      case "check":
        await handleCheck();
        break;

      case "remove":
        await handleRemove();
        break;

      case "info":
        await handleInfo();
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
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function handleList(): Promise<void> {
  console.log("📋 Configured MCP Servers:\n");
  console.log("─".repeat(70));

  const servers = await listMCPServers();

  if (servers.length === 0) {
    console.log("No MCP servers configured.");
    return;
  }

  for (const server of servers) {
    const typeIcon =
      server.type === "npm"
        ? "📦"
        : server.type === "python"
          ? "🐍"
          : server.type === "java"
            ? "☕"
            : "❓";

    console.log(`${typeIcon} ${server.name} (${server.type})`);
    if (server.package) {
      console.log(`   Package: ${server.package}`);
    }
    if (server.path) {
      console.log(`   Path: ${server.path}`);
    }
    console.log("");
  }

  console.log("─".repeat(70));
  console.log(`Total: ${servers.length} server(s)\n`);
}

async function handleInstall(): Promise<void> {
  const type = args[1]; // npm or python
  const name = args[2]; // server name
  const target = args[3]; // package name or path

  if (!type || !name || !target) {
    console.error("Error: Missing required arguments");
    console.log("\nUsage:");
    console.log(
      "  npm run mcp-install npm <server-name> <package-name> [path]",
    );
    console.log(
      "  npm run mcp-install python <server-name> <script-path> [requirements-path]",
    );
    console.log("\nExamples:");
    console.log(
      "  npm run mcp-install npm filesystem @modelcontextprotocol/server-filesystem /home/user",
    );
    console.log(
      "  npm run mcp-install python my-server ./server.py ./requirements.txt",
    );
    process.exit(1);
  }

  if (type === "npm") {
    const serverPath = args[4]; // optional path argument for npm servers
    await installNpmMCPServer(target, name, serverPath);
  } else if (type === "python") {
    const requirementsPath = args[4]; // optional requirements path
    await installPythonMCPServer(target, name, requirementsPath);
  } else {
    console.error(`Unknown server type: ${type}`);
    console.log("Supported types: npm, python");
    process.exit(1);
  }
}

async function handleUpgrade(): Promise<void> {
  const serverName = args[1];

  if (!serverName) {
    console.error("Error: Server name is required");
    console.log("\nUsage:");
    console.log(
      "  npm run mcp-upgrade <server-name> [package-name] [requirements-path]",
    );
    console.log("\nExamples:");
    console.log(
      "  npm run mcp-upgrade filesystem @modelcontextprotocol/server-filesystem",
    );
    console.log(
      "  npm run mcp-upgrade my-python-server ./server.py ./requirements.txt",
    );
    process.exit(1);
  }

  const serverInfo = await getMCPServerInfo(serverName);
  if (!serverInfo) {
    console.error(`Server not found: ${serverName}`);
    process.exit(1);
  }

  if (serverInfo.type === "npm") {
    const packageName = args[2];
    if (!packageName) {
      console.error("Error: Package name is required for npm servers");
      process.exit(1);
    }
    await upgradeNpmMCPServer(packageName, serverName);
  } else if (serverInfo.type === "python") {
    const scriptPath = args[2];
    const requirementsPath = args[3];
    if (!scriptPath) {
      console.error("Error: Script path is required for Python servers");
      process.exit(1);
    }
    await upgradePythonMCPServer(scriptPath, serverName, requirementsPath);
  } else {
    console.error(`Upgrade not supported for server type: ${serverInfo.type}`);
    process.exit(1);
  }
}

async function handleCheck(): Promise<void> {
  const packageName = args[1];

  if (!packageName) {
    console.error("Error: Package name is required");
    console.log("\nUsage:");
    console.log("  npm run mcp-check <package-name>");
    console.log("\nExample:");
    console.log("  npm run mcp-check @modelcontextprotocol/server-filesystem");
    process.exit(1);
  }

  console.log(`Checking for updates: ${packageName}\n`);

  const updateInfo = await checkNpmPackageUpdate(packageName);

  if (!updateInfo.current) {
    console.log("📦 Package not currently installed");
    console.log(`Latest version: ${updateInfo.latest}`);
    console.log("\nTo install, run:");
    console.log(`  npm run mcp-install npm <server-name> ${packageName}`);
  } else if (updateInfo.updateAvailable) {
    console.log("╔════════════════════════════════════════╗");
    console.log("║     UPDATE AVAILABLE                   ║");
    console.log("╚════════════════════════════════════════╝\n");
    console.log(`Current version: ${updateInfo.current}`);
    console.log(`Latest version:  ${updateInfo.latest}`);
    console.log("\nTo update, run:");
    console.log(`  npm run mcp-upgrade <server-name> ${packageName}`);
  } else {
    console.log(`✓ You are using the latest version (${updateInfo.current})`);
  }
}

async function handleRemove(): Promise<void> {
  const serverName = args[1];

  if (!serverName) {
    console.error("Error: Server name is required");
    console.log("\nUsage:");
    console.log("  npm run mcp-remove <server-name>");
    console.log("\nExample:");
    console.log("  npm run mcp-remove filesystem-home");
    process.exit(1);
  }

  await removeMCPServer(serverName);
}

async function handleInfo(): Promise<void> {
  const serverName = args[1];

  if (!serverName) {
    console.error("Error: Server name is required");
    console.log("\nUsage:");
    console.log("  npm run mcp-info <server-name>");
    console.log("\nExample:");
    console.log("  npm run mcp-info filesystem-home");
    process.exit(1);
  }

  const serverInfo = await getMCPServerInfo(serverName);

  if (!serverInfo) {
    console.error(`Server not found: ${serverName}`);
    process.exit(1);
  }

  console.log("\n📊 MCP Server Information\n");
  console.log("─".repeat(50));
  console.log(`Name:    ${serverInfo.name}`);
  console.log(`Type:    ${serverInfo.type}`);
  if (serverInfo.package) {
    console.log(`Package: ${serverInfo.package}`);
  }
  if (serverInfo.path) {
    console.log(`Path:    ${serverInfo.path}`);
  }
  if (serverInfo.version) {
    console.log(`Version: ${serverInfo.version}`);
  }
  console.log("─".repeat(50));
}

function displayHelp(): void {
  console.log(`
╔════════════════════════════════════════╗
║   MCP SERVER MANAGER CLI               ║
╚════════════════════════════════════════╝

Usage: npm run <command> [options]

Commands:
  list                          List all configured MCP servers
  install <type> <name> <target> [extra]
                               Install a new MCP server
  upgrade <name> [package] [requirements]
                               Upgrade an existing MCP server
  check <package>              Check for available updates (npm only)
  remove <name>                Remove an MCP server from configuration
  info <name>                  Display detailed server information
  help                         Display this help message

Installation Examples:
  npm run mcp-install npm filesystem @modelcontextprotocol/server-filesystem /home/user
  npm run mcp-install python my-server ./mcp-server/server.py ./mcp-server/requirements.txt

Upgrade Examples:
  npm run mcp-upgrade filesystem-home @modelcontextprotocol/server-filesystem
  npm run mcp-upgrade python-utils ./mcp-python-server/server.py ./mcp-python-server/requirements.txt

Other Examples:
  npm run mcp-list
  npm run mcp-check @modelcontextprotocol/server-filesystem
  npm run mcp-info filesystem-home
  npm run mcp-remove old-server

Supported Server Types:
  npm      - Node.js-based MCP servers (installed via npm)
  python   - Python-based MCP servers (uses virtual environment)

Notes:
  - npm servers use npx for execution
  - Python servers automatically create/use .venv in the server directory
  - Removing a server only updates .mcp.json, it doesn't uninstall dependencies

For more information, visit: https://github.com/koreatest12/koreakimtest
  `);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { main };
