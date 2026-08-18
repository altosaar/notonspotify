/**
 * What a clock face is.
 *
 * Every face is now a mirrored clocks.dev component (see ./clocksdev), so this
 * is only the contract between clock.ts and one of those: it gets a box, mounts
 * itself into it, is handed the time on every frame, and takes itself down when
 * the track changes.
 *
 * The SVG vocabulary that used to live here — .frame, .mark, .dot, and the
 * helpers for drawing them — went when the faces written for this site did. A
 * mirror brings its own markup and its own styles; there is nothing left to
 * share.
 */

/** Where a track is, in the terms the clocks are driven by. */
export interface FaceInput {
  /** Seconds into the track, fractional and smooth. Starts at 0. */
  elapsed: number;
  /**
   * The hour hand, in hours: where this track sits in the playlist, as a
   * fraction of twelve. Fixed for as long as the track is on — it says how far
   * through the playlist you are, not how far through the track.
   */
  hours: number;
}

export type FaceUpdate = (input: FaceInput) => void;

export interface FaceHandle {
  /** What the face drew into, for a caller that needs to act on it — stripping
   *  the words off a `notext` face, say. */
  root: HTMLElement;
  update: FaceUpdate;
  destroy(): void;
}

/**
 * A face mounts itself into a plain box and has to clean up after itself,
 * because a mounted component keeps running effects until it is told not to.
 */
export interface Face {
  name: string;
  /** `initial` so the clock renders the right time on its first frame instead
   *  of mounting at zero and correcting itself a moment later. */
  mount(host: HTMLElement, initial: FaceInput): FaceHandle;
}
