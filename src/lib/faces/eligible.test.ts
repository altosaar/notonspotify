/**
 * faces.json is edited by hand and by the picker at /faces, so what it means has
 * to hold whatever ends up in it. These assert the rules rather than today's
 * contents: they keep passing as clocks are turned off and speeded up.
 */
import { describe, expect, it } from "vitest";
import config from "../../../faces.json";
import { ELIGIBLE_NAMES, speedOf } from "./eligible.ts";
import { MIRROR_NAMES } from "./clocksdev/names.ts";

const choices = config as Record<string, { include?: boolean; x10?: boolean }>;

describe("faces.json", () => {
  it("only ever names real faces", () => {
    expect(Object.keys(choices).filter((name) => !MIRROR_NAMES.includes(name))).toEqual([]);
  });

  it("leaves out exactly what it says to leave out", () => {
    const expected = MIRROR_NAMES.filter((name) => choices[name]?.include !== false);
    expect(ELIGIBLE_NAMES).toEqual(expected);
  });

  it("keeps a face nobody has judged yet", () => {
    // A mirror added after the last curation pass is not silently dropped.
    expect(speedOf("cd-not-in-the-file-yet")).toBe(1);
    expect(MIRROR_NAMES.every((n) => n in choices || !ELIGIBLE_NAMES.includes(n) === false)).toBe(
      true,
    );
  });

  it("runs a face at 10x only where it was asked for", () => {
    for (const name of MIRROR_NAMES) {
      expect(speedOf(name)).toBe(choices[name]?.x10 ? 10 : 1);
    }
  });

  it("leaves something to deal", () => {
    expect(ELIGIBLE_NAMES.length).toBeGreaterThan(0);
  });
});
