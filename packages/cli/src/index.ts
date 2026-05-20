#!/usr/bin/env node
import { sanitizeRepositoryPlan } from "@gitrag/sanitizer";

const version = "0.1.0";
const [, , command, ...args] = process.argv;

function printHelp() {
  console.log(`GitRAG ${version}

Usage:
  gitrag --help
  gitrag --version
  gitrag doctor
  gitrag sanitize <repo-path>
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

console.error(`Unknown command: ${command}`);
printHelp();
process.exit(1);
