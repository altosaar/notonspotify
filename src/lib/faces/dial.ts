import { arc, el, layerOf, polar, shuffled, spread, turn, SECONDS, type Face } from "./kit.ts";

const C = 100;
const R = 92;

/**
 * The dial: a thin ring, twelve ticks, an arc that fills with the track, and
 * three hands — a long hairline, a shorter heavy one, and a dot riding the ring.
 *
 * Which hand carries which layer is drawn fresh each time, so the same face
 * reads as a different instrument from track to track. The arc is exempt: it is
 * always progress, always from twelve, because it's the honest readout.
 */
export const dial: Face = {
  name: "dial",
  build(svg, rnd) {
    svg.setAttribute("viewBox", "0 0 200 200");

    svg.append(el("circle", { class: "frame", cx: C, cy: C, r: R, "stroke-width": 1 }));
    const ticks = el("g", { class: "frame" });
    for (let i = 0; i < 12; i++) {
      const [x1, y1] = polar(C, C, R - 8, i / 12);
      const [x2, y2] = polar(C, C, R - 3, i / 12);
      ticks.append(el("line", { x1, y1, x2, y2, "stroke-width": 1 }));
    }
    svg.append(ticks);

    const progress = el("path", { class: "progress", "stroke-width": 3, d: "" });
    const carries = shuffled(rnd, [0, 1, 2]);
    const phase = spread(rnd);
    const parts: SVGElement[] = [
      el("line", { class: "mark", x1: C, y1: C, x2: C, y2: C - 84, "stroke-width": 1 }),
      el("line", { class: "mark", x1: C, y1: C, x2: C, y2: C - 54, "stroke-width": 2.5 }),
      el("circle", { class: "dot", cx: C, cy: C - R, r: 3 }),
    ];
    parts.forEach((part, i) => {
      if (carries[i] === SECONDS) part.classList.add("seconds");
    });
    svg.append(progress, ...parts, el("circle", { class: "dot", cx: C, cy: C, r: 2 }));

    return (input) => {
      progress.setAttribute("d", input.track === null ? "" : arc(C, C, R, 0, input.track));
      parts.forEach((part, i) => {
        const v = layerOf(input, carries[i]!);
        turn(part, C, C, v === null ? null : (v + phase[i]!) % 1);
      });
    };
  },
};
