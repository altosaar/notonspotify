import { el, type Face } from "./kit.ts";

const W = 64;
const TOP = 12;
const BOTTOM = 188;
const SPAN = BOTTOM - TOP;

/**
 * A tall one: the track fills a column from the bottom, a marker slides up it on
 * the fast layer and starts over at the top, and the seconds run along a rail
 * underneath. Upright rather than round — the same three numbers read as a
 * gauge instead of a dial.
 */
export const column: Face = {
  name: "column",
  build(svg, rnd) {
    svg.setAttribute("viewBox", `0 0 ${W} 200`);

    const x = W / 2;
    const markerPhase = rnd();
    const secondsPhase = rnd();
    const railY = 196;

    svg.append(
      el("line", { class: "frame", x1: x, y1: TOP, x2: x, y2: BOTTOM, "stroke-width": 10 }),
    );
    const fill = el("line", {
      class: "progress",
      x1: x,
      y1: BOTTOM,
      x2: x,
      y2: BOTTOM,
      "stroke-width": 10,
    });
    const marker = el("line", {
      class: "mark",
      x1: x - 16,
      y1: BOTTOM,
      x2: x + 16,
      y2: BOTTOM,
      "stroke-width": 2,
    });
    svg.append(
      fill,
      marker,
      el("line", { class: "frame", x1: 6, y1: railY, x2: W - 6, y2: railY, "stroke-width": 1 }),
    );
    const dot = el("circle", { class: "dot seconds", cx: 6, cy: railY, r: 3 });
    svg.append(dot);

    return (input) => {
      if (input.track === null) fill.style.opacity = "0";
      else {
        fill.style.opacity = "";
        fill.setAttribute("y2", String(BOTTOM - SPAN * input.track));
      }
      const y = BOTTOM - SPAN * ((input.fast + markerPhase) % 1);
      marker.setAttribute("y1", String(y));
      marker.setAttribute("y2", String(y));
      dot.setAttribute("cx", String(6 + (W - 12) * ((input.seconds + secondsPhase) % 1)));
    };
  },
};
