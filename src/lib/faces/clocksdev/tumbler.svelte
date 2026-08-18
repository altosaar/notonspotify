<script>
  let { time } = $props();

  const SIZE = 200, C = 100, R_OUTER = 96, R_NUM = 70;

  const CONFIG = [
    { key: 'hh', max: 24, majorEvery: 3 },
    { key: 'mm', max: 60, majorEvery: 5 },
    { key: 'ss', max: 60, majorEvery: 5 }
  ];

  // Precompute tick + number geometry once per dial
  const dials = CONFIG.map((cfg) => {
    const ticks = [];
    const nums = [];
    for (let i = 0; i < cfg.max; i++) {
      const angle = (i / cfg.max) * 360;
      const rad = ((angle - 90) * Math.PI) / 180;
      const major = i % cfg.majorEvery === 0;
      const len = major ? 10 : 5;
      ticks.push({
        major,
        x1: C + Math.cos(rad) * (R_OUTER - len),
        y1: C + Math.sin(rad) * (R_OUTER - len),
        x2: C + Math.cos(rad) * R_OUTER,
        y2: C + Math.sin(rad) * R_OUTER
      });
      if (major) {
        nums.push({
          value: i,
          label: String(i).padStart(2, '0'),
          x: C + Math.cos(rad) * R_NUM,
          y: C + Math.sin(rad) * R_NUM
        });
      }
    }
    return { ...cfg, ticks, nums };
  });

  // Track full wraps (59 -> 00) so each ring keeps rotating forward
  let turns = $state({ hh: 0, mm: 0, ss: 0 });
  let last = { hh: -1, mm: -1, ss: -1 };

  $effect(() => {
    for (const d of dials) {
      const v = Number(time?.[d.key] ?? 0);
      if (last[d.key] !== -1 && v < last[d.key]) turns[d.key]++;
      last[d.key] = v;
    }
  });
</script>

<div class="clock">
  <div class="row">
    {#each dials as d}
      {@const v = Number(time?.[d.key] ?? 0)}
      {@const rot = -(turns[d.key] * 360 + (v / d.max) * 360)}
      <div class="dial">
        <svg viewBox="0 0 {SIZE} {SIZE}">
          <circle cx={C} cy={C} r="98" class="face" />
          <g class="ring" style="transform: rotate({rot}deg)">
            {#each d.ticks as t}
              <line
                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                class="tick" class:major={t.major}
              />
            {/each}
            {#each d.nums as n}
              <text
                x={n.x} y={n.y}
                class="num" class:active={n.value === v}
                style="transform-origin: {n.x}px {n.y}px; transform: rotate({-rot}deg)"
              >{n.label}</text>
            {/each}
          </g>
        </svg>
        <div class="pointer"></div>
        <div class="readout">{String(v).padStart(2, '0')}</div>
      </div>
    {/each}
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
    --active: #ffffff;
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
    font: 400 clamp(20px, 3vw, 30px)/1 Inter, system-ui, sans-serif;
    letter-spacing: -0.03em;
  }

  .row {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 820px;
    gap: 4%;
  }

  .dial {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    max-width: 240px;
    aspect-ratio: 1;
    container-type: inline-size;
  }

  .dial svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .face {
    fill: var(--dial-face);
    stroke: var(--ring);
    stroke-width: 1.5;
  }

  .ring {
    transform-origin: 100px 100px;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .tick {
    stroke: var(--tick);
    stroke-width: 1;
    stroke-linecap: round;
  }

  .tick.major {
    stroke: var(--tick-major);
    stroke-width: 2;
  }

  .num {
    fill: var(--num);
    font-size: 11px;
    font-family: Inter, system-ui, sans-serif;
    text-anchor: middle;
    dominant-baseline: central;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .num.active {
    fill: var(--active);
    font-weight: 600;
  }

  .pointer {
    position: absolute;
    top: -2cqw;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 3.5cqw solid transparent;
    border-right: 3.5cqw solid transparent;
    border-top: 5cqw solid var(--accent);
  }

  .readout {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    font-size: 24cqw;
    font-weight: 200;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  @media (prefers-reduced-motion: reduce) {
    .ring, .num { transition: none; }
  }
</style>