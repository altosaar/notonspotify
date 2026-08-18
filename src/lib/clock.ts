/**
 * The clock: the mapping from seconds to the three numbers a face draws, the
 * animation loop, and the draw for which face wears them.
 *
 * Faces live in ./faces — each one builds its own SVG, sets its own shape, and
 * randomises its own start positions. This file has no opinion about how a
 * clock looks; it only knows what time it is and which face is on.
 */
import { FACES, type Face } from "./faces/index.ts";
import { DRAWN } from "./faces/drawn.ts";
import { isMounted, type FaceInput, type FaceUpdate } from "./faces/kit.ts";

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
export function createClock(
  host: HTMLElement,
  onLabel: (label: string) => void,
  /** The face the opening track was dealt. Wearing one is the constructor's job
   *  because `svg` and `draw` have no meaningful empty state — nothing may paint
   *  before a face is on. */
  initialFace: string,
) {
  let mode: ClockMode = "idle";
  let estimate = false;
  let duration = 0;
  let base = 0; // seconds, at the last anchor
  let at = performance.now(); // when that anchor was set

  // The root the face lives in — an <svg> for the ones drawn here, a plain box
  // for a mounted component. Only the state classes are put on it, so the two
  // kinds need not have anything else in common.
  let root: Element;
  let draw: FaceUpdate;
  let teardown: (() => void) | null = null;
  let current: Face | null = null;

  /**
   * `#face=grid` in the URL pins one face, for looking at a single one without
   * pressing → until it comes up. No effect on anything else.
   */
  const pinned = FACES.find((f) => f.name === location.hash.replace("#face=", ""));

  function wear(face: Face) {
    // A mounted component goes on running its effects until it is unmounted, so
    // the outgoing face is always taken down first — dropping the node is enough
    // for an <svg> and nowhere near enough for a component.
    teardown?.();
    teardown = null;
    current = face;

    if (isMounted(face)) {
      const box = document.createElement("div");
      box.className = "mirror";
      box.setAttribute("role", "img");
      box.setAttribute("aria-label", "clock");
      box.dataset.face = face.name;
      // In the document before mounting: several of the mirrors measure
      // themselves as they start up, and a detached node measures zero.
      host.replaceChildren(box);
      try {
        const handle = face.mount(box, Math.random);
        draw = handle.update;
        teardown = handle.destroy;
        root = box;
        return;
      } catch (error) {
        // The mirrors are forty components this site did not write and cannot
        // test by eye. One that throws on the way up takes its track's clock
        // down with it, which is a blank box for the whole of that track — so it
        // falls back to a face that is known to work and says so in the console
        // rather than on the page.
        console.warn(`face ${face.name} failed to mount, falling back`, error);
        return wear(DRAWN[Math.floor(Math.random() * DRAWN.length)]!);
      }
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "face");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "clock");
    svg.dataset.face = face.name;
    draw = face.build(svg, Math.random);
    host.replaceChildren(svg);
    root = svg;
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
    root.classList.toggle("is-dim", mode === "paused");
    root.classList.toggle("is-estimate", estimate);
    root.classList.toggle("is-buffering", mode === "buffering" && !reduced);

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

  /**
   * Wear the face this track was dealt at build time. Which face that is stopped
   * being the browser's decision when the deal moved into resolve.ts — every
   * track in a build has its own, and no two share one.
   *
   * The name is looked up rather than trusted: a playlist.json written before a
   * face was renamed or removed would otherwise leave the clock blank, and a
   * missing face is not worth a broken page.
   */
  function shuffle(name?: string) {
    if (pinned) {
      if (!current) wear(pinned);
      paint();
      return;
    }
    const dealt = FACES.find((f) => f.name === name);
    const others = current ? FACES.filter((f) => f !== current) : FACES;
    wear(dealt ?? others[Math.floor(Math.random() * others.length)]!);
    paint();
  }

  shuffle(initialFace);

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
    /** Wear a named face. Called once per track, by the player. */
    shuffle,
    /** Seconds into the track right now. */
    elapsed,
  };
}
