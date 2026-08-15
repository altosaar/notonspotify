import { emitter, type PlayerAdapter, type ResolvedTrack } from "./types.ts";

/**
 * Bandcamp is tier 2 by design (spec §4.2, §12.1). Their official embed exposes
 * no API: no play, no pause, no position, no end event. That is the ceiling,
 * and scraping the stream URLs to get past it is off the table — it breaks their
 * terms and it breaks constantly.
 *
 * So this adapter mounts an iframe and admits it can do nothing else. The
 * honesty lives upstream: player.ts reads caps and changes the button to "play
 * below", and the clock estimates instead of pretending to know.
 */
export function bandcamp(): PlayerAdapter {
  const bus = emitter();

  return {
    caps: { control: false, progress: false },

    async mount(host: HTMLElement, track: ResolvedTrack) {
      const frame = document.createElement("iframe");
      // linkcol is the one accent use the palette allows here.
      frame.src =
        `https://bandcamp.com/EmbeddedPlayer/${track.embedRef}/` +
        "size=small/bgcol=000000/linkcol=24cb71/transparent=true/";
      frame.title = `${track.title} on Bandcamp`;
      // Deliberately no `allow="autoplay"`: without that delegation the embed
      // cannot start itself off this page's user activation, only off a click
      // of its own. One more lock on a door that is already shut.
      frame.setAttribute("frameborder", "0");
      frame.addEventListener("load", () => bus.emit("ready"), { once: true });
      host.append(frame);
    },

    play: () => {},
    pause: () => {},
    destroy: () => {},
    on: bus.on,
  };
}
