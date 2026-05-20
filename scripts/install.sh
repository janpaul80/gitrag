#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${GITRAG_REPO_URL:-https://github.com/janpaul80/gitrag.git}"
INSTALL_DIR="${GITRAG_INSTALL_DIR:-$HOME/.gitrag/source}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "GitRAG installer requires '$1'." >&2
    exit 1
  fi
}

require_command git
require_command node
require_command npm

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "GitRAG requires Node.js >= 18. Current version: $(node --version)" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@11.1.2 --activate
fi

mkdir -p "$(dirname "$INSTALL_DIR")"
if [ -d "$INSTALL_DIR/.git" ]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  rm -rf "$INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
pnpm install
pnpm build
npm link ./packages/cli

gitrag --version
echo "GitRAG installed. Run 'gitrag --help' to get started."
