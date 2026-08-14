import { emitter, loadScript, type PlayerAdapter, type ResolvedTrack } from "./types.ts";

declare const SC: any;

const API = "https://w.soundcloud.com/player/api.js";

/** Widget chrome, tuned to the palette: monochrome, no related tracks, no teaser. */
const PARAMS =
  "&color=%23e2e2e2&visual=false&auto_play=false&hide_related=true" +
  "&show_comments=false&show_teaser=false&show_user=true&buying=false&download=false";

export function soundcloud(): PlayerAdapter {
  const bus = emitter();
  let widget: any = null;
  let duration = 0; // seconds, learned on ready
  let seeked = false;
  let dead = false;

  return {
    caps: { control: true, progress: true },

    async mount(host: HTMLElement, track: ResolvedTrack) {
      await loadScript(API);
      if (dead) return;

      const frame = document.createElement("iframe");
      frame.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.embedRef)}${PARAMS}`;
      // encrypted-media as well as autoplay: setting `allow` at all replaces the
      // default policy, and some SoundCloud streams use EME.
      frame.allow = "autoplay; encrypted-media";
      frame.title = `${track.title} on SoundCloud`;
      frame.setAttribute("frameborder", "0");
      host.append(frame);

      widget = SC.Widget(frame);
      const E = SC.Widget.Events;
      // As with YouTube: the widget ignores play() until it says READY, so the
      // mount isn't finished until then.
      let settle = () => {};
      const mounted = new Promise<void>((resolve) => (settle = resolve));
      widget.bind(E.READY, () => {
        widget.getDuration((ms: number) => {
          duration = ms / 1000;
        });
        settle();
        bus.emit("ready");
      });
      widget.bind(E.PLAY, () => {
        if (track.start && !seeked) {
          seeked = true;
          widget.seekTo(track.start * 1000);
        }
        bus.emit("playing");
      });
      widget.bind(E.PAUSE, () => bus.emit("paused"));
      widget.bind(E.FINISH, () => bus.emit("ended"));
      widget.bind(E.PLAY_PROGRESS, (p: { currentPosition: number }) => {
        bus.emit("progress", { elapsed: p.currentPosition / 1000, duration });
      });
      widget.bind(E.ERROR, () => {
        settle();
        bus.emit("error");
      });
      await mounted;
    },

    play: () => widget?.play?.(),
    pause: () => widget?.pause?.(),
    destroy() {
      dead = true;
      widget = null; // the iframe goes with the dock; the widget object dies with it
    },
    on: bus.on,
  };
}
