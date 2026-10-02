# Claude Code compatibility

Read `AGENTS.md` for shared project instructions and tool descriptions.

Claude Code remains an optional client. The default `.mcp.json` contains only general MCP servers.
To retain the previous Claude bridge, use `config/claude/mcp.legacy.json` explicitly with your Claude client; it preserves the original configuration.

The previously documented claude.ai Calendar integration depends on Claude OAuth and is not portable authentication. Reauthorize an independently supported Calendar connector in the new client. See `docs/CODEX_MIGRATION.md`.
