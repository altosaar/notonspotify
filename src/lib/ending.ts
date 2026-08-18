/**
 * What happens when a track finishes.
 *
 * Its own function because it is the rule the whole player hangs on and it used
 * to be three conditions inside an event handler, where it was wrong: only
 * `repeat: all` moved to the next track, so with repeat off — the default, and
 * what every first visit gets — a track ended and the site went quiet. A
 * playlist that stops after every song is not a playlist.
 *
 * The model is the ordinary one:
 *
 *   off   play the list through and come to rest at the end OF THE LIST
 *   all   play the list through and come round again, forever
 *   one   play this track again
 */
export type Repeat = "off" | "all" | "one";

export type Ending = "again" | "next" | "stop";

export function afterTrack(
  repeat: Repeat,
  /** Is the track that just finished the last one in the playing order? */
  atEndOfList: boolean,
  /** Whether this platform can be told to play again. Bandcamp cannot. */
  canReplay: boolean,
): Ending {
  // "one" on a platform that cannot be restarted has nothing to repeat with, so
  // it falls through and lets the ordinary rule apply.
  if (repeat === "one") return canReplay ? "again" : "stop";
  return repeat === "all" || !atEndOfList ? "next" : "stop";
}
