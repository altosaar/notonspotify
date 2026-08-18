import { MIRRORED } from "./clocksdev/index.ts";
import type { Face } from "./kit.ts";

/**
 * Every face the clock can wear: the forty clocks.dev clocks, mirrored. There
 * are no faces written for this site any more — the whole of clocks.dev is the
 * library.
 *
 * resolve.ts deals one per track at build time, without replacement, so with
 * fewer than forty tracks no two of them wear the same clock.
 */
export const FACES: Face[] = MIRRORED;

export type { Face } from "./kit.ts";
