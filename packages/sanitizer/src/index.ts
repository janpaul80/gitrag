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
  "**/*.lock",
  "**/*.{png,jpg,jpeg,gif,webp,ico,mp4,mov,zip,tar,gz,7z,pdf}"
];

export function sanitizeRepositoryPlan(rootPath: string): SanitizerPlan {
  return {
    rootPath,
    ignoredGlobs: defaultIgnoredGlobs,
    maxFileBytes: 256_000
  };
}
