export type TerminalLine = {
  command?: string;
  response?: string;
};

export const terminalSequence: TerminalLine[] = [
  { command: "pnpm install" },
  { response: "workspace ready · 6 packages linked" },
  { command: "gitrag doctor" },
  { response: "✔ Node.js >= 18\n✔ Local GitRAG Relay Server Online\n✔ Gateway Environment Key Configured" },
  { command: "gitrag sync ./apps/server --collection core-api" },
  { response: "✔ src/index.ts synced\n✔ src/gatewayRoutes.ts synced\ncollection grounded" }
];

export function getTerminalLineCount() {
  return terminalSequence.length;
}
