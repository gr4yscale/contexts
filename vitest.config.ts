import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// setupFiles: ["./src/test/setup.ts"],

export default defineConfig({
  plugins: [react()],
  test: {
    maxConcurrency: 1,
    globals: true,
    environment: "jsdom", // For React component testing
    include: ["src/**/*.test.{ts,tsx,mts,mtsx}"],
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
