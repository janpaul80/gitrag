import test from "node:test";
import assert from "node:assert/strict";
import { getIngestionStatus } from "./ingestionProgress.js";

test("getIngestionStatus renders terminal-style ingestion phases", () => {
  assert.equal(getIngestionStatus({ phase: "crawling", foundFiles: 0, syncedFiles: 0, totalFiles: 0 }), "[!] Crawling directory...");
  assert.equal(
    getIngestionStatus({ phase: "filtering", foundFiles: 42, syncedFiles: 0, totalFiles: 42 }),
    "[!] Found 42 source files. Filtering assets..."
  );
  assert.equal(
    getIngestionStatus({ phase: "syncing", foundFiles: 42, syncedFiles: 25, totalFiles: 42 }),
    "[>] Syncing collection to core gateway... [██████░░░░] 60%"
  );
  assert.equal(getIngestionStatus({ phase: "grounded", foundFiles: 42, syncedFiles: 42, totalFiles: 42 }), "[ONLINE/GROUNDED]");
});
