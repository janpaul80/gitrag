import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "./index.js";

test("knowledge folder query proxies Langdock SSE bytes without resolving JSON", async () => {
  const originalApiKey = process.env.LANGDOCK_API_KEY;
  const originalBaseUrl = process.env.LANGDOCK_BASE_URL;
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; authorization: string | null; body: string }> = [];

  process.env.LANGDOCK_API_KEY = "LDK_test_key";
  process.env.LANGDOCK_BASE_URL = "https://api.langdock.test";
  globalThis.fetch = async (input, init) => {
    calls.push({
      url: String(input),
      authorization: new Headers(init?.headers).get("authorization"),
      body: String(init?.body)
    });

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: hello\n\n"));
          controller.enqueue(new TextEncoder().encode("data: world\n\n"));
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

  const server = await buildServer();
  const response = await server.inject({
    method: "POST",
    url: "/v1/knowledge-folders/folder_123/query",
    payload: {
      messages: [{ role: "user", content: "Explain auth" }],
      stream: true
    }
  });

  await server.close();
  globalThis.fetch = originalFetch;
  process.env.LANGDOCK_API_KEY = originalApiKey;
  process.env.LANGDOCK_BASE_URL = originalBaseUrl;

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "text/event-stream");
  assert.equal(response.headers["cache-control"], "no-cache");
  assert.equal(response.headers.connection, "keep-alive");
  assert.equal(response.body, "data: hello\n\ndata: world\n\n");
  assert.equal(calls[0]?.url, "https://api.langdock.test/v1/knowledge-folders/folder_123/query");
  assert.equal(calls[0]?.authorization, "Bearer LDK_test_key");
  assert.match(calls[0]?.body ?? "", /Explain auth/);
});
