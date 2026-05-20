import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { RepositoryLimitError, packRepository, sanitizeRepositoryPlan } from "./index.js";

test("packRepository merges .gitignore rules with defaults and enforces file size caps", async () => {
  const root = await mkdtemp(join(tmpdir(), "gitrag-sanitizer-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "node_modules", "left-pad"), { recursive: true });
  await writeFile(join(root, ".gitignore"), "ignored-local.ts\nbuild-output/\n");
  await writeFile(join(root, "src", "index.ts"), "export const value = 1;\n");
  await writeFile(join(root, "ignored-local.ts"), "export const ignored = true;\n");
  await writeFile(join(root, "package-lock.json"), "{}\n");
  await writeFile(join(root, "node_modules", "left-pad", "index.js"), "module.exports = '';\n");
  await writeFile(join(root, "large.ts"), "x".repeat(64));

  const packed = await packRepository(root, { maxFileBytes: 40 });

  assert.deepEqual(
    packed.files.map((file) => file.filePath).sort(),
    [".gitignore", "src/index.ts"]
  );
  assert.deepEqual(
    packed.ignored
      .filter((entry) => ["size", "pattern"].includes(entry.reason))
      .map((entry) => entry.filePath)
      .sort(),
    ["ignored-local.ts", "large.ts", "node_modules/left-pad/index.js", "package-lock.json"]
  );
});

test("packRepository returns language metadata and clean text content", async () => {
  const root = await mkdtemp(join(tmpdir(), "gitrag-language-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "component.tsx"), "export function Component() {\n  return <div />;\n}\n");
  await writeFile(join(root, "README.md"), "# Demo\n\nHello.\n");

  const packed = await packRepository(root);

  assert.deepEqual(packed.files, [
    {
      filePath: "README.md",
      language: "markdown",
      content: "# Demo\n\nHello.\n"
    },
    {
      filePath: "src/component.tsx",
      language: "tsx",
      content: "export function Component() {\n  return <div />;\n}\n"
    }
  ]);
});

test("packRepository fails gracefully when source file count crosses the repository ceiling", async () => {
  const root = await mkdtemp(join(tmpdir(), "gitrag-heavy-count-"));
  for (let index = 0; index < 3; index += 1) {
    await writeFile(join(root, `file${index}.ts`), `export const value${index} = ${index};\n`);
  }

  await assert.rejects(
    () => packRepository(root, { maxSourceFiles: 2 }),
    (error) =>
      error instanceof RepositoryLimitError &&
      error.message.includes("configure a targeted .gitignore") &&
      error.message.includes("explicit subfolder")
  );
});

test("sanitizeRepositoryPlan exposes global heavy repository thresholds", () => {
  const plan = sanitizeRepositoryPlan(".");
  assert.equal(plan.maxSourceFiles, 250);
  assert.equal(plan.maxTotalBytes, 15_000_000);
});
