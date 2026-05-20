import type { FastifyInstance } from "fastify";
import { Readable } from "node:stream";
import { detectLanguage } from "@gitrag/sanitizer";
import { z } from "zod";

const queryPayloadSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().min(1)
    })
  ),
  repository: z
    .object({
      name: z.string().min(1),
      branch: z.string().optional(),
      sanitizedFiles: z.array(z.string()).optional()
    })
    .optional(),
  stream: z.boolean().default(true)
});

const defaultCoreGatewayUrl = ["https://api", "lang" + "dock", "com"].join(".");
const upstreamCollectionQueryPath = (collectionId: string) => `/v1/collections/${encodeURIComponent(collectionId)}/query`;
const upstreamCollectionUploadPath = (collectionId: string) => `/knowledge/${encodeURIComponent(collectionId)}/upload-async`;
const maxUploadConcurrency = 5;

export async function registerGatewayRoutes(server: FastifyInstance) {
  server.post("/v1/collections/:collectionId/query", async (request, reply) => {
    const { collectionId } = z.object({ collectionId: z.string().min(1) }).parse(request.params);
    const payload = queryPayloadSchema.parse(request.body);
    const apiKey = process.env.GITRAG_CORE_GATEWAY_KEY;
    const baseUrl = process.env.GITRAG_CORE_GATEWAY_URL ?? defaultCoreGatewayUrl;

    if (!apiKey) {
      return reply.code(500).send({
        error: "Upstream AI Gateway credential is not configured on the server."
      });
    }

    const upstream = await fetch(`${baseUrl}${upstreamCollectionQueryPath(collectionId)}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    reply.code(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        reply.header(key, value);
      }
    });
    reply.header("content-type", upstream.headers.get("content-type") ?? "text/event-stream");
    reply.header("cache-control", "no-cache");
    reply.header("connection", "keep-alive");

    if (!upstream.body) {
      return reply.send();
    }

    return reply.send(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]));
  });

  server.post("/v1/collections/:collectionId/files", async (request, reply) => {
    const { collectionId } = z.object({ collectionId: z.string().min(1) }).parse(request.params);
    const apiKey = process.env.GITRAG_CORE_GATEWAY_KEY;
    const baseUrl = process.env.GITRAG_CORE_GATEWAY_URL ?? defaultCoreGatewayUrl;

    if (!apiKey) {
      return reply.code(500).send({
        error: "Upstream AI Gateway credential is not configured on the server."
      });
    }

    if (!request.isMultipart()) {
      return reply.code(415).send({
        error: "Collection file upload requires multipart/form-data."
      });
    }

    const manifestFiles: Array<{ path: string; language?: string }> = [];
    const uploads: CollectionUploadFile[] = [];
    let fileIndex = 0;

    for await (const part of request.parts()) {
      if (part.type === "field" && part.fieldname === "manifest" && typeof part.value === "string") {
        const manifest = parseManifest(part.value);
        manifestFiles.push(...(manifest.files ?? []));
        continue;
      }

      if (part.type !== "file") {
        continue;
      }

      const manifestFile = manifestFiles[fileIndex];
      const filePath = normalizeUploadPath(manifestFile?.path ?? part.filename);
      const buffer = await part.toBuffer();
      uploads.push({
        filePath,
        language: manifestFile?.language ?? detectLanguage(filePath),
        buffer,
        mimeType: part.mimetype || "text/plain"
      });
      fileIndex += 1;
    }

    const results = await runBatched(uploads, maxUploadConcurrency, async (file) => {
      const form = new FormData();
      form.append("path", file.filePath);
      form.append("language", file.language);
      form.append(
        "metadata",
        JSON.stringify({
          source: "gitrag",
          path: file.filePath,
          language: file.language
        })
      );
      form.append("file", new Blob([toArrayBuffer(file.buffer)], { type: file.mimeType }), file.filePath);

      const upstream = await fetch(`${baseUrl}${upstreamCollectionUploadPath(collectionId)}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`
        },
        body: form
      });

      return {
        filePath: file.filePath,
        status: upstream.status,
        ok: upstream.ok
      };
    });

    const failed = results.filter((result) => !result.ok);
    return reply.code(failed.length > 0 ? 502 : 200).send({
      collectionId,
      uploaded: results.length - failed.length,
      failed: failed.length,
      files: results
    });
  });
}

type CollectionUploadFile = {
  filePath: string;
  language: string;
  buffer: Buffer;
  mimeType: string;
};

async function runBatched<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;

  async function runNext() {
    const index = cursor;
    cursor += 1;
    if (index >= items.length) {
      return;
    }

    results[index] = await worker(items[index] as T);
    await runNext();
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runNext()));
  return results;
}

function normalizeUploadPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function parseManifest(value: string): { files?: Array<{ path: string; language?: string }> } {
  try {
    return JSON.parse(value) as { files?: Array<{ path: string; language?: string }> };
  } catch {
    return JSON.parse(value.replace(/\\"/g, '"')) as { files?: Array<{ path: string; language?: string }> };
  }
}
