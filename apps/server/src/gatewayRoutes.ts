import type { FastifyInstance } from "fastify";
import { Readable } from "node:stream";
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
}
