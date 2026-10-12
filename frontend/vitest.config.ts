import { defineConfig } from "vitest/config";

// Vitest runs the TypeScript specs (*.spec.ts). The older plain-JS tests
// (*.test.js) run with `node --test`; see the "test" script in package.json.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
  },
});
