# GitRAG Server API Routing Contract

GitRAG's server is a credential-holding relay between the browser UI, the sanitizer package, and Langdock's API at `https://api.langdock.com`.

## Principles

- The browser never receives `LANGDOCK_API_KEY`.
- The server validates all incoming payloads before forwarding.
- Streaming responses are proxied without buffering the full model output.
- Sanitized repository metadata is explicit in the request payload.
- Langdock endpoint names remain visible in GitRAG routes so the relay is easy to audit.

## Environment

```env
LANGDOCK_API_KEY=LDK_your_workspace_api_key_here
LANGDOCK_BASE_URL=https://api.langdock.com
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

### `POST /v1/knowledge-folders/:folderId/query`

Relays a repository-grounded chat request to Langdock's Knowledge Folder API.

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
  -> read LANGDOCK_API_KEY from server env
  -> POST https://api.langdock.com/v1/knowledge-folders/:folderId/query
  -> stream upstream response to client
```

Error responses:

```json
{
  "error": "LANGDOCK_API_KEY is not configured on the server."
}
```

## Planned Route Extensions

### `POST /v1/repositories/sanitize`

Accepts a local path or uploaded file manifest and returns the sanitizer inclusion plan. This route should call `@gitrag/sanitizer` and never forward ignored files to Langdock.

### `POST /v1/knowledge-folders/:folderId/files`

Uploads sanitized source artifacts to a Langdock Knowledge Folder. The exact upstream shape should be finalized against Langdock's published API schema before implementation.

### `POST /v1/chat/stream`

UI-optimized alias that accepts repo context plus messages, resolves the active Knowledge Folder, and streams Markdown/code/citation output back to the custom chat console.
