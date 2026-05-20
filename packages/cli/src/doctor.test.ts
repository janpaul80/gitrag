import test from "node:test";
import assert from "node:assert/strict";
import { runDoctor } from "./doctor.js";

test("runDoctor reports passing checkpoints for a healthy setup", async () => {
  const result = await runDoctor({
    nodeVersion: "v20.11.1",
    gatewayKey: "configured",
    fetchHealth: async () => new Response(JSON.stringify({ ok: true, gatewayConfigured: true }), { status: 200 })
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.checks.map((check) => check.label),
    ["Node.js >= 18", "Local GitRAG Relay Server Online", "Gateway Environment Key Configured"]
  );
  assert.equal(result.lines.join("\n").includes("✔ Gateway Environment Key Configured"), true);
});

test("runDoctor reports failures for missing key and offline server", async () => {
  const result = await runDoctor({
    nodeVersion: "v20.11.1",
    gatewayKey: "configured",
    fetchHealth: async () => new Response(JSON.stringify({ ok: true, gatewayConfigured: false }), { status: 200 })
  });

  assert.equal(result.ok, false);
  assert.equal(result.lines.join("\n").includes("✔ Local GitRAG Relay Server Online"), true);
  assert.equal(result.lines.join("\n").includes("✖ Gateway Environment Key Configured"), true);
});

test("runDoctor reports failures for old node and offline server", async () => {
  const result = await runDoctor({
    nodeVersion: "v16.20.2",
    gatewayKey: "configured",
    fetchHealth: async () => {
      throw new Error("offline");
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.lines.join("\n").includes("✖ Node.js >= 18"), true);
  assert.equal(result.lines.join("\n").includes("✖ Local GitRAG Relay Server Offline"), true);
});
