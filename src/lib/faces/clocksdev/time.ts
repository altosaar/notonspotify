/**
 * The `time` prop every mirrored clocks.dev component reads.
 *
 * The components are byte-identical copies, so this is the whole seam between
 * them and this site: they ask for an hour, a minute and a second, and this is
 * what fills it.
 *
 *   seconds and minutes   the track, running. Zero when it starts and counting
 *                         up in real time, so a clock reads 00:00:00 the moment
 *                         a track does and sweeps from there.
 *   hours                 the PLAYLIST. Track n of N puts the hour hand at
 *                         n/N × 12, so the hour says how far through the whole
 *                         list you are and holds still for the length of a
 *                         track.
 *
 * The sub-second is real, not rounded, which is what makes the sweep smooth:
 * every one of these clocks animates off `millisecond` or off `progress.*`, and
 * both come straight off the same fractional elapsed time.
 *
 * The calendar fields are the real date. A handful of the clocks are almanacs
 * and world clocks that print a weekday or a month, and a made-up date would
 * read as a bug rather than as a choice.
 */
import type { FaceInput } from "../kit.ts";

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
const frac = (n: number) => n - Math.floor(n);

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

export function clockTime({ elapsed, hours }: FaceInput): ClockTime {
  // Straight off the track's own clock: no wrapping beyond the ordinary one, so
  // 00:00:00 at the start and 00:03:47 three minutes and forty-seven seconds in.
  const totalSeconds = Math.max(0, elapsed);
  const second = Math.floor(totalSeconds) % 60;
  const minute = Math.floor(totalSeconds / 60) % 60;
  const hour = Math.floor(hours) % 24;
  const now = new Date();

  return {
    hour,
    minute,
    second,
    millisecond: Math.floor(frac(totalSeconds) * 1000),
    hh: pad(hour),
    mm: pad(minute),
    ss: pad(second),
    hour12: hour % 12 || 12,
    hh12: pad(hour % 12 || 12),
    ampm: hour < 12 ? "AM" : "PM",
    progress: {
      second: frac(totalSeconds),
      minute: frac(totalSeconds / 60),
      // The hour hand's fraction is the playlist's, so it advances a track at a
      // time rather than creeping with the seconds under it.
      hour: frac(hours),
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
