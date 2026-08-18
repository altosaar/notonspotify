/**
 * The player: playlist navigation, adapter lifecycle, and the flags that
 * everything else falls out of —
 *
 *   armed   the visitor has tapped play at least once. Before that, nothing
 *           YouTube- or SoundCloud-shaped is mounted and the clock sits at
 *           rest. This is also the browser's autoplay gesture.
 *   intent  the visitor wants sound. Survives track changes, so auto-advance
 *           and prev/next know whether to start the next one playing.
 *   repeat  what happens at the end of a track: nothing, on to the next one, or
 *           this one again. Persisted between visits.
 *
 * Bandcamp is the exception to `armed`: its embed IS its play button, so it
 * mounts the moment its track becomes current, before any tap. Nothing else
 * would let a visitor start it (see the note above `clickThrough`).
 *
 * Adapters own their iframe and nothing else; the clock owns time; this owns
 * the rest.
 */
import { createClock } from "./clock.ts";
import { bandcamp } from "./adapters/bandcamp.ts";
import { soundcloud } from "./adapters/soundcloud.ts";
import { youtube } from "./adapters/youtube.ts";
import type { PlayerAdapter, Platform, Progress, ResolvedTrack } from "./adapters/types.ts";

/** Refresh = probably a different track. The cheapest homage to clocks.dev. */
const RANDOM_START = true;
const ERROR_PAUSE_MS = 1500;
const MAX_CONSECUTIVE_ERRORS = 3;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const tracks: ResolvedTrack[] = JSON.parse($("playlist").textContent ?? "[]");

const ui = {
  clock: $("clock"),
  dock: $("dock"),
  meta: $("meta"),
  artist: $("artist"),
  banger: $("banger"),
  status: $("status"),
  prev: $<HTMLButtonElement>("prev"),
  next: $<HTMLButtonElement>("next"),
  toggle: $<HTMLButtonElement>("toggle"),
  repeat: $<HTMLButtonElement>("repeat"),
  ask: $<HTMLButtonElement>("ask"),
  about: $<HTMLDialogElement>("about"),
  aboutClose: $<HTMLButtonElement>("about-close"),
  glyph: $("glyph"),
  label: $("label"),
  out: $<HTMLAnchorElement>("out"),
};

const ADAPTERS: Record<Platform, () => PlayerAdapter> = { youtube, soundcloud, bandcamp };

const clock = createClock(ui.clock, (label) =>
  ui.clock.firstElementChild?.setAttribute("aria-label", label),
);

let index = RANDOM_START ? Math.floor(Math.random() * tracks.length) : 0;
let adapter: PlayerAdapter | null = null;
let armed = false;
let intent = false;
let playing = false;
let errors = 0;
let skipTimer = 0;
/** Guards against a slow mount landing after the visitor has moved on. */
let generation = 0;
/** Bandcamp's estimated clock: started, and currently running. */
let estimating = false;
let estimateRunning = false;
/** Bandcamp's stand-in for an `ended` event (see `armEstimateAdvance`). */
let estimateTimer = 0;

/** off → the whole list → this one track → off. */
type Repeat = "off" | "all" | "one";
const REPEAT_CYCLE: Repeat[] = ["off", "all", "one"];
const REPEAT_KEY = "notonspotify:repeat";

let repeat: Repeat = "off";
try {
  const saved = localStorage.getItem(REPEAT_KEY);
  if (saved === "all" || saved === "one") repeat = saved;
} catch {
  // Private mode, or storage turned off. Starts at off, same as a first visit.
}

const track = () => tracks[index]!;

// ── Rendering ───────────────────────────────────────────────────────────────

function paintMeta() {
  const t = track();
  // Two lines: the title owns one, the artist and year the next. A single
  // "title — artist" run meant one long title truncated the artist's name away.
  ui.meta.textContent = t.title;
  ui.artist.textContent = `${t.artist}${t.year ? ` · ${t.year}` : ""}`;
  ui.banger.hidden = !t.banger;
  const sounding = playing || estimateRunning;
  // The tab has one line to work with, so it keeps the old single-run form.
  document.title = sounding ? `${t.title} — ${t.artist} · not on spotify` : "not on spotify";
}

/**
 * The link out, for tracks that carry one. Hidden rather than emptied when a
 * track has none: `hidden` takes it out of the tab order and off the screen
 * reader too, so nothing is left behind pointing at the previous track. Its
 * room stays reserved in CSS either way, so nothing on the page moves.
 *
 * The label names the destination — "buy" would be a guess, and half of these
 * are an artist's own site rather than a shop.
 */
function paintLink() {
  const link = track().link;
  ui.out.hidden = !link;
  if (!link) return;
  ui.out.href = link;
  ui.out.setAttribute("aria-label", `open ${host(link)} in a new tab`);
}

/** "https://nitejewel.bandcamp.com/track/x" → "nitejewel.bandcamp.com". */
function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the artist's page";
  }
}

/**
 * Can this page start and stop what's in the dock? Bandcamp: no, and never.
 * The mounted adapter is authoritative; before it mounts, the platform says.
 */
