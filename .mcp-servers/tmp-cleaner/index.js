import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const HOME = os.homedir();
const TEMP = os.tmpdir();
const SERVER_DIR = path.join(HOME, ".mcp-servers", "tmp-cleaner");
const STATE_FILE = path.join(SERVER_DIR, "state.json");

// 정리 대상 디렉토리
const TARGETS = {
  claude: path.join(TEMP, "claude"),
  codex_tmp: path.join(HOME, ".codex", "tmp"),
  codex_cache: path.join(HOME, ".codex", ".tmp"),
};

// 상태 저장/로드
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch {}
  return { lastCleanedAt: null, autoCleanIntervalDays: 7, totalBytesFreed: 0, cleanCount: 0 };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {}
}

// 폴더 크기 계산
function getFolderSize(dirPath) {
  if (!fs.existsSync(dirPath)) return { bytes: 0, files: 0, dirs: 0 };
  let totalBytes = 0, totalFiles = 0, totalDirs = 0;
  function traverse(p) {
    try {
      const entries = fs.readdirSync(p, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(p, entry.name);
        if (entry.isDirectory()) {
          totalDirs++;
          traverse(fullPath);
        } else {
          try {
            totalBytes += fs.statSync(fullPath).size;
            totalFiles++;
          } catch {}
        }
      }
    } catch {}
  }
  traverse(dirPath);
  return { bytes: totalBytes, files: totalFiles, dirs: totalDirs };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Claude 현재 세션 경로 찾기 (가장 최근 수정된 세션)
function getCurrentClaudeSession() {
  const claudeTmp = TARGETS.claude;
  if (!fs.existsSync(claudeTmp)) return null;
  let latestTime = 0, latestSession = null;
  try {
    const projectDirs = fs.readdirSync(claudeTmp, { withFileTypes: true })
      .filter(e => e.isDirectory());
    for (const pDir of projectDirs) {
      const pPath = path.join(claudeTmp, pDir.name);
      try {
        const sessionDirs = fs.readdirSync(pPath, { withFileTypes: true })
          .filter(e => e.isDirectory());
        for (const sDir of sessionDirs) {
          const sPath = path.join(pPath, sDir.name);
          try {
            const stat = fs.statSync(sPath);
            if (stat.mtimeMs > latestTime) {
              latestTime = stat.mtimeMs;
              latestSession = sPath;
            }
          } catch {}
        }
      } catch {}
    }
  } catch {}
  return latestSession;
}

// 디렉토리 내 항목 삭제 (daysOld 이상 된 것만)
function cleanDirectory(dirPath, daysOld, protectPaths = []) {
  if (!fs.existsSync(dirPath)) return { deleted: [], skipped: [], bytesFreed: 0, errors: [] };
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  const deleted = [], skipped = [], errors = [];
  let bytesFreed = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (protectPaths.some(p => fullPath.startsWith(p) || p.startsWith(fullPath))) {
        skipped.push({ path: fullPath, reason: "보호된 경로" });
        continue;
      }
      try {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs < cutoff) {
          const size = entry.isDirectory() ? getFolderSize(fullPath).bytes : stat.size;
          try {
            if (entry.isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
            bytesFreed += size;
            deleted.push({ path: fullPath, size: formatBytes(size), age: Math.floor((Date.now() - stat.mtimeMs) / 86400000) + "일" });
          } catch (e) {
            errors.push({ path: fullPath, error: e.message });
          }
        } else {
          skipped.push({ path: fullPath, reason: "최근 파일 (보존)" });
        }
      } catch {}
    }
  } catch (e) {
    errors.push({ path: dirPath, error: e.message });
  }

  return { deleted, skipped, bytesFreed, errors };
}

