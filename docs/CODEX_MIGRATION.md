# Codex/OpenAI transition audit — 2026-10-02

Audited default branch `main` at `3b99022706783e0eebd4d5e8d0272b0e4e7cf848` by scanning all tracked text, including hidden workflow/config files and lockfiles. User-reported Claude Max expiry: 2026-10-21, Gmail message 1a0f268335321777 (mail not independently retrieved). No subscriptions or API credentials were changed.

## Classification and disposition

| Category | Files/components | Decision |
|---|---|---|
| Documentation only | CLAUDE.md, test-commit.md, .gitignore Claude patterns; .github/workflows/test.yml Claude labels | Move shared instructions to AGENTS.md; retain compatibility stub, historical attribution, ignore protections and workflow labels. Labels do not invoke Claude. |
| Claude Code only | .mcp.json: @steipete/claude-code-mcp@latest | Remove bridge from default configuration; preserve complete prior config in config/claude/mcp.legacy.json. Codex is the primary coding agent; no assertion that bridge-specific tools are identical. |
| Claude OAuth only | Former CLAUDE.md claude.ai Calendar section | Authentication and Calendar CRUD cannot be carried over automatically. Independently reauthorize Calendar in a supported new client and verify list/get/create/update/delete on a disposable event before ending fallback access. |
| Anthropic API only | package.json and package-lock.json: @anthropic-ai/sdk ^0.68.0 | No tracked imports/calls found. Retain temporarily because root build/source is incomplete; remove SDK and regenerate lockfile only after recovering intended source and confirming no consumers. No OpenAI SDK added without a working API consumer. |
| Anthropic API only | anthropic-cost-tracker/nodejs/package.json: SDK ^0.74.0, estimate/admin-report scripts | Only manifest exists: referenced index.js and TypeScript entrypoints are absent. Retain as optional legacy manifest. OpenAI usage/admin billing is not a drop-in replacement; restore source and implement provider-specific adapters with separate credentials and accounting tests before replacement. |
| Anthropic API only | .github/workflows/dependabot-auto-merge.yml | Real Messages curl call, Anthropic headers/key, fixed legacy model. Now explicitly opt-in and endpoint restricted; default skips API call. Existing legacy functionality retained. OpenAI requires its own request schema, auth, configurable model, usage mapping and fail-on-error verification. |
| Anthropic-related CI scaffolding | .github/workflows/api-test-server.yml, dependency-check.yml; mcp-server-upgrade.yml cost_tracker services | Preserve paths/matrix and service blueprints. Python tracker path is absent. These are not evidence of a working tracker. |
| General MCP | filesystem, money-mcp, crypto-mcp, chrome-mcp; @modelcontextprotocol/sdk and StdioServerTransport; mcp-python-server | Preserve server source, tool names/schemas and protocol. Add Codex TOML with same command/args/env for four configured standard servers. |

## Activation order

1. Review this branch diff. The local Windows installation paths are preserved from existing settings; verify C:\Users\kwonn\{money,crypto,chrome}-mcp\index.js and installed dependencies. Repository checkout location is not automatically the deployment location.
2. Install each local Node MCP module's dependencies using its own package.json. Review filesystem access to C:\Users\kwonn (existing broad scope). Chrome requires its existing debugging configuration; do not enable remote debugging on an untrusted interface.
3. Open this repository with Codex after reviewing/trusting the project configuration. Alternatively merge only the `[mcp_servers.*]` tables into your existing user config; back up that config first and do not overwrite login/model/settings. Run `codex mcp list`, then `/mcp` and verify tool listing and representative calls. Official syntax: https://learn.chatgpt.com/docs/extend/mcp?surface=cli
4. Validate finance results against known inputs; crypto round trip on disposable text; Chrome tab listing only before write/browser operations. Do not register a recursive `codex mcp-server` as a replacement for the Claude bridge inside Codex itself.
5. Reauthorize Calendar separately; keep Claude fallback until its required features have been checked. Cloud ChatGPT does not automatically launch these Windows stdio servers from a repository file.
6. Recover root `src/utils`/tsconfig and missing tracker source; implement OpenAI API usage only where a real consumer exists, with separate authentication and spend controls. A subscription expiry is not proof that an API key stops working. This phase makes no billed API calls.
7. Before 2026-10-21, compare required tool coverage and remove optional Claude access only after successful acceptance checks.

## Rollback

Revert this migration's commits or close the draft PR without merging. For Claude bridge use the preserved config explicitly, or restore .mcp.json from config/claude/mcp.legacy.json. Restore prior CLAUDE.md from the base commit if needed. API workflow opt-in preserves legacy behavior for deliberate testing; no secrets were modified.

## Validation limits

Root package scripts reference absent src/utils files; root TypeScript configuration is absent. The tracker manifests also reference missing source. These are pre-existing blockers, not passing builds. Windows path execution and OAuth cannot be validated in this Linux workspace. Validation results are recorded in the pull request.
