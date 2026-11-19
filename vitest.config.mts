import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": src } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // These three files use node:test and are executed by `npm run test:unit`.
    exclude: [
      "**/node_modules/**",
      "tests/submission-policy.test.ts",
      "tests/template-design.test.ts",
      "tests/template-studio.test.ts",
    ],
    setupFiles: ["tests/vitest.setup.ts"],
  },
});
