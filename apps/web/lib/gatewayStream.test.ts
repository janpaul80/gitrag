import test from "node:test";
import assert from "node:assert/strict";
import { streamCollectionQuery } from "./gatewayStream.js";

test("streamCollectionQuery reads browser fetch chunks as text", async () => {
  const originalFetch = globalThis.fetch;
  const chunks: string[] = [];

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://localhost:8787/v1/collections/collection_123/query");
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

  await streamCollectionQuery({
    serverUrl: "http://localhost:8787",
    collectionId: "collection_123",
    messages: [{ role: "user", content: "Explain auth" }],
    onToken: (token) => chunks.push(token)
  });

  globalThis.fetch = originalFetch;
  assert.deepEqual(chunks, ["first", "second"]);
});
