/**
 * CLI tool for encrypting and decrypting MCP configuration files
 */

import "dotenv/config";
import {
  encryptFile,
  decryptFile,
  getEncryptionPassword,
  isEncrypted,
} from "./encryption.js";
import fs from "fs/promises";
import path from "path";

const MCP_CONFIG_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".mcp.json",
);
const ENCRYPTED_CONFIG_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".mcp.json.encrypted",
);
const BACKUP_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".mcp.json.backup",
);

/**
 * Encrypts the MCP configuration file
 */
export async function encryptMCPConfig(): Promise<void> {
  console.log("🔒 Encrypting MCP configuration...\n");

  try {
    // Check if original config exists
    const configExists = await fs
      .access(MCP_CONFIG_PATH)
      .then(() => true)
      .catch(() => false);
    if (!configExists) {
      throw new Error(`MCP config file not found at: ${MCP_CONFIG_PATH}`);
    }

    // Check if already encrypted
    if (await isEncrypted(MCP_CONFIG_PATH)) {
      console.log("⚠️  Configuration file is already encrypted.");
      return;
    }

    // Get encryption password
    const password = getEncryptionPassword();

    // Create backup before encryption
    await fs.copyFile(MCP_CONFIG_PATH, BACKUP_PATH);
    console.log(`✓ Backup created at: ${BACKUP_PATH}`);

    // Encrypt the configuration
    await encryptFile(MCP_CONFIG_PATH, ENCRYPTED_CONFIG_PATH, password);
    console.log(`✓ Encrypted configuration saved to: ${ENCRYPTED_CONFIG_PATH}`);

    // Optional: Remove original unencrypted file
    console.log(
      "\n⚠️  Original unencrypted file still exists at: " + MCP_CONFIG_PATH,
    );
    console.log(
      "   Consider deleting it after verifying the encrypted version works.",
    );
    console.log("   Backup is available at: " + BACKUP_PATH);

    console.log("\n✅ Encryption completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Test decryption with: npm run decrypt-mcp");
    console.log("   2. Set MCP_ENCRYPTION_KEY in your environment");
    console.log("   3. Update your MCP loader to use encrypted config");
  } catch (error) {
    console.error(
      "\n❌ Encryption failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

/**
 * Decrypts the MCP configuration file
 */
export async function decryptMCPConfig(): Promise<void> {
  console.log("🔓 Decrypting MCP configuration...\n");

  try {
    // Check if encrypted config exists
    const encryptedExists = await fs
      .access(ENCRYPTED_CONFIG_PATH)
      .then(() => true)
      .catch(() => false);
    if (!encryptedExists) {
      throw new Error(
        `Encrypted config file not found at: ${ENCRYPTED_CONFIG_PATH}`,
      );
    }

    // Get encryption password
    const password = getEncryptionPassword();

    // Decrypt the configuration
    const outputPath = MCP_CONFIG_PATH + ".decrypted";
    await decryptFile(ENCRYPTED_CONFIG_PATH, outputPath, password);
    console.log(`✓ Decrypted configuration saved to: ${outputPath}`);

    console.log("\n✅ Decryption completed successfully!");
    console.log(
      "\n⚠️  Security reminder: Delete the decrypted file after use.",
    );
  } catch (error) {
    console.error(
      "\n❌ Decryption failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

/**
 * Loads and decrypts MCP configuration in memory (without writing to disk)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadEncryptedMCPConfig(): Promise<any> {
  try {
    const encryptedExists = await fs
      .access(ENCRYPTED_CONFIG_PATH)
      .then(() => true)
      .catch(() => false);

    if (!encryptedExists) {
      // Fall back to regular config if encrypted version doesn't exist
      const regularConfig = await fs.readFile(MCP_CONFIG_PATH, "utf8");
      return JSON.parse(regularConfig);
    }

    // Get encryption password
    const password = getEncryptionPassword();

    // Read and decrypt in memory
    const { decryptJSON } = await import("./encryption.js");
    const encryptedData = await fs.readFile(ENCRYPTED_CONFIG_PATH, "utf8");
    return decryptJSON(encryptedData, password);
  } catch (error) {
    console.error(
      "Failed to load MCP config:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

/**
 * Restores MCP configuration from backup
 */
export async function restoreMCPConfigBackup(): Promise<void> {
  console.log("♻️  Restoring MCP configuration from backup...\n");

  try {
    const backupExists = await fs
      .access(BACKUP_PATH)
      .then(() => true)
      .catch(() => false);
    if (!backupExists) {
      throw new Error(`Backup file not found at: ${BACKUP_PATH}`);
    }

    await fs.copyFile(BACKUP_PATH, MCP_CONFIG_PATH);
    console.log(`✓ Configuration restored from: ${BACKUP_PATH}`);
    console.log(`✓ Active configuration: ${MCP_CONFIG_PATH}`);

    console.log("\n✅ Restore completed successfully!");
  } catch (error) {
    console.error(
      "\n❌ Restore failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

/**
 * Shows status of MCP configuration files
 */
export async function showMCPConfigStatus(): Promise<void> {
  console.log("📊 MCP Configuration Status\n");
  console.log("─".repeat(60));

  const files = [
    { path: MCP_CONFIG_PATH, label: "Main Config" },
    { path: ENCRYPTED_CONFIG_PATH, label: "Encrypted Config" },
    { path: BACKUP_PATH, label: "Backup" },
  ];

  for (const file of files) {
    const exists = await fs
      .access(file.path)
      .then(() => true)
      .catch(() => false);
    const status = exists ? "✓" : "✗";
    let info = "";

    if (exists) {
      const stats = await fs.stat(file.path);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const encrypted = await isEncrypted(file.path);
      info = `${sizeKB} KB ${encrypted ? "(encrypted)" : "(plaintext)"}`;
    }

    console.log(
      `${status} ${file.label.padEnd(20)} ${exists ? info : "Not found"}`,
    );
  }

  console.log("─".repeat(60));

  // Check environment variable
  const hasKey = !!process.env.MCP_ENCRYPTION_KEY;
  console.log(`\n🔑 MCP_ENCRYPTION_KEY: ${hasKey ? "✓ Set" : "✗ Not set"}`);

  if (!hasKey) {
    console.log(
      "   ⚠️  Set MCP_ENCRYPTION_KEY environment variable to use encryption",
    );
  }
}

// CLI interface
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const command = process.argv[2];

  void (async () => {
    try {
      switch (command) {
        case "encrypt":
          await encryptMCPConfig();
          break;
        case "decrypt":
          await decryptMCPConfig();
          break;
        case "load": {
          const config = await loadEncryptedMCPConfig();
          console.log(JSON.stringify(config, null, 2));
          break;
        }
        case "restore":
          await restoreMCPConfigBackup();
          break;
        case "status":
          await showMCPConfigStatus();
          break;
        default:
          console.log("MCP Configuration Encryption Tool\n");
          console.log("Usage:");
          console.log(
            "  npm run mcp-encrypt          Encrypt MCP configuration",
          );
          console.log(
            "  npm run mcp-decrypt          Decrypt MCP configuration",
          );
          console.log(
            "  npm run mcp-load             Load encrypted config (memory only)",
          );
          console.log("  npm run mcp-restore          Restore from backup");
          console.log(
            "  npm run mcp-status           Show configuration status",
          );
          console.log("\nEnvironment:");
          console.log(
            "  MCP_ENCRYPTION_KEY - Required encryption password (min 16 chars)",
          );
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    } catch (_error) {
      process.exit(1);
    }
  })();
}
