/**
 * What every clock face is, and the geometry they share.
 *
 * A face knows three numbers between 0 and 1 and nothing else — not what a
 * track is, not whether anything is playing. It builds itself into an <svg>,
 * sets its own viewBox (its own shape and proportions), and hands back a
 * function that moves its parts. clock.ts picks one at random per track.
 *
 * States are not the face's problem either: clock.ts puts `is-dim`,
 * `is-estimate` and `is-buffering` on the root, and the stylesheet acts on the
 * shared class names below. So a new face needs no new CSS to pause, to say
 * "this is an estimate", or to show buffering.
 *
 *   .frame     the still structure — rings, rails, tick marks
 *   .progress  the track's progress, and only that
 *   .mark      a moving stroked part
 *   .dot       a moving filled part
 *   .seconds   modifier: this is the part carrying real seconds
 */

export interface FaceInput {
  /** Track progress, 0..1. null when the duration is unknown. */
  track: number | null;
  /** One turn per ten seconds of playback, 0..1. */
  fast: number;
  /** Real seconds, 0..1 per minute. */
  seconds: number;
}

export type FaceUpdate = (input: FaceInput) => void;

/**
 * A face drawn here: it builds itself into an <svg> the clock hands it, in the
 * shared vocabulary above, and needs no teardown because dropping the <svg>
 * drops everything it made.
 */
export interface SvgFace {
  name: string;
  /** `rnd` is only called while building: a face's randomness is fixed for as
   *  long as it is on screen. */
  build(svg: SVGSVGElement, rnd: () => number): FaceUpdate;
}

/**
 * A face that mounts itself — the mirrored clocks.dev components, which are
 * Svelte and bring their own markup and styles rather than drawing into an
 * <svg>. It gets a plain box and has to clean up after itself, because a
 * mounted component keeps running effects until it is told not to.
 */
export interface MountFace {
  name: string;
  mount(host: HTMLElement, rnd: () => number): FaceHandle;
}

export interface FaceHandle {
  update: FaceUpdate;
  destroy(): void;
}

export type Face = SvgFace | MountFace;

/** The two kinds are told apart structurally — no discriminant to keep in sync. */
export function isMounted(face: Face): face is MountFace {
  return "mount" in face;
}

/** The three layers, by index — the order `layerOf` reads them in. */
export const TRACK = 0;
export const FAST = 1;
export const SECONDS = 2;

export function layerOf(input: FaceInput, index: number): number | null {
  return index === TRACK ? input.track : index === FAST ? input.fast : input.seconds;
}

const NS = "http://www.w3.org/2000/svg";

export function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** turns: 0 = twelve o'clock, 0.25 = three o'clock. */
export function polar(cx: number, cy: number, r: number, turns: number): [number, number] {
  const a = (turns - 0.25) * Math.PI * 2;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Clockwise arc between two angles in turns. Empty string when it has no length. */
export function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const sweep = Math.min(Math.max(to - from, 0), 0.9999);
  if (sweep < 0.0005) return "";
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, from + sweep);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${x2} ${y2}`;
}

export function shuffled<T>(rnd: () => number, input: T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function pick<T>(rnd: () => number, input: T[]): T {
  return input[Math.floor(rnd() * input.length)]!;
}

/**
 * Three starting angles, well apart: thirds of a turn, spun to a random angle
 * and jittered. Three independent random angles look right most of the time and
 * then deal two hands four degrees apart, which reads as a bug rather than as
 * chance. This keeps them ~90° apart and still unpredictable.
 */
export function spread(rnd: () => number): [number, number, number] {
  const spin = rnd();
  return shuffled(rnd, [0, 1 / 3, 2 / 3]).map(
    (third) => (third + spin + (rnd() - 0.5) * 0.08 + 1) % 1,
  ) as [number, number, number];
}

/** Move a node to `turns` around (cx, cy), or hide it when the layer is unknown. */
export function turn(node: SVGElement, cx: number, cy: number, turns: number | null) {
  if (turns === null) {
    node.style.opacity = "0";
    return;
  }
  node.style.opacity = "";
  node.setAttribute("transform", `rotate(${turns * 360} ${cx} ${cy})`);
}
