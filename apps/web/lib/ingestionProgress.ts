export type IngestionPhase = "idle" | "crawling" | "filtering" | "syncing" | "grounded";

export type IngestionProgress = {
  phase: IngestionPhase;
  foundFiles: number;
  syncedFiles: number;
  totalFiles: number;
};

export function getIngestionStatus(progress: IngestionProgress): string {
  if (progress.phase === "crawling") {
    return "[!] Crawling directory...";
  }

  if (progress.phase === "filtering") {
    return `[!] Found ${progress.foundFiles} source files. Filtering assets...`;
  }

  if (progress.phase === "syncing") {
    return `[>] Syncing collection to core gateway... [${getProgressBar(progress.syncedFiles, progress.totalFiles)}] ${getPercent(
      progress.syncedFiles,
      progress.totalFiles
    )}%`;
  }

  if (progress.phase === "grounded") {
    return "[ONLINE/GROUNDED]";
  }

  return "[OFFLINE]";
}

export function getProgressBar(value: number, total: number): string {
  const cells = 10;
  const filled = Math.max(0, Math.min(cells, Math.round((value / Math.max(total, 1)) * cells)));
  return `${"█".repeat(filled)}${"░".repeat(cells - filled)}`;
}

function getPercent(value: number, total: number): number {
  return Math.round((value / Math.max(total, 1)) * 100);
}
