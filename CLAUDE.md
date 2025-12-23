# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a multi-project monorepo focused on **Anthropic API cost tracking** and **Model Context Protocol (MCP) server development**. The repository contains TypeScript/Node.js and Python implementations for cost estimation, usage reporting, and utility tools integrated with Claude.

## Key Projects

### 1. Anthropic Cost Tracker (`anthropic-cost-tracker/`)
Dual-language implementation for tracking and estimating Anthropic API costs.

**Node.js Implementation** (`anthropic-cost-tracker/nodejs/`):
- **Run cost estimation**: `npm run estimate` (executes immediate cost calculator)
- **Generate admin report**: `npm run admin-report` (fetches usage from Admin API)
- **Development mode**: `npm run dev` (watch mode for cost estimator)
- **Dependencies**: `@anthropic-ai/sdk`, `tsx`, TypeScript 5.3+
- **Environment**: Requires `ANTHROPIC_API_KEY` and `ANTHROPIC_ADMIN_API_KEY` in `.env`

**Python Implementation** (`anthropic-cost-tracker/python/`):
- **Run**: `python immediate_cost_estimate.py`
- **Dependencies**: Install via `pip install -r requirements.txt`
- **Pricing**: Model prices defined in `PRICES` dictionary (update as needed from https://www.anthropic.com/pricing)

**Cost Calculation Architecture**:
- Token-based pricing with separate rates for input/output tokens
- Supports cache creation/read tokens (prompt caching)
- USD-to-KRW conversion (default exchange rate: 1350)
- Admin API integration for historical usage reports with grouping by model and time bucketing

### 2. MCP Servers
Multiple Model Context Protocol servers providing tools for Claude integration.

**MCP Python Utilities** (`mcp-python-server/`):
- **Primary server**: `server_mcp.py` (FastMCP-based with comprehensive utilities)
- **Standard server**: `server.py` (basic MCP SDK implementation)
- **Available tools**:
  - File operations: `calculate_file_hash`, `get_directory_size`, `count_words_in_file`
  - System info: `get_system_info`, `get_current_time`
  - JSON operations: `format_json`, `validate_json`
  - Math: `calculate` (safe expression evaluator)
- **Setup**: Activate `.venv` and run `python server_mcp.py`
- **Configuration**: Registered in `.mcp.json` as `python-utils`

**MCP Hello Servers** (Example implementations):
- **JavaScript** (`mcp-hello-js/`): Basic MCP server with `greet` and `add` tools. Run: `node index.js`
- **Python** (`mcp-hello-py/`): Example server with `ping` tool. Run: `python server.py` (uses `.venv`)

**MCP Filesystem** (`mcp-fs/`):
- Uses official `@modelcontextprotocol/server-filesystem` package
- Provides filesystem access to Claude via MCP protocol
- Configured in `.mcp.json` with home directory access

### 3. Shared Utilities (`src/utils/`)

**fetchAnthropicUsage.ts** - Admin API Integration:
- Function: `fetchAnthropicUsage(params, apiKey?)` - Fetches usage reports from Anthropic Admin API
- Function: `formatUsageReport(report)` - Formats usage data into human-readable tables
- Function: `runUsageReport(startDate, endDate)` - CLI helper that fetches, displays, and saves usage reports
- **Date validation**: Ensures valid ISO date ranges
- **Query parameters**: Supports `groupBy` (e.g., by model), `bucketWidth` (default: '1d')
- **Output**: Console report + JSON file (`usage-report-{start}-to-{end}.json`)

**usageReportCli.ts**:
- Command-line interface for usage reporting
- Imports and uses functions from `fetchAnthropicUsage.ts`

**mcpServerManager.ts** - MCP Server Management:
- Function: `listMCPServers()` - Lists all configured MCP servers
- Function: `installNpmMCPServer(packageName, serverName, serverPath?)` - Install npm-based MCP server
- Function: `installPythonMCPServer(serverPath, serverName, requirementsPath?)` - Install Python-based MCP server
- Function: `upgradeNpmMCPServer(packageName, serverName)` - Upgrade npm-based MCP server
- Function: `upgradePythonMCPServer(serverPath, serverName, requirementsPath?)` - Upgrade Python-based MCP server
- Function: `checkNpmPackageUpdate(packageName)` - Check for available updates
- Function: `removeMCPServer(serverName)` - Remove server from configuration
- Function: `getMCPServerInfo(serverName)` - Get detailed server information
- **Auto-detection**: Automatically detects server type (npm/python/java/other)
- **Virtual environments**: Automatically creates/manages Python virtual environments
- **Configuration**: Manages `.mcp.json` file programmatically

**mcpServerCli.ts** - MCP Server Management CLI:
- Commands: `list`, `install`, `upgrade`, `check`, `remove`, `info`, `help`
- **Usage**: `npm run mcp-<command> [args]`
- **Installation**: Supports both npm and Python servers with automatic dependency management
- **Upgrading**: Updates packages and dependencies for existing servers
- See `docs/MCP_SERVER_MANAGER.md` for detailed usage

## MCP Configuration

All MCP servers are configured in `.mcp.json` at the repository root:

```json
{
  "mcpServers": {
    "hello-mcp-js": { "command": "node", "args": ["C:\\Users\\kwonn\\mcp-hello-js\\index.js"] },
    "hello-mcp-py": { "command": "C:\\Users\\kwonn\\mcp-hello-py\\.venv\\Scripts\\python.exe", "args": ["..."] },
    "filesystem": { "command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\kwonn"] },
    "python-utils": { "command": "C:\\Users\\kwonn\\mcp-python-server\\.venv\\Scripts\\python.exe", "args": ["..."] }
  }
}
```

**Important**: Python MCP servers require `PYTHONUNBUFFERED=1` environment variable for proper stdio communication.

## Development Workflow

### TypeScript Projects
1. **Install dependencies**: `npm install` (in respective project directory)
2. **Run TypeScript directly**: Use `tsx` for execution without compilation
3. **Development**: TypeScript 5.3+ with ES2022 target, ESM modules (`"type": "module"`)

### Python Projects
1. **Create/activate virtual environment**:
   - `python -m venv .venv`
   - Activate: `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Unix)
2. **Install dependencies**: `pip install -r requirements.txt`
3. **Run servers**: `python server.py` or `python server_mcp.py`

### Testing MCP Servers
1. After modifying `.mcp.json`, restart Claude desktop client
2. Test tools are available in Claude's tool palette
3. Check server logs for debugging (MCP servers output to stderr)

## Architecture Patterns

### Cost Tracking Pattern
- **Real-time estimation**: Calculate cost immediately after API calls using `usage` object
- **Historical reporting**: Fetch aggregated data from Admin API with time bucketing
- **Pricing updates**: Model prices in `PRICES` constant need manual updates when Anthropic changes pricing
- **Token types**: Input, output, cache creation (write), cache read tokens all priced differently

### MCP Integration Pattern
- **Stdio communication**: All MCP servers use stdin/stdout for Claude communication
- **Tool registration**: Tools defined in `@server.list_tools()` decorator
- **Tool execution**: Handled by `@server.call_tool()` decorator
- **Error handling**: Return `CallToolResult` with `isError=True` for failures
- **JSON responses**: All tool results formatted as JSON for structured data exchange

### Utility Function Organization
- **Shared utilities**: Place in `src/utils/` with TypeScript for reuse
- **Export pattern**: Named exports from utility modules, re-exported through `index.ts`
- **API integration**: Separate concerns - fetch logic in one module, CLI in another

## Environment Variables

Required environment variables (create `.env` files as needed):

```bash
# Anthropic API keys
ANTHROPIC_API_KEY=sk-ant-xxx           # For general API usage
ANTHROPIC_ADMIN_API_KEY=sk-ant-xxx     # For Admin API (usage reports)

# Python MCP servers
PYTHONUNBUFFERED=1                     # Required for stdio communication
```

## Important Notes

1. **No root package.json**: Each sub-project manages dependencies independently
2. **Windows paths**: All absolute paths use Windows format (`C:\Users\kwonn\...`)
3. **Test infrastructure**: Test directories exist (`tests/unit/`, `tests/integration/`) but are currently empty - tests should be added as projects mature
4. **Virtual environments**: Python projects use `.venv` for isolation - always activate before running
5. **TypeScript execution**: Use `tsx` instead of `tsc` + `node` for faster development iteration
6. **MCP debugging**: Set `PYTHONUNBUFFERED=1` and check stderr output for Python MCP servers
7. **Cost accuracy**: Model pricing in code may lag behind official pricing - verify at https://www.anthropic.com/pricing before financial decisions
