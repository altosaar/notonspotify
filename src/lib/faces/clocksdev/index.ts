/**
 * The forty clocks.dev clocks, mirrored.
 *
 * Every .svelte file in this directory is a byte-for-byte copy of what its
 * author published at clocks.dev — none of them has been edited, which is why
 * they are all in here on their own rather than rewritten into the face
 * vocabulary next door. `manifest.json` carries who made each one and where
 * they are, and the about panel prints all of it.
 *
 * They are public domain: clocks.dev has authors agree, on publishing, to
 * "release your clock's code into the public domain, where anyone may use,
 * modify, and share it". Attribution is kept anyway — a public domain
 * dedication gives away the copyright, not the authorship.
 *
 * Globbed rather than imported one by one so that adding or dropping a mirror is
 * a file, the same as it is for a hand-written face.
 */
import type { Component } from "svelte";
import type { Face } from "../kit.ts";
import { clockTime, type ClockTime } from "./time.ts";
import { mountClock } from "./mount.svelte.ts";
import manifest from "./manifest.json";
import { mirrorName } from "./names.ts";

interface Entry {
  slug: string;
  id: string;
  name: string;
  author: string;
  website: string;
  background: string | null;
  color: string | null;
  muted: string | null;
  aspectRatio: string | null;
  animation: string | null;
}

const components = import.meta.glob<{ default: Component<{ time: ClockTime }> }>("./*.svelte", {
  eager: true,
});

/**
 * clocks.dev sizes each clock to the ratio its author chose and paints the
 * surround in the colours they picked. Both are part of the design — a square
 * dial stretched to a wide box is a different clock — so the box carries them.
 */
function shape(entry: Entry): Partial<CSSStyleDeclaration> {
  const ratio = entry.aspectRatio;
  const custom = ratio && ratio !== "full" && ratio !== "custom" ? ratio : null;
  return {
    aspectRatio: custom ?? "auto",
    // Height-driven and capped by width: the box fits inside the clock area at
    // its own ratio instead of overflowing it on one axis or the other.
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    width: custom ? "auto" : "100%",
    background: entry.background ?? "transparent",
    color: entry.color ?? "inherit",
  };
}

export const MIRRORED: Face[] = (manifest as Entry[]).flatMap((entry) => {
  const module = components[`./${entry.slug}.svelte`];
  if (!module) return [];
  return [
    {
      name: mirrorName(entry.slug),
      // Deliberately knows nothing about faces.json. It used to read the 10x
      // flag itself, which meant the picker — winding its own preview forward
      // ten times faster — got a hundred. What the clock is told is the
      // caller's business; this only draws it.
      mount(host, initial) {
        const box = document.createElement("div");
        box.className = "mirror-box";
        Object.assign(box.style, shape(entry));
        host.append(box);

        // Mounted already showing the track's time — at rest that is 00:00:00 —
        // rather than at some default it then corrects away from.
        const mounted = mountClock(module.default, box, clockTime(initial));
        return {
          root: box,
          update: (input) => mounted.set(clockTime(input)),
          destroy: () => mounted.destroy(),
        };
      },
    },
  ];
});

/** Author and provenance for every mirror, for the about panel. */
export const CREDITS = (manifest as Entry[]).map(({ slug, id, name, author, website }) => ({
  slug,
  id,
  name,
  author,
  website,
}));
