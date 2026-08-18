/**
 * Which of the forty are actually allowed on the site, and how fast.
 *
 * Not every clocks.dev clock suits this page: some are wrong for it, and some
 * barely move at the speed a track runs at. `faces.json` at the repo root is
 * where that judgement is recorded, and `/faces` (dev server only) is the tool
 * that makes it — ten clocks a page, running, with the two checkboxes.
 *
 *   include   false and it is never dealt to a track
 *   x10       run this one's clock ten times faster, for the ones that are too
 *             still to read otherwise
 *   notext    strip everything that is not a number — for the ones that are as
 *             much poster as clock
 *
 * A face missing from the file is included at 1× — a new mirror shows up rather
 * than silently vanishing.
 */
import config from "../../../faces.json";
import { MIRROR_NAMES } from "./clocksdev/names.ts";

interface Choice {
  include?: boolean;
  x10?: boolean;
  notext?: boolean;
}

const choices = config as Record<string, Choice | undefined>;

export const ELIGIBLE_NAMES: string[] = MIRROR_NAMES.filter(
  (name) => choices[name]?.include !== false,
);

/** How fast a face's clock runs. 1 unless it was marked too still to read. */
export function speedOf(name: string): number {
  return choices[name]?.x10 ? 10 : 1;
}

/** Whether to keep only the numbers on this face. */
export function noTextOf(name: string): boolean {
  return choices[name]?.notext === true;
}
