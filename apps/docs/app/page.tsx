import { BentoCard } from "../components/BentoCard";
import { TerminalSimulator } from "../components/TerminalSimulator";

const installBlocks = [
  ["macOS", "curl -fsSL https://raw.githubusercontent.com/janpaul80/gitrag/main/scripts/install.sh | bash"],
  ["Linux", "curl -fsSL https://raw.githubusercontent.com/janpaul80/gitrag/main/scripts/install.sh | bash"],
  ["WSL", "curl -fsSL https://raw.githubusercontent.com/janpaul80/gitrag/main/scripts/install.sh | bash"],
  ["PowerShell", "iwr -UseBasicParsing https://raw.githubusercontent.com/janpaul80/gitrag/main/scripts/install.ps1 | iex"]
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a className="flex items-center gap-3" href="#top" aria-label="GitRAG home">
            <img src="/gitrag-logo.svg" alt="" className="h-8 w-8" />
            <span className="font-mono text-sm text-white">GitRAG</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-zinc-500 md:flex">
            <a className="transition hover:text-white" href="#install">
              Install
            </a>
            <a className="transition hover:text-white" href="#architecture">
              Architecture
            </a>
            <a className="transition hover:text-white" href="#docs">
              Docs
            </a>
          </nav>
          <a
            className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-white"
            href="https://github.com/janpaul80/gitrag"
          >
            GitHub
          </a>
        </div>
      </header>

      <section id="top" className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <h1 className="text-balance text-5xl font-semibold tracking-[-0.03em] text-white md:text-7xl">
            Ask your repository what it knows.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            GitRAG is an open-source repo oracle for developer teams, powered by a secure, compliance-ready Enterprise AI Gateway Integration.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="rounded-md bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200" href="#install">
              Install GitRAG
            </a>
            <a className="rounded-md border border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white" href="#architecture">
              View architecture
            </a>
          </div>
        </div>
        <TerminalSimulator />
      </section>

      <section id="architecture" className="border-y border-zinc-900 bg-[#0A0A0A]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white md:text-4xl">Credential-safe by design.</h2>
            <p className="mt-4 text-base leading-7 text-zinc-500">
              Browser requests stay provider-neutral. The local relay validates payloads, holds gateway credentials server-side, and streams grounded answers back with file citations.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <BentoCard title="Sanitized context">
              `.gitignore` rules, lockfiles, generated output, media, binaries, oversized files, and heavy repositories are filtered before sync.
            </BentoCard>
            <BentoCard title="Gateway relay">
              `apps/server` maps generic collection routes to the upstream gateway while keeping keys out of browser bundles and public routes.
            </BentoCard>
            <BentoCard title="File citations">
              Final stream metadata is parsed into clickable file pills that jump directly to the relevant context tree entry.
            </BentoCard>
          </div>
        </div>
      </section>

      <section id="install" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white md:text-4xl">Install once. Sync anywhere.</h2>
            <p className="mt-4 text-base leading-7 text-zinc-500">
              Native macOS, Linux, WSL, and Windows PowerShell installers bootstrap the workspace and expose `gitrag` globally.
            </p>
          </div>
          <div className="grid gap-3">
            {installBlocks.map(([label, command]) => (
              <div key={label} className="rounded-lg border border-zinc-900 bg-[#0A0A0A] p-4">
                <div className="mb-2 text-sm text-zinc-500">{label}</div>
                <code className="block overflow-x-auto whitespace-nowrap font-mono text-sm text-zinc-300">{command}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="docs" className="border-t border-zinc-900 bg-[#0A0A0A]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-black p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">Local configuration</h2>
            <pre className="mt-5 overflow-x-auto rounded-md border border-zinc-900 bg-[#0A0A0A] p-4 font-mono text-sm leading-6 text-zinc-400">{`GITRAG_CORE_GATEWAY_KEY=your_gateway_key_here
GITRAG_CORE_GATEWAY_URL=https://gateway.example.com
GITRAG_SERVER_PORT=8787`}</pre>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-black p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">Core commands</h2>
            <pre className="mt-5 overflow-x-auto rounded-md border border-zinc-900 bg-[#0A0A0A] p-4 font-mono text-sm leading-6 text-zinc-400">{`gitrag doctor
gitrag sync ./packages --collection core
gitrag sanitize ./apps/server`}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
