/**
 * The rule a playlist lives or dies by. It was wrong in exactly one way — only
 * `repeat: all` moved on, so the default stopped after every track — and these
 * pin every branch so it cannot go quiet again.
 */
import { describe, expect, it } from "vitest";
import { afterTrack } from "./ending.ts";

describe("what happens when a track ends", () => {
  describe("repeat off", () => {
    it("plays the next one — this is the bug that made the site stop", () => {
      expect(afterTrack("off", false, true)).toBe("next");
    });

    it("comes to rest at the end of the list, and only there", () => {
      expect(afterTrack("off", true, true)).toBe("stop");
    });
  });

  describe("repeat all", () => {
    it("plays the next one", () => {
      expect(afterTrack("all", false, true)).toBe("next");
    });

    it("comes round again at the end of the list", () => {
      expect(afterTrack("all", true, true)).toBe("next");
    });
  });

  describe("repeat one", () => {
    it("plays the same track again, wherever it is in the list", () => {
      expect(afterTrack("one", false, true)).toBe("again");
      expect(afterTrack("one", true, true)).toBe("again");
    });

    it("stops on a platform that cannot be restarted rather than pretending", () => {
      // Bandcamp's embed cannot be told anything, so there is nothing to repeat
      // with and nothing honest to do but stop.
      expect(afterTrack("one", false, false)).toBe("stop");
    });
  });

  it("never asks a platform that cannot replay to replay", () => {
    for (const repeat of ["off", "all", "one"] as const) {
      for (const end of [true, false]) {
        expect(afterTrack(repeat, end, false)).not.toBe("again");
      }
    }
  });
});
