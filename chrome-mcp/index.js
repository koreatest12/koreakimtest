import CDP from "chrome-remote-interface";
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "chrome-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

/* =========================
   CDP CONNECTION MANAGER
========================= */
let client = null;
const DEFAULT_PORT = 9222;

async function getClient(port) {
  const p = port || DEFAULT_PORT;
  if (client) {
    try {
      // test if connection is alive
      await client.Browser.getVersion();
      return client;
    } catch {
      client = null;
    }
  }
  client = await CDP({ port: p });
  return client;
}

async function ensureDomains(c, domains) {
  for (const d of domains) {
    if (c[d] && c[d].enable) {
      await c[d].enable();
    }
  }
}

/* =========================
   TOOL DEFINITIONS
========================= */
const tools = [
  {
    name: "chrome_connect",
    description:
      "Chrome DevTools에 연결 - Chrome을 --remote-debugging-port=9222 옵션으로 실행해야 합니다",
    inputSchema: {
      type: "object",
      properties: {
        port: {
          type: "number",
          description: "디버깅 포트 (기본값 9222)",
        },
      },
    },
  },
  {
    name: "chrome_list_tabs",
    description: "열린 탭 목록 조회",
    inputSchema: {
      type: "object",
      properties: {
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
    },
  },
  {
    name: "chrome_navigate",
    description: "특정 URL로 이동",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "이동할 URL" },
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
      required: ["url"],
    },
  },
  {
    name: "chrome_screenshot",
    description: "현재 페이지 스크린샷 캡처 (Base64 PNG)",
    inputSchema: {
      type: "object",
      properties: {
        fullPage: {
          type: "boolean",
          description: "전체 페이지 캡처 (기본값 false)",
        },
        quality: {
          type: "number",
          description: "JPEG 품질 (1-100, 미지정 시 PNG)",
        },
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
    },
  },
  {
    name: "chrome_evaluate",
    description:
      "브라우저에서 JavaScript 실행 후 결과 반환",
    inputSchema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "실행할 JavaScript 표현식",
        },
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
      required: ["expression"],
    },
  },
  {
    name: "chrome_console_logs",
    description:
      "콘솔 로그 수집 시작/중지/조회 - 페이지의 console.log, warn, error 등을 캡처",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "start (수집 시작), stop (수집 중지), get (수집된 로그 조회)",
        },
        clear: {
          type: "boolean",
          description: "get 시 조회 후 로그 초기화 (기본값 false)",
        },
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
      required: ["action"],
    },
  },
  {
    name: "chrome_network_monitor",
    description:
      "네트워크 요청 모니터링 시작/중지/조회 - HTTP 요청/응답, 상태코드, 크기 등 캡처",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "start (모니터링 시작), stop (중지), get (수집된 요청 조회)",
        },
        clear: {
          type: "boolean",
          description: "get 시 조회 후 초기화 (기본값 false)",
        },
        urlFilter: {
          type: "string",
          description: "URL 필터 (포함된 문자열 기준 필터링)",
        },
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
      required: ["action"],
    },
  },
  {
    name: "chrome_performance",
    description:
      "페이지 성능 메트릭 조회 - DOM 노드 수, JS 힙 크기, 레이아웃 수 등",
    inputSchema: {
      type: "object",
      properties: {
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
    },
  },
  {
    name: "chrome_dom_query",
    description:
      "CSS 셀렉터로 DOM 요소 검색 - 텍스트, 속성, 자식 요소 수 반환",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "CSS 셀렉터 (예: #main, .title, div > p)",
        },
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
      required: ["selector"],
    },
  },
  {
    name: "chrome_cookies",
    description: "쿠키 조회/삭제 - 현재 페이지 또는 특정 도메인의 쿠키 관리",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "get (조회), delete (삭제)",
        },
        name: {
          type: "string",
          description: "삭제할 쿠키 이름 (delete 시 필수)",
        },
        domain: {
          type: "string",
          description: "도메인 필터 (선택)",
        },
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
      required: ["action"],
    },
  },
  {
    name: "chrome_page_info",
    description: "현재 페이지 정보 조회 - URL, 제목, HTML 크기, 로드 상태 등",
    inputSchema: {
      type: "object",
      properties: {
        port: { type: "number", description: "디버깅 포트 (기본값 9222)" },
      },
    },
  },
  {
    name: "file_server_start",
    description: "로컬 HTTP 파일 공유 서버 시작 - 웹 브라우저에서 URL로 파일 열람/다운로드/업로드 가능한 홈페이지 제공",
    inputSchema: {
      type: "object",
      properties: {
        directory: { type: "string", description: "공유할 디렉토리 절대 경로" },
        port: { type: "number", description: "서버 포트 (기본값 8080)" },
        host: { type: "string", description: "바인딩 호스트 (기본값 localhost, 외부 접근 허용 시 0.0.0.0)" },
      },
      required: ["directory"],
    },
  },
  {
    name: "file_server_stop",
    description: "HTTP 파일 공유 서버 중지",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "file_server_list",
    description: "파일 공유 서버의 공유 폴더 파일 목록과 다운로드 URL 조회",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "file_server_upload",
    description: "로컬 파일을 파일 공유 서버의 공유 폴더에 복사",
    inputSchema: {
      type: "object",
      properties: {
        sourcePath: { type: "string", description: "복사할 파일의 로컬 절대 경로" },
        targetName: { type: "string", description: "저장할 파일명 (선택, 미입력 시 원본 파일명 사용)" },
      },
      required: ["sourcePath"],
    },
  },
  {
    name: "file_server_info",
    description: "파일 공유 서버 상태, 접속 URL, 공유 폴더 정보 조회",
    inputSchema: { type: "object", properties: {} },
  },
];

