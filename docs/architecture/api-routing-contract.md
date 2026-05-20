# GitRAG Server API Routing Contract

GitRAG's server is a credential-holding relay between the browser UI, the sanitizer package, and an upstream Enterprise AI Gateway.

## Principles

- The browser never receives `GITRAG_CORE_GATEWAY_KEY`.
- The server validates all incoming payloads before forwarding.
- Streaming responses are proxied without buffering the full model output.
- Sanitized repository metadata is explicit in the request payload.
- Public GitRAG route names stay provider-neutral so the project remains brand-agnostic.

## Environment

```env
GITRAG_CORE_GATEWAY_KEY=your_gateway_key_here
GITRAG_CORE_GATEWAY_URL=https://gateway.example.com
GITRAG_SERVER_PORT=8787
```

## Routes

### `GET /health`

Returns local server health.

Response:

```json
{
  "ok": true,
  "service": "gitrag-server"
}
```

### `POST /v1/collections/:collectionId/query`

Relays a repository-grounded chat request to the upstream Enterprise AI Gateway.

Request:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Where is authentication handled?"
    }
  ],
  "repository": {
    "name": "janpaul80/gitrag",
    "branch": "main",
    "sanitizedFiles": ["apps/server/src/index.ts"]
  },
  "stream": true
}
```

Server behavior:

```text
client request
  -> validate body with zod
  -> read GITRAG_CORE_GATEWAY_KEY from server env
  -> POST upstream collection query endpoint
  -> stream upstream response to client
```

Error responses:

```json
{
  "error": "Upstream AI Gateway credential is not configured on the server."
}
```

## Planned Route Extensions

### `POST /v1/repositories/sanitize`

Accepts a local path or uploaded file manifest and returns the sanitizer inclusion plan. This route should call `@gitrag/sanitizer` and never forward ignored files to the upstream gateway.

### `POST /v1/collections/:collectionId/files`

Uploads sanitized source artifacts to an upstream gateway collection. The exact upstream shape should be finalized against the gateway schema before implementation.

### `POST /v1/chat/stream`

UI-optimized alias that accepts repo context plus messages, resolves the active Knowledge Folder, and streams Markdown/code/citation output back to the custom chat console.
