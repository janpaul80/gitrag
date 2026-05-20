import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "./index.js";

test("collection query proxies Enterprise AI Gateway SSE bytes without resolving JSON", async () => {
  const originalApiKey = process.env.GITRAG_CORE_GATEWAY_KEY;
  const originalBaseUrl = process.env.GITRAG_CORE_GATEWAY_URL;
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; authorization: string | null; body: string }> = [];

  process.env.GITRAG_CORE_GATEWAY_KEY = "gateway_test_key";
  process.env.GITRAG_CORE_GATEWAY_URL = "https://gateway.test";
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
    url: "/v1/collections/collection_123/query",
    payload: {
      messages: [{ role: "user", content: "Explain auth" }],
      stream: true
    }
  });

  await server.close();
  globalThis.fetch = originalFetch;
  process.env.GITRAG_CORE_GATEWAY_KEY = originalApiKey;
  process.env.GITRAG_CORE_GATEWAY_URL = originalBaseUrl;

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "text/event-stream");
  assert.equal(response.headers["cache-control"], "no-cache");
  assert.equal(response.headers.connection, "keep-alive");
  assert.equal(response.body, "data: hello\n\ndata: world\n\n");
  assert.equal(calls[0]?.url, "https://gateway.test/v1/collections/collection_123/query");
  assert.equal(calls[0]?.authorization, "Bearer gateway_test_key");
  assert.match(calls[0]?.body ?? "", /Explain auth/);
});

test("collection files route uploads multipart code files to the upstream gateway", async () => {
  const originalApiKey = process.env.GITRAG_CORE_GATEWAY_KEY;
  const originalBaseUrl = process.env.GITRAG_CORE_GATEWAY_URL;
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; authorization: string | null; body: FormData }> = [];
  let activeUploads = 0;
  let maxActiveUploads = 0;

  process.env.GITRAG_CORE_GATEWAY_KEY = "gateway_test_key";
  process.env.GITRAG_CORE_GATEWAY_URL = "https://gateway.test";
  globalThis.fetch = async (input, init) => {
    activeUploads += 1;
    maxActiveUploads = Math.max(maxActiveUploads, activeUploads);
    await new Promise((resolve) => setTimeout(resolve, 5));
    activeUploads -= 1;

    calls.push({
      url: String(input),
      authorization: new Headers(init?.headers).get("authorization"),
      body: init?.body as FormData
    });

    return new Response(JSON.stringify({ queued: true }), { status: 202 });
  };

  const form = new FormData();
  form.append(
    "manifest",
    JSON.stringify({
      files: Array.from({ length: 7 }, (_, index) => ({
        path: `src/file${index}.ts`,
        language: "typescript"
      }))
    })
  );
  for (let index = 0; index < 7; index += 1) {
    form.append("files", new Blob([`export const value${index} = ${index};\n`], { type: "text/plain" }), `file${index}.ts`);
  }

  const server = await buildServer();
  const response = await server.inject({
    method: "POST",
    url: "/v1/collections/collection_123/files",
    headers: Object.fromEntries(form.headers?.entries?.() ?? []),
    payload: form
  });

  await server.close();
  globalThis.fetch = originalFetch;
  process.env.GITRAG_CORE_GATEWAY_KEY = originalApiKey;
  process.env.GITRAG_CORE_GATEWAY_URL = originalBaseUrl;

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).uploaded, 7);
  assert.equal(calls.length, 7);
  assert.equal(maxActiveUploads <= 5, true);
  assert.equal(calls[0]?.url, "https://gateway.test/knowledge/collection_123/upload-async");
  assert.equal(calls[0]?.authorization, "Bearer gateway_test_key");
  assert.equal(calls[0]?.body.get("path"), "src/file0.ts");
  assert.equal(calls[0]?.body.get("language"), "typescript");
  assert.equal((calls[0]?.body.get("file") as File).name, "src/file0.ts");
});

test("collection files route accepts shell-escaped manifest JSON", async () => {
  const originalApiKey = process.env.GITRAG_CORE_GATEWAY_KEY;
  const originalBaseUrl = process.env.GITRAG_CORE_GATEWAY_URL;
  const originalFetch = globalThis.fetch;

  process.env.GITRAG_CORE_GATEWAY_KEY = "gateway_test_key";
  process.env.GITRAG_CORE_GATEWAY_URL = "https://gateway.test";
  globalThis.fetch = async () => new Response(JSON.stringify({ queued: true }), { status: 202 });

  const form = new FormData();
  form.append("manifest", '{\\"files\\":[{\\"path\\":\\"src/smoke.ts\\",\\"language\\":\\"typescript\\"}]}');
  form.append("files", new Blob(["export const smoke = true;\n"], { type: "text/plain" }), "smoke.ts");

  const server = await buildServer();
  const response = await server.inject({
    method: "POST",
    url: "/v1/collections/collection_123/files",
    payload: form
  });

  await server.close();
  globalThis.fetch = originalFetch;
  process.env.GITRAG_CORE_GATEWAY_KEY = originalApiKey;
  process.env.GITRAG_CORE_GATEWAY_URL = originalBaseUrl;

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).uploaded, 1);
});
