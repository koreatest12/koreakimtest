#!/usr/bin/env python3

import asyncio
from typing import Any
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, CallToolResult

# Create server instance
server = Server("hello-mcp-py")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="ping",
            description="Responds with pong and the provided text",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to echo back",
                    }
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="greet",
            description="Greets a person by name",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the person to greet",
                    }
                },
                "required": ["name"],
            },
        ),
        Tool(
            name="add",
            description="Adds two numbers together",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {
                        "type": "number",
                        "description": "First number",
                    },
                    "b": {
                        "type": "number",
                        "description": "Second number",
                    },
                },
                "required": ["a", "b"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> CallToolResult:
    """Handle tool calls."""
    if name == "ping":
        text = arguments.get("text")
        return CallToolResult(
            content=[TextContent(type="text", text=f"pong: {text}")]
        )
    elif name == "greet":
        person_name = arguments.get("name")
        return CallToolResult(
            content=[
                TextContent(
                    type="text",
                    text=f"Hello, {person_name}! Welcome to MCP from Python!",
                )
            ]
        )
    elif name == "add":
        a = arguments.get("a")
        b = arguments.get("b")
        result = a + b
        return CallToolResult(
            content=[TextContent(type="text", text=f"{a} + {b} = {result}")]
        )
    else:
        raise ValueError(f"Unknown tool: {name}")


async def main():
    """Run the server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream, write_stream, server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