// 서버 시작 시 자동 정리 체크
function autoCleanOnStartup() {
  const state = loadState();
  if (!state.autoCleanIntervalDays) return;
  const lastCleaned = state.lastCleanedAt ? new Date(state.lastCleanedAt).getTime() : 0;
  const daysSinceLast = (Date.now() - lastCleaned) / (24 * 60 * 60 * 1000);
  if (daysSinceLast >= state.autoCleanIntervalDays) {
    try {
      const currentSession = getCurrentClaudeSession();
      const protect = currentSession ? [currentSession] : [];
      let totalFreed = 0;
      for (const [, dirPath] of Object.entries(TARGETS)) {
        const result = cleanDirectory(dirPath, state.autoCleanIntervalDays, protect);
        totalFreed += result.bytesFreed;
      }
      state.lastCleanedAt = new Date().toISOString();
      state.totalBytesFreed = (state.totalBytesFreed || 0) + totalFreed;
      state.cleanCount = (state.cleanCount || 0) + 1;
      saveState(state);
    } catch {}
  }
}

autoCleanOnStartup();

const server = new McpServer({
  name: "tmp-cleaner",
  version: "1.0.0",
});

// 1. 상태 조회
server.tool(
  "tmp_status",
  "Claude, Codex tmp 디렉토리 현재 상태 조회 (크기, 파일 수, 마지막 정리 시각)",
  {},
  async () => {
    const state = loadState();
    const lines = ["=== Tmp 디렉토리 상태 ===\n"];

    const targets = [
      { key: "claude", label: "Claude 세션 tmp", path: TARGETS.claude },
      { key: "codex_tmp", label: "Codex 작업 tmp", path: TARGETS.codex_tmp },
      { key: "codex_cache", label: "Codex 플러그인 캐시 (.tmp)", path: TARGETS.codex_cache },
    ];

    let totalBytes = 0;
    for (const t of targets) {
      const info = getFolderSize(t.path);
      totalBytes += info.bytes;
      const exists = fs.existsSync(t.path);
      lines.push(`📁 ${t.label}`);
      lines.push(`   경로: ${t.path}`);
      if (exists) {
        lines.push(`   크기: ${formatBytes(info.bytes)} (파일 ${info.files}개, 폴더 ${info.dirs}개)`);
        // 가장 오래된 항목 찾기
        try {
          const entries = fs.readdirSync(t.path, { withFileTypes: true });
          let oldest = null;
          for (const e of entries) {
            try {
              const stat = fs.statSync(path.join(t.path, e.name));
              if (!oldest || stat.mtimeMs < oldest.time) {
                oldest = { name: e.name, time: stat.mtimeMs };
              }
            } catch {}
          }
          if (oldest) {
            const days = Math.floor((Date.now() - oldest.time) / 86400000);
            lines.push(`   가장 오래된 항목: ${oldest.name} (${days}일 전)`);
          }
        } catch {}
      } else {
        lines.push(`   상태: 없음`);
      }
      lines.push("");
    }

    lines.push(`📊 전체 합계: ${formatBytes(totalBytes)}`);
    lines.push(`\n⏰ 자동 정리 설정: ${state.autoCleanIntervalDays}일 주기`);
    lines.push(`🕐 마지막 정리: ${state.lastCleanedAt ? new Date(state.lastCleanedAt).toLocaleString("ko-KR") : "없음"}`);
    lines.push(`🗑️ 누적 절약: ${formatBytes(state.totalBytesFreed || 0)} (총 ${state.cleanCount || 0}회 정리)`);

    const currentSession = getCurrentClaudeSession();
    if (currentSession) {
      lines.push(`\n🔒 현재 Claude 세션 (보호됨): ${path.basename(currentSession)}`);
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// 2. 미리보기 (실제 삭제 없이)
server.tool(
  "tmp_clean_preview",
  "실제 삭제 없이 정리될 항목 미리보기",
  {
    days_old: z.number().int().min(1).default(7).describe("몇 일 이상 된 파일을 정리할지 (기본: 7일)"),
  },
  async ({ days_old }) => {
    const currentSession = getCurrentClaudeSession();
    const protect = currentSession ? [currentSession] : [];
    const cutoff = Date.now() - days_old * 24 * 60 * 60 * 1000;
    const lines = [`=== 정리 미리보기 (${days_old}일 이상 된 파일) ===\n`];
    let totalBytes = 0, totalItems = 0;

    const targets = [
      { label: "Claude 세션 tmp", path: TARGETS.claude },
      { label: "Codex 작업 tmp", path: TARGETS.codex_tmp },
      { label: "Codex 플러그인 캐시", path: TARGETS.codex_cache },
    ];

    for (const t of targets) {
      if (!fs.existsSync(t.path)) continue;
      lines.push(`📁 ${t.label} (${t.path})`);
      let found = false;
      try {
        const entries = fs.readdirSync(t.path, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(t.path, entry.name);
          if (protect.some(p => fullPath.startsWith(p) || p.startsWith(fullPath))) {
            lines.push(`   🔒 [보호] ${entry.name}`);
            continue;
          }
          try {
            const stat = fs.statSync(fullPath);
            if (stat.mtimeMs < cutoff) {
              const size = entry.isDirectory() ? getFolderSize(fullPath).bytes : stat.size;
              const days = Math.floor((Date.now() - stat.mtimeMs) / 86400000);
              lines.push(`   🗑️ ${entry.name}  (${formatBytes(size)}, ${days}일 전)`);
              totalBytes += size;
              totalItems++;
              found = true;
            }
          } catch {}
        }
      } catch {}
      if (!found) lines.push("   ✅ 정리할 항목 없음");
      lines.push("");
    }

    lines.push(`\n📊 정리 예상: ${totalItems}개 항목, ${formatBytes(totalBytes)} 확보`);
    lines.push(`\ntmp_clean 도구로 실제 정리를 실행하세요.`);

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// 3. 정리 실행
server.tool(
  "tmp_clean",
  "Claude, Codex tmp 파일 정리 (현재 Claude 세션은 자동 보호)",
  {
    days_old: z.number().int().min(1).default(7).describe("몇 일 이상 된 파일을 정리할지 (기본: 7일)"),
    target: z.enum(["all", "claude", "codex_tmp", "codex_cache"]).default("all").describe("정리 대상 (all: 전체, claude: Claude 세션, codex_tmp: Codex 작업 tmp, codex_cache: Codex 캐시)"),
  },
  async ({ days_old, target }) => {
    const state = loadState();
    const currentSession = getCurrentClaudeSession();
    const protect = currentSession ? [currentSession] : [];
    const lines = [`=== Tmp 정리 실행 (${days_old}일 이상) ===\n`];
    let grandTotal = 0, grandDeleted = 0;

    const targetMap = {
      claude: [{ label: "Claude 세션 tmp", path: TARGETS.claude }],
      codex_tmp: [{ label: "Codex 작업 tmp", path: TARGETS.codex_tmp }],
      codex_cache: [{ label: "Codex 플러그인 캐시", path: TARGETS.codex_cache }],
      all: [
        { label: "Claude 세션 tmp", path: TARGETS.claude },
        { label: "Codex 작업 tmp", path: TARGETS.codex_tmp },
        { label: "Codex 플러그인 캐시", path: TARGETS.codex_cache },
      ],
    };

    for (const t of targetMap[target]) {
      lines.push(`📁 ${t.label}`);
      const result = cleanDirectory(t.path, days_old, protect);

      if (result.deleted.length > 0) {
        for (const d of result.deleted) {
          lines.push(`   ✅ 삭제: ${path.basename(d.path)}  (${d.size}, ${d.age})`);
        }
        grandDeleted += result.deleted.length;
        grandTotal += result.bytesFreed;
      } else {
        lines.push("   📭 정리할 항목 없음");
      }
      if (result.errors.length > 0) {
        for (const e of result.errors) {
          lines.push(`   ❌ 오류: ${path.basename(e.path)} - ${e.error}`);
        }
      }
      lines.push("");
    }

    // 상태 업데이트
    state.lastCleanedAt = new Date().toISOString();
    state.totalBytesFreed = (state.totalBytesFreed || 0) + grandTotal;
    state.cleanCount = (state.cleanCount || 0) + 1;
    saveState(state);

    lines.push(`\n🎉 정리 완료: ${grandDeleted}개 삭제, ${formatBytes(grandTotal)} 확보`);
    if (currentSession) {
      lines.push(`🔒 현재 세션 보호됨: ${path.basename(currentSession)}`);
    }
    lines.push(`📅 다음 자동 정리: ${state.autoCleanIntervalDays}일 후 서버 시작 시`);

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// 4. 자동 정리 주기 설정
server.tool(
  "tmp_set_interval",
  "자동 정리 주기 설정 (서버 시작 시 지정 일수 경과하면 자동 정리)",
  {
    days: z.number().int().min(1).max(365).describe("자동 정리 주기 (일). 0 입력 시 자동 정리 비활성화"),
  },
  async ({ days }) => {
    const state = loadState();
    const prev = state.autoCleanIntervalDays;
    state.autoCleanIntervalDays = days;
    saveState(state);

    const msg = days === 0
      ? `✅ 자동 정리 비활성화됨 (이전: ${prev}일 주기)`
      : `✅ 자동 정리 주기 설정: ${days}일\n서버 시작 시 ${days}일 이상 된 파일을 자동으로 정리합니다.`;

    return { content: [{ type: "text", text: msg }] };
  }
);

// 5. Windows 작업 스케줄러 등록
server.tool(
  "tmp_schedule_setup",
  "Windows 작업 스케줄러에 정기 자동 정리 작업 등록 (매일 또는 매주)",
  {
    frequency: z.enum(["daily", "weekly"]).default("weekly").describe("실행 주기 (daily: 매일, weekly: 매주)"),
    time: z.string().default("03:00").describe("실행 시각 (HH:MM 형식, 기본: 03:00)"),
    days_old: z.number().int().min(1).default(7).describe("몇 일 이상 된 파일을 정리할지 (기본: 7일)"),
  },
  async ({ frequency, time, days_old }) => {
    const scriptPath = path.join(SERVER_DIR, "auto-clean.ps1");
    const taskName = "ClaudeCodexTmpCleaner";
    const logPath = path.join(SERVER_DIR, "clean.log");

    // PowerShell 정리 스크립트 생성
    const psScript = `# Auto-generated by tmp-cleaner MCP server
$ErrorActionPreference = "SilentlyContinue"
$logFile = "${logPath.replace(/\\/g, "\\\\")}"
$daysOld = ${days_old}
$cutoff = (Get-Date).AddDays(-$daysOld)
$totalFreed = 0
$logLines = @()
$logLines += "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [START] Tmp 정리 시작 (${days_old}일 이상)"

# Claude tmp
$claudeTmp = "$env:TEMP\\claude"
if (Test-Path $claudeTmp) {
  # 현재 세션(가장 최근) 보호
  $latest = Get-ChildItem -Path $claudeTmp -Recurse -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  Get-ChildItem -Path $claudeTmp -Directory -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
    if ($latest -and $_.FullName -ne $latest.FullName) {
      $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
      Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
      $totalFreed += $size
      $logLines += "  삭제: $($_.Name) ($([math]::Round($size/1KB,1))KB)"
    }
  }
  Get-ChildItem -Path $claudeTmp -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
    $totalFreed += $_.Length
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
    $logLines += "  삭제: $($_.Name) ($([math]::Round($_.Length/1KB,1))KB)"
  }
}

# Codex tmp
$codexTmp = "$env:USERPROFILE\\.codex\\tmp"
if (Test-Path $codexTmp) {
  Get-ChildItem -Path $codexTmp -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
    $size = if ($_.PSIsContainer) { (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum } else { $_.Length }
    Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $size
    $logLines += "  삭제: $($_.Name) ($([math]::Round($size/1MB,2))MB)"
  }
}

# Codex .tmp
$codexDotTmp = "$env:USERPROFILE\\.codex\\.tmp"
if (Test-Path $codexDotTmp) {
  Get-ChildItem -Path $codexDotTmp -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
    $size = if ($_.PSIsContainer) { (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum } else { $_.Length }
    Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    $totalFreed += $size
    $logLines += "  삭제: $($_.Name) ($([math]::Round($size/1MB,2))MB)"
  }
}

$logLines += "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [END] 완료: $([math]::Round($totalFreed/1MB,2))MB 확보"
$logLines | Add-Content -Path $logFile -Encoding UTF8
`;

    try {
      fs.writeFileSync(scriptPath, psScript, "utf8");

      // 기존 작업 제거 후 재등록
      try { execSync(`schtasks /delete /tn "${taskName}" /f`, { stdio: "pipe" }); } catch {}

      const scheduleFlag = frequency === "daily"
        ? `/sc DAILY /st ${time}`
        : `/sc WEEKLY /d MON /st ${time}`;

      execSync(
        `schtasks /create /tn "${taskName}" /tr "powershell.exe -NonInteractive -ExecutionPolicy Bypass -File \\"${scriptPath}\\"" ${scheduleFlag} /ru SYSTEM /f`,
        { stdio: "pipe" }
      );

      return {
        content: [{
          type: "text",
          text: [
            `✅ Windows 작업 스케줄러 등록 완료`,
            ``,
            `📋 작업 이름: ${taskName}`,
            `⏰ 실행 주기: ${frequency === "daily" ? "매일" : "매주 월요일"} ${time}`,
            `🗑️ 정리 기준: ${days_old}일 이상 된 파일`,
            `📄 스크립트: ${scriptPath}`,
            `📜 로그: ${logPath}`,
            ``,
            `수동 실행: schtasks /run /tn "${taskName}"`,
          ].join("\n"),
        }],
      };
    } catch (e) {
      return {
        content: [{
          type: "text",
          text: `❌ 스케줄러 등록 실패: ${e.message}\n\nPowerShell 스크립트는 생성됨: ${scriptPath}\n수동으로 등록하려면:\nschtasks /create /tn "${taskName}" /tr "powershell.exe -File \\"${scriptPath}\\"" /sc WEEKLY /d MON /st 03:00`,
        }],
      };
    }
  }
);

// 6. 스케줄러 상태 확인
server.tool(
  "tmp_schedule_status",
  "Windows 작업 스케줄러 등록 상태 및 마지막 실행 결과 확인",
  {},
  async () => {
    const taskName = "ClaudeCodexTmpCleaner";
    const logPath = path.join(SERVER_DIR, "clean.log");
    const lines = [];

    try {
      const result = execSync(`schtasks /query /tn "${taskName}" /fo LIST`, { encoding: "utf8", stdio: "pipe" });
      lines.push("✅ 스케줄러 등록됨\n");
      // 주요 정보만 추출
      for (const line of result.split("\n")) {
        const l = line.trim();
        if (l.startsWith("작업 이름") || l.startsWith("Task To Run") || l.startsWith("다음 실행 시간") ||
            l.startsWith("마지막 실행 시간") || l.startsWith("마지막 결과") || l.startsWith("Status") ||
            l.startsWith("Next Run") || l.startsWith("Last Run") || l.startsWith("Last Result") ||
            l.startsWith("Task Name") || l.startsWith("상태")) {
          lines.push(`  ${l}`);
        }
      }
    } catch {
      lines.push("❌ 스케줄러 작업 없음 (tmp_schedule_setup으로 등록하세요)");
    }

    // 최근 로그
    if (fs.existsSync(logPath)) {
      try {
        const logContent = fs.readFileSync(logPath, "utf8");
        const logLines = logContent.trim().split("\n");
        const last20 = logLines.slice(-20);
        lines.push("\n\n📜 최근 정리 로그:");
        lines.push(...last20);
      } catch {}
    } else {
      lines.push("\n📜 정리 로그: 없음 (아직 실행되지 않음)");
    }

    const state = loadState();
    lines.push(`\n\n📊 누적 정리: ${state.cleanCount || 0}회, ${formatBytes(state.totalBytesFreed || 0)} 확보`);
    lines.push(`⏰ MCP 서버 자동 정리 주기: ${state.autoCleanIntervalDays}일`);

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// 7. 스케줄러 제거
server.tool(
  "tmp_schedule_remove",
  "Windows 작업 스케줄러에서 자동 정리 작업 제거",
  {},
  async () => {
    const taskName = "ClaudeCodexTmpCleaner";
    try {
      execSync(`schtasks /delete /tn "${taskName}" /f`, { stdio: "pipe" });
      return { content: [{ type: "text", text: `✅ 스케줄러 작업 '${taskName}' 제거 완료` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `❌ 제거 실패 (이미 없거나 오류): ${e.message}` }] };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
