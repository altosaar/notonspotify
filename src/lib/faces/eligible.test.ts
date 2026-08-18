/**
 * faces.json is edited by hand and by the picker at /faces, so what it means has
 * to hold whatever ends up in it. These assert the rules rather than today's
 * contents: they keep passing as clocks are turned off and speeded up.
 */
import { describe, expect, it } from "vitest";
import config from "../../../faces.json";
import { ELIGIBLE_NAMES, speedOf, stripOf } from "./eligible.ts";
import { MIRROR_NAMES } from "./clocksdev/names.ts";

const choices = config as Record<
  string,
  { include?: boolean; x10?: boolean; notext?: boolean; nonumbers?: boolean }
>;

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

  it("strips only where it was asked to", () => {
    for (const name of MIRROR_NAMES) {
      const choice = choices[name];
      const expected = choice?.nonumbers ? "all" : choice?.notext ? "words" : null;
      expect(stripOf(name)).toBe(expected);
    }
  });

  it("lets no-numbers settle it when both are ticked", () => {
    // Not a config the picker can produce by accident, but the file is edited by
    // hand too and the two flags have to mean something together.
    const both = Object.entries(choices).find(([, c]) => c.notext && c.nonumbers);
    if (both) expect(stripOf(both[0])).toBe("all");
    expect(stripOf("cd-not-in-the-file-yet")).toBe(null);
  });

  it("leaves something to deal", () => {
    expect(ELIGIBLE_NAMES.length).toBeGreaterThan(0);
  });
});
