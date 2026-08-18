/**
 * Take the writing off a mounted clock.
 *
 * Several of these are as much poster as clock — mastheads, captions, an
 * author's wordmark — and some read as a readout rather than an instrument.
 * faces.json says how far to go:
 *
 *   "words"  keep anything with a digit in it, drop the rest. The time stays.
 *   "all"    drop every word, digit, colon and mark. What is left is whatever
 *            the clock draws rather than writes: hands, arcs, dots, bars.
 *
 * Done to the mounted DOM rather than to the component, because the components
 * are byte-identical copies and editing one would end that. Svelte rewrites
 * these text nodes on every update, overwriting whatever it finds, so this has
 * to run again after each one.
 */

/** In "words" mode a text node earns its place by containing a digit. */
const HAS_DIGIT = /\d/;

export type Strip = "words" | "all";

export function stripText(root: HTMLElement, mode: Strip): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    // Whitespace is left alone in both modes: blanking it collapses the layout
    // the clock is built in, which is a different clock rather than a quieter
    // one.
    if (text.trim() === "") continue;
    if (mode === "all" || !HAS_DIGIT.test(text)) node.nodeValue = "";
  }
}
