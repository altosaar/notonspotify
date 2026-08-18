<script>
  let { time } = $props();

  const h = $derived(Number(time?.hh ?? 0));
  const m = $derived(Number(time?.mm ?? 0));
  const s = $derived(Number(time?.ss ?? 0));

  const A = 18;                       // swing amplitude, degrees
  const PIVOT = { x: 100, y: 18 };
  const BOB_Y = 183;                  // bob center, along the rod

  // faint guide arc tracing the bob's path
  const rad = (A * Math.PI) / 180;
  const R = BOB_Y - PIVOT.y;
  const arc = {
    x1: PIVOT.x - Math.sin(rad) * R,
    y1: PIVOT.y + Math.cos(rad) * R,
    x2: PIVOT.x + Math.sin(rad) * R,
    y2: PIVOT.y + Math.cos(rad) * R
  };

  // one half-swing per second: the pendulum arrives at an extreme
  // exactly on each tick, alternating sides. ease-in-out timing gives
  // the fast-middle / slow-ends feel of real harmonic motion.
  const swing = $derived((s + 1) % 2 === 0 ? -A : A);

  // weights slide down the rod as their unit progresses (targets are
  // next-tick positions; 1s linear transitions carry them)
  const TRACK = { top: 0, range: 105 };   // translateY range for weights
  const minY = $derived(TRACK.top + ((m + (s + 1) / 60) / 60) * TRACK.range);
  const hourY = $derived(TRACK.top + (((h % 12) + (m + (s + 1) / 60) / 60) / 12) * TRACK.range);

  const pad = (n) => String(n).padStart(2, '0');
</script>

<div class="clock">
  <div class="dial">
    <svg viewBox="0 0 200 210">
      <path d="M {arc.x1} {arc.y1} A {R} {R} 0 0 0 {arc.x2} {arc.y2}" class="guide" />

      <g class="pendulum" style="transform: rotate({swing}deg)">
        <line x1="100" y1="18" x2="100" y2={BOB_Y} class="rod" />

        <g class="weight hour" style="transform: translateY({hourY}px)">
          <rect x="66" y="35" width="34" height="18" rx="9" />
          <text x="83" y="44">{pad(h)}</text>
        </g>

        <g class="weight minute" style="transform: translateY({minY}px)">
          <rect x="100" y="35" width="34" height="18" rx="9" />
          <text x="117" y="44">{pad(m)}</text>
        </g>

        <circle cx="100" cy={BOB_Y} r="15" class="bob" />
        <text x="100" y={BOB_Y} class="bob-num">{pad(s)}</text>
      </g>

      <line x1="82" y1="14" x2="118" y2="14" class="mount" />
      <circle cx="100" cy="18" r="4" class="pin" />
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
    --ink: #101418;

    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: clamp(12px, 4%, 32px);
    background: var(--bg);
    font: 400 20px/1 Inter, system-ui, sans-serif;
    letter-spacing: -0.02em;
    container-type: size;
  }

  .dial {
    width: min(88cqw, 82cqh, 440px);
    aspect-ratio: 200 / 210;
  }

  .dial svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .guide {
    fill: none;
    stroke: var(--ring);
    stroke-width: 1;
    stroke-dasharray: 2 5;
    stroke-linecap: round;
  }

  .pendulum {
    transform-origin: 100px 18px;
    transition: transform 1s ease-in-out;
  }

  .rod {
    stroke: var(--tick);
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .weight {
    transition: transform 1s linear;
  }

  .weight text {
    font-size: 9px;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--ink);
  }

  .weight.hour rect   { fill: var(--hour); }
  .weight.minute rect { fill: var(--minute); }

  .bob {
    fill: var(--accent);
  }

  .bob-num {
    font-size: 11px;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--ink);
  }

  .mount {
    stroke: var(--ring);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .pin {
    fill: var(--tick-major);
  }

  @media (prefers-reduced-motion: reduce) {
    .pendulum, .weight { transition: none; }
  }
</style>