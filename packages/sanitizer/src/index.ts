import { readFile, readdir, stat } from "node:fs/promises";
import { relative, sep } from "node:path";
import ignore from "ignore";

export type SanitizedFile = {
  filePath: string;
  language: string;
  content: string;
};

export type IgnoredFile = {
  filePath: string;
  reason: "pattern" | "size" | "read-error";
};

export type RepositoryPack = {
  rootPath: string;
  files: SanitizedFile[];
  ignored: IgnoredFile[];
};

export type PackRepositoryOptions = {
  maxFileBytes?: number;
};

export type SanitizerPlan = {
  rootPath: string;
  ignoredGlobs: string[];
  maxFileBytes: number;
};

const defaultIgnoredGlobs = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/.next/**",
  "**/coverage/**",
  "**/.DS_Store",
  "**/Thumbs.db",
  "**/*.lock",
  "**/package-lock.json",
  "**/pnpm-lock.yaml",
  "**/yarn.lock",
  "**/bun.lockb",
  "**/*.{png,jpg,jpeg,gif,webp,ico,mp4,mov,zip,tar,gz,7z,pdf}"
];

const defaultMaxFileBytes = 500_000;

const languageByExtension = new Map<string, string>([
  [".cjs", "javascript"],
  [".css", "css"],
  [".go", "go"],
  [".html", "html"],
  [".java", "java"],
  [".js", "javascript"],
  [".json", "json"],
  [".jsx", "jsx"],
  [".md", "markdown"],
  [".mjs", "javascript"],
  [".py", "python"],
  [".rs", "rust"],
  [".sh", "shell"],
  [".sql", "sql"],
  [".tsx", "tsx"],
  [".ts", "typescript"],
  [".txt", "text"],
  [".yaml", "yaml"],
  [".yml", "yaml"]
]);

export function sanitizeRepositoryPlan(rootPath: string): SanitizerPlan {
  return {
    rootPath,
    ignoredGlobs: defaultIgnoredGlobs,
    maxFileBytes: defaultMaxFileBytes
  };
}

export async function packRepository(rootPath: string, options: PackRepositoryOptions = {}): Promise<RepositoryPack> {
  const maxFileBytes = options.maxFileBytes ?? defaultMaxFileBytes;
  const ignored: IgnoredFile[] = [];
  const matcher = ignore().add(defaultIgnoredGlobs).add(await readGitignorePatterns(rootPath));
  const candidateFiles = await walkFiles(rootPath);
  const files: SanitizedFile[] = [];

  for (const absolutePath of candidateFiles) {
    const filePath = toRepositoryPath(relative(rootPath, absolutePath));

    if (matcher.ignores(filePath)) {
      ignored.push({ filePath, reason: "pattern" });
      continue;
    }

    const fileStat = await stat(absolutePath);
    if (fileStat.size > maxFileBytes) {
      ignored.push({ filePath, reason: "size" });
      continue;
    }

    try {
      const content = normalizeContent(await readFile(absolutePath, "utf8"));
      files.push({
        filePath,
        language: detectLanguage(filePath),
        content
      });
    } catch {
      ignored.push({ filePath, reason: "read-error" });
    }
  }

  return {
    rootPath,
    files: files.sort((left, right) => left.filePath.localeCompare(right.filePath)),
    ignored: ignored.sort((left, right) => left.filePath.localeCompare(right.filePath))
  };
}

async function walkFiles(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = `${rootPath}${sep}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

async function readGitignorePatterns(rootPath: string): Promise<string[]> {
  const gitignoreFiles = (await walkFiles(rootPath)).filter((filePath) => filePath.endsWith(`${sep}.gitignore`));
  const patterns: string[] = [];

  for (const gitignorePath of gitignoreFiles) {
    const gitignoreDir = toRepositoryPath(relative(rootPath, gitignorePath)).replace(/(^|\/)\.gitignore$/, "");
    const prefix = gitignoreDir.length > 0 ? `${gitignoreDir}/` : "";
    const lines = normalizeContent(await readFile(gitignorePath, "utf8"))
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    for (const line of lines) {
      patterns.push(prefixGitignorePattern(prefix, line));
    }
  }

  return patterns;
}

function prefixGitignorePattern(prefix: string, pattern: string): string {
  if (prefix.length === 0) {
    return pattern;
  }

  if (pattern.startsWith("/")) {
    return `${prefix}${pattern.slice(1)}`;
  }

  if (pattern.includes("/")) {
    return `${prefix}${pattern}`;
  }

  return `${prefix}**/${pattern}`;
}

function detectLanguage(filePath: string): string {
  const extension = filePath.match(/\.[^.\/]+$/)?.[0]?.toLowerCase();
  return extension ? (languageByExtension.get(extension) ?? extension.slice(1)) : "text";
}

function normalizeContent(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function toRepositoryPath(filePath: string): string {
  return filePath.split(sep).join("/");
}
