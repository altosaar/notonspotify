/**
 * The clock: the mapping from seconds to the three numbers a face draws, the
 * animation loop, and the draw for which face wears them.
 *
 * Faces live in ./faces — each one builds its own SVG, sets its own shape, and
 * randomises its own start positions. This file has no opinion about how a
 * clock looks; it only knows what time it is and which face is on.
 */
import { FACES, type Face } from "./faces/index.ts";
import type { FaceInput, FaceUpdate } from "./faces/kit.ts";

export type ClockMode = "idle" | "playing" | "paused" | "buffering";

export interface ClockPatch {
  mode?: ClockMode;
  /** Seconds into the track. Sets a new anchor for the extrapolation. */
  elapsed?: number;
  /** Seconds. 0 means unknown. */
  duration?: number;
  /** Bandcamp's estimated progress — same maths, and the face says so. */
  estimate?: boolean;
}

/** One turn per ten seconds of playback: fast enough to be obviously not the
 *  seconds hand, slow enough to read. */
const FAST_PERIOD = 10;

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Owns the animation loop and the clock's sense of "now".
 *
 * Progress events arrive a few times a second at best (YouTube is polled at
 * 4 Hz, SoundCloud fires when it feels like it, Bandcamp never does). Rather
 * than tick the face at that rate, the clock stores the last known elapsed time
 * and when it was learned, then extrapolates in real time between events — so
 * the face sweeps, and a Bandcamp estimate is the exact same code path with no
 * events at all.
 */
export function createClock(host: HTMLElement, onLabel: (label: string) => void) {
  let mode: ClockMode = "idle";
  let estimate = false;
  let duration = 0;
  let base = 0; // seconds, at the last anchor
  let at = performance.now(); // when that anchor was set

  let svg: SVGSVGElement;
  let draw: FaceUpdate;
  let current: Face | null = null;

  /**
   * `#face=grid` in the URL pins one face, for looking at a single one without
   * pressing → until it comes up. No effect on anything else.
   */
  const pinned = FACES.find((f) => f.name === location.hash.replace("#face=", ""));

  function wear(face: Face) {
    current = face;
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "face");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "clock");
    svg.dataset.face = face.name;
    draw = face.build(svg, Math.random);
    host.replaceChildren(svg);
  }

  const elapsed = () => {
    const raw = mode === "playing" ? base + (performance.now() - at) / 1000 : base;
    return duration ? Math.min(raw, duration) : raw;
  };

  let lastLabelAt = 0;
  function paint() {
    const reduced = REDUCED.matches;
    let input: FaceInput;

    if (mode === "idle") {
      // At rest. This clock measures a track, so with no track running there is
      // nothing for it to be doing: every layer sits at zero, which leaves each
      // face showing the starting positions it drew for itself.
      input = { track: 0, fast: 0, seconds: 0 };
    } else {
      const e = elapsed();
      const now = Date.now() / 1000;
      input = {
        track: duration ? e / duration : null,
        fast: (e % FAST_PERIOD) / FAST_PERIOD,
        // Real seconds — the one layer that keeps moving on a fifty-minute
        // track. Under reduced motion it steps rather than sweeps.
        seconds: ((reduced ? Math.floor(now) : now) % 60) / 60,
      };
    }

    draw(input);
    svg.classList.toggle("is-dim", mode === "paused");
    svg.classList.toggle("is-estimate", estimate);
    svg.classList.toggle("is-buffering", mode === "buffering" && !reduced);

    const stamp = performance.now();
    if (stamp - lastLabelAt > 1000) {
      lastLabelAt = stamp;
      onLabel(
        mode === "idle" || !duration
          ? "clock"
          : `track progress: ${Math.round((elapsed() / duration) * 100)}%`,
      );
    }
  }

  // The loop runs while something is playing and not a frame longer. Every other
  // state — at rest, paused, buffering — is a still picture, so it gets painted
  // once and then costs nothing: no timers behind an idle page, no frames burnt
  // on a phone showing a motionless face.
  //
  // Reduced motion swaps the frame timer for discrete one-second ticks rather
  // than branching everywhere downstream. The setting is re-read every tick, so
  // flipping it mid-track lands on the next one.
  let running = false;
  function schedule() {
    if (REDUCED.matches) window.setTimeout(tick, 1000);
    else requestAnimationFrame(tick);
  }
  function tick() {
    paint();
    if (mode === "playing") schedule();
    else running = false;
  }

  /** A new face for the new track — never the one just shown. */
  function shuffle() {
    if (pinned) {
      if (!current) wear(pinned);
    } else {
      const others = current ? FACES.filter((f) => f !== current) : FACES;
      wear(others[Math.floor(Math.random() * others.length)]!);
    }
    paint();
  }

  shuffle();

  return {
    set(patch: ClockPatch) {
      const was = { mode, duration, estimate };
      // Freeze the current extrapolation before changing anything, so a mode
      // change never rewinds the face.
      base = elapsed();
      at = performance.now();
      if (patch.elapsed !== undefined) base = patch.elapsed;
      if (patch.duration !== undefined) duration = patch.duration;
      if (patch.estimate !== undefined) estimate = patch.estimate;
      if (patch.mode !== undefined) mode = patch.mode;
      if (mode === "idle") {
        base = 0;
        duration = 0;
        estimate = false;
      }
      // A progress event only re-anchors the extrapolation; how often the face
      // is actually redrawn is the loop's business. Painting here too would let
      // the platform's polling rate (YouTube's is 4 Hz, and it repeats the
      // duration every time) leak through as the frame rate — which under
      // reduced motion is exactly the stutter that setting exists to avoid.
      // Hence comparing values rather than trusting which keys were passed.
      const changed = mode !== was.mode || duration !== was.duration || estimate !== was.estimate;
      if (changed || !running) paint();
      if (mode === "playing" && !running) {
        running = true;
        schedule();
      }
    },
    /** Draw a new face. Called once per track, by the player. */
    shuffle,
    /** Seconds into the track right now. */
    elapsed,
  };
}
