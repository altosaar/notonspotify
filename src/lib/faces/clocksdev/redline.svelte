<script>
  let { time } = $props();

  const CX = 100, CY = 100;
  const R_FACE = 98, R_TICK = 94, R_NUM = 76;
  const SPAN = 190;              // degrees of arc
  const START = -SPAN / 2;       // 0 = 12 o'clock, so the arc is centered on top

  const angle = (v) => START + (v / 60) * SPAN;
  const pt = (deg, r) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: CX + Math.cos(rad) * r, y: CY + Math.sin(rad) * r };
  };

  // face outline: the 190° arc, closed with a chord across the bottom
  const a0 = pt(START, R_FACE);
  const a1 = pt(START + SPAN, R_FACE);
  const facePath = `M ${a0.x} ${a0.y} A ${R_FACE} ${R_FACE} 0 1 1 ${a1.x} ${a1.y} Z`;

  // ticks 0..60 inclusive — 0 and 60 are distinct ends of the scale here
  const ticks = [];
  const nums = [];
  for (let v = 0; v <= 60; v++) {
    const major = v % 5 === 0;
    const len = major ? 9 : 4;
    const outer = pt(angle(v), R_TICK);
    const inner = pt(angle(v), R_TICK - len);
    ticks.push({ major, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y });
    if (major) {
      const n = pt(angle(v), R_NUM);
      nums.push({ label: v, x: n.x, y: n.y });
    }
  }

  const h = $derived(Number(time?.hh ?? 0));
  const m = $derived(Number(time?.mm ?? 0));
  const s = $derived(Number(time?.ss ?? 0));

  // needle angles on the 0-60 scale; hour maps like a normal clock (5 units/hour)
  const secA = $derived(angle(s));
  const minA = $derived(angle(m + s / 60));
  const hourA = $derived(angle(((h % 12) + (m + s / 60) / 60) * 5));
</script>

<div class="clock">
  <div class="dial">
    <svg viewBox="0 0 200 114">
      <path d={facePath} class="face" />

      {#each ticks as t}
        <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} class="tick" class:major={t.major} />
      {/each}

      {#each nums as n}
        <text x={n.x} y={n.y} class="num">{n.label}</text>
      {/each}

      <g class="needle hour" style="transform: rotate({hourA}deg)">
        <line x1="100" y1="100" x2="100" y2="54" />
      </g>
      <g class="needle minute" style="transform: rotate({minA}deg)">
        <line x1="100" y1="100" x2="100" y2="32" />
      </g>
      <g class="needle second" style="transform: rotate({secA}deg)">
        <line x1="100" y1="108" x2="100" y2="12" />
      </g>

      <circle cx="100" cy="100" r="4.5" class="hub" />
      <circle cx="100" cy="100" r="1.8" class="hub-pin" />
    </svg>
  </div>
</div>

<style>
  .clock {
    --bg: #101418;
    --dial-face: #171d23;
    --ring: #2a333c;
    --tick: #46525e;
    --tick-major: #8fa0b0;
    --num: #6b7a88;
    --hour: #ffffff;
    --minute: #8fa0b0;
    --accent: #ffb454;

    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: clamp(12px, 4%, 32px);
    background: var(--bg);
    color: white;
    font: 400 20px/1 Inter, system-ui, sans-serif;
    letter-spacing: -0.03em;
    container-type: size;
  }

  .dial {
    width: min(92cqw, 158cqh, 640px);
    aspect-ratio: 200 / 114;
  }

  .dial svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .face {
    fill: var(--dial-face);
    stroke: var(--ring);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .tick {
    stroke: var(--tick);
    stroke-width: 1;
    stroke-linecap: round;
  }

  .tick.major {
    stroke: var(--tick-major);
    stroke-width: 1.6;
  }

  .num {
    fill: var(--num);
    font-size: 8px;
    font-family: Inter, system-ui, sans-serif;
    text-anchor: middle;
    dominant-baseline: central;
  }

  .needle {
    transform-origin: 100px 100px;
    transition: transform 1s linear;
  }

  .needle line { stroke-linecap: round; }

  .needle.hour line {
    stroke: var(--hour);
    stroke-width: 3;
  }

  .needle.minute line {
    stroke: var(--minute);
    stroke-width: 2;
  }

  .needle.second line {
    stroke: var(--accent);
    stroke-width: 1;
  }

  .hub {
    fill: var(--dial-face);
    stroke: var(--tick-major);
    stroke-width: 1.5;
  }

  .hub-pin { fill: var(--accent); }

  @media (prefers-reduced-motion: reduce) {
    .needle { transition: none; }
  }
</style>