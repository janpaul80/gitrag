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
  "service": "gitrag-server",
  "gatewayConfigured": true
}
```

`gatewayConfigured` is a boolean only. The relay never returns the configured credential value.

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

Citation handling:

```text
upstream final stream chunk
  -> JSON payload with citations or sources metadata
  -> browser parser extracts filePath/path/filename aliases
  -> console renders clickable file pills below the assistant answer
  -> clicking a pill scrolls the context tree to the cited file
```

Error responses:

```json
{
  "error": "Upstream AI Gateway credential is not configured on the server."
}
```

### `POST /v1/collections/:collectionId/files`

Uploads sanitized source artifacts to an upstream gateway collection through a provider-neutral multipart relay.

Request content type:

```http
multipart/form-data
```

Required form fields:

```text
manifest: JSON string
files: one or more source file blobs
```

Manifest shape:

```json
{
  "totalFiles": 2,
  "files": [
    {
      "path": "src/index.ts",
      "language": "typescript"
    },
    {
      "path": "README.md",
      "language": "markdown"
    }
  ]
}
```

Server behavior:

```text
multipart request
  -> validate server gateway credential
  -> parse manifest and file parts
  -> preserve repository-relative paths from manifest metadata
  -> upload files to the upstream collection endpoint with concurrency limit 5
  -> attach path, language, and metadata to every upstream payload
```

Response:

```json
{
  "collectionId": "collection_123",
  "uploaded": 2,
  "failed": 0,
  "files": [
    {
      "filePath": "src/index.ts",
      "status": 202,
      "ok": true
    }
  ]
}
```

## CLI Contract

```bash
gitrag sync <local-path> --collection <collectionId>
```

CLI behavior:

```text
local path
  -> verify path exists
  -> verify GITRAG_CORE_GATEWAY_KEY is readable from the host shell
  -> run @gitrag/sanitizer packRepository()
  -> post multipart files to http://localhost:8787/v1/collections/:collectionId/files
  -> print one terminal progress line per queued source file
```

Doctor command:

```bash
gitrag doctor
```

Doctor verifies:

```text
Node.js >= 18
Local GitRAG relay server /health availability
Server-side gateway environment initialization
```

Example output:

```text
✔ Node.js >= 18
✔ Local GitRAG Relay Server Online
✔ Gateway Environment Key Configured
```

## Sanitizer Limits

Default sync safety ceilings:

```text
single file cap: 500KB
source file cap: 250 files
collective source cap: 15MB
```

When a repository crosses these thresholds, GitRAG throws a descriptive `RepositoryLimitError` instructing the user to configure a targeted `.gitignore` or pass an explicit subfolder pathway scope.

## Planned Route Extensions

### `POST /v1/repositories/sanitize`

Accepts a local path or uploaded file manifest and returns the sanitizer inclusion plan. This route should call `@gitrag/sanitizer` and never forward ignored files to the upstream gateway.

### `POST /v1/chat/stream`

UI-optimized alias that accepts repo context plus messages, resolves the active collection, and streams Markdown/code/citation output back to the custom chat console.
