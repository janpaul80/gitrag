"use client";

import { useEffect, useState } from "react";
import { getIngestionStatus, type IngestionProgress } from "../lib/ingestionProgress";

type ContextSidebarProps = {
  grounded: boolean;
  highlightedFile?: string | null;
  onGrounded: () => void;
};

export function ContextSidebar({ grounded, highlightedFile, onGrounded }: ContextSidebarProps) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [progress, setProgress] = useState<IngestionProgress>({
    phase: grounded ? "grounded" : "idle",
    foundFiles: 0,
    syncedFiles: 0,
    totalFiles: 0
  });

  useEffect(() => {
    if (!highlightedFile) {
      return;
    }

    document.getElementById(`file-${highlightedFile}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, [highlightedFile]);

  async function beginIngestion() {
    const totalFiles = repositoryUrl.trim().length > 0 ? 42 : 0;
    setProgress({ phase: "crawling", foundFiles: 0, syncedFiles: 0, totalFiles: 0 });
    await delay(180);
    setProgress({ phase: "filtering", foundFiles: totalFiles, syncedFiles: 0, totalFiles });
    await delay(180);
    setProgress({ phase: "syncing", foundFiles: totalFiles, syncedFiles: 25, totalFiles });
    await delay(180);
    setProgress({ phase: "grounded", foundFiles: totalFiles, syncedFiles: totalFiles, totalFiles });
    onGrounded();
  }

  return (
    <aside className="border-r border-slate-800 pr-5">
      <div className="font-mono text-xs uppercase text-slate-500">workspace</div>
      <div className="mt-4 space-y-3">
        <input
          className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none"
          placeholder="repository url"
          value={repositoryUrl}
          onChange={(event) => setRepositoryUrl(event.target.value)}
        />
        <button
          className="w-full rounded border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 font-mono text-sm text-cyan-200 disabled:opacity-50"
          disabled={progress.phase === "crawling" || progress.phase === "filtering" || progress.phase === "syncing"}
          onClick={() => void beginIngestion()}
        >
          sync collection
        </button>
        <div className="min-h-16 rounded border border-slate-800 bg-[#0b0f14] p-3 font-mono text-xs leading-5 text-emerald-200">
          {getIngestionStatus(progress)}
        </div>
      </div>
      <nav className="mt-4 space-y-2 font-mono text-sm text-slate-300">
        <div className="rounded bg-slate-900 px-3 py-2 text-cyan-200">apps/web</div>
        <div className="px-3 py-2">apps/server</div>
        <div className="px-3 py-2">packages/cli</div>
        <div className="px-3 py-2">packages/sanitizer</div>
        {highlightedFile ? (
          <div id={`file-${highlightedFile}`} className="rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-cyan-100">
            {highlightedFile}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
