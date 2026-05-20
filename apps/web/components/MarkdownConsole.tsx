"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { streamKnowledgeFolderQuery, type StreamMessage } from "../lib/langdockStream";

const initialMessages: StreamMessage[] = [
  {
    role: "system",
    content: "Repository indexed. Sanitizer skipped lockfiles, media, generated output, and heavy binaries."
  },
  {
    role: "user",
    content: "Where does authentication enter the API layer?"
  }
];

export function MarkdownConsole() {
  const [messages, setMessages] = useState<StreamMessage[]>(initialMessages);
  const [answer, setAnswer] = useState(
    "GitRAG keeps Langdock credentials inside `apps/server`. Browser requests carry repo intent and chat payloads only; the relay injects the Workspace API key server-side."
  );
  const [prompt, setPrompt] = useState("Explain the Langdock relay route.");
  const [isStreaming, setIsStreaming] = useState(false);

  async function submitPrompt() {
    const nextMessages: StreamMessage[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setAnswer("");
    setIsStreaming(true);

    try {
      await streamKnowledgeFolderQuery({
        serverUrl: process.env.NEXT_PUBLIC_GITRAG_SERVER_URL ?? "http://localhost:8787",
        folderId: process.env.NEXT_PUBLIC_GITRAG_KNOWLEDGE_FOLDER_ID ?? "local-dev",
        messages: nextMessages,
        onToken: (token) => setAnswer((current) => `${current}${token}`)
      });
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "GitRAG stream failed.");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <section className="flex min-h-[620px] flex-col overflow-hidden rounded border border-slate-800 bg-[#0f151c]">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="font-mono text-sm text-slate-300">console://repo-oracle</div>
        <div className={isStreaming ? "h-2 w-2 rounded-full bg-cyan-300" : "h-2 w-2 rounded-full bg-emerald-400"} />
      </div>
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {messages.map((item, index) => (
          <article key={`${item.role}:${index}`} className="font-mono">
            <div className="mb-1 text-xs uppercase text-slate-500">{item.role}</div>
            <div className="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.content}</div>
          </article>
        ))}
        <article className="font-mono">
          <div className="mb-1 text-xs uppercase text-slate-500">assistant</div>
          <ReactMarkdown
            components={{
              code: ({ children }) => (
                <code className="rounded bg-slate-950 px-1.5 py-0.5 text-cyan-100">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="my-3 overflow-auto rounded bg-slate-950 p-3 text-sm text-slate-100">{children}</pre>
              )
            }}
          >
            {answer}
          </ReactMarkdown>
        </article>
      </div>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-2 rounded bg-[#0b0f14] px-3 py-3 font-mono text-sm text-slate-300">
          <span className="text-cyan-300">&gt;</span>
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isStreaming) {
                void submitPrompt();
              }
            }}
          />
          <button
            className="rounded border border-cyan-400/30 px-3 py-1 text-cyan-200 disabled:opacity-50"
            disabled={isStreaming}
            onClick={() => void submitPrompt()}
          >
            send
          </button>
        </div>
      </div>
    </section>
  );
}
