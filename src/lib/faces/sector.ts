import { arc, el, type Face } from "./kit.ts";

const C = 100;
const R = 62; // the band's centreline; its stroke width gives it its body

/**
 * A wedge. Progress is drawn as one very heavy arc, so the face fills like a
 * pie chart being poured — and because it is a stroke rather than a fill, it
 * still goes dashed when the clock is only estimating.
 *
 * Start angle and direction are drawn at build time: some tracks fill clockwise
 * from the top, others the other way from somewhere else entirely. The mirror
 * is a transform on the whole group, so every part turns with it.
 */
export const sector: Face = {
  name: "sector",
  build(svg, rnd) {
    svg.setAttribute("viewBox", "0 0 200 200");

    const start = rnd();
    const group = el("g", rnd() < 0.5 ? { transform: "translate(200 0) scale(-1 1)" } : {});

    group.append(el("circle", { class: "frame", cx: C, cy: C, r: 92, "stroke-width": 1 }));
    const band = el("path", { class: "progress", "stroke-width": 44, d: "" });
    const edge = el("line", {
      class: "mark",
      x1: C,
      y1: C - 40,
      x2: C,
      y2: C - 84,
      "stroke-width": 1,
    });
    const dot = el("circle", { class: "dot seconds", cx: C, cy: C - 92, r: 3 });
    group.append(band, edge, dot);
    svg.append(group);

    return (input) => {
      band.setAttribute("d", input.track === null ? "" : arc(C, C, R, start, start + input.track));
      edge.setAttribute("transform", `rotate(${(input.fast + start) * 360} ${C} ${C})`);
      dot.setAttribute("transform", `rotate(${input.seconds * 360} ${C} ${C})`);
    };
  },
};
