const transcript = [
  {
    role: "system",
    content: "Repository indexed. Sanitizer skipped lockfiles, media, generated output, and heavy binaries."
  },
  {
    role: "user",
    content: "Where does authentication enter the API layer?"
  },
  {
    role: "assistant",
    content:
      "GitRAG will keep Langdock credentials inside apps/server. Browser requests carry repo intent and chat payloads only; the relay injects the Workspace API key server-side."
  }
];

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

          <section className="flex min-h-[620px] flex-col overflow-hidden rounded border border-slate-800 bg-[#0f151c]">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="font-mono text-sm text-slate-300">console://repo-oracle</div>
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 space-y-4 overflow-auto p-4">
              {transcript.map((item) => (
                <article key={`${item.role}:${item.content}`} className="font-mono">
                  <div className="mb-1 text-xs uppercase text-slate-500">{item.role}</div>
                  <p className="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.content}</p>
                </article>
              ))}
            </div>
            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center gap-2 rounded bg-[#0b0f14] px-3 py-3 font-mono text-sm text-slate-400">
                <span className="text-cyan-300">&gt;</span>
                <span>Ask GitRAG about this repository</span>
                <span className="h-4 w-2 animate-pulse bg-cyan-300" />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
