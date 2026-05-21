"use client";

import * as motion from "framer-motion/client";
import { terminalSequence } from "../lib/terminalSequence";

const spring = { type: "spring", stiffness: 100, damping: 15 } as const;

export function TerminalSimulator() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#0A0A0A] shadow-[0_0_20px_rgba(255,255,255,0.05)]">
      <div className="flex h-10 items-center gap-2 border-b border-zinc-900 px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
        <span className="ml-3 font-mono text-xs text-zinc-500">gitrag://terminal</span>
      </div>
      <div className="min-h-[360px] space-y-5 p-5 font-mono text-sm leading-6 text-zinc-300">
        {terminalSequence.map((line, index) => (
          <motion.div
            key={`${line.command ?? line.response}:${index}`}
            animate={{ opacity: [0.28, 1], y: [12, 0] }}
            transition={{
              ...spring,
              delay: index * 0.28,
              duration: 1.8,
              repeat: Infinity,
              repeatDelay: terminalSequence.length * 0.44
            }}
          >
            {line.command ? (
              <div>
                <span className="text-zinc-500">$</span> <span className="text-white">{line.command}</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-zinc-500">{line.response}</pre>
            )}
          </motion.div>
        ))}
        <motion.div
          className="h-4 w-2 bg-white"
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </div>
  );
}
