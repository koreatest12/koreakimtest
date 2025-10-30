import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
// __dirname kept for potential future use
// eslint-disable-next-line no-unused-vars
const _unusedDirname = path.dirname(__filename);

interface VersionInfo {
  current: string;
  latest: string;
  updateAvailable: boolean;
  releaseNotes?: string;
}

interface UpdateConfig {
  enabled: boolean;
  checkInterval: number; // in hours
  autoInstall: boolean;
  notifyOnly: boolean;
}

interface PackageJson {
  name: string;
  version: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const DEFAULT_CONFIG: UpdateConfig = {
  enabled: true,
  checkInterval: 24, // Check every 24 hours
  autoInstall: false,
  notifyOnly: true,
};

const CONFIG_FILE = path.join(process.cwd(), ".auto-update.json");
const LAST_CHECK_FILE = path.join(process.cwd(), ".last-update-check");

/**
 * Get current package version from package.json
 */
export async function getCurrentVersion(): Promise<string> {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const content = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson: PackageJson = JSON.parse(content);
    return packageJson.version;
  } catch (error) {
    throw new Error(`Failed to read current version: ${error}`);
  }
}

/**
 * Get latest version from npm registry
 */
export async function getLatestVersion(packageName: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version`);
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to fetch latest version: ${error}`);
  }
}

/**
 * Get release notes from npm registry
 */
export async function getReleaseNotes(
  packageName: string,
  version: string,
): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `npm view ${packageName}@${version} description`,
    );
    return stdout.trim();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  } catch (_error) {
    return "No release notes available";
  }
}

/**
 * Compare semantic versions
 */
export function compareVersions(current: string, latest: string): boolean {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const curr = currentParts[i] || 0;
    const lat = latestParts[i] || 0;

    if (lat > curr) return true;
    if (lat < curr) return false;
  }

  return false;
}

/**
 * Check if an update is available
 */
export async function checkForUpdates(
  packageName?: string,
): Promise<VersionInfo> {
  try {
    const currentVersion = await getCurrentVersion();

    // If no package name provided, read from package.json
    if (!packageName) {
      const packageJsonPath = path.join(process.cwd(), "package.json");
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson: PackageJson = JSON.parse(content);
      packageName = packageJson.name;
    }

    const latestVersion = await getLatestVersion(packageName);
    const updateAvailable = compareVersions(currentVersion, latestVersion);

    let releaseNotes = "";
    if (updateAvailable) {
      releaseNotes = await getReleaseNotes(packageName, latestVersion);
    }

    return {
      current: currentVersion,
      latest: latestVersion,
      updateAvailable,
      releaseNotes,
    };
  } catch (error) {
    throw new Error(`Failed to check for updates: ${error}`);
  }
}

/**
 * Perform the update
 */
export async function performUpdate(packageName: string): Promise<void> {
  try {
    console.log("Updating package...");

    // Use npm update or global install depending on context
    const { stdout, stderr } = await execAsync(
      `npm install ${packageName}@latest`,
    );

    if (stderr && !stderr.includes("npm WARN")) {
      throw new Error(stderr);
    }

    console.log("Update completed successfully!");
    console.log(stdout);
  } catch (error) {
    throw new Error(`Failed to perform update: ${error}`);
  }
}

/**
 * Load update configuration
 */
export async function loadConfig(): Promise<UpdateConfig> {
  try {
    const content = await fs.readFile(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  } catch (_error) {
    // If config doesn't exist, return default
    return DEFAULT_CONFIG;
  }
}

/**
 * Save update configuration
 */
export async function saveConfig(config: UpdateConfig): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    throw new Error(`Failed to save config: ${error}`);
  }
}

/**
 * Check if enough time has passed since last check
 */
export async function shouldCheckForUpdates(): Promise<boolean> {
  try {
    const config = await loadConfig();

    if (!config.enabled) {
      return false;
    }

    const lastCheckContent = await fs.readFile(LAST_CHECK_FILE, "utf-8");
    const lastCheck = parseInt(lastCheckContent, 10);
    const now = Date.now();
    const intervalMs = config.checkInterval * 60 * 60 * 1000;

    return now - lastCheck >= intervalMs;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  } catch (_error) {
    // If file doesn't exist, we should check
    return true;
  }
}

/**
 * Update last check timestamp
 */
export async function updateLastCheckTime(): Promise<void> {
  try {
    await fs.writeFile(LAST_CHECK_FILE, Date.now().toString(), "utf-8");
  } catch (error) {
    console.error("Failed to update last check time:", error);
  }
}

/**
 * Run auto-update check and perform update if configured
 */
export async function runAutoUpdate(packageName?: string): Promise<void> {
  try {
    const config = await loadConfig();

    if (!config.enabled) {
      console.log("Auto-update is disabled.");
      return;
    }

    const shouldCheck = await shouldCheckForUpdates();

    if (!shouldCheck) {
      console.log("Update check skipped (checked recently).");
      return;
    }

    const versionInfo = await checkForUpdates(packageName);
    await updateLastCheckTime();

    if (!versionInfo.updateAvailable) {
      console.log(
        `✓ You are using the latest version (${versionInfo.current})`,
      );
      return;
    }

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     UPDATE AVAILABLE                   ║");
    console.log("╚════════════════════════════════════════╝\n");
    console.log(`Current version: ${versionInfo.current}`);
    console.log(`Latest version:  ${versionInfo.latest}`);

    if (versionInfo.releaseNotes) {
      console.log(`\nRelease notes: ${versionInfo.releaseNotes}`);
    }

    if (config.autoInstall && !config.notifyOnly) {
      console.log("\nAuto-installing update...");
      if (packageName) {
        await performUpdate(packageName);
      } else {
        const packageJsonPath = path.join(process.cwd(), "package.json");
        const content = await fs.readFile(packageJsonPath, "utf-8");
        const packageJson: PackageJson = JSON.parse(content);
        await performUpdate(packageJson.name);
      }
    } else {
      console.log("\nTo update, run: npm install <package-name>@latest");
      console.log("Or use: npm run update");
    }
  } catch (error) {
    console.error("Auto-update check failed:", error);
  }
}

/**
 * Display current update configuration
 */
export async function displayConfig(): Promise<void> {
  const config = await loadConfig();

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   AUTO-UPDATE CONFIGURATION            ║");
  console.log("╚════════════════════════════════════════╝\n");
  console.log(`Enabled:        ${config.enabled ? "✓" : "✗"}`);
  console.log(`Check interval: ${config.checkInterval} hours`);
  console.log(`Auto-install:   ${config.autoInstall ? "✓" : "✗"}`);
  console.log(`Notify only:    ${config.notifyOnly ? "✓" : "✗"}`);
  console.log("");
}

/**
 * Configure auto-update settings
 */
export async function configureUpdate(
  options: Partial<UpdateConfig>,
): Promise<void> {
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, ...options };
  await saveConfig(newConfig);
  console.log("Configuration updated successfully!");
  await displayConfig();
}
