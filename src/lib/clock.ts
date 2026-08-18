/**
 * The clock: what time a face is told it is, the animation loop, and which face
 * is wearing it.
 *
 * Faces live in ./faces/clocksdev — forty components mirrored from clocks.dev,
 * each mounting itself. This file has no opinion about how a clock looks; it
 * only knows how far into the track it is and where the track sits in the
 * playlist.
 */
import { flushSync } from "svelte";
import { FACES, type Face } from "./faces/index.ts";
import { speedOf, stripOf } from "./faces/eligible.ts";
import { stripText } from "./faces/clocksdev/plain.ts";
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
   *  because `root` and `draw` have no meaningful empty state — nothing may
   *  paint before a face is on. */
  initialFace: string,
  /** The opening track's place in the playlist, in hours. */
  initialHours: number,
) {
  let mode: ClockMode = "idle";
  let estimate = false;
  let duration = 0;
  let base = 0; // seconds, at the last anchor
  let at = performance.now(); // when that anchor was set
  /** Where the current track sits in the playlist, as a fraction of twelve.
   *  Holds still for the length of a track; the hour hand and nothing else. */
  let hours = 0;

  // The box the mounted face lives in. Only the state classes go on it — a
  // mirror brings all of its own markup.
  let root: HTMLElement;
  let draw: FaceUpdate;
  let teardown: (() => void) | null = null;
  let current: Face | null = null;

  /**
   * `#face=grid` in the URL pins one face, for looking at a single one without
   * pressing → until it comes up. No effect on anything else.
   */
  const pinned = FACES.find((f) => f.name === location.hash.replace("#face=", ""));

  /** 10x winds the seconds on; the hour is the playlist's and never changes pace. */
  const scaled = (input: FaceInput, speed: number): FaceInput =>
    speed === 1 ? input : { ...input, elapsed: input.elapsed * speed };

  /** What the face would be told right now — mount and paint agree on it. */
  const now = (): FaceInput => {
    const e = mode === "idle" ? 0 : elapsed();
    // Reduced motion steps a second at a time where the clocks would otherwise
    // sweep. It is the one place this file changes the shape of the motion, and
    // only for people who asked for that.
    return { elapsed: REDUCED.matches ? Math.floor(e) : e, hours };
  };

  function wear(face: Face, tried: Set<string> = new Set()) {
    // A mounted component goes on running its effects until it is unmounted, so
    // the outgoing face is always taken down first. Dropping the node is not
    // enough.
    teardown?.();
    teardown = null;
    current = face;
    tried.add(face.name);

    const box = document.createElement("div");
    box.className = "mirror";
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", "clock");
    box.dataset.face = face.name;
    // In the document before mounting: several of the mirrors measure themselves
    // as they start up, and a detached node measures zero.
    host.replaceChildren(box);
    root = box;

    try {
      // faces.json's two adjustments, applied here rather than inside the face:
      // the face draws whatever time it is handed and knows nothing about the
      // file, so there is exactly one place either of these can be applied.
      const speed = speedOf(face.name);
      const strip = stripOf(face.name);
      const handle = face.mount(box, scaled(now(), speed));
      draw = (input) => {
        handle.update(scaled(input, speed));
        if (strip === null) return;
        // Svelte writes the DOM on a microtask, so the words are not there to
        // strip until it has. Flushed rather than deferred so a frame is never
        // shown with the text still on it.
        flushSync();
        stripText(handle.root, strip);
      };
      teardown = handle.destroy;
    } catch (error) {
      // Forty components this site did not write. One that throws on the way up
      // would leave a blank box for the whole of its track, so another face gets
      // a turn and the console carries the reason.
      console.warn(`face ${face.name} failed to mount, falling back`, error);
      const rest = FACES.filter((f) => !tried.has(f.name));
      // Every face failing means something is wrong with the page, not with a
      // clock: better an empty box than a stack overflow behind it.
      if (rest.length === 0) {
        draw = () => {};
        return;
      }
      wear(rest[Math.floor(Math.random() * rest.length)]!, tried);
    }
  }

  const elapsed = () => {
    const raw = mode === "playing" ? base + (performance.now() - at) / 1000 : base;
    return duration ? Math.min(raw, duration) : raw;
  };

  let lastLabelAt = 0;
  function paint() {
    const reduced = REDUCED.matches;
    // At rest the clock reads 00:00:00 — this one measures a track, so with no
    // track running there is nothing for it to be counting. The hour hand still
    // shows where in the playlist you are, because that is true either way.
    draw(now());
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
  function shuffle(name: string | undefined, atHours: number) {
    hours = atHours;
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

  shuffle(initialFace, initialHours);

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
    /** Wear a named face, and set the hour hand to that track's place in the
     *  playlist. Called once per track, by the player. */
    shuffle,
    /** Seconds into the track right now. */
    elapsed,
  };
}
