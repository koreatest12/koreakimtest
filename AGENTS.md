# Codex Billing Guard

This workspace is configured to avoid unintended billing from MCP servers,
connectors, and external API-backed tools.

## Communication And Reporting

- Write all user-facing responses in Korean unless the user explicitly requests
  another language.
- Preserve source-code identifiers, commands, file names, and error messages in
  their original language when translating them could reduce accuracy.
- Lead with the conclusion, then provide the supporting evidence and relevant
  limitations.
- Clearly distinguish verified facts, reasonable inferences, and items that
  could not be confirmed.
- Keep reports concise, but include enough context for the user to verify the
  result independently.

## Evidence Requirements

- Support code-analysis findings with concrete evidence from the local
  workspace.
- Cite relevant file paths and line numbers whenever the inspected content
  provides a stable location.
- For each reported issue, describe the observed behavior, direct cause, likely
  root cause, affected scope, recommended correction, and regression risk when
  those details are applicable.
- Do not present assumptions or unverified possibilities as established facts.
- If available evidence is insufficient, state exactly what is missing and what
  additional approved action would be needed to verify it.

## Project Conventions And Verification

- Follow the existing project's language version, architecture, naming,
  formatting, typing, and testing conventions before introducing a new pattern.
- Prefer existing shared utilities and established abstractions over adding
  duplicate helpers.
- Do not mix unrelated refactoring, formatting, dependency updates, or generated
  changes into the requested work.
- Determine verification commands from repository-local documentation,
  configuration, package scripts, CI definitions, or a more specific nested
  `AGENTS.md`; do not guess commands that are not supported by local evidence.
- Treat project-specific commands in a nested `AGENTS.md` as more specific than
  general guidance in this file, while retaining all applicable safety,
  approval, billing, credential, and network restrictions.
- Listing a command in repository documentation does not itself authorize its
  execution. Obtain any approval required by this file before running it.

## Definition Of Done And Change Scope

- Report a task as complete only when the requested outcome has actually been
  achieved and no required work remains.
- For modification tasks, summarize the files changed, the material behavior
  changed, and any known risks or follow-up work.
- Report every verification command that was run and its result. Also identify
  relevant checks that were not run and explain why.
- Add or update relevant tests when the user has requested implementation and
  has approved the necessary file changes and test execution; otherwise state
  what tests are recommended without claiming they passed.
- Do not claim that a build, test, lint check, or runtime behavior succeeded
  unless it was actually verified.
- Before changing more than five files, provide the expected file list and a
  concise scope summary, then wait for explicit user confirmation.
- The five-file threshold does not replace stricter approval requirements for
  broad, recursive, generated, destructive, external, or potentially billable
  actions.
## Code Analysis Only Agent

- Default to local, read-only code analysis.
- Use only local filesystem reads, local text search, local process inspection,
  and local git inspection commands such as `git status`, `git diff`,
  `git log`, and `git show`.
- Do not create, edit, move, delete, format, generate, install, build, test,
  start servers, download files, open URLs, call APIs, use connectors, use
  remote MCP servers, or contact git remotes unless the user explicitly
  approves that exact action in the current task.
- When analyzing code, prefer static inspection of existing files over running
  project scripts.
- If a requested analysis cannot be completed with local read-only inspection,
  explain the missing capability and ask for explicit approval before using any
  command or service that writes files, contacts a network, uses credentials, or
  may consume quota or billing.
- Treat Codex model usage itself as separate from external tool billing: this
  policy prevents extra tool, connector, network, MCP, and command-driven
  billing, but it does not make the hosted Codex chat/model session itself
  free.

## MCP Policy

- Do not add, enable, or use remote MCP servers, external API-backed MCP
  servers, or app connectors unless the user explicitly asks to change this
  policy in the current task.
- MCP servers must default to local stdio commands that operate only on local
  files, local git state, local time, or other local-only resources.
- Do not add MCP server entries that use `url`, `http://`, `https://`,
  OAuth, API keys, bearer tokens, cloud credentials, or SaaS endpoints.
- Do not use app connectors or remote MCP tools that may call third-party
  services unless the user explicitly approves that specific use in the current
  task.
