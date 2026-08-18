<script>
  export let time

  // Clock geometry. Three circles roll along the inside of the rim (radius R),
  // each osculating (kissing) the boundary at its hand angle. A circle of
  // radius r rolling inside R keeps its center on an orbit of radius R - r.
  const center = 50
  const R = 44
  const rHour = R / 2 // 22 — center orbits at R/2, so it passes through the clock center
  const rMinute = R / 4 // 11
  const rSecond = R / 8 // 5.5
  const markR = rSecond / 2 // 2.75 — hour markers are half the radius of the second circle

  const dHour = R - rHour // orbital radius of each rolling circle's center
  const dMinute = R - rMinute
  const dSecond = R - rSecond

  // Rolling-without-slipping spin: an internally rolling disk turns (R - r)/r
  // times per orbit, opposite to its revolution. Here that lands on 1, 3, 7.
  const spinHour = -(R - rHour) / rHour // -1
  const spinMinute = -(R - rMinute) / rMinute // -3
  const spinSecond = -(R - rSecond) / rSecond // -7

  // 0deg points up (12 o'clock), increasing clockwise.
  function point(angle, radius) {
    const r = (angle * Math.PI) / 180
    return { x: center + Math.sin(r) * radius, y: center - Math.cos(r) * radius }
  }

  function around(cx, cy, angle, radius) {
    const r = (angle * Math.PI) / 180
    return { x: cx + Math.sin(r) * radius, y: cy - Math.cos(r) * radius }
  }

  const marks = Array.from({ length: 12 }, (_, i) => {
    const p = point(i * 30, R)
    return { x: p.x, y: p.y, major: i % 3 === 0 }
  })

  $: hourAngle = ((time.hour % 12) + time.minute / 60 + time.second / 3600) * 30
  $: minuteAngle = (time.minute + time.second / 60 + time.millisecond / 60000) * 6
  $: secondAngle = (time.second + time.millisecond / 1000) * 6

  // Center of each rolling circle, and a marker point on its rim showing spin.
  $: cHour = point(hourAngle, dHour)
  $: cMinute = point(minuteAngle, dMinute)
  $: cSecond = point(secondAngle, dSecond)
  $: nHour = around(cHour.x, cHour.y, spinHour * hourAngle, rHour)
  $: nMinute = around(cMinute.x, cMinute.y, spinMinute * minuteAngle, rMinute)
  $: nSecond = around(cSecond.x, cSecond.y, spinSecond * secondAngle, rSecond)
</script>

<div
  class="osculated-clock"
  role="img"
  aria-label={`Osculated clock showing ${time.hh}:${time.mm}:${time.ss}`}
>
  <svg viewBox="0 0 100 100" role="presentation">
    <defs>
      <radialGradient id="osc-face" cx="50%" cy="46%" r="62%">
        <stop offset="0" stop-color="#141416" />
        <stop offset="0.62" stop-color="#0d0d0f" />
        <stop offset="1" stop-color="#050506" />
      </radialGradient>
    </defs>

    <rect width="100" height="100" fill="url(#osc-face)" />

    <g class="frame">
      <circle class="rim" cx="50" cy="50" r={R} />
      {#each marks as mark}
        <circle class:major={mark.major} cx={mark.x} cy={mark.y} r={markR} />
      {/each}
    </g>

    <g class="rollers">
      <g class="roller hour">
        <circle class="disc" cx={cHour.x} cy={cHour.y} r={rHour} />
        <line class="spoke" x1={cHour.x} y1={cHour.y} x2={nHour.x} y2={nHour.y} />
        <circle class="hub" cx={cHour.x} cy={cHour.y} r="0.7" />
        <circle class="node" cx={nHour.x} cy={nHour.y} r="1.1" />
      </g>

      <g class="roller minute">
        <circle class="disc" cx={cMinute.x} cy={cMinute.y} r={rMinute} />
        <line class="spoke" x1={cMinute.x} y1={cMinute.y} x2={nMinute.x} y2={nMinute.y} />
        <circle class="hub" cx={cMinute.x} cy={cMinute.y} r="0.6" />
        <circle class="node" cx={nMinute.x} cy={nMinute.y} r="1" />
      </g>

      <g class="roller second">
        <circle class="disc" cx={cSecond.x} cy={cSecond.y} r={rSecond} />
        <line class="spoke" x1={cSecond.x} y1={cSecond.y} x2={nSecond.x} y2={nSecond.y} />
        <circle class="hub" cx={cSecond.x} cy={cSecond.y} r="0.5" />
        <circle class="node" cx={nSecond.x} cy={nSecond.y} r="0.9" />
      </g>
    </g>

    <circle class="pin" cx="50" cy="50" r="0.9" />
  </svg>
</div>

<style>
  .osculated-clock {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    background: #0b0b0c;
    isolation: isolate;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .rim {
    fill: none;
    stroke: rgb(245 244 235 / 16%);
    stroke-width: 0.4;
  }

  .frame circle:not(.rim) {
    fill: rgb(245 244 235 / 16%);
  }

  .frame circle.major {
    fill: rgb(245 244 235 / 34%);
  }

  /* Translucent discs, brightened where they overlap. */
  .rollers {
    mix-blend-mode: screen;
  }

  .disc {
    fill: rgb(245 244 235 / 8%);
    stroke: rgb(245 244 235 / 52%);
    stroke-width: 0.5;
  }

  .spoke {
    stroke: rgb(245 244 235 / 42%);
    stroke-width: 0.4;
    stroke-linecap: round;
  }

  .hub {
    fill: rgb(245 244 235 / 55%);
  }

  .node {
    fill: rgb(245 244 235 / 92%);
  }

  .pin {
    fill: rgb(245 244 235 / 70%);
  }

  @media (prefers-reduced-motion: reduce) {
    .spoke,
    .node {
      display: none;
    }
  }
</style>
