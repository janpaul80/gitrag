import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncRepository } from "./sync.js";

test("syncRepository packs local files and posts them to the local collection relay", async () => {
  const root = await mkdtemp(join(tmpdir(), "gitrag-cli-sync-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "index.ts"), "export const ok = true;\n");
  await writeFile(join(root, "package-lock.json"), "{}\n");

  const originalFetch = globalThis.fetch;
  const originalGatewayKey = process.env.GITRAG_CORE_GATEWAY_KEY;
  const calls: Array<{ url: string; body: FormData }> = [];
  process.env.GITRAG_CORE_GATEWAY_KEY = "gateway_test_key";
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), body: init?.body as FormData });
    return new Response(JSON.stringify({ uploaded: 1 }), { status: 200 });
  };

  const result = await syncRepository({
    path: root,
    collectionId: "collection_123",
    serverUrl: "http://localhost:8787"
  });

  globalThis.fetch = originalFetch;
  process.env.GITRAG_CORE_GATEWAY_KEY = originalGatewayKey;

  assert.equal(result.uploaded, 1);
  assert.equal(calls[0]?.url, "http://localhost:8787/v1/collections/collection_123/files");
  assert.equal(
    calls[0]?.body.get("manifest"),
    JSON.stringify({ totalFiles: 1, files: [{ path: "src/index.ts", language: "typescript" }] })
  );
  assert.equal((calls[0]?.body.get("files") as File).name, "src/index.ts");
});
