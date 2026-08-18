/** Shared vocabulary for the build step (scripts/resolve.ts) and the player. */

export type Platform = "youtube" | "soundcloud" | "bandcamp";

/**
 * One entry of src/generated/playlist.json — a tracks.yaml row with its URL
 * turned into something a platform embed can be handed directly.
 *
 * `embedRef` is per-platform and deliberately opaque to everything but that
 * platform's adapter:
 *   youtube     the 11-character video id
 *   soundcloud  the canonical track URL (short links already followed)
 *   bandcamp    "album=123" or "track=456", the path segment its embed wants
 */
export interface ResolvedTrack {
  platform: Platform;
  embedRef: string;
  title: string;
  artist: string;
  /** Straight from tracks.yaml: where to buy it or find the artist, shown as
   *  the one link under the play button. Never played, http(s) only. */
  link?: string;
  year?: number;
  /** Seconds. Only ever set from tracks.yaml; YouTube and SoundCloud report
   *  their own, so in practice this is the Bandcamp estimate's input. */
  duration?: number;
  /** Seconds. Seek-on-play offset. Ignored for Bandcamp. */
  start?: number;
  note?: string;
  sourceUrl: string;
}

export type AdapterEvent =
  "ready" | "playing" | "paused" | "buffering" | "ended" | "error" | "progress";

export interface Progress {
  elapsed: number;
  duration: number;
}

/**
 * An adapter owns exactly one iframe and nothing else. It does not know about
 * the playlist, the clock, or the other adapters; player.ts owns all of that.
 */
export interface PlayerAdapter {
  readonly caps: { control: boolean; progress: boolean };
  mount(host: HTMLElement, track: ResolvedTrack): Promise<void>;
  /** No-op when !caps.control. */
  play(): void;
  pause(): void;
  destroy(): void;
  on(event: AdapterEvent, cb: (payload?: Progress) => void): void;
}

/** The three-line event bus every adapter shares. */
export function emitter() {
  const map = new Map<AdapterEvent, ((payload?: Progress) => void)[]>();
  return {
    on(event: AdapterEvent, cb: (payload?: Progress) => void) {
      const list = map.get(event) ?? [];
      list.push(cb);
      map.set(event, list);
    },
    emit(event: AdapterEvent, payload?: Progress) {
      for (const cb of map.get(event) ?? []) cb(payload);
    },
  };
}

/**
 * Load a third-party SDK once, ever. Returns the same promise on every call, so
 * the second track from a platform costs no network at all.
 *
 * Nothing here runs until an adapter mounts — which is the whole point: no
 * third-party request happens before the visitor asks for audio.
 */
const loaded = new Map<string, Promise<void>>();
export function loadScript(src: string, ready?: (resolve: () => void) => void): Promise<void> {
  const existing = loaded.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    // Some SDKs (YouTube) announce readiness through a global callback rather
    // than the load event; `ready` is where that hook gets installed.
    if (ready) ready(resolve);
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => {
      if (!ready) resolve();
    };
    el.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.append(el);
  });
  loaded.set(src, promise);
  return promise;
}
