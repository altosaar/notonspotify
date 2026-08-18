/**
 * The eight faces written here, in the shared SVG vocabulary.
 *
 * Their own file so that the build step can count them and read their names
 * without loading the mirrored clocks.dev components next door — those are
 * Svelte, and importing one under Node would need a compiler the build script
 * has no reason to run.
 */
import { bars } from "./bars.ts";
import { column } from "./column.ts";
import { dial } from "./dial.ts";
import { grid } from "./grid.ts";
import { orbits } from "./orbits.ts";
import { sector } from "./sector.ts";
import { ticks } from "./ticks.ts";
import { triangle } from "./triangle.ts";
import type { SvgFace } from "./kit.ts";

export const DRAWN: SvgFace[] = [dial, orbits, ticks, sector, triangle, bars, grid, column];
