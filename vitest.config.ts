import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "adwatch/**/*.test.ts",
      "antideep/**/*.test.ts",
      "citoyen/**/*.test.ts",
      "cnra-analytics/**/*.test.ts",
      "copyright/**/*.test.ts",
      "edumedia/**/*.test.ts",
      "electrowatch/**/*.test.ts",
      "kidsprotect/**/*.test.ts",
      "mediabase/**/*.test.ts",
      "mediawatch/**/*.test.ts",
      "streamregul/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
})
