/**
 * Every mirrored clock mounts, survives being driven, and comes down again.
 *
 * These are forty components from clocks.dev, copied unmodified — this repo did
 * not write them and cannot look at all forty rendering. What it can do is prove
 * that none of them throws, that each one actually redraws as the track runs,
 * and that each one starts where it is supposed to. A mirror that fails here is
 * a broken clock for whichever track was dealt it.
 */
import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import { MIRRORED } from "./index.ts";
import { clockTime } from "./time.ts";

/** Halfway through a 23-track playlist, two minutes and a bit into the track. */
const RUNNING = { elapsed: 125.5, hours: (11 / 23) * 12 };

describe("the time the clocks are told", () => {
  it("starts at 00:00:00 on the first track", () => {
    const t = clockTime({ elapsed: 0, hours: 0 });
    expect([t.hh, t.mm, t.ss]).toEqual(["00", "00", "00"]);
  });

  it("starts a later track at 00:00 past its own hour", () => {
    // Track 12 of 24 is halfway through the playlist, so six o'clock.
    const t = clockTime({ elapsed: 0, hours: (12 / 24) * 12 });
    expect([t.hh, t.mm, t.ss]).toEqual(["06", "00", "00"]);
  });

  it("counts the track's own minutes and seconds up from zero", () => {
    const t = clockTime({ elapsed: 125.25, hours: 0 });
    expect([t.mm, t.ss]).toEqual(["02", "05"]);
    expect(t.millisecond).toBe(250);
  });

  it("moves continuously between frames, so the sweep is smooth", () => {
    const a = clockTime({ elapsed: 10.0, hours: 3 });
    const b = clockTime({ elapsed: 10.016, hours: 3 });
    expect(b.progress.second).toBeGreaterThan(a.progress.second);
    expect(b.millisecond).toBeGreaterThan(a.millisecond);
  });

  it("holds the hour still while the track runs", () => {
    const hours = (7 / 23) * 12;
    const a = clockTime({ elapsed: 0, hours });
    const b = clockTime({ elapsed: 600, hours });
    expect(b.hour).toBe(a.hour);
    expect(b.progress.hour).toBe(a.progress.hour);
  });

  it("puts the hour hand a twelfth of the way round per twelfth of the list", () => {
    for (const [n, total, expected] of [
      [0, 24, 0],
      [6, 24, 3],
      [12, 24, 6],
      [23, 24, 11],
    ] as const) {
      expect(clockTime({ elapsed: 0, hours: (n / total) * 12 }).hour).toBe(expected);
    }
  });
});

describe("mirrored clocks.dev faces", () => {
  it("mirrors every clock in the manifest", () => {
    expect(MIRRORED.length).toBe(40);
  });

  for (const face of MIRRORED) {
    it(`${face.name} mounts, runs and unmounts`, () => {
      const host = document.createElement("div");
      document.body.append(host);
      const handle = face.mount(host, { elapsed: 0, hours: 0 });

      // A track's worth of states, including the ones a clock is most likely to
      // trip on: the very start, a minute rollover, and an hour-long track.
      for (const elapsed of [0, 59.999, 60, 125.5, 3600]) {
        handle.update({ elapsed, hours: RUNNING.hours });
      }

      expect(host.childElementCount).toBeGreaterThan(0);
      handle.destroy();
      host.remove();
    });
  }

  /**
   * The one that would fail silently: `mount()` renders a plain props object
   * once and then never again, so without the `$state` in mount.svelte.ts every
   * mirror would sit frozen at whatever time it was born at — mounting fine,
   * throwing nothing, and never moving.
   */
  it("redraws when the time changes", () => {
    const still: string[] = [];
    for (const face of MIRRORED) {
      // The one clock that paints to a <canvas>. Its pixels are real and its
      // markup never changes, so innerHTML is blind to it by construction.
      if (face.name === "cd-inkform") continue;
      const host = document.createElement("div");
      document.body.append(host);
      const handle = face.mount(host, { elapsed: 0, hours: 0 });

      // flushSync because Svelte 5 applies state changes on a microtask: the DOM
      // is a beat behind the assignment, which is invisible at sixty frames a
      // second and very visible to an assertion on the next line.
      // Across a minute boundary, not within one: several of these show hours
      // and minutes only, and asking a minute-resolution clock to change inside
      // the same minute tests nothing but the test.
      handle.update({ elapsed: 1, hours: RUNNING.hours });
      flushSync();
      const before = host.innerHTML;
      handle.update({ elapsed: 125.5, hours: RUNNING.hours });
      flushSync();
      if (host.innerHTML === before) still.push(face.name);

      handle.destroy();
      host.remove();
    }
    expect(still).toEqual([]);
  });

  /**
   * Smoothness, at the only resolution that proves it: a single frame. Plenty of
   * these clocks tick rather than sweep — a flip-digit or a binary clock has
   * nothing to say about a sixtieth of a second, and that is their design — so
   * this asserts that a good number of them move, not that all of them do. The
   * failure it exists to catch is every clock going stepwise at once, which is
   * what a sub-second time that stopped being fractional would look like.
   */
  it("sweeps sub-second on the clocks that are meant to", () => {
    const swept: string[] = [];
    for (const face of MIRRORED) {
      const host = document.createElement("div");
      document.body.append(host);
      const handle = face.mount(host, RUNNING);

      handle.update(RUNNING);
      flushSync();
      const before = host.innerHTML;
      handle.update({ ...RUNNING, elapsed: RUNNING.elapsed + 1 / 60 });
      flushSync();
      if (host.innerHTML !== before) swept.push(face.name);

      handle.destroy();
      host.remove();
    }
    expect(swept.length).toBeGreaterThanOrEqual(10);
  });
});
