import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "crypto-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

/* =========================
   HELPERS
========================= */
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512");
}

function encryptBuffer(buffer, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: salt(32) + iv(16) + tag(16) + encrypted
  return Buffer.concat([salt, iv, tag, encrypted]);
}

function decryptBuffer(buffer, password) {
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/* =========================
   TOOL LIST
========================= */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "encrypt_text",
      description: "텍스트를 비밀번호로 AES-256-GCM 암호화 (결과: Base64)",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "암호화할 텍스트" },
          password: { type: "string", description: "암호화 비밀번호" }
        },
        required: ["text", "password"]
      }
    },
    {
      name: "decrypt_text",
      description: "Base64 암호문을 비밀번호로 복호화",
      inputSchema: {
        type: "object",
        properties: {
          encrypted: { type: "string", description: "Base64 암호문" },
          password: { type: "string", description: "복호화 비밀번호" }
        },
        required: ["encrypted", "password"]
      }
    },
    {
      name: "encrypt_file",
      description: "파일을 비밀번호로 AES-256-GCM 암호화 (.enc 파일 생성)",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "암호화할 파일 경로" },
          password: { type: "string", description: "암호화 비밀번호" },
          output_path: { type: "string", description: "출력 파일 경로 (기본값: 원본파일.enc)" }
        },
        required: ["file_path", "password"]
      }
    },
    {
      name: "decrypt_file",
      description: "암호화된 .enc 파일을 비밀번호로 복호화",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "복호화할 .enc 파일 경로" },
          password: { type: "string", description: "복호화 비밀번호" },
          output_path: { type: "string", description: "출력 파일 경로 (기본값: .enc 제거)" }
        },
        required: ["file_path", "password"]
      }
    },
    {
      name: "hash_text",
      description: "텍스트 해시 생성 (SHA-256, SHA-512, MD5 등)",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "해시할 텍스트" },
          algorithm: { type: "string", description: "해시 알고리즘: sha256 (기본값), sha512, md5, sha1" }
        },
        required: ["text"]
      }
    },
    {
      name: "hash_file",
      description: "파일의 해시값 생성 (무결성 검증용)",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "해시할 파일 경로" },
          algorithm: { type: "string", description: "해시 알고리즘: sha256 (기본값), sha512, md5, sha1" }
        },
        required: ["file_path"]
      }
    },
    {
      name: "generate_password",
      description: "안전한 랜덤 비밀번호 생성",
      inputSchema: {
        type: "object",
        properties: {
          length: { type: "number", description: "비밀번호 길이 (기본값 16)" },
          include_symbols: { type: "boolean", description: "특수문자 포함 여부 (기본값 true)" },
          count: { type: "number", description: "생성할 비밀번호 수 (기본값 1)" }
        }
      }
    },
    {
      name: "base64_encode",
      description: "텍스트를 Base64로 인코딩",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "인코딩할 텍스트" }
        },
        required: ["text"]
      }
    },
    {
      name: "base64_decode",
      description: "Base64 문자열을 디코딩",
      inputSchema: {
        type: "object",
        properties: {
          encoded: { type: "string", description: "디코딩할 Base64 문자열" }
        },
        required: ["encoded"]
      }
    }
  ]
}));

