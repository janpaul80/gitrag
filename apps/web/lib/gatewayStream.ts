export type StreamMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamCitation = {
  filePath: string;
};

export type StreamCollectionQueryInput = {
  serverUrl: string;
  collectionId: string;
  messages: StreamMessage[];
  repository?: {
    name: string;
    branch?: string;
    sanitizedFiles?: string[];
  };
  onToken: (token: string) => void;
  onCitations?: (citations: StreamCitation[]) => void;
};

export async function streamCollectionQuery(input: StreamCollectionQueryInput): Promise<void> {
  const response = await fetch(
    `${input.serverUrl.replace(/\/$/, "")}/v1/collections/${encodeURIComponent(input.collectionId)}/query`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream"
      },
      body: JSON.stringify({
        messages: input.messages,
        repository: input.repository,
        stream: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(`GitRAG stream failed with HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error("GitRAG stream response did not include a body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffered += decoder.decode(value, { stream: true });
    buffered = emitCompleteSseFrames(buffered, input.onToken, input.onCitations);
  }

  buffered += decoder.decode();
  emitCompleteSseFrames(`${buffered}\n\n`, input.onToken, input.onCitations);
}

function emitCompleteSseFrames(
  buffered: string,
  onToken: (token: string) => void,
  onCitations?: (citations: StreamCitation[]) => void
): string {
  const frames = buffered.split(/\n\n/);
  const remainder = frames.pop() ?? "";

  for (const frame of frames) {
    const token = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    const citations = parseCitationToken(token);
    if (citations.length > 0) {
      onCitations?.(citations);
    } else if (token.length > 0 && token !== "[DONE]") {
      onToken(token);
    }
  }

  return remainder;
}

export function parseCitationToken(token: string): StreamCitation[] {
  try {
    const parsed = JSON.parse(token) as {
      citations?: Array<Record<string, unknown>>;
      sources?: Array<Record<string, unknown>>;
    };
    const sourceItems = parsed.citations ?? parsed.sources ?? [];
    return sourceItems
      .map((item) => item.filePath ?? item.path ?? item.filename)
      .filter((filePath): filePath is string => typeof filePath === "string" && filePath.length > 0)
      .map((filePath) => ({ filePath }));
  } catch {
    return [];
  }
}
