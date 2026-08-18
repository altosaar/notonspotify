import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Only for the mirror smoke test: forty components this repo did not write, and
// cannot check by eye. The rest of the site has no test setup and needs none.
export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ["browser"] },
  test: { environment: "happy-dom", include: ["src/**/*.test.ts"] },
});