function drivable(): boolean {
  return adapter ? adapter.caps.control : track().platform !== "bandcamp";
}

function paintButton() {
  // Bandcamp can't be driven from here, so the button stops pretending to be a
  // play button and becomes a sign — an inert one. Disabled rather than merely
  // ignored: a control that looks pressable and does nothing is worse than one
  // that plainly isn't, and this way nothing (a tap, Space, a screen reader
  // activating it) can pretend to start a track this page cannot start.
  const below = !drivable();
  const label = below ? "click below to play" : playing ? "pause" : "play";
  ui.glyph.textContent = below ? "↓" : playing ? "⏸" : "▶";
  ui.label.textContent = label;
  ui.toggle.setAttribute("aria-label", label);
  ui.toggle.classList.toggle("is-below", below);
  ui.toggle.disabled = below;
}

function paintRepeat() {
  ui.repeat.classList.toggle("is-on", repeat !== "off");
  ui.repeat.classList.toggle("is-one", repeat === "one");
  ui.repeat.setAttribute(
    "aria-label",
    repeat === "off" ? "repeat: off" : repeat === "all" ? "repeat: all" : "repeat: this track",
  );
}

function status(text: string) {
  ui.status.textContent = text;
}

// ── Adapter lifecycle ───────────────────────────────────────────────────────

function teardown() {
  generation++;
  clearTimeout(skipTimer);
  clearTimeout(estimateTimer);
  adapter?.destroy();
  adapter = null;
  ui.dock.replaceChildren(); // exactly one iframe in the DOM, ever
  delete ui.dock.dataset.platform;
  playing = false;
  estimating = estimateRunning = false;
  clock.set({ mode: "idle" });
}

async function mount(autoplay: boolean) {
  const t = track();
  const mine = ++generation;
  const next = ADAPTERS[t.platform]();
  adapter = next;
  ui.dock.dataset.platform = t.platform;
  wire(next, t, mine);
  paintButton();
  await next.mount(ui.dock, t);
  if (mine !== generation) return;
  if (autoplay && next.caps.control) next.play();
}

function wire(a: PlayerAdapter, t: ResolvedTrack, mine: number) {
  const live = () => mine === generation;

  a.on("playing", () => {
    if (!live()) return;
    errors = 0;
    playing = true;
    clock.set({ mode: "playing", duration: t.duration ?? 0 });
    paintButton();
    paintMeta();
  });
  a.on("paused", () => {
    if (!live()) return;
    playing = false;
    clock.set({ mode: "paused" });
    paintButton();
    paintMeta();
  });
  a.on("buffering", () => live() && clock.set({ mode: "buffering" }));
  a.on("progress", (p?: Progress) => {
    if (!live() || !p) return;
    clock.set({ elapsed: p.elapsed, duration: p.duration || t.duration || 0 });
  });
  a.on("ended", () => {
    if (!live()) return;
    if (repeat === "all") return go(1, intent);
    // "one" replays in place: a finished player restarts from the top when it
    // is told to play again, on both platforms that can be told anything.
    if (repeat === "one" && a.caps.control) return a.play();
    // Nothing follows, so come to rest on the finished track. Setting `playing`
    // here rather than waiting for a `paused` event: YouTube doesn't send one
    // after the end, so the button would go on saying "pause" over silence.
    playing = false;
    clock.set({ mode: "paused" });
    paintButton();
    paintMeta();
  });
  a.on("error", () => live() && onError());
}

function onError() {
  errors++;
  if (errors >= MAX_CONSECUTIVE_ERRORS) {
    teardown();
    paintButton();
    status("a lot of this list is broken, try →");
    return;
  }
  status("unavailable — skipping");
  skipTimer = window.setTimeout(() => go(1, intent, true), ERROR_PAUSE_MS);
}

// ── Navigation ──────────────────────────────────────────────────────────────

/** Wraps at both ends. `keepStatus` is the error-skip carrying its own message. */
function go(delta: number, autoplay: boolean, keepStatus = false) {
  teardown();
  index = (index + delta + tracks.length) % tracks.length;
  // New track, new face: which hand carries which layer of time, and where each
  // one starts, is drawn fresh here and holds for as long as this track does.
  clock.shuffle();
  if (!keepStatus) {
    status("");
    errors = 0; // a deliberate move is a fresh start for the error streak
  }
  paintMeta();
  paintButton();
  paintLink();
  // Bandcamp mounts on sight — its embed is the only thing that can start it,
  // so it has to be there and ready. YouTube and SoundCloud stay unmounted
  // until the first tap: before that the clock is at rest and the page has
  // made no third-party request at all.
  if (armed || track().platform === "bandcamp") void mount(autoplay);
}

function toggle() {
  // The button is disabled in this state, but Space routes here directly, so
  // the rule lives here too. It does NOT focus the embed as it once did: moving
  // focus into a cross-origin iframe fires the same window blur that a real
  // click does, so the play button was starting the estimated clock over a
  // track nobody had played.
  if (!drivable()) return;
  armed = true;
  if (!adapter) {
    intent = true;
    void mount(true);
    return;
  }
  intent = !playing;
  if (playing) adapter.pause();
  else adapter.play();
}

