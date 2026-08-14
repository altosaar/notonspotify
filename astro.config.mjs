import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://notonspotify.jaan.io",
  output: "static",
  // Matches jaan.io: slash-less URLs, one .html file per route. There is only
  // one route here, so this is purely about the two sites behaving alike.
  trailingSlash: "never",
  build: { format: "file" },
});
