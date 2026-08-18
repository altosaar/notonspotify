import { el, pick, type SvgFace } from "./kit.ts";

/**
 * A field of dots that fill in as the track plays, like a progress bar with
 * enough resolution to watch. One dot burns brighter and walks the field once a
 * minute — the seconds — and a hairline scans across at the fast layer's rate.
 *
 * The grid's size, and whether it fills in rows or in columns, are drawn at
 * build time.
 */
export const grid: SvgFace = {
  name: "grid",
  build(svg, rnd) {
    const cols = pick(rnd, [12, 15, 20]);
    const rows = pick(rnd, [5, 6, 8]);
    const byColumn = rnd() < 0.35;

    const step = 12;
    const w = cols * step;
    const h = rows * step;
    svg.setAttribute("viewBox", `0 0 ${w} ${h + 14}`);

    const cells = cols * rows;
    const dots: SVGCircleElement[] = [];
    // Index in fill order, so `lit` below is just a count.
    for (let n = 0; n < cells; n++) {
      const [col, row] = byColumn
        ? [Math.floor(n / rows), n % rows]
        : [n % cols, Math.floor(n / cols)];
      dots.push(
        el("circle", {
          class: "frame-dot",
          cx: col * step + step / 2,
          cy: row * step + step / 2,
          r: 2.6,
        }),
      );
    }
    svg.append(...dots);

    const scan = el("line", { class: "mark", x1: 0, y1: 2, x2: 0, y2: h - 2, "stroke-width": 1 });
    const walker = el("circle", { class: "dot seconds", cx: 0, cy: 0, r: 4 });
    // A rail under the field, so the face still has a `.frame` to go dashed on
    // when the clock is estimating.
    svg.append(
      scan,
      walker,
      el("line", { class: "frame", x1: 0, y1: h + 7, x2: w, y2: h + 7, "stroke-width": 2 }),
    );

    let lit = -1;
    return (input) => {
      const next = input.track === null ? 0 : Math.round(input.track * cells);
      if (next !== lit) {
        // Only the dots that changed sides get touched.
        const [from, to] = next > lit ? [Math.max(lit, 0), next] : [next, Math.max(lit, 0)];
        for (let n = from; n < to; n++) dots[n]!.classList.toggle("is-lit", n < next);
        lit = next;
      }
      const at = dots[Math.min(cells - 1, Math.floor(input.seconds * cells))]!;
      walker.setAttribute("cx", at.getAttribute("cx")!);
      walker.setAttribute("cy", at.getAttribute("cy")!);
      const x = input.fast * w;
      scan.setAttribute("x1", String(x));
      scan.setAttribute("x2", String(x));
    };
  },
};