// ── Bandcamp click-through ──────────────────────────────────────────────────
//
// Bandcamp's embed cannot be started from here. Checked rather than assumed:
// their player bundle registers no message listener, so there is no inbound
// channel, and the one autoplay branch in it is gated on a `facebook.com`
// parameter that the server does parse but that never actually fires playback
// for a third-party embed. The embed is the play button; that's the ceiling.
//
// So the click has to be inferred. It's cross-origin, so a click inside it is
// invisible to us — except that it takes the window's focus with it. Pointer
// last seen over the dock, plus a window blur, is as close to "they pressed
// play" as this can get. It's a guess, the clock says so by drawing its arc
// dashed, and drift is fine: this is an art project, not a transport control.

window.addEventListener("blur", () => {
  if (!adapter || adapter.caps.control) return; // Bandcamp is the only one that can't be driven
  // One signal only: focus has moved INTO the dock's iframe, which is what
  // clicking inside a cross-origin embed does and nothing else on this page can
  // now cause. Switching tab or app leaves activeElement where it was, so
  // neither is mistaken for pressing play.
  if (document.activeElement !== ui.dock.querySelector("iframe")) return;
  clickThrough();
});

function clickThrough() {
  const duration = track().duration;
  // No duration means no honest estimate, so the clock stays at rest and this
  // does nothing at all. resolve.ts reads one off the Bandcamp page, so in
  // practice every Bandcamp entry has one.
  if (!duration) return;
  armed = true;
  if (!estimating) {
    estimating = estimateRunning = true;
    clock.set({ mode: "playing", elapsed: 0, duration, estimate: true });
  } else {
    estimateRunning = !estimateRunning;
    clock.set({ mode: estimateRunning ? "playing" : "paused" });
  }
  armEstimateAdvance();
  paintMeta();
  // Take focus back, or the next tap inside the embed produces no blur at all
  // (a window that has already lost focus can't lose it again) and the estimate
  // could never be paused. It also gives the page its keyboard back.
  setTimeout(() => window.focus(), 250);
}

/**
 * Bandcamp's stand-in for an `ended` event.
 *
 * There isn't one, so autoplay books the hand-off itself: at the moment the
 * estimate says the record is over, plus a couple of seconds, because arriving
 * late is a pause and arriving early is a track cut off mid-note. Re-armed
 * whenever the estimate is paused or resumed, or repeat is cycled;
 * cancelled by teardown along with everything else.
 */
function armEstimateAdvance() {
  clearTimeout(estimateTimer);
  const duration = track().duration;
  // Only "all" applies: Bandcamp cannot be restarted, so "one" has nothing to
  // repeat with and simply lets the estimate run out.
  if (repeat !== "all" || !estimateRunning || !duration) return;
  const remaining = Math.max(0, duration - clock.elapsed()) * 1000 + 2000;
  estimateTimer = window.setTimeout(() => go(1, intent), remaining);
}

// ── Input ───────────────────────────────────────────────────────────────────

/**
 * Buttons keep focus after a pointer click, and a focused button answers to
 * Space — so tapping → and then pressing Space would skip a track instead of
 * playing one. Dropping focus after a POINTER click (detail > 0) fixes that
 * without touching the keyboard path, where focus is the whole point.
 */
function click(button: HTMLButtonElement, run: () => void) {
  button.addEventListener("click", (e) => {
    if (e.detail > 0) button.blur();
    run();
  });
}

click(ui.toggle, toggle);
click(ui.prev, () => go(-1, intent));
click(ui.next, () => go(1, intent));
click(ui.repeat, () => {
  repeat = REPEAT_CYCLE[(REPEAT_CYCLE.indexOf(repeat) + 1) % REPEAT_CYCLE.length]!;
  try {
    localStorage.setItem(REPEAT_KEY, repeat);
  } catch {
    // Private mode, or storage turned off. The control still works, it just
    // won't be remembered — not worth telling anyone about.
  }
  paintRepeat();
  armEstimateAdvance();
});

click(ui.ask, () => {
  ui.about.showModal();
  // Focus the panel itself, not the close button inside it: with a button
  // focused, Space — the play key everywhere else on this page — would shut the
  // panel again. Escape and the × are the ways out.
  ui.about.focus();
});
click(ui.aboutClose, () => ui.about.close());

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // While the about panel is up it owns the keyboard — Escape closes it (the
  // dialog's own doing) and Space must not be reaching the player behind it.
  if (ui.about.open) return;
  if (e.key === " " || e.key === "Spacebar") {
    // A focused button already answers to Space; intercepting here as well
    // would fire prev/next AND the toggle from one keypress.
    if (e.target instanceof HTMLButtonElement) return;
    e.preventDefault();
    toggle();
  } else if (e.key === "ArrowLeft") {
    go(-1, intent);
  } else if (e.key === "ArrowRight") {
    go(1, intent);
  }
});

paintMeta();
paintButton();
paintRepeat();
paintLink();
// The opening track gets what any other would: if it's a Bandcamp one, its
// player is on screen from the start rather than one tap away.
if (track().platform === "bandcamp") void mount(false);
