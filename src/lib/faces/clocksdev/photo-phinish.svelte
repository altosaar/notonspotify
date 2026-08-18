<script>
  let { time } = $props();

  const h = $derived(Number(time?.hh ?? 0));
  const m = $derived(Number(time?.mm ?? 0));
  const s = $derived(Number(time?.ss ?? 0));

  const CX = 110, CY = 75;

  // parameterize a rounded-rect oval: T = total laps travelled ->
  // point on the centerline plus heading, clockwise from top-center
  // (the start/finish line). heading accumulates across laps so a
  // car's rotation never unwinds mid-race.
  function oval(w, hgt, r) {
    const sw = w - 2 * r, sh = hgt - 2 * r;
    const arc = (Math.PI * r) / 2;
    const P = 2 * sw + 2 * sh + 4 * arc;
    const corner = (ccx, ccy, a0, h0) => (d) => {
      const t = d / arc;
      const a = a0 + (t * Math.PI) / 2;
      return { x: ccx + Math.cos(a) * r, y: ccy + Math.sin(a) * r, a: h0 + t * 90 };
    };
    const segs = [
      [sw / 2, (d) => ({ x: CX + d, y: CY - hgt / 2, a: 0 })],
      [arc,    corner(CX + sw / 2, CY - sh / 2, -Math.PI / 2, 0)],
      [sh,     (d) => ({ x: CX + w / 2, y: CY - sh / 2 + d, a: 90 })],
      [arc,    corner(CX + sw / 2, CY + sh / 2, 0, 90)],
      [sw,     (d) => ({ x: CX + sw / 2 - d, y: CY + hgt / 2, a: 180 })],
      [arc,    corner(CX - sw / 2, CY + sh / 2, Math.PI / 2, 180)],
      [sh,     (d) => ({ x: CX - w / 2, y: CY + sh / 2 - d, a: 270 })],
      [arc,    corner(CX - sw / 2, CY - sh / 2, Math.PI, 270)],
      [sw / 2, (d) => ({ x: CX - sw / 2 + d, y: CY - hgt / 2, a: 360 })]
    ];
    return (T) => {
      const laps = Math.floor(T);
      let d = (T - laps) * P;
      for (const [len, fn] of segs) {
        if (d <= len) {
          const p = fn(d);
          return { x: p.x, y: p.y, a: laps * 360 + p.a };
        }
        d -= len;
      }
      const p = segs[0][1](0);
      return { x: p.x, y: p.y, a: (laps + 1) * 360 };
    };
  }

  // lanes: hour outside (longest career, slowest lap), second inside
  const LANES = {
    hour:   { w: 196, h: 126, r: 45 },
    minute: { w: 164, h: 94,  r: 34 },
    second: { w: 132, h: 62,  r: 24 }
  };
  const laneH = oval(LANES.hour.w, LANES.hour.h, LANES.hour.r);
  const laneM = oval(LANES.minute.w, LANES.minute.h, LANES.minute.r);
  const laneS = oval(LANES.second.w, LANES.second.h, LANES.second.r);

  // next-tick targets in TOTAL laps since midnight, so heading keeps
  // accumulating. second car: one lap per minute. minute: per hour.
  // hour: one lap per 12 hours.
  const secP = $derived(laneS((h * 3600 + m * 60 + s + 1) / 60));
  const minP = $derived(laneM((h * 60 + m + (s + 1) / 60) / 60));
  const hourP = $derived(laneH((h + (m + (s + 1) / 60) / 60) / 12));

  const pad = (n) => String(n).padStart(2, '0');
</script>

<div class="clock">
  <div class="dial">
    <svg viewBox="0 0 220 150">
      {#each Object.values(LANES) as lane}
        <rect
          x={CX - lane.w / 2} y={CY - lane.h / 2}
          width={lane.w} height={lane.h} rx={lane.r}
          class="lane"
        />
      {/each}

      <!-- start/finish line across all three lanes -->
      <line x1="110" y1="6" x2="110" y2="48" class="finish" />

      {#snippet carBody()}
        <rect x="-7" y="-7.4" width="4.6" height="2.3" rx="1" class="tire" />
        <rect x="2.4" y="-7.4" width="4.6" height="2.3" rx="1" class="tire" />
        <rect x="-7" y="5.1" width="4.6" height="2.3" rx="1" class="tire" />
        <rect x="2.4" y="5.1" width="4.6" height="2.3" rx="1" class="tire" />
        <rect x="-11" y="-6" width="22" height="12" rx="3.5" class="shell" />
        <rect x="4" y="-4.4" width="3.8" height="8.8" rx="1.4" class="windshield" />
      {/snippet}

      <g class="car hour" style="transform: translate({hourP.x}px, {hourP.y}px)">
        <g class="body" style="transform: rotate({hourP.a}deg) scale(1.15)">
          {@render carBody()}
        </g>
        <text class="car-num">{pad(h)}</text>
      </g>
      <g class="car minute" style="transform: translate({minP.x}px, {minP.y}px)">
        <g class="body" style="transform: rotate({minP.a}deg)">
          {@render carBody()}
        </g>
        <text class="car-num">{pad(m)}</text>
      </g>
      <g class="car second" style="transform: translate({secP.x}px, {secP.y}px)">
        <g class="body" style="transform: rotate({secP.a}deg) scale(0.9)">
          {@render carBody()}
        </g>
        <text class="car-num">{pad(s)}</text>
      </g>
    </svg>
  </div>
</div>

<style>
  .clock {
    --bg: #101418;
    --ring: #2a333c;
    --track: #1c232b;
    --tick-major: #8fa0b0;
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
    width: min(92cqw, 135cqh, 640px);
    aspect-ratio: 220 / 150;
  }

  .dial svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .lane {
    fill: none;
    stroke: var(--track);
    stroke-width: 14;
  }

  .finish {
    stroke: var(--tick-major);
    stroke-width: 2;
    stroke-dasharray: 3 3;
  }

  .car {
    transition: transform 1s linear;
  }

  .car .body {
    transition: transform 1s linear;
  }

  .tire {
    fill: #0b0e11;
  }

  .windshield {
    fill: rgba(16, 20, 24, 0.35);
  }

  .car-num {
    font-size: 7.5px;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--ink);
  }

  .car.hour .shell   { fill: var(--hour); }
  .car.minute .shell { fill: var(--minute); }
  .car.second .shell { fill: var(--accent); }

  @media (prefers-reduced-motion: reduce) {
    .car, .car .body { transition: none; }
  }
</style>