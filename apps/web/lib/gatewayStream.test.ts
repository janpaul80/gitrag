import test from "node:test";
import assert from "node:assert/strict";
import { parseCitationToken, streamCollectionQuery } from "./gatewayStream.js";

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

test("streamCollectionQuery emits citation metadata from final stream chunks", async () => {
  const originalFetch = globalThis.fetch;
  const tokens: string[] = [];
  const citations: string[][] = [];

  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: Answer text\n\n"));
          controller.enqueue(
            new TextEncoder().encode('data: {"citations":[{"filePath":"src/index.ts"},{"path":"packages/cli/src/index.ts"}]}\n\n')
          );
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

  await streamCollectionQuery({
    serverUrl: "http://localhost:8787",
    collectionId: "collection_123",
    messages: [{ role: "user", content: "Explain auth" }],
    onToken: (token) => tokens.push(token),
    onCitations: (items) => citations.push(items.map((item) => item.filePath))
  });

  globalThis.fetch = originalFetch;
  assert.deepEqual(tokens, ["Answer text"]);
  assert.deepEqual(citations, [["src/index.ts", "packages/cli/src/index.ts"]]);
});

test("parseCitationToken accepts source metadata aliases", () => {
  assert.deepEqual(parseCitationToken('{"sources":[{"filename":"README.md"}]}'), [{ filePath: "README.md" }]);
});
