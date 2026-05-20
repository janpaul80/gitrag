import test from "node:test";
import assert from "node:assert/strict";
import { streamKnowledgeFolderQuery } from "./langdockStream.js";

test("streamKnowledgeFolderQuery reads browser fetch chunks as text", async () => {
  const originalFetch = globalThis.fetch;
  const chunks: string[] = [];

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://localhost:8787/v1/knowledge-folders/folder_123/query");
    assert.equal(init?.method, "POST");

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: first\n\n"));
          controller.enqueue(new TextEncoder().encode("data: second\n\n"));
          controller.close();
        }
      }),
      {
        status: 200,
        headers: {
          "content-type": "text/event-stream"
        }
      }
    );
  };

  await streamKnowledgeFolderQuery({
    serverUrl: "http://localhost:8787",
    folderId: "folder_123",
    messages: [{ role: "user", content: "Explain auth" }],
    onToken: (token) => chunks.push(token)
  });

  globalThis.fetch = originalFetch;
  assert.deepEqual(chunks, ["first", "second"]);
});
