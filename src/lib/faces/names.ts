/**
 * Every face name there is — the one list the build step deals from.
 *
 * Names only, and no Svelte anywhere in the import graph, so `tsx` can load this
 * during the build without a component compiler.
 */
export { MIRROR_NAMES as FACE_NAMES } from "./clocksdev/names.ts";
