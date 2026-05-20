export type StreamMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamKnowledgeFolderQueryInput = {
  serverUrl: string;
  folderId: string;
  messages: StreamMessage[];
  repository?: {
    name: string;
    branch?: string;
    sanitizedFiles?: string[];
  };
  onToken: (token: string) => void;
};

export async function streamKnowledgeFolderQuery(input: StreamKnowledgeFolderQueryInput): Promise<void> {
  const response = await fetch(
    `${input.serverUrl.replace(/\/$/, "")}/v1/knowledge-folders/${encodeURIComponent(input.folderId)}/query`,
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
    buffered = emitCompleteSseFrames(buffered, input.onToken);
  }

  buffered += decoder.decode();
  emitCompleteSseFrames(`${buffered}\n\n`, input.onToken);
}

function emitCompleteSseFrames(buffered: string, onToken: (token: string) => void): string {
  const frames = buffered.split(/\n\n/);
  const remainder = frames.pop() ?? "";

  for (const frame of frames) {
    const token = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    if (token.length > 0 && token !== "[DONE]") {
      onToken(token);
    }
  }

  return remainder;
}
