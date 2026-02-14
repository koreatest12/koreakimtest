import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "money-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/* =========================
   TOOL LIST
========================= */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "money_calculator",
      description: "Perform money calculation (add, subtract, multiply, divide, tax, discount, exchange)",
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string" },
          amount1: { type: "number" },
          amount2: { type: "number" },
          rate: { type: "number" }
        },
        required: ["operation", "amount1"]
      }
    }
  ]
}));

/* =========================
   TOOL CALL
========================= */
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { operation, amount1, amount2, rate } = req.params.arguments;

  const needsAmount2 = ["add", "subtract", "multiply", "divide"];
  const needsRate = ["tax", "discount", "exchange"];

  if (needsAmount2.includes(operation) && (amount2 == null || typeof amount2 !== "number")) {
    return { content: [{ type: "text", text: "오류: amount2 값이 필요합니다." }] };
  }
  if (needsRate.includes(operation) && (rate == null || typeof rate !== "number")) {
    return { content: [{ type: "text", text: "오류: rate 값이 필요합니다." }] };
  }
  if (operation === "divide" && amount2 === 0) {
    return { content: [{ type: "text", text: "오류: 0으로 나눌 수 없습니다." }] };
  }

  let result;

  switch (operation) {
    case "add":
      result = amount1 + amount2;
      break;

    case "subtract":
      result = amount1 - amount2;
      break;

    case "multiply":
      result = amount1 * amount2;
      break;

    case "divide":
      result = amount1 / amount2;
      break;

    case "tax":
      result = amount1 + (amount1 * (rate / 100));
      break;

    case "discount":
      result = amount1 - (amount1 * (rate / 100));
      break;

    case "exchange":
      result = amount1 * rate;
      break;

    default:
      return { content: [{ type: "text", text: "오류: 잘못된 연산입니다. (add, subtract, multiply, divide, tax, discount, exchange)" }] };
  }

  return {
    content: [{ type: "text", text: `결과: ${result.toLocaleString()}` }]
  };
});

/* =========================
   START SERVER
========================= */
const transport = new StdioServerTransport();
await server.connect(transport);
