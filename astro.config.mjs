import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

const FACES = resolve(dirname(fileURLToPath(import.meta.url)), "faces.json");

/**
 * Lets the face picker at /faces save straight to faces.json.
 *
 * A browser cannot write to the repo, and a copy-the-JSON-and-paste-it step is a
 * step to forget. This is the standard way round it: one dev-server route that
 * takes the selection and writes the file. `apply: "serve"` means it exists in
 * `astro dev` and nowhere else — nothing is added to the built site.
 */
function facesWriter() {
  return {
    name: "faces-writer",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__faces", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            // Parsed before writing, so a mangled request cannot leave the file
            // unreadable and take the next build down with it.
            const parsed = JSON.parse(body);
            writeFileSync(FACES, `${JSON.stringify(parsed, null, 2)}\n`);
            res.statusCode = 204;
            res.end();
          } catch (error) {
            res.statusCode = 400;
            res.end(String(error));
          }
        });
      });
    },
  };
}

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
  vite: {
    plugins: [facesWriter()],
    server: {
      // faces.json is in the module graph, so every tick of a checkbox would
      // otherwise reload the page and reset all ten clocks mid-look.
      watch: { ignored: ["**/faces.json"] },
    },
  },
});
