#!/usr/bin/env node
import { sanitizeRepositoryPlan } from "@gitrag/sanitizer";
import { syncRepository } from "./sync.js";

const version = "0.1.0";
const [, , command, ...args] = process.argv;

function printHelp() {
  console.log(`GitRAG ${version}

Usage:
  gitrag --help
  gitrag --version
  gitrag doctor
  gitrag sanitize <repo-path>
  gitrag sync <repo-path> --collection <collection-id>
`);
}

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "--version" || command === "-v") {
  console.log(version);
  process.exit(0);
}

if (command === "doctor") {
  console.log("GitRAG doctor: Node.js and CLI entrypoint are available.");
  process.exit(0);
}

if (command === "sanitize") {
  const targetPath = args[0] ?? process.cwd();
  const plan = sanitizeRepositoryPlan(targetPath);
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}

if (command === "sync") {
  const targetPath = args[0];
  const collectionFlagIndex = args.indexOf("--collection");
  const collectionId = collectionFlagIndex >= 0 ? args[collectionFlagIndex + 1] : undefined;

  if (!targetPath || !collectionId) {
    console.error("Usage: gitrag sync <repo-path> --collection <collection-id>");
    process.exit(1);
  }

  const result = await syncRepository({
    path: targetPath,
    collectionId,
    onProgress: (message) => console.log(message)
  });
  console.log(`Collection sync complete: ${result.uploaded} uploaded, ${result.failed} failed.`);
  process.exit(result.failed > 0 ? 1 : 0);
}

console.error(`Unknown command: ${command}`);
printHelp();
process.exit(1);
