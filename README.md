# GitRAG

GitRAG is a repo question answering tool. It crawls a source repository, filters noisy files, sends clean context through a server side gateway, and returns answers with citations.

I built it to explore a simple question: what if a team could ask a codebase questions without exposing API keys in the browser?

## What it does

- Crawls local or remote repositories
- Filters files that should not be sent to an AI model
- Sends context through a server side gateway
- Keeps gateway keys out of the browser
- Provides a web UI for asking repo questions
- Includes a CLI package and install scripts

## Tech stack

- pnpm monorepo
- Next.js web app
- Node.js and TypeScript server
- CLI package exposed as `gitrag`
- Shared sanitizer package
- Shell and PowerShell install scripts

## Install

macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/janpaul80/gitrag/main/scripts/install.sh | bash
```

Windows PowerShell:

```powershell
iwr -UseBasicParsing https://raw.githubusercontent.com/janpaul80/gitrag/main/scripts/install.ps1 | iex
```

## Run it locally

```bash
git clone https://github.com/janpaul80/gitrag.git
cd gitrag
pnpm install
pnpm build
pnpm dev
```

Run the gateway server:

```bash
pnpm dev:server
```

## Environment

Create a server environment file:

```bash
cp apps/server/.env.example apps/server/.env
```

Example values:

```env
GITRAG_CORE_GATEWAY_KEY=your_gateway_key_here
GITRAG_CORE_GATEWAY_URL=https://gateway.example.com
GITRAG_SERVER_PORT=8787
```

Do not put gateway keys in `NEXT_PUBLIC_*` values.

## Repo map

- `apps/web/` has the web app.
- `apps/server/` has the gateway relay.
- `packages/cli/` has the command line tool.
- `packages/sanitizer/` has repo filtering and cleanup logic.
- `scripts/` has installers.

## Status

Prototype. The structure is useful for testing repo chat and gateway patterns. Before real team use, it needs more auth, logging, file filtering, and provider error handling.
