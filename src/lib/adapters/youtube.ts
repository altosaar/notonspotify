import { emitter, loadScript, type PlayerAdapter, type ResolvedTrack } from "./types.ts";

declare const YT: any;

const API = "https://www.youtube.com/iframe_api";

/** The IFrame API announces itself through a global, not a load event. */
const ready = () =>
  loadScript(API, (resolve) => {
    (window as any).onYouTubeIframeAPIReady = resolve;
  });

export function youtube(): PlayerAdapter {
  const bus = emitter();
  let player: any = null;
  let poll = 0;
  let dead = false;

  function startPolling() {
    stopPolling();
    // 4 Hz. The clock interpolates between these, so this only has to be often
    // enough to correct drift and catch seeks — not to look smooth.
    poll = window.setInterval(() => {
      if (!player?.getCurrentTime) return;
      bus.emit("progress", {
        elapsed: player.getCurrentTime() ?? 0,
        duration: player.getDuration() ?? 0,
      });
    }, 250);
  }
  function stopPolling() {
    clearInterval(poll);
    poll = 0;
  }

  return {
    caps: { control: true, progress: true },

    // Resolves when the player will actually answer to playVideo() — the API
    // silently drops calls made before onReady, which is the difference between
    // a tap that plays and a tap that does nothing.
    async mount(host: HTMLElement, track: ResolvedTrack) {
      await ready();
      if (dead) return;
      const slot = document.createElement("div");
      host.append(slot);
      let settle = () => {};
      const mounted = new Promise<void>((resolve) => (settle = resolve));
      player = new YT.Player(slot, {
        videoId: track.embedRef,
        width: "100%",
        height: "100%",
        playerVars: {
          playsinline: 1,
          rel: 0,
          // The start offset is a player var rather than a seekTo on first
          // play: one fewer state to get wrong, and it survives a reload.
          ...(track.start ? { start: track.start } : {}),
        },
        events: {
          onReady: () => {
            settle();
            bus.emit("ready");
          },
          onStateChange: (e: { data: number }) => {
            const S = YT.PlayerState;
            if (e.data === S.PLAYING) {
              startPolling();
              bus.emit("playing");
            } else if (e.data === S.PAUSED) {
              stopPolling();
              bus.emit("paused");
            } else if (e.data === S.BUFFERING) {
              bus.emit("buffering");
            } else if (e.data === S.ENDED) {
              stopPolling();
              bus.emit("ended");
            }
          },
          // Deleted, private, region-blocked, or embedding disabled — all the
          // same to us: the track can't play, so move on.
          onError: () => {
            settle(); // never leave the mount hanging
            bus.emit("error");
          },
        },
      });
      await mounted;
    },

    play: () => player?.playVideo?.(),
    pause: () => player?.pauseVideo?.(),
    destroy() {
      dead = true;
      stopPolling();
      player?.destroy?.();
      player = null;
    },
    on: bus.on,
  };
}
