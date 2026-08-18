import { arc, el, layerOf, shuffled, spread, turn, SECONDS, type SvgFace } from "./kit.ts";

const C = 100;
const RADII = [44, 66, 88];

/**
 * Three concentric rings, a dot travelling each one. The ring carrying the
 * track also draws the trail behind its dot, so progress is a widening arc at
 * whatever radius it landed on this time.
 */
export const orbits: SvgFace = {
  name: "orbits",
  build(svg, rnd) {
    svg.setAttribute("viewBox", "0 0 200 200");

    const carries = shuffled(rnd, [0, 1, 2]);
    const phase = spread(rnd);
    const trackRing = RADII[carries.indexOf(0)]!;
    const trackPhase = phase[carries.indexOf(0)]!;

    for (const r of RADII) {
      svg.append(el("circle", { class: "frame", cx: C, cy: C, r, "stroke-width": 1 }));
    }
    const progress = el("path", { class: "progress", "stroke-width": 2.5, d: "" });
    svg.append(progress);

    const dots = RADII.map((r, i) => {
      const dot = el("circle", { class: "dot", cx: C, cy: C - r, r: i === 2 ? 3.5 : 3 });
      if (carries[i] === SECONDS) dot.classList.add("seconds");
      svg.append(dot);
      return dot;
    });

    return (input) => {
      // The trail starts where this ring's dot started, so the two always agree.
      progress.setAttribute(
        "d",
        input.track === null ? "" : arc(C, C, trackRing, trackPhase, trackPhase + input.track),
      );
      dots.forEach((dot, i) => {
        const v = layerOf(input, carries[i]!);
        turn(dot, C, C, v === null ? null : (v + phase[i]!) % 1);
      });
    };
  },
};
