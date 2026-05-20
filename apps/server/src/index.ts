import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerGatewayRoutes } from "./gatewayRoutes.js";

export async function buildServer() {
  const server = Fastify({
    logger: true
  });

  await server.register(cors, {
    origin: true
  });

  server.get("/health", async () => ({
    ok: true,
    service: "gitrag-server"
  }));

  await registerGatewayRoutes(server);

  return server;
}

const isDirectRun = process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts");

if (isDirectRun) {
  const port = Number(process.env.GITRAG_SERVER_PORT ?? 8787);
  const server = await buildServer();
  await server.listen({ host: "0.0.0.0", port });
}
