import { arc, el, layerOf, polar, shuffled, spread, SECONDS, type SvgFace } from "./kit.ts";

const C = 100;
const RADII = [46, 66, 86];

/**
 * Three points, one per layer, each on its own radius and turning at its own
 * rate — joined into a triangle that stretches and folds as they drift apart.
 * The track's own point drags the progress arc around behind it.
 *
 * Which layer gets which radius, and where each starts, is drawn at build time.
 */
export const triangle: SvgFace = {
  name: "triangle",
  build(svg, rnd) {
    svg.setAttribute("viewBox", "0 0 200 200");

    const carries = shuffled(rnd, [0, 1, 2]);
    const radii = shuffled(rnd, RADII);
    const phase = spread(rnd);
    const trackAt = carries.indexOf(0);

    svg.append(el("circle", { class: "frame", cx: C, cy: C, r: 92, "stroke-width": 1 }));
    const progress = el("path", { class: "progress", "stroke-width": 2.5, d: "" });
    const shape = el("polygon", { class: "mark", "stroke-width": 1, points: "" });
    svg.append(progress, shape);

    const dots = radii.map((_, i) => {
      const dot = el("circle", { class: "dot", cx: 0, cy: 0, r: 3 });
      if (carries[i] === SECONDS) dot.classList.add("seconds");
      svg.append(dot);
      return dot;
    });

    return (input) => {
      const points: string[] = [];
      dots.forEach((dot, i) => {
        const v = layerOf(input, carries[i]!);
        const turns = v === null ? phase[i]! : (v + phase[i]!) % 1;
        const [x, y] = polar(C, C, radii[i]!, turns);
        dot.setAttribute("cx", String(x));
        dot.setAttribute("cy", String(y));
        dot.style.opacity = v === null ? "0" : "";
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      });
      shape.setAttribute("points", points.join(" "));
      progress.setAttribute(
        "d",
        input.track === null
          ? ""
          : arc(C, C, radii[trackAt]!, phase[trackAt]!, phase[trackAt]! + input.track),
      );
    };
  },
};
