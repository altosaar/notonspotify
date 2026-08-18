import { DRAWN } from "./drawn.ts";
import { MIRRORED } from "./clocksdev/index.ts";
import type { Face } from "./kit.ts";

/**
 * Every face the clock can wear: the eight written here plus the forty mirrored
 * from clocks.dev. resolve.ts deals one per track at build time, without
 * replacement, so no two tracks in a build wear the same one.
 *
 * Adding another is one file — nothing else in the app knows how many there are,
 * and no face knows about any other.
 */
export const FACES: Face[] = [...DRAWN, ...MIRRORED];

export { CREDITS } from "./clocksdev/index.ts";
export type { Face } from "./kit.ts";
