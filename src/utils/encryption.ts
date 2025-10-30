/**
 * Encryption utility for securing MCP configuration files
 * Uses AES-256-GCM for encryption with environment-based key management
 */

import crypto from "crypto";
import fs from "fs/promises";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(
  data: string,
  password: string,
): {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
} {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from password
  const key = deriveKey(password, salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decrypt(
  encrypted: string,
  password: string,
  salt: string,
  iv: string,
  authTag: string,
): string {
  // Derive key from password and salt
  const key = deriveKey(password, Buffer.from(salt, "hex"));

  // Create decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex"),
  );

  // Set authentication tag
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  // Decrypt data
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypts a JSON object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encryptJSON(data: any, password: string): string {
  const jsonString = JSON.stringify(data, null, 2);
  const encrypted = encrypt(jsonString, password);

  return JSON.stringify(
    {
      version: "1.0",
      algorithm: ALGORITHM,
      ...encrypted,
    },
    null,
    2,
  );
}

/**
 * Decrypts a JSON object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decryptJSON(encryptedData: string, password: string): any {
  const parsed = JSON.parse(encryptedData);

  if (parsed.version !== "1.0") {
    throw new Error(`Unsupported encryption version: ${parsed.version}`);
  }

  if (parsed.algorithm !== ALGORITHM) {
    throw new Error(`Unsupported algorithm: ${parsed.algorithm}`);
  }

  const decrypted = decrypt(
    parsed.encrypted,
    password,
    parsed.salt,
    parsed.iv,
    parsed.authTag,
  );

  return JSON.parse(decrypted);
}

/**
 * Encrypts a file
 */
export async function encryptFile(
  inputPath: string,
  outputPath: string,
  password: string,
): Promise<void> {
  const data = await fs.readFile(inputPath, "utf8");
  const encrypted = encryptJSON(JSON.parse(data), password);
  await fs.writeFile(outputPath, encrypted, "utf8");
}

/**
 * Decrypts a file
 */
export async function decryptFile(
  inputPath: string,
  outputPath: string,
  password: string,
): Promise<void> {
  const encryptedData = await fs.readFile(inputPath, "utf8");
  const decrypted = decryptJSON(encryptedData, password);
  await fs.writeFile(outputPath, JSON.stringify(decrypted, null, 2), "utf8");
}

/**
 * Gets encryption password from environment or prompts user
 */
export function getEncryptionPassword(): string {
  const password = process.env.MCP_ENCRYPTION_KEY;

  if (!password) {
    throw new Error(
      "MCP_ENCRYPTION_KEY environment variable not set. " +
        "Please set it to encrypt/decrypt MCP configuration.",
    );
  }

  if (password.length < 16) {
    throw new Error(
      "MCP_ENCRYPTION_KEY must be at least 16 characters long for security.",
    );
  }

  return password;
}

/**
 * Validates if a file is encrypted
 */
export async function isEncrypted(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(content);
    return parsed.version && parsed.algorithm && parsed.encrypted;
  } catch {
    return false;
  }
}
