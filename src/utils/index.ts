// Utility functions

// MCP Server Management
export {
  loadMCPConfig,
  saveMCPConfig,
  listMCPServers,
  installNpmMCPServer,
  installPythonMCPServer,
  upgradeNpmMCPServer,
  upgradePythonMCPServer,
  checkNpmPackageUpdate,
  removeMCPServer,
  getMCPServerInfo,
} from "./mcpServerManager.js";

// Auto Update
export {
  getCurrentVersion,
  getLatestVersion,
  checkForUpdates,
  performUpdate,
  runAutoUpdate,
  displayConfig,
  configureUpdate,
} from "./autoUpdate.js";

// MCP Configuration Encryption
export {
  encryptMCPConfig,
  decryptMCPConfig,
  loadEncryptedMCPConfig,
  restoreMCPConfigBackup,
  showMCPConfigStatus,
} from "./mcpConfigEncryption.js";

// Encryption utilities
export {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  encryptFile,
  decryptFile,
  getEncryptionPassword,
  isEncrypted,
  deriveKey,
} from "./encryption.js";
