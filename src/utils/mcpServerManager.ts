import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

interface MCPServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServer>;
}

interface ServerInfo {
  name: string;
  type: "npm" | "python" | "java" | "other";
  package?: string;
  version?: string;
  path?: string;
}

const MCP_CONFIG_PATH = path.join(process.cwd(), ".mcp.json");

/**
 * Load MCP configuration from .mcp.json
 */
export async function loadMCPConfig(): Promise<MCPConfig> {
  try {
    const content = await fs.readFile(MCP_CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load MCP config: ${error}`);
  }
}

/**
 * Save MCP configuration to .mcp.json
 */
export async function saveMCPConfig(config: MCPConfig): Promise<void> {
  try {
    await fs.writeFile(
      MCP_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      "utf-8",
    );
  } catch (error) {
    throw new Error(`Failed to save MCP config: ${error}`);
  }
}

/**
 * List all configured MCP servers
 */
export async function listMCPServers(): Promise<ServerInfo[]> {
  const config = await loadMCPConfig();
  const servers: ServerInfo[] = [];

  for (const [name, server] of Object.entries(config.mcpServers)) {
    const info: ServerInfo = {
      name,
      type: detectServerType(server),
    };

    // Extract package information
    if (info.type === "npm") {
      const packageMatch = server.args.find((arg) => arg.includes("@"));
      if (packageMatch) {
        info.package = packageMatch.split("/").pop()?.split("@")[0];
      }
    } else if (info.type === "python") {
      const scriptPath = server.args.find((arg) => arg.endsWith(".py"));
      if (scriptPath) {
        info.path = scriptPath;
      }
    }

    servers.push(info);
  }

  return servers;
}

/**
 * Detect server type based on command and args
 */
function detectServerType(
  server: MCPServer,
): "npm" | "python" | "java" | "other" {
  const cmd = server.command.toLowerCase();
  const args = server.args.join(" ").toLowerCase();

  if (cmd.includes("npx") || cmd.includes("node") || args.includes("npx")) {
    return "npm";
  } else if (cmd.includes("python") || args.includes(".py")) {
    return "python";
  } else if (cmd.includes("java") || args.includes(".jar")) {
    return "java";
  }
  return "other";
}

/**
 * Install an npm-based MCP server
 */
export async function installNpmMCPServer(
  packageName: string,
  serverName: string,
  serverPath?: string,
): Promise<void> {
  console.log(`Installing npm MCP server: ${packageName}...`);

  try {
    // Install the package
    const installCmd = `npm install ${packageName}`;
    console.log(`Running: ${installCmd}`);
    const { stdout, stderr } = await execAsync(installCmd);

    if (stderr && !stderr.includes("npm WARN")) {
      console.warn("Installation warnings:", stderr);
    }
    console.log(stdout);

    // Add to MCP configuration
    const config = await loadMCPConfig();

    const newServer: MCPServer = {
      command: "npx",
      args: ["-y", packageName],
      env: {},
    };

    if (serverPath) {
      newServer.args.push(serverPath);
    }

    config.mcpServers[serverName] = newServer;
    await saveMCPConfig(config);

    console.log(`✓ Successfully installed and configured: ${serverName}`);
  } catch (error) {
    throw new Error(`Failed to install npm MCP server: ${error}`);
  }
}

/**
 * Install a Python-based MCP server
 */
export async function installPythonMCPServer(
  serverPath: string,
  serverName: string,
  requirementsPath?: string,
): Promise<void> {
  console.log(`Installing Python MCP server: ${serverPath}...`);

  try {
    const serverDir = path.dirname(serverPath);

    // Create virtual environment if it doesn't exist
    const venvPath = path.join(serverDir, ".venv");
    const venvExists = await fs
      .access(venvPath)
      .then(() => true)
      .catch(() => false);

    if (!venvExists) {
      console.log("Creating virtual environment...");
      await execAsync(`python -m venv "${venvPath}"`);
    }

    // Install requirements if provided
    if (requirementsPath) {
      console.log("Installing Python dependencies...");
      const pythonExe =
        process.platform === "win32"
          ? path.join(venvPath, "Scripts", "python.exe")
          : path.join(venvPath, "bin", "python");
      await execAsync(`"${pythonExe}" -m pip install -r "${requirementsPath}"`);
    }

    // Add to MCP configuration
    const config = await loadMCPConfig();
    const pythonExe =
      process.platform === "win32"
        ? path.join(venvPath, "Scripts", "python.exe")
        : path.join(venvPath, "bin", "python");

    config.mcpServers[serverName] = {
      command: pythonExe,
      args: [serverPath],
      env: { PYTHONUNBUFFERED: "1" },
    };

    await saveMCPConfig(config);
    console.log(`✓ Successfully installed and configured: ${serverName}`);
  } catch (error) {
    throw new Error(`Failed to install Python MCP server: ${error}`);
  }
}

/**
 * Upgrade an npm-based MCP server
 */
export async function upgradeNpmMCPServer(
  packageName: string,
  serverName: string,
): Promise<void> {
  console.log(`Upgrading npm MCP server: ${packageName}...`);

  try {
    const upgradeCmd = `npm install ${packageName}@latest`;
    console.log(`Running: ${upgradeCmd}`);
    const { stdout, stderr } = await execAsync(upgradeCmd);

    if (stderr && !stderr.includes("npm WARN")) {
      console.warn("Upgrade warnings:", stderr);
    }
    console.log(stdout);

    console.log(`✓ Successfully upgraded: ${serverName}`);
  } catch (error) {
    throw new Error(`Failed to upgrade npm MCP server: ${error}`);
  }
}

/**
 * Upgrade a Python-based MCP server
 */
export async function upgradePythonMCPServer(
  serverPath: string,
  serverName: string,
  requirementsPath?: string,
): Promise<void> {
  console.log(`Upgrading Python MCP server: ${serverPath}...`);

  try {
    const serverDir = path.dirname(serverPath);
    const venvPath = path.join(serverDir, ".venv");

    // Upgrade pip first
    const pythonExe =
      process.platform === "win32"
        ? path.join(venvPath, "Scripts", "python.exe")
        : path.join(venvPath, "bin", "python");

    console.log("Upgrading pip...");
    await execAsync(`"${pythonExe}" -m pip install --upgrade pip`);

    // Upgrade requirements if provided
    if (requirementsPath) {
      console.log("Upgrading Python dependencies...");
      await execAsync(
        `"${pythonExe}" -m pip install --upgrade -r "${requirementsPath}"`,
      );
    }

    console.log(`✓ Successfully upgraded: ${serverName}`);
  } catch (error) {
    throw new Error(`Failed to upgrade Python MCP server: ${error}`);
  }
}

/**
 * Check for available updates for npm packages
 */
export async function checkNpmPackageUpdate(
  packageName: string,
): Promise<{ current?: string; latest: string; updateAvailable: boolean }> {
  try {
    // Get latest version
    const { stdout: latestStdout } = await execAsync(
      `npm view ${packageName} version`,
    );
    const latest = latestStdout.trim();

    // Try to get current version
    let current: string | undefined;
    try {
      const { stdout: currentStdout } = await execAsync(
        `npm list ${packageName} --depth=0 --json`,
      );
      const data = JSON.parse(currentStdout);
      current = data.dependencies?.[packageName]?.version;
    } catch {
      // Package not installed
      current = undefined;
    }

    const updateAvailable = current ? current !== latest : true;

    return { current, latest, updateAvailable };
  } catch (error) {
    throw new Error(`Failed to check npm package update: ${error}`);
  }
}

/**
 * Remove an MCP server from configuration
 */
export async function removeMCPServer(serverName: string): Promise<void> {
  try {
    const config = await loadMCPConfig();

    if (!config.mcpServers[serverName]) {
      throw new Error(`Server not found: ${serverName}`);
    }

    delete config.mcpServers[serverName];
    await saveMCPConfig(config);

    console.log(`✓ Successfully removed server: ${serverName}`);
    console.log(
      "Note: This only removes the configuration. Dependencies are not uninstalled.",
    );
  } catch (error) {
    throw new Error(`Failed to remove MCP server: ${error}`);
  }
}

/**
 * Get detailed information about a specific MCP server
 */
export async function getMCPServerInfo(
  serverName: string,
): Promise<ServerInfo | null> {
  const servers = await listMCPServers();
  return servers.find((s) => s.name === serverName) || null;
}
