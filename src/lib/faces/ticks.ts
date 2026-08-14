import { el, pick, polar, type Face } from "./kit.ts";

const C = 100;

/**
 * A ring of tick marks that light up one by one as the track plays: the face is
 * a bar chart bent into a circle. A single tick burns brighter for the current
 * second, and a hairline hand sweeps the fast layer across the middle.
 *
 * The whole ring is spun to a random angle at build time, so the track doesn't
 * always start filling from twelve.
 */
export const ticks: Face = {
  name: "ticks",
  build(svg, rnd) {
    svg.setAttribute("viewBox", "0 0 200 200");

    const count = pick(rnd, [36, 48, 60]);
    const spin = rnd();
    const inner = 68;
    const outer = 88;

    // An outer ring, so the face has something for the estimate tell to dash.
    svg.append(el("circle", { class: "frame", cx: C, cy: C, r: 94, "stroke-width": 1 }));

    const group = el("g", { transform: `rotate(${spin * 360} ${C} ${C})` });
    const marks = Array.from({ length: count }, (_, i) => {
      const [x1, y1] = polar(C, C, inner, i / count);
      const [x2, y2] = polar(C, C, outer, i / count);
      const line = el("line", { class: "frame", x1, y1, x2, y2, "stroke-width": 2 });
      group.append(line);
      return line;
    });
    const second = el("line", {
      class: "mark seconds",
      "stroke-width": 2.5,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
    });
    group.append(second);
    svg.append(group);

    const hand = el("line", { class: "mark", x1: C, y1: C, x2: C, y2: C - 58, "stroke-width": 1 });
    svg.append(hand, el("circle", { class: "dot", cx: C, cy: C, r: 2 }));

    let lit = -1;
    return (input) => {
      // Only the ticks that changed state get touched — at 60fps over 60 marks
      // that is the difference between a quiet main thread and a busy one.
      const next = input.track === null ? -1 : Math.round(input.track * count);
      if (next !== lit) {
        marks.forEach((mark, i) => mark.classList.toggle("is-lit", i < next));
        lit = next;
      }
      const s = Math.floor(input.seconds * count) / count;
      const [x1, y1] = polar(C, C, inner - 8, s);
      const [x2, y2] = polar(C, C, outer, s);
      second.setAttribute("x1", String(x1));
      second.setAttribute("y1", String(y1));
      second.setAttribute("x2", String(x2));
      second.setAttribute("y2", String(y2));
      hand.setAttribute("transform", `rotate(${(input.fast + spin) * 360} ${C} ${C})`);
    };
  },
};