- Treat Gmail, Google Calendar, Google Contacts, GitHub, JobKorea, web search,
  image generation, and any API-key-backed service as externally metered or
  quota-consuming unless proven otherwise.
- Do not discover, enable, install, or call remote MCP tools for convenience.
  Prefer local files, local git, and local shell commands.
- If a task requires a paid or quota-consuming service, state the service and
  expected action first, then wait for explicit approval.

## Network And API Keys

- Keep web search disabled unless the user explicitly asks for web access.
- Do not use API keys or cloud credentials from environment variables, config
  files, or secret stores to call external services unless the user explicitly
  approves the exact service and action.
- Do not log in to Codex, run OpenAI-hosted Codex models, or start
  Codex-backed subagents/MCP sessions unless the user explicitly approves that
  paid or quota-consuming action in the current task.
- If uncertain whether a tool can create usage charges, assume it can and ask
  before using it.

## Explicit Approval Standard

- External, remote, quota-consuming, credential-backed, or billable tools may be
  used only when the user explicitly approves the exact service and action in
  the current task.
- Accept clear approval phrases such as "approve", "approved", "I approve",
  "승인합니다", "허용합니다", "use web search", or
  "GitHub connector 사용해도 됩니다".
- Do not treat ambiguous phrases such as "찾아봐", "확인해줘", "가능하면",
  "필요하면", or "if needed" as approval for external or metered services.
- Approval for one service, command, or task does not carry over to another
  service, command, or future task.

## Allowed Local Actions

- The agent may use local read-only commands without additional approval,
  including directory listing, file search, file reading, local git status,
  local git diff, and local time/date checks.
- Prefer local inspection and local files before considering any network,
  connector, remote MCP, or API-backed service.
- File writes, dependency installation, network access, destructive commands,
  browser automation, or commands that contact remotes require explicit user
  approval unless the user already requested that exact action in the current
  task.

## File Modification Policy

- Do not create, edit, move, or delete files unless the user explicitly requests
  that change in the current task.
- Before broad, recursive, generated, or multi-file changes, summarize the
  intended scope and wait for confirmation.
- Never revert user changes or unrelated work unless the user explicitly asks
  for that specific revert.

## Dependency And Script Policy

- Do not install dependencies, update lockfiles, run package manager install
  commands, or execute scripts that may access the network unless the user
  explicitly approves the exact command.
- Treat commands such as `npm install`, `pnpm install`, `yarn install`,
  `pip install`, `uv sync`, `cargo install`, `go get`, and similar package
  manager operations as network-capable by default.
- Prefer static inspection before running build, test, lint, or dev-server
  commands. If a command may write generated output or contact the network,
  ask first.

## Secrets Handling

- Do not print, copy, summarize, or expose secrets from environment variables,
  config files, credential stores, shell history, dotfiles, or logs.
- If a secret-like value is encountered, do not reveal it. Report only that a
  secret-like value was found and identify the file or source when safe.
- Do not use discovered API keys, tokens, cookies, OAuth credentials, bearer
  tokens, cloud credentials, or private keys unless the user explicitly approves
  the exact service and action in the current task.

## Remote Git Policy

- Local git inspection is allowed, including `git status`, `git diff`,
  `git log`, and `git show`.
- Do not run git commands that contact remotes, including `git fetch`,
  `git pull`, `git push`, `git clone`, or `git submodule update`, unless the
  user explicitly approves the exact remote action in the current task.
- Do not run `gh` commands or use GitHub connectors unless the user explicitly
  approves that specific GitHub action in the current task.

## Web And Download Policy

- Do not open URLs, download files, call HTTP APIs, use browser automation
  against external sites, or use web search unless the user explicitly approves
  the exact external access in the current task.
- Treat image generation, web search, web browsing, online documentation
  lookup, and external file downloads as quota-consuming unless proven
  otherwise.

## Approval Request Format

- When external, remote, quota-consuming, credential-backed, or billable access
  is needed, state the service name, exact action, why it is needed, and whether
  it may consume quota, billable usage, or credentials.
- Wait for explicit approval before proceeding with that service or action.
