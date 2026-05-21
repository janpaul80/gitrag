import test from "node:test";
import assert from "node:assert/strict";
import { getTerminalLineCount, terminalSequence } from "./terminalSequence.js";

test("terminal sequence includes install, doctor, and sync commands", () => {
  assert.equal(getTerminalLineCount(), 6);
  assert.equal(terminalSequence.some((line) => line.command === "gitrag doctor"), true);
  assert.equal(terminalSequence.some((line) => line.command?.startsWith("gitrag sync")), true);
});
