"use client";

import { useState } from "react";
import { ContextSidebar } from "./ContextSidebar";
import { MarkdownConsole } from "./MarkdownConsole";

export function DashboardClient() {
  const [grounded, setGrounded] = useState(false);

  return (
    <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[280px_1fr]">
      <ContextSidebar grounded={grounded} onGrounded={() => setGrounded(true)} />
      <MarkdownConsole enabled={grounded} />
    </div>
  );
}
