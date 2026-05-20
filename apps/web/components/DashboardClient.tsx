"use client";

import { useState } from "react";
import { ContextSidebar } from "./ContextSidebar";
import { MarkdownConsole } from "./MarkdownConsole";

export function DashboardClient() {
  const [grounded, setGrounded] = useState(false);
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);

  return (
    <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[280px_1fr]">
      <ContextSidebar grounded={grounded} highlightedFile={highlightedFile} onGrounded={() => setGrounded(true)} />
      <MarkdownConsole enabled={grounded} onCitationClick={setHighlightedFile} />
    </div>
  );
}
