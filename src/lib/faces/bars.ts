import { el, layerOf, shuffled, spread, SECONDS, TRACK, type Face } from "./kit.ts";

const W = 200;
const X0 = 12;
const X1 = W - 12;
const SPAN = X1 - X0;

/**
 * Three rails, stacked. The track's rail fills from one end; the two cyclic
 * layers get a marker sliding along theirs and wrapping round — a bar that
 * filled and emptied on a ten-second loop would read as progress, and lie.
 *
 * Wide rather than square, so it takes the room a phone actually has.
 */
export const bars: Face = {
  name: "bars",
  build(svg, rnd) {
    svg.setAttribute("viewBox", "0 0 200 92");

    const carries = shuffled(rnd, [0, 1, 2]);
    const phase = spread(rnd);
    const rows = [16, 46, 76];

    const fills = rows.map((y, i) => {
      svg.append(el("line", { class: "frame", x1: X0, y1: y, x2: X1, y2: y, "stroke-width": 2 }));
      const isTrack = carries[i] === TRACK;
      const part = isTrack
        ? el("line", { class: "progress", x1: X0, y1: y, x2: X0, y2: y, "stroke-width": 6 })
        : el("line", {
            class: "mark",
            x1: X0,
            y1: y - 9,
            x2: X0,
            y2: y + 9,
            "stroke-width": 2.5,
          });
      if (carries[i] === SECONDS) part.classList.add("seconds");
      svg.append(part);
      return { part, y, isTrack };
    });

    return (input) => {
      fills.forEach(({ part, isTrack }, i) => {
        const v = layerOf(input, carries[i]!);
        if (v === null) {
          part.style.opacity = "0";
          return;
        }
        part.style.opacity = "";
        if (isTrack) {
          // Fills from the left, no phase: where progress starts is not a free
          // choice, it starts at nothing.
          part.setAttribute("x2", String(X0 + SPAN * v));
        } else {
          const x = X0 + SPAN * ((v + phase[i]!) % 1);
          part.setAttribute("x1", String(x));
          part.setAttribute("x2", String(x));
        }
      });
    };
  },
};
