import { bars } from "./bars.ts";
import { column } from "./column.ts";
import { dial } from "./dial.ts";
import { grid } from "./grid.ts";
import { orbits } from "./orbits.ts";
import { sector } from "./sector.ts";
import { ticks } from "./ticks.ts";
import { triangle } from "./triangle.ts";
import type { Face } from "./kit.ts";

/**
 * Every face the clock can wear. One is drawn at random per track.
 *
 * Adding another is this list plus one file — nothing else in the app knows how
 * many there are, and no face knows about any other.
 */
export const FACES: Face[] = [dial, orbits, ticks, sector, triangle, bars, grid, column];

export type { Face } from "./kit.ts";
