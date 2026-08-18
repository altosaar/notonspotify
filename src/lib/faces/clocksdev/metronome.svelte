<script>
  let { time } = $props();

  const h = $derived(Number(time?.hh ?? 0));
  const m = $derived(Number(time?.mm ?? 0));
  const s = $derived(Number(time?.ss ?? 0));

  // vertical ping-pong: each ball makes one full floor-to-ceiling traversal
  // per time unit, reversing direction each trip. n = completed trips,
  // frac = progress through the current one.
  const bounce = (n, frac) => (n % 2 === 0 ? 1 - frac : frac);

  // each derived value is the position the ball should REACH at the next tick;
  // the 1s linear CSS transition carries it there in a straight line.

  // second ball: full-height bounce every second, x sweeps 0-60 across the width
  const secPos = $derived({ x: (s + 1) / 60, y: bounce(s, 1) });

  // minute ball: one traversal per minute
  const minPos = $derived({
    x: (m + (s + 1) / 60) / 60,
    y: bounce(m, (s + 1) / 60)
  });

  // hour ball: one traversal per hour, x crosses the width over 24 hours
  const hourPos = $derived({
    x: (h + (m + (s + 1) / 60) / 60) / 24,
    y: bounce(h, (m * 60 + s + 1) / 3600)
  });

  const pad = (n) => String(n).padStart(2, '0');
  const pos = (p) => `left: calc(var(--d) / 2 + ${p.x} * (100% - var(--d)));` +
                     `top: calc(var(--d) / 2 + ${p.y} * (100% - var(--d)))`;
</script>

<div class="clock">
  <div class="ball hour" style={pos(hourPos)}>{pad(h)}</div>
  <div class="ball minute" style={pos(minPos)}>{pad(m)}</div>
  <div class="ball second" style={pos(secPos)}>{pad(s)}</div>
</div>

<style>
  .clock {
    --bg: #101418;
    --hour: #ffffff;
    --minute: #8fa0b0;
    --accent: #ffb454;
    --ink: #101418;

    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    background: var(--bg);
    font: 400 20px/1 Inter, system-ui, sans-serif;
    letter-spacing: -0.02em;
    container-type: size;
  }

  .ball {
    position: absolute;
    width: var(--d);
    height: var(--d);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    display: grid;
    place-content: center;
    color: var(--ink);
    font-weight: 600;
    font-size: calc(var(--d) * 0.36);
    font-variant-numeric: tabular-nums;
    transition: left 1s linear, top 1s linear;
    will-change: left, top;
  }

  .ball.hour {
    --d: clamp(64px, 20cqmin, 120px);
    background: var(--hour);
  }

  .ball.minute {
    --d: clamp(52px, 16cqmin, 96px);
    background: var(--minute);
  }

  .ball.second {
    --d: clamp(40px, 12cqmin, 72px);
    background: var(--accent);
  }

  @media (prefers-reduced-motion: reduce) {
    .ball { transition: none; }
  }
</style>