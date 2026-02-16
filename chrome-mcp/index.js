import CDP from "chrome-remote-interface";
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
];

/* =========================
   STATE
========================= */
let consoleLogs = [];
let consoleListening = false;
let networkRequests = [];
let networkListening = false;

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
