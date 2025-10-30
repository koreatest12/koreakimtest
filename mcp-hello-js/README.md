# MCP Hello Server

A simple Model Context Protocol (MCP) server example in JavaScript.

## Features

### Tools
- **greet**: Greets a person by name
- **add**: Adds two numbers together

### Resources
- **hello://greeting**: A default greeting message resource

## Installation

```bash
npm install
```

## Usage

### Running the server directly
```bash
node index.js
```

### Using with Claude Code

Add this to your Claude Code MCP settings (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "mcp-hello": {
      "command": "node",
      "args": ["C:\\Users\\kwonn\\mcp-hello-js\\index.js"]
    }
  }
}
```

Then restart Claude Code and use `/mcp` to verify the server is connected.

### Testing the tools

Once connected, you can ask Claude to:
- "Use the greet tool to say hello to Alice"
- "Use the add tool to calculate 5 + 3"
- "Read the hello://greeting resource"

## Development

To modify the server:
1. Edit `index.js`
2. Restart Claude Code (or reconnect to MCP)
3. Test your changes

## MCP SDK Documentation

For more information about building MCP servers, visit:
- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk)
