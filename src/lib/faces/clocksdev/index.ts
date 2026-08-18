/**
 * The forty clocks.dev clocks, mirrored.
 *
 * Every .svelte file in this directory is a byte-for-byte copy of what its
 * author published at clocks.dev — none of them has been edited, which is why
 * they are all in here on their own rather than rewritten into the face
 * vocabulary next door. `manifest.json` carries who made each one and where
 * they are, and the about panel prints all of it.
 *
 * NO LICENCE IS ATTACHED TO ANY OF THEM. clocks.dev states no terms, the API
 * exposes no licence field, and not one of the forty sources carries a notice,
 * so each is its author's work under default copyright. They are mirrored here
 * at the site owner's direction, with attribution in full and nothing implied
 * about permission. See README ("Mirrored clocks").
 *
 * Globbed rather than imported one by one so that adding or dropping a mirror is
 * a file, the same as it is for a hand-written face.
 */
import type { Component } from "svelte";
import { shuffled, type FaceInput, type MountFace } from "../kit.ts";
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

export const MIRRORED: MountFace[] = (manifest as Entry[]).flatMap((entry) => {
  const module = components[`./${entry.slug}.svelte`];
  if (!module) return [];
  return [
    {
      name: mirrorName(entry.slug),
      mount(host, rnd) {
        // Which layer drives which hand, drawn once and held for as long as this
        // face is worn — the same trick the hand-written faces play with their
        // parts, and the reason one mirror reads differently from track to track.
        const carries = shuffled(rnd, [0, 1, 2]);

        const box = document.createElement("div");
        box.className = "mirror-box";
        Object.assign(box.style, shape(entry));
        host.append(box);

        const at = (input: FaceInput) => clockTime(input, carries);
        const mounted = mountClock(module.default, box, at({ track: 0, fast: 0, seconds: 0 }));
        return {
          update: (input) => mounted.set(at(input)),
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