/* =========================
   TOOL HANDLERS
========================= */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "encrypt_text": {
        const buf = Buffer.from(args.text, "utf-8");
        const encrypted = encryptBuffer(buf, args.password);
        const result = encrypted.toString("base64");
        return {
          content: [{
            type: "text",
            text: `🔒 암호화 완료\n\n알고리즘: AES-256-GCM\n키 유도: PBKDF2 (SHA-512, ${ITERATIONS}회)\n\n암호문 (Base64):\n${result}\n\n⚠️ 비밀번호를 분실하면 복호화할 수 없습니다.`
          }]
        };
      }

      case "decrypt_text": {
        const buf = Buffer.from(args.encrypted, "base64");
        const decrypted = decryptBuffer(buf, args.password);
        return {
          content: [{
            type: "text",
            text: `🔓 복호화 완료\n\n원문:\n${decrypted.toString("utf-8")}`
          }]
        };
      }

      case "encrypt_file": {
        const filePath = args.file_path;
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `❌ 파일을 찾을 수 없습니다: ${filePath}` }] };
        }
        const fileData = fs.readFileSync(filePath);
        const encrypted = encryptBuffer(fileData, args.password);
        const outputPath = args.output_path || filePath + ".enc";
        fs.writeFileSync(outputPath, encrypted);
        const originalSize = fileData.length;
        const encryptedSize = encrypted.length;
        return {
          content: [{
            type: "text",
            text: `🔒 파일 암호화 완료\n\n원본: ${filePath} (${formatSize(originalSize)})\n암호화: ${outputPath} (${formatSize(encryptedSize)})\n알고리즘: AES-256-GCM\n키 유도: PBKDF2 (SHA-512, ${ITERATIONS}회)\n\n⚠️ 비밀번호를 분실하면 복호화할 수 없습니다.`
          }]
        };
      }

      case "decrypt_file": {
        const filePath = args.file_path;
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `❌ 파일을 찾을 수 없습니다: ${filePath}` }] };
        }
        const fileData = fs.readFileSync(filePath);
        const decrypted = decryptBuffer(fileData, args.password);
        const outputPath = args.output_path || filePath.replace(/\.enc$/, "");
        if (outputPath === filePath && !args.output_path) {
          return { content: [{ type: "text", text: `❌ 출력 파일 경로를 지정해주세요. 원본 파일을 덮어쓸 수 없습니다.` }] };
        }
        fs.writeFileSync(outputPath, decrypted);
        return {
          content: [{
            type: "text",
            text: `🔓 파일 복호화 완료\n\n암호화: ${filePath} (${formatSize(fileData.length)})\n복호화: ${outputPath} (${formatSize(decrypted.length)})`
          }]
        };
      }

      case "hash_text": {
        const algo = args.algorithm || "sha256";
        const hash = crypto.createHash(algo).update(args.text, "utf-8").digest("hex");
        return {
          content: [{
            type: "text",
            text: `# 해시 결과\n\n알고리즘: ${algo.toUpperCase()}\n입력: ${args.text.length > 100 ? args.text.substring(0, 100) + "..." : args.text}\n\n해시값:\n${hash}`
          }]
        };
      }

      case "hash_file": {
        const filePath = args.file_path;
        if (!fs.existsSync(filePath)) {
          return { content: [{ type: "text", text: `❌ 파일을 찾을 수 없습니다: ${filePath}` }] };
        }
        const algo = args.algorithm || "sha256";
        const fileData = fs.readFileSync(filePath);
        const hash = crypto.createHash(algo).update(fileData).digest("hex");
        return {
          content: [{
            type: "text",
            text: `# 파일 해시 결과\n\n파일: ${filePath} (${formatSize(fileData.length)})\n알고리즘: ${algo.toUpperCase()}\n\n해시값:\n${hash}`
          }]
        };
      }

      case "generate_password": {
        const length = args.length || 16;
        const includeSymbols = args.include_symbols !== false;
        const count = Math.min(args.count || 1, 20);
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const digits = "0123456789";
        const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        const charset = lower + upper + digits + (includeSymbols ? symbols : "");
        const passwords = [];
        for (let i = 0; i < count; i++) {
          const bytes = crypto.randomBytes(length);
          let pw = "";
          for (let j = 0; j < length; j++) {
            pw += charset[bytes[j] % charset.length];
          }
          passwords.push(pw);
        }
        const strengthBits = Math.floor(Math.log2(Math.pow(charset.length, length)));
        return {
          content: [{
            type: "text",
            text: `🔑 비밀번호 생성 완료\n\n길이: ${length}자\n특수문자: ${includeSymbols ? "포함" : "미포함"}\n엔트로피: ~${strengthBits}비트\n\n${passwords.map((pw, i) => count > 1 ? `${i + 1}. ${pw}` : pw).join("\n")}`
          }]
        };
      }

      case "base64_encode": {
        const encoded = Buffer.from(args.text, "utf-8").toString("base64");
        return {
          content: [{
            type: "text",
            text: `Base64 인코딩 결과:\n${encoded}`
          }]
        };
      }

      case "base64_decode": {
        const decoded = Buffer.from(args.encoded, "base64").toString("utf-8");
        return {
          content: [{
            type: "text",
            text: `Base64 디코딩 결과:\n${decoded}`
          }]
        };
      }

      default:
        return { content: [{ type: "text", text: `알 수 없는 도구: ${name}` }] };
    }
  } catch (err) {
    return {
      content: [{
        type: "text",
        text: `❌ 오류 발생: ${err.message}\n\n비밀번호가 올바른지 확인해주세요.`
      }]
    };
  }
});

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* =========================
   START
========================= */
const transport = new StdioServerTransport();
await server.connect(transport);
