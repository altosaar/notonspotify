/**
 * What the mirrors are called, without loading a single one of them.
 *
 * The build step deals faces by name and must run under plain Node; the naming
 * rule lives here so that it, and the browser, cannot disagree about what a
 * mirror is called.
 */
import manifest from "./manifest.json";

/** Prefixed, so a mirror can never collide with a face written here. */
export const mirrorName = (slug: string) => `cd-${slug}`;

export const MIRROR_NAMES: string[] = (manifest as { slug: string }[]).map((entry) =>
  mirrorName(entry.slug),
);
