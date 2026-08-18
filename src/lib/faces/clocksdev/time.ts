/**
 * The `time` prop every mirrored clocks.dev component reads.
 *
 * The components are byte-identical copies, so this is the whole seam between
 * them and this site: they ask for an hour, a minute and a second, and what
 * they get here is TRACK time rather than wall time. That keeps the site the
 * thing it says it is — a clock that tells track time — without touching a line
 * of anyone's component. `time` is their documented input; what fills it is
 * ours.
 *
 * Which of the three layers drives which hand is drawn per instance, exactly as
 * the hand-written faces draw `carries`: the hour hand might be carrying track
 * progress on one track and real seconds on the next.
 *
 * The calendar fields are the real date. A handful of the clocks are almanacs
 * and world clocks that print a weekday or a month, and a made-up date would
 * read as a bug rather than as a choice.
 */
import { layerOf, type FaceInput } from "../kit.ts";

/** Every `time.*` property any of the forty components reads. */
export interface ClockTime {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  hh: string;
  mm: string;
  ss: string;
  hour12: number;
  hh12: string;
  ampm: string;
  /** Sub-unit fractions, for the ones that sweep rather than tick: how far
   *  through the current second/minute/hour/day it is. Six of the components
   *  build their continuous angles as `time.minute + time.progress.minute`. */
  progress: { second: number; minute: number; hour: number; day: number };
  day: number;
  month: number;
  monthName: string;
  weekday: number;
  weekdayName: string;
  year: number;
  timestamp: number;
  timezone: string;
  offsetMinutes: number;
}

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * `carries` is [hour, minute, second] → layer index, so the caller decides which
 * layer drives which hand and can randomise it once per mounted face.
 *
 * A null layer (an unknown duration, so no track progress) reads as zero rather
 * than hiding the hand: these components have no idea a layer can be unknown,
 * and a hand parked at twelve is the one thing they all render sensibly.
 */
export function clockTime(input: FaceInput, carries: readonly number[]): ClockTime {
  const layer = (i: number) => layerOf(input, carries[i]!) ?? 0;

  // A turn of each hand, in its own units: the hour hand goes round the day, the
  // other two round the minute, which is what every one of these expects.
  const hours = layer(0) * 24;
  const minutes = layer(1) * 60;
  const seconds = layer(2) * 60;

  const hour = Math.floor(hours);
  const minute = Math.floor(minutes);
  const second = Math.floor(seconds);
  const now = new Date();

  return {
    hour,
    minute,
    second,
    // The sub-second the smooth ones sweep on, taken from the seconds layer so
    // it stays continuous with it instead of ticking against it.
    millisecond: Math.floor((seconds % 1) * 1000),
    hh: pad(hour),
    mm: pad(minute),
    ss: pad(second),
    hour12: hour % 12 || 12,
    hh12: pad(hour % 12 || 12),
    ampm: hour < 12 ? "AM" : "PM",
    progress: {
      second: seconds % 1,
      minute: minutes % 1,
      hour: hours % 1,
      day: (hours % 24) / 24,
    },
    day: now.getDate(),
    month: now.getMonth() + 1,
    monthName: MONTHS[now.getMonth()]!,
    weekday: now.getDay(),
    weekdayName: DAYS[now.getDay()]!,
    year: now.getFullYear(),
    timestamp: now.getTime(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offsetMinutes: -now.getTimezoneOffset(),
  };
}
