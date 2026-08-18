/**
 * Every face name there is — the one list the build step deals from.
 *
 * Names only, and no Svelte anywhere in the import graph, so `tsx` can load this
 * during the build without a component compiler.
 */
import { DRAWN } from "./drawn.ts";
import { MIRROR_NAMES } from "./clocksdev/names.ts";

export const FACE_NAMES: string[] = [...DRAWN.map((face) => face.name), ...MIRROR_NAMES];
