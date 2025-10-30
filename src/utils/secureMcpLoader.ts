/**
 * Secure MCP Configuration Loader
 * Loads encrypted MCP configuration and provides secure access
 */

import "dotenv/config";
import { loadEncryptedMCPConfig } from "./mcpConfigEncryption.js";

export interface MCPServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServer>;
}

/**
 * Loads MCP configuration (encrypted or plaintext)
 * Automatically detects and handles encrypted configurations
 */
export async function loadMCPConfig(): Promise<MCPConfig> {
  try {
    return await loadEncryptedMCPConfig();
  } catch (error) {
    console.error(
      "Failed to load MCP configuration:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

/**
 * Gets a specific MCP server configuration by name
 */
export async function getMCPServer(
  serverName: string,
): Promise<MCPServer | null> {
  const config = await loadMCPConfig();
  return config.mcpServers[serverName] || null;
}

/**
 * Lists all available MCP servers
 */
export async function listMCPServers(): Promise<string[]> {
  const config = await loadMCPConfig();
  return Object.keys(config.mcpServers);
}

/**
 * Validates MCP server configuration
 */
export function validateMCPServer(server: MCPServer): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!server.command) {
    errors.push("Command is required");
  }

  if (!Array.isArray(server.args)) {
    errors.push("Args must be an array");
  }

  if (server.env && typeof server.env !== "object") {
    errors.push("Env must be an object");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Safely displays MCP configuration (masks sensitive data)
 */
export function sanitizeMCPConfig(config: MCPConfig): MCPConfig {
  const sanitized: MCPConfig = { mcpServers: {} };

  for (const [name, server] of Object.entries(config.mcpServers)) {
    sanitized.mcpServers[name] = {
      command: server.command,
      args: server.args.map((arg) => {
        // Mask potential sensitive paths or tokens
        if (
          arg.includes("api") ||
          arg.includes("token") ||
          arg.includes("key")
        ) {
          return "[REDACTED]";
        }
        return arg;
      }),
      env: server.env
        ? {
            ...server.env,
            // Mask sensitive environment variables
            ...Object.fromEntries(
              Object.entries(server.env).map(([key, value]) => [
                key,
                key.toLowerCase().includes("key") ||
                key.toLowerCase().includes("token") ||
                key.toLowerCase().includes("secret")
                  ? "[REDACTED]"
                  : value,
              ]),
            ),
          }
        : undefined,
    };
  }

  return sanitized;
}

/**
 * CLI interface for testing the loader
 */
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  void (async () => {
    try {
      console.log("🔐 Secure MCP Configuration Loader\n");

      const command = process.argv[2];

      switch (command) {
        case "list": {
          const servers = await listMCPServers();
          console.log(`Found ${servers.length} MCP servers:\n`);
          servers.forEach((name, index) => {
            console.log(`  ${index + 1}. ${name}`);
          });
          break;
        }

        case "get": {
          const serverName = process.argv[3];
          if (!serverName) {
            console.error("❌ Please specify a server name");
            process.exit(1);
          }
          const server = await getMCPServer(serverName);
          if (server) {
            console.log(`Configuration for "${serverName}":\n`);
            console.log(JSON.stringify(server, null, 2));
          } else {
            console.error(`❌ Server "${serverName}" not found`);
            process.exit(1);
          }
          break;
        }

        case "show": {
          const config = await loadMCPConfig();
          const sanitized = sanitizeMCPConfig(config);
          console.log("MCP Configuration (sanitized):\n");
          console.log(JSON.stringify(sanitized, null, 2));
          break;
        }

        case "validate": {
          const allConfig = await loadMCPConfig();
          console.log("Validating MCP configuration...\n");
          let hasErrors = false;
          for (const [name, srv] of Object.entries(allConfig.mcpServers)) {
            const result = validateMCPServer(srv);
            if (!result.valid) {
              console.error(`❌ ${name}: ${result.errors.join(", ")}`);
              hasErrors = true;
            } else {
              console.log(`✓ ${name}: Valid`);
            }
          }
          if (!hasErrors) {
            console.log("\n✅ All servers are valid");
          } else {
            process.exit(1);
          }
          break;
        }

        default:
          console.log("Usage:");
          console.log(
            "  npm run mcp-loader list              List all MCP servers",
          );
          console.log(
            "  npm run mcp-loader get <name>        Get specific server config",
          );
          console.log(
            "  npm run mcp-loader show              Show full config (sanitized)",
          );
          console.log(
            "  npm run mcp-loader validate          Validate configuration",
          );
      }
    } catch (error) {
      console.error(
        "\n❌ Error:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  })();
}
