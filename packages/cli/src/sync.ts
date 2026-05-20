import { access } from "node:fs/promises";
import { packRepository, sanitizeRepositoryPlan } from "@gitrag/sanitizer";

export type SyncRepositoryInput = {
  path: string;
  collectionId: string;
  serverUrl?: string;
  onProgress?: (message: string) => void;
};

export type SyncRepositoryResult = {
  uploaded: number;
  failed: number;
};

export async function syncRepository(input: SyncRepositoryInput): Promise<SyncRepositoryResult> {
  await access(input.path);

  if (!process.env.GITRAG_CORE_GATEWAY_KEY) {
    throw new Error("GITRAG_CORE_GATEWAY_KEY must be readable in the host shell before syncing.");
  }

  const plan = sanitizeRepositoryPlan(input.path);
  const packed = await packRepository(input.path, {
    maxFileBytes: plan.maxFileBytes
  });
  const form = new FormData();

  form.append(
    "manifest",
    JSON.stringify({
      totalFiles: packed.files.length,
      files: packed.files.map((file) => ({
        path: file.filePath,
        language: file.language
      }))
    })
  );

  for (const file of packed.files) {
    form.append("files", new Blob([file.content], { type: "text/plain" }), file.filePath);
    input.onProgress?.(`✔ ${file.filePath} queued`);
  }

  const response = await fetch(
    `${(input.serverUrl ?? "http://localhost:8787").replace(/\/$/, "")}/v1/collections/${encodeURIComponent(
      input.collectionId
    )}/files`,
    {
      method: "POST",
      body: form
    }
  );

  if (!response.ok) {
    throw new Error(`GitRAG sync failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as SyncRepositoryResult;
  return body;
}
