$ErrorActionPreference = "Stop"

$RepoUrl = if ($env:GITRAG_REPO_URL) { $env:GITRAG_REPO_URL } else { "https://github.com/janpaul80/gitrag.git" }
$InstallDir = if ($env:GITRAG_INSTALL_DIR) { $env:GITRAG_INSTALL_DIR } else { Join-Path $HOME ".gitrag\source" }

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "GitRAG installer requires '$Name'."
  }
}

Require-Command git
Require-Command node
Require-Command npm

$NodeMajor = [int]((node -p "process.versions.node.split('.')[0]") -replace "\s", "")
if ($NodeMajor -lt 18) {
  throw "GitRAG requires Node.js >= 18. Current version: $(node --version)"
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  corepack enable
  corepack prepare pnpm@11.1.2 --activate
}

$Parent = Split-Path -Parent $InstallDir
New-Item -ItemType Directory -Force -Path $Parent | Out-Null

if (Test-Path (Join-Path $InstallDir ".git")) {
  git -C $InstallDir pull --ff-only
} else {
  if (Test-Path $InstallDir) {
    Remove-Item -Recurse -Force $InstallDir
  }
  git clone $RepoUrl $InstallDir
}

Set-Location $InstallDir
pnpm install
pnpm build
npm link .\packages\cli

gitrag --version
Write-Host "GitRAG installed. Run 'gitrag --help' to get started."
