import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    maxConcurrency: 1,
    globals: true,
    environment: "node",
    include: ["src/**/*.test.{ts,mts}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    },
    // run tests serially since db integration tests rely on a shared postgres container
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1,
      },
    },
  },
});
