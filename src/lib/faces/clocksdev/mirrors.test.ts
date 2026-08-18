/**
 * Every mirrored clock mounts, survives being driven, and comes down again.
 *
 * These are forty components from clocks.dev, copied unmodified — this repo did
 * not write them and cannot look at all forty rendering. What it can do is prove
 * that none of them throws on the way up, when handed a `time` prop through a
 * whole track, or on unmount. A mirror that fails here is a blank clock for
 * whichever track was dealt it.
 */
import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import { MIRRORED } from "./index.ts";

describe("mirrored clocks.dev faces", () => {
  it("mirrors every clock in the manifest", () => {
    expect(MIRRORED.length).toBe(40);
  });

  for (const face of MIRRORED) {
    it(`${face.name} mounts, runs and unmounts`, () => {
      const host = document.createElement("div");
      document.body.append(host);
      const handle = face.mount(host, Math.random);

      // A track's worth of states, including the two a face is most likely to
      // trip on: an unknown duration, and both ends of the range.
      for (const input of [
        { track: 0, fast: 0, seconds: 0 },
        { track: null, fast: 0.5, seconds: 0.5 },
        { track: 0.5, fast: 0.999, seconds: 0.25 },
        { track: 1, fast: 1, seconds: 1 },
      ]) {
        handle.update(input);
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
  it("redraws when the time prop changes", () => {
    const still: string[] = [];
    for (const face of MIRRORED) {
      const host = document.createElement("div");
      document.body.append(host);
      const handle = face.mount(host, Math.random);

      // flushSync because Svelte 5 applies state changes on a microtask: the DOM
      // is a beat behind the assignment, which is invisible at sixty frames a
      // second and very visible to an assertion on the next line.
      handle.update({ track: 0.1, fast: 0.1, seconds: 0.1 });
      flushSync();
      const before = host.innerHTML;
      handle.update({ track: 0.8, fast: 0.7, seconds: 0.6 });
      flushSync();
      if (host.innerHTML === before) still.push(face.name);

      handle.destroy();
      host.remove();
    }
    expect(still).toEqual([]);
  });
});
