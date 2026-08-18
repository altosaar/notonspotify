/**
 * `notext` keeps the numbers and drops the words. The rule is simple enough to
 * state and easy to get subtly wrong, so it is pinned here.
 */
import { describe, expect, it } from "vitest";
import { stripText, type Strip } from "./plain.ts";

const render = (html: string, mode: Strip = "words") => {
  const host = document.createElement("div");
  host.innerHTML = html;
  stripText(host, mode);
  return host;
};

describe("stripText, words", () => {
  it("drops a text node with no digits in it", () => {
    expect(render("<p>ZODIAC SEAL ALMANAC</p>").textContent).toBe("");
  });

  it("keeps one that reads as a time", () => {
    expect(render("<p>03:26:07</p>").textContent).toBe("03:26:07");
  });

  it("keeps the numbers and drops the words around them", () => {
    const host = render("<div><span>hours</span><span>12</span><span>minutes</span></div>");
    expect(host.textContent).toBe("12");
  });

  it("leaves a mixed run alone rather than mangling it", () => {
    // "12生肖" is a label and a number at once. Cutting the characters out of it
    // would be editing someone's clock, not quieting it.
    expect(render("<p>12生肖</p>").textContent).toBe("12生肖");
  });

  it("leaves whitespace alone", () => {
    // Blanking it collapses the layout the numbers are sitting in.
    const host = render("<p> </p><p>07</p>");
    expect(host.textContent).toBe(" 07");
  });

  it("reaches into SVG text too, where half of these draw", () => {
    const host = render("<svg><text>SECONDS</text><text>42</text></svg>");
    expect(host.textContent).toBe("42");
  });
});

describe("stripText, all", () => {
  it("takes the time away too", () => {
    expect(render("<p>03:26:07</p>", "all").textContent).toBe("");
  });

  it("takes the colons and marks with it", () => {
    expect(render("<p>@ 12 · 04 — 07</p>", "all").textContent).toBe("");
  });

  it("leaves nothing written anywhere", () => {
    const host = render(
      "<div><span>hours</span><span>12</span><svg><text>42</text></svg></div>",
      "all",
    );
    expect(host.textContent).toBe("");
  });

  it("still leaves whitespace, so the layout holds its shape", () => {
    expect(render("<p> </p><p>07</p>", "all").textContent).toBe(" ");
  });

  it("leaves what the clock draws rather than writes", () => {
    // The hands, arcs and dots are elements, not text, and are untouched.
    const host = render('<svg><line class="hand"/><text>12</text></svg>', "all");
    expect(host.querySelectorAll("line").length).toBe(1);
    expect(host.textContent).toBe("");
  });
});
