import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

export default defineConfig({
  site: "https://notonspotify.jaan.io",
  output: "static",
  // Matches jaan.io: slash-less URLs, one .html file per route. There is only
  // one route here, so this is purely about the two sites behaving alike.
  trailingSlash: "never",
  build: { format: "file" },
  // Only for compiling the mirrored clocks.dev faces, which are .svelte files.
  // Nothing on the page is server-rendered by Svelte: the faces are mounted by
  // hand from clock.ts, one at a time, into the clock box.
  integrations: [svelte()],
});