/* =========================
   STATE
========================= */
let consoleLogs = [];
let consoleListening = false;
let networkRequests = [];
let networkListening = false;
let fileServer = null;
let fileServerConfig = { directory: '', port: 8080, host: 'localhost' };

/* =========================
   FILE SERVER HELPERS
========================= */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getHomePage(directory, port, host) {
  let fileRows = '';
  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile());
    if (files.length === 0) {
      fileRows = '<tr><td colspan="4" style="text-align:center;padding:32px;color:#999;">공유된 파일이 없습니다</td></tr>';
    } else {
      for (const entry of files) {
        const stat = fs.statSync(path.join(directory, entry.name));
        const size = formatSize(stat.size);
        const date = stat.mtime.toLocaleString('ko-KR');
        const encodedName = encodeURIComponent(entry.name);
        fileRows += `
          <tr>
            <td class="name">📄 ${escapeHtml(entry.name)}</td>
            <td>${size}</td>
            <td>${date}</td>
            <td><a href="/file/${encodedName}" class="btn-dl">⬇ 다운로드</a></td>
          </tr>`;
      }
    }
  } catch {
    fileRows = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#c00;">디렉토리를 읽을 수 없습니다</td></tr>';
  }

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>📁 파일 공유 서버</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,sans-serif;background:#f0f2f5;min-height:100vh}
.header{background:#1a73e8;color:#fff;padding:18px 24px}
.header h1{font-size:1.3rem;font-weight:600}
.header small{opacity:.85;font-size:.82rem}
.container{max-width:960px;margin:24px auto;padding:0 16px}
.card{background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:20px;overflow:hidden}
.card-header{padding:13px 20px;border-bottom:1px solid #eee;font-weight:600;color:#333;font-size:.93rem}
.info-grid{display:grid;grid-template-columns:110px 1fr;gap:8px;padding:14px 20px;font-size:.88rem;color:#555}
.info-grid strong{color:#333}
.info-grid a{color:#1a73e8;text-decoration:none}
.upload-form{padding:16px 20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
input[type="file"]{flex:1;min-width:200px;font-size:.88rem}
.btn-up{background:#1a73e8;color:#fff;border:none;padding:9px 20px;border-radius:6px;cursor:pointer;font-size:.88rem;white-space:nowrap}
.btn-up:hover{background:#1557b0}
table{width:100%;border-collapse:collapse}
thead th{background:#f8f9fa;color:#555;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;padding:10px 16px;text-align:left;border-bottom:2px solid #eee}
tbody td{padding:11px 16px;border-bottom:1px solid #f0f0f0;font-size:.88rem;color:#333}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:#fafbff}
.name{font-weight:500;word-break:break-all}
.btn-dl{background:#34a853;color:#fff;padding:5px 13px;border-radius:5px;text-decoration:none;font-size:.8rem;white-space:nowrap}
.btn-dl:hover{background:#2d9048}
</style>
</head>
<body>
<div class="header">
  <h1>📁 파일 공유 서버</h1>
  <small>http://${displayHost}:${port}</small>
</div>
<div class="container">
  <div class="card">
    <div class="card-header">ℹ️ 서버 정보</div>
    <div class="info-grid">
      <strong>접속 URL</strong>
      <a href="http://${displayHost}:${port}">http://${displayHost}:${port}</a>
      <strong>공유 폴더</strong>
      <span>${escapeHtml(directory)}</span>
    </div>
  </div>
  <div class="card">
    <div class="card-header">📤 파일 업로드</div>
    <form class="upload-form" action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="files" multiple>
      <button type="submit" class="btn-up">업로드</button>
    </form>
  </div>
  <div class="card">
    <div class="card-header">📋 파일 목록</div>
    <table>
      <thead><tr><th>파일명</th><th>크기</th><th>수정일</th><th>다운로드</th></tr></thead>
      <tbody>${fileRows}</tbody>
    </table>
  </div>
</div>
</body>
</html>`;
}

async function parseMultipartUpload(req, uploadDir) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
    if (!boundaryMatch) return reject(new Error('multipart boundary를 찾을 수 없습니다'));

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const savedFiles = [];
        const firstBoundary = '--' + boundary + '\r\n';
        const partSeparator = '\r\n--' + boundary;

        let partStart = body.indexOf(Buffer.from(firstBoundary));
        if (partStart === -1) { resolve(savedFiles); return; }
        partStart += firstBoundary.length;

        while (partStart < body.length) {
          const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), partStart);
          if (headerEnd === -1) break;

          const headers = body.slice(partStart, headerEnd).toString('utf8');
          const dataStart = headerEnd + 4;

          const separatorIdx = body.indexOf(Buffer.from(partSeparator), dataStart);
          const dataEnd = separatorIdx === -1 ? body.length : separatorIdx;

          const cdMatch = headers.match(/content-disposition:[^\r\n]*/i);
          if (cdMatch) {
            const filenameMatch = cdMatch[0].match(/filename="([^"]+)"/);
            if (filenameMatch && filenameMatch[1]) {
              const filename = path.basename(filenameMatch[1]);
              if (filename) {
                fs.writeFileSync(path.join(uploadDir, filename), body.slice(dataStart, dataEnd));
                savedFiles.push(filename);
              }
            }
          }

          if (separatorIdx === -1) break;
          const afterSep = separatorIdx + partSeparator.length;
          if (body[afterSep] === 0x2D && body[afterSep + 1] === 0x2D) break;
          if (body[afterSep] === 0x0D && body[afterSep + 1] === 0x0A) {
            partStart = afterSep + 2;
          } else {
            break;
          }
        }
        resolve(savedFiles);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/* =========================
   TOOL HANDLERS
========================= */
async function handleTool(name, args) {
  const port = args?.port || DEFAULT_PORT;

  switch (name) {
    case "chrome_connect": {
      const c = await getClient(port);
      const { Browser } = c;
      const info = await Browser.getVersion();
      return `✅ Chrome 연결 성공\n브라우저: ${info.product}\nProtocol: ${info.protocolVersion}\nUser-Agent: ${info.userAgent}`;
    }

    case "chrome_list_tabs": {
      const targets = await CDP.List({ port });
      const tabs = targets
        .filter((t) => t.type === "page")
        .map((t, i) => `${i + 1}. [${t.title || "(제목 없음)"}] ${t.url}`)
        .join("\n");
      return tabs || "(열린 탭 없음)";
    }

    case "chrome_navigate": {
      const c = await getClient(port);
      await ensureDomains(c, ["Page"]);
      await c.Page.navigate({ url: args.url });
      await c.Page.loadEventFired();
      return `✅ ${args.url} 로 이동 완료`;
    }

    case "chrome_screenshot": {
      const c = await getClient(port);
      await ensureDomains(c, ["Page"]);
      const params = { format: "png" };
      if (args?.quality) {
        params.format = "jpeg";
        params.quality = args.quality;
      }
      if (args?.fullPage) {
        const { cssContentSize } = await c.Page.getLayoutMetrics();
        params.clip = {
          x: 0,
          y: 0,
          width: cssContentSize.width,
          height: cssContentSize.height,
          scale: 1,
        };
      }
      const { data } = await c.Page.captureScreenshot(params);
      // Save to temp file
      const fs = await import("node:fs");
      const path = await import("node:path");
      const os = await import("node:os");
      const tmpFile = path.join(
        os.tmpdir(),
        `chrome_screenshot_${Date.now()}.${params.format}`
      );
      fs.writeFileSync(tmpFile, Buffer.from(data, "base64"));
      return `✅ 스크린샷 저장: ${tmpFile}\n크기: ${Math.round(data.length * 0.75 / 1024)} KB`;
    }

    case "chrome_evaluate": {
      const c = await getClient(port);
      await ensureDomains(c, ["Runtime"]);
      const result = await c.Runtime.evaluate({
        expression: args.expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        const errText =
          result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text;
        return `❌ 에러: ${errText}`;
      }
      const val = result.result.value;
      return typeof val === "object" ? JSON.stringify(val, null, 2) : String(val ?? "undefined");
    }

    case "chrome_console_logs": {
      const c = await getClient(port);
      if (args.action === "start") {
        if (consoleListening) return "이미 콘솔 수집 중입니다.";
        await ensureDomains(c, ["Runtime"]);
        c.Runtime.consoleAPICalled((params) => {
          consoleLogs.push({
            type: params.type,
            timestamp: new Date().toISOString(),
            text: params.args
              .map((a) => a.value ?? a.description ?? JSON.stringify(a))
              .join(" "),
          });
        });
        consoleListening = true;
        consoleLogs = [];
        return "✅ 콘솔 로그 수집 시작";
      }
      if (args.action === "stop") {
        consoleListening = false;
        return "✅ 콘솔 로그 수집 중지";
      }
      if (args.action === "get") {
        const result =
          consoleLogs.length === 0
            ? "(수집된 로그 없음)"
            : consoleLogs
                .map(
                  (l) =>
                    `[${l.type.toUpperCase()}] ${l.timestamp} ${l.text}`
                )
                .join("\n");
        if (args.clear) consoleLogs = [];
        return `총 ${consoleLogs.length}건\n${result}`;
      }
      return "action은 start, stop, get 중 하나여야 합니다.";
    }

    case "chrome_network_monitor": {
      const c = await getClient(port);
      if (args.action === "start") {
        if (networkListening) return "이미 네트워크 모니터링 중입니다.";
        await ensureDomains(c, ["Network"]);
        const pendingRequests = new Map();

        c.Network.requestWillBeSent((params) => {
          pendingRequests.set(params.requestId, {
            url: params.request.url,
            method: params.request.method,
            timestamp: new Date().toISOString(),
            type: params.type,
          });
        });

        c.Network.responseReceived((params) => {
          const req = pendingRequests.get(params.requestId);
          if (req) {
            networkRequests.push({
              ...req,
              status: params.response.status,
              statusText: params.response.statusText,
              mimeType: params.response.mimeType,
              contentLength: params.response.headers["content-length"] || "N/A",
            });
            pendingRequests.delete(params.requestId);
          }
        });

        networkListening = true;
        networkRequests = [];
        return "✅ 네트워크 모니터링 시작";
      }
      if (args.action === "stop") {
        networkListening = false;
        return "✅ 네트워크 모니터링 중지";
      }
      if (args.action === "get") {
        let filtered = networkRequests;
        if (args.urlFilter) {
          filtered = filtered.filter((r) =>
            r.url.includes(args.urlFilter)
          );
        }
        const result =
          filtered.length === 0
            ? "(수집된 요청 없음)"
            : filtered
                .map(
                  (r) =>
                    `[${r.method}] ${r.status || "pending"} ${r.url}\n  Type: ${r.type} | Size: ${r.contentLength} | ${r.timestamp}`
                )
                .join("\n");
        if (args.clear) networkRequests = [];
        return `총 ${filtered.length}건\n${result}`;
      }
      return "action은 start, stop, get 중 하나여야 합니다.";
    }

    case "chrome_performance": {
      const c = await getClient(port);
      await ensureDomains(c, ["Performance"]);
      const { metrics } = await c.Performance.getMetrics();
      const fmt = (name) => {
        const m = metrics.find((x) => x.name === name);
        return m ? m.value : "N/A";
      };
      return [
        `📊 성능 메트릭`,
        `  DOM 노드 수: ${fmt("Nodes")}`,
        `  JS 힙 크기: ${Math.round(fmt("JSHeapUsedSize") / 1024 / 1024)} MB / ${Math.round(fmt("JSHeapTotalSize") / 1024 / 1024)} MB`,
        `  레이아웃 수: ${fmt("LayoutCount")}`,
        `  리페인트 수: ${fmt("RecalcStyleCount")}`,
        `  스크립트 실행 시간: ${Math.round(fmt("ScriptDuration") * 1000)} ms`,
        `  레이아웃 시간: ${Math.round(fmt("LayoutDuration") * 1000)} ms`,
        `  Document 수: ${fmt("Documents")}`,
        `  Frame 수: ${fmt("Frames")}`,
        `  이벤트 리스너 수: ${fmt("JSEventListeners")}`,
      ].join("\n");
    }

    case "chrome_dom_query": {
      const c = await getClient(port);
      await ensureDomains(c, ["DOM"]);
      const { root } = await c.DOM.getDocument();
      const { nodeIds } = await c.DOM.querySelectorAll({
        nodeId: root.nodeId,
        selector: args.selector,
      });

      if (nodeIds.length === 0) return `선택자 "${args.selector}"에 매칭되는 요소 없음`;

      const results = [];
      for (const nodeId of nodeIds.slice(0, 20)) {
        try {
          const { outerHTML } = await c.DOM.getOuterHTML({ nodeId });
          const preview =
            outerHTML.length > 200
              ? outerHTML.substring(0, 200) + "..."
              : outerHTML;
          results.push(preview);
        } catch {
          results.push(`(nodeId ${nodeId} 조회 실패)`);
        }
      }
      return `매칭 요소: ${nodeIds.length}개${nodeIds.length > 20 ? " (처음 20개만 표시)" : ""}\n\n${results.join("\n---\n")}`;
    }

    case "chrome_cookies": {
      const c = await getClient(port);
      await ensureDomains(c, ["Network"]);
      if (args.action === "get") {
        const { cookies } = await c.Network.getCookies();
        let filtered = cookies;
        if (args.domain) {
          filtered = cookies.filter((ck) => ck.domain.includes(args.domain));
        }
        if (filtered.length === 0) return "(쿠키 없음)";
        return filtered
          .map(
            (ck) =>
              `${ck.name}=${ck.value.substring(0, 50)}${ck.value.length > 50 ? "..." : ""}\n  Domain: ${ck.domain} | Path: ${ck.path} | Secure: ${ck.secure} | HttpOnly: ${ck.httpOnly}`
          )
          .join("\n");
      }
      if (args.action === "delete") {
        if (!args.name) return "삭제할 쿠키 이름(name)을 지정하세요.";
        await c.Network.deleteCookies({ name: args.name, domain: args.domain });
        return `✅ 쿠키 "${args.name}" 삭제 완료`;
      }
      return "action은 get 또는 delete여야 합니다.";
    }

    case "chrome_page_info": {
      const c = await getClient(port);
      await ensureDomains(c, ["Runtime", "DOM"]);
      const urlResult = await c.Runtime.evaluate({
        expression: "JSON.stringify({url:location.href,title:document.title,readyState:document.readyState})",
        returnByValue: true,
      });
      const info = JSON.parse(urlResult.result.value);
      const { root } = await c.DOM.getDocument();
      const { outerHTML } = await c.DOM.getOuterHTML({ nodeId: root.nodeId });

      return [
        `📄 페이지 정보`,
        `  URL: ${info.url}`,
        `  제목: ${info.title}`,
        `  상태: ${info.readyState}`,
        `  HTML 크기: ${Math.round(outerHTML.length / 1024)} KB`,
      ].join("\n");
    }

    case "file_server_start": {
      if (fileServer) return "⚠️ 서버가 이미 실행 중입니다. file_server_stop으로 먼저 중지하세요.";
      const dir = path.resolve(args.directory);
      if (!fs.existsSync(dir)) return `❌ 디렉토리가 존재하지 않습니다: ${dir}`;
      const sPort = args.port || 8080;
      const sHost = args.host || 'localhost';
      fileServerConfig = { directory: dir, port: sPort, host: sHost };

      fileServer = http.createServer(async (req, res) => {
        try {
          const pathname = new URL(req.url, 'http://localhost').pathname;
          if (req.method === 'GET' && pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(getHomePage(dir, sPort, sHost));
          } else if (req.method === 'GET' && pathname.startsWith('/file/')) {
            const filename = decodeURIComponent(pathname.slice(6));
            const filePath = path.resolve(path.join(dir, filename));
            if (!filePath.startsWith(path.resolve(dir))) {
              res.writeHead(403); res.end('접근 거부'); return;
            }
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
              res.writeHead(404); res.end('파일을 찾을 수 없습니다'); return;
            }
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(filePath))}`,
              'Content-Length': stat.size,
            });
            fs.createReadStream(filePath).pipe(res);
          } else if (req.method === 'POST' && pathname === '/upload') {
            const saved = await parseMultipartUpload(req, dir);
            const msg = saved.length === 0
              ? '업로드할 파일을 선택하세요.'
              : `${saved.map((f) => escapeHtml(f)).join(', ')} 업로드 완료!`;
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<script>alert(${JSON.stringify(msg)});location.href='/';</script>`);
          } else {
            res.writeHead(404); res.end('Not Found');
          }
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`서버 오류: ${err.message}`);
        }
      });

      await new Promise((resolve, reject) => {
        fileServer.on('error', reject);
        fileServer.listen(sPort, sHost, resolve);
      });

      const displayHost = sHost === '0.0.0.0' ? 'localhost' : sHost;
      return `✅ 파일 공유 서버 시작\n🌐 홈페이지 URL: http://${displayHost}:${sPort}\n📁 공유 폴더: ${dir}\n\n브라우저에서 위 URL로 접속하면 파일 목록과 업로드 기능을 사용할 수 있습니다.`;
    }

    case "file_server_stop": {
      if (!fileServer) return "❌ 실행 중인 파일 서버가 없습니다.";
      await new Promise((resolve, reject) => {
        fileServer.close((err) => (err ? reject(err) : resolve()));
      });
      fileServer = null;
      fileServerConfig = { directory: '', port: 8080, host: 'localhost' };
      return "✅ 파일 공유 서버 중지 완료";
    }

    case "file_server_list": {
      if (!fileServer) return "❌ 서버가 실행되지 않았습니다. 먼저 file_server_start로 서버를 시작하세요.";
      const { directory: lDir, port: lPort, host: lHost } = fileServerConfig;
      const entries = fs.readdirSync(lDir, { withFileTypes: true });
      const files = entries.filter((e) => e.isFile());
      if (files.length === 0) return "📂 공유 폴더에 파일이 없습니다.";
      const lDisplayHost = lHost === '0.0.0.0' ? 'localhost' : lHost;
      const baseUrl = `http://${lDisplayHost}:${lPort}`;
      const lines = [`📁 공유 폴더: ${lDir}`, `🌐 서버 URL: ${baseUrl}`, '', `파일 ${files.length}개:`];
      for (const entry of files) {
        const stat = fs.statSync(path.join(lDir, entry.name));
        lines.push(`  📄 ${entry.name}  (${formatSize(stat.size)})\n     🔗 ${baseUrl}/file/${encodeURIComponent(entry.name)}`);
      }
      return lines.join('\n');
    }

    case "file_server_upload": {
      if (!fileServerConfig.directory) return "❌ 서버가 실행되지 않았습니다. 먼저 file_server_start로 서버를 시작하세요.";
      const srcPath = path.resolve(args.sourcePath);
      if (!fs.existsSync(srcPath) || !fs.statSync(srcPath).isFile()) return `❌ 파일이 존재하지 않습니다: ${srcPath}`;
      const targetName = args.targetName ? path.basename(args.targetName) : path.basename(srcPath);
      const destPath = path.join(fileServerConfig.directory, targetName);
      fs.copyFileSync(srcPath, destPath);
      const stat = fs.statSync(destPath);
      const { host: uHost, port: uPort } = fileServerConfig;
      const uDisplayHost = uHost === '0.0.0.0' ? 'localhost' : uHost;
      const downloadUrl = fileServer ? `http://${uDisplayHost}:${uPort}/file/${encodeURIComponent(targetName)}` : '(서버 미실행)';
      return `✅ 파일 복사 완료\n  원본: ${srcPath}\n  저장: ${destPath}\n  크기: ${formatSize(stat.size)}\n  다운로드 URL: ${downloadUrl}`;
    }

    case "file_server_info": {
      if (!fileServer) return "⏹ 파일 공유 서버가 실행되지 않았습니다.";
      const { directory: iDir, port: iPort, host: iHost } = fileServerConfig;
      const iDisplayHost = iHost === '0.0.0.0' ? 'localhost' : iHost;
      let fileCount = 0;
      try { fileCount = fs.readdirSync(iDir, { withFileTypes: true }).filter((e) => e.isFile()).length; } catch {}
      return [
        "✅ 서버 실행 중",
        `  🌐 홈페이지: http://${iDisplayHost}:${iPort}`,
        `  📁 공유 폴더: ${iDir}`,
        `  📄 파일 수: ${fileCount}개`,
        `  🏠 바인딩: ${iHost}:${iPort}`,
      ].join('\n');
    }

    default:
      return `알 수 없는 도구: ${name}`;
  }
}

/* =========================
   MCP HANDLERS
========================= */
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    const msg = err.code === "ECONNREFUSED"
      ? `❌ Chrome 연결 실패 (포트 ${args?.port || DEFAULT_PORT})\nChrome을 다음 명령으로 실행하세요:\nchrome.exe --remote-debugging-port=9222`
      : `❌ 오류: ${err.message}`;
    return { content: [{ type: "text", text: msg }], isError: true };
  }
});

/* =========================
   START
========================= */
const transport = new StdioServerTransport();
await server.connect(transport);
