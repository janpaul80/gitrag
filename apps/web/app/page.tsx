import { MarkdownConsole } from "../components/MarkdownConsole";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0f14] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6">
        <header className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <img src="/gitrag-logo.svg" alt="GitRAG" className="h-9 w-9" />
            <div>
              <h1 className="font-mono text-lg font-semibold tracking-normal">GitRAG</h1>
              <p className="text-sm text-slate-400">Repo oracle via Langdock</p>
            </div>
          </div>
          <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
            scaffold online
          </div>
        </header>

        <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[280px_1fr]">
          <aside className="border-r border-slate-800 pr-5">
            <div className="font-mono text-xs uppercase text-slate-500">workspace</div>
            <nav className="mt-4 space-y-2 font-mono text-sm text-slate-300">
              <div className="rounded bg-slate-900 px-3 py-2 text-cyan-200">apps/web</div>
              <div className="px-3 py-2">apps/server</div>
              <div className="px-3 py-2">packages/cli</div>
              <div className="px-3 py-2">packages/sanitizer</div>
            </nav>
          </aside>

          <MarkdownConsole />
        </div>
      </section>
    </main>
  );
}
