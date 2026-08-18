<script>
  let { time } = $props();

  const h = $derived(Number(time?.hh ?? 0));
  const m = $derived(Number(time?.mm ?? 0));
  const s = $derived(Number(time?.ss ?? 0));

  // ring geometry: hour outermost, second innermost
  const RINGS = [
    { key: 'hour',   r: 88, w: 8 },
    { key: 'minute', r: 70, w: 8 },
    { key: 'second', r: 52, w: 8 }
  ];
  const circ = (r) => 2 * Math.PI * r;

  // each fraction is where the arc should be at the NEXT tick;
  // 1s linear transitions on stroke-dasharray sweep it there
  const frac = $derived({
    second: (s + 1) / 60,
    minute: (m + (s + 1) / 60) / 60,
    hour: ((h % 12) + (m + (s + 1) / 60) / 60) / 12
  });

  const pad = (n) => String(n).padStart(2, '0');
</script>

<div class="clock">
  <div class="dial">
    <svg viewBox="0 0 200 200">
      <!-- rotate so every arc begins at 12 o'clock -->
      <g transform="rotate(-90 100 100)">
        {#each RINGS as ring}
          <circle cx="100" cy="100" r={ring.r} class="track" stroke-width={ring.w} />
          <circle
            cx="100" cy="100" r={ring.r}
            class="arc {ring.key}"
            stroke-width={ring.w}
            style="stroke-dasharray: {frac[ring.key] * circ(ring.r)} {circ(ring.r)}"
          />
        {/each}
      </g>

      <circle cx="100" cy="100" r="36" class="moon" />
    </svg>
    <div class="readout">{pad(h)}:{pad(m)}</div>
  </div>
</div>

<style>
  .clock {
    --bg: #101418;
    --dial-face: #171d23;
    --ring: #2a333c;
    --track: #1c232b;
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
    position: relative;
    width: 88cqmin;
    max-width: 460px;
    aspect-ratio: 1;
  }

  .dial svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .track {
    fill: none;
    stroke: var(--track);
  }

  .arc {
    fill: none;
    stroke-linecap: round;
    transition: stroke-dasharray 1s linear;
  }

  .arc.hour   { stroke: var(--hour); }
  .arc.minute { stroke: var(--minute); }
  .arc.second { stroke: var(--accent); }

  .moon {
    fill: var(--dial-face);
    stroke: var(--ring);
    stroke-width: 1.5;
  }

  .readout {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    font-size: 9cqmin;
    font-weight: 200;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    color: var(--num);
  }

  @media (prefers-reduced-motion: reduce) {
    .arc { transition: none; }
  }
</style>