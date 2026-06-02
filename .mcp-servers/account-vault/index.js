import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VAULT_FILE = join(__dirname, "vault.enc");
const MASTER_PASSWORD = process.env.VAULT_MASTER_PASSWORD;
if (!MASTER_PASSWORD) {
  process.stderr.write("ERROR: VAULT_MASTER_PASSWORD 환경변수가 설정되지 않았습니다.\n");
  process.exit(1);
}
const SALT = "mcpaccountvault2026";

function deriveKey(password) {
  return scryptSync(password, SALT, 32);
}

function encrypt(text) {
  const key = deriveKey(MASTER_PASSWORD);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(data) {
  const buf = Buffer.from(data, "base64");
  const iv = buf.subarray(0, 16);
  const tag = buf.subarray(16, 32);
  const encrypted = buf.subarray(32);
  const key = deriveKey(MASTER_PASSWORD);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

function loadVault() {
  if (!existsSync(VAULT_FILE)) return {};
  try {
    const raw = readFileSync(VAULT_FILE, "utf8");
    return JSON.parse(decrypt(raw));
  } catch {
    return {};
  }
}

function saveVault(vault) {
  writeFileSync(VAULT_FILE, encrypt(JSON.stringify(vault, null, 2)), "utf8");
}

const server = new McpServer({
  name: "account-vault",
  version: "1.0.0",
});

server.tool(
  "vault_save_account",
  "서비스 계정 정보를 AES-256-GCM으로 암호화하여 보관합니다",
  {
    service: z.string().describe("서비스 이름 (예: Gemini, GitHub, Google)"),
    email: z.string().optional().describe("이메일 주소"),
    username: z.string().optional().describe("사용자명"),
    password: z.string().optional().describe("비밀번호"),
    tokens: z.record(z.string()).optional().describe("토큰 정보 (access_token, refresh_token 등)"),
    notes: z.string().optional().describe("메모"),
  },
  async ({ service, email, username, password, tokens, notes }) => {
    const vault = loadVault();
    vault[service] = {
      service,
      ...(email && { email }),
      ...(username && { username }),
      ...(password && { password }),
      ...(tokens && { tokens }),
      ...(notes && { notes }),
      updatedAt: new Date().toISOString(),
    };
    saveVault(vault);
    return { content: [{ type: "text", text: `✅ "${service}" 계정 정보가 암호화되어 저장되었습니다.` }] };
  }
);

server.tool(
  "vault_get_account",
  "저장된 계정 정보를 복호화하여 조회합니다",
  {
    service: z.string().describe("조회할 서비스 이름"),
    show_tokens: z.boolean().optional().describe("토큰 전체 표시 여부 (기본: 마스킹)"),
  },
  async ({ service, show_tokens = false }) => {
    const vault = loadVault();
    const account = vault[service];
    if (!account) {
      return { content: [{ type: "text", text: `❌ "${service}" 계정 정보가 없습니다.\n저장된 서비스: ${Object.keys(vault).join(", ") || "없음"}` }] };
    }
    const display = { ...account };
    if (!show_tokens && display.tokens) {
      display.tokens = Object.fromEntries(
        Object.entries(display.tokens).map(([k, v]) => [k, v ? v.substring(0, 20) + "..." : v])
      );
    }
    if (!show_tokens && display.password) {
      display.password = "••••••••";
    }
    return { content: [{ type: "text", text: JSON.stringify(display, null, 2) }] };
  }
);

server.tool(
  "vault_list_accounts",
  "보관된 모든 계정 목록을 조회합니다",
  {},
  async () => {
    const vault = loadVault();
    const list = Object.keys(vault);
    if (list.length === 0) {
      return { content: [{ type: "text", text: "저장된 계정이 없습니다." }] };
    }
    const lines = list.map(s => {
      const a = vault[s];
      const id = a.email || a.username || "(계정)";
      return `• ${s} — ${id} (${a.updatedAt?.substring(0, 10) || "날짜없음"})`;
    });
    return { content: [{ type: "text", text: `저장된 계정 ${list.length}개:\n${lines.join("\n")}` }] };
  }
);

server.tool(
  "vault_delete_account",
  "저장된 계정 정보를 삭제합니다",
  {
    service: z.string().describe("삭제할 서비스 이름"),
  },
  async ({ service }) => {
    const vault = loadVault();
    if (!vault[service]) {
      return { content: [{ type: "text", text: `❌ "${service}" 계정 정보가 없습니다.` }] };
    }
    delete vault[service];
    saveVault(vault);
    return { content: [{ type: "text", text: `🗑️ "${service}" 계정 정보가 삭제되었습니다.` }] };
  }
);

server.tool(
  "vault_update_tokens",
  "계정의 토큰 정보만 업데이트합니다 (토큰 갱신 시 사용)",
  {
    service: z.string().describe("서비스 이름"),
    tokens: z.record(z.string()).describe("새 토큰 정보"),
  },
  async ({ service, tokens }) => {
    const vault = loadVault();
    if (!vault[service]) {
      return { content: [{ type: "text", text: `❌ "${service}" 계정이 없습니다. vault_save_account로 먼저 저장하세요.` }] };
    }
    vault[service].tokens = { ...(vault[service].tokens || {}), ...tokens };
    vault[service].updatedAt = new Date().toISOString();
    saveVault(vault);
    return { content: [{ type: "text", text: `✅ "${service}" 토큰이 업데이트되었습니다.` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
