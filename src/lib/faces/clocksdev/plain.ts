/**
 * Strip the words out of a mounted clock, leaving the numbers.
 *
 * Several of these are as much poster as clock — mastheads, captions, an
 * author's wordmark. `notext` in faces.json says to keep only what reads as a
 * time.
 *
 * Done to the mounted DOM rather than to the component, because the components
 * are byte-identical copies and editing one would end that. Svelte rewrites
 * these text nodes on every update, overwriting whatever it finds, so this has
 * to run again after each one.
 */

/** A text node earns its place by containing a digit. Nothing else survives. */
const KEEP = /\d/;

export function stripWords(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    // Whitespace is left alone: blanking it collapses the layout the numbers sit
    // in, which is a different clock rather than a quieter one.
    if (text.trim() !== "" && !KEEP.test(text)) node.nodeValue = "";
  }
}
