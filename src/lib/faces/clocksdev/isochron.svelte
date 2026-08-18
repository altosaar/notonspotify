<script>
  let { time } = $props();

  const SIZE = 200, C = 100;
  const R_DOT = 84;    // where the dots ride

  // point on the dot ring for a given angle (degrees, 0 = 12 o'clock)
  function pt(angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: C + Math.cos(rad) * R_DOT, y: C + Math.sin(rad) * R_DOT };
  }

  const h = $derived(Number(time?.hh ?? 0));
  const m = $derived(Number(time?.mm ?? 0));
  const s = $derived(Number(time?.ss ?? 0));

  // fractional angles; CSS transitions glide between each per-second update
  const hourPt = $derived(pt((((h % 12) + (m + s / 60) / 60) / 12) * 360));
  const minutePt = $derived(pt(((m + s / 60) / 60) * 360));
  const secondPt = $derived(pt((s / 60) * 360));

  const trianglePath = $derived(
    `M ${hourPt.x} ${hourPt.y} L ${minutePt.x} ${minutePt.y} L ${secondPt.x} ${secondPt.y} Z`
  );
</script>

<div class="clock">
  <div class="dial">
    <svg viewBox="0 0 {SIZE} {SIZE}">
      <circle cx={C} cy={C} r="98" class="face" />

      <path
        d={trianglePath}
        style="d: path('{trianglePath}')"
        class="triangle"
      />

      <circle cx={hourPt.x} cy={hourPt.y} r="7" class="dot hour" />
      <circle cx={minutePt.x} cy={minutePt.y} r="5" class="dot minute" />
      <circle cx={secondPt.x} cy={secondPt.y} r="3.5" class="dot second" />
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
    position: relative;
    width: 88cqmin;
    max-width: 420px;
    aspect-ratio: 1;
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

  .triangle {
    fill: rgba(255, 180, 84, 0.08);
    stroke: var(--tick-major);
    stroke-width: 1;
    stroke-linejoin: round;
    transition: d 1s linear;
  }

  .dot {
    transition: cx 1s linear, cy 1s linear;
  }

  .dot.hour   { fill: var(--hour); }
  .dot.minute { fill: var(--minute); }
  .dot.second { fill: var(--accent); }

  @media (prefers-reduced-motion: reduce) {
    .triangle, .dot { transition: none; }
  }
</style>