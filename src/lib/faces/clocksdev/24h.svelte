<script>
  export let time

  const hours = Array.from({ length: 24 }, (_, hour) => {
    const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2

    return {
      hour,
      x: 50 + Math.cos(angle) * 41.5,
      y: 50 + Math.sin(angle) * 41.5,
      tickX1: 50 + Math.cos(angle) * 46.4,
      tickY1: 50 + Math.sin(angle) * 46.4,
      tickX2: 50 + Math.cos(angle) * 48,
      tickY2: 50 + Math.sin(angle) * 48,
    }
  })

  $: minuteAngle = (time.minute + time.second / 60 + time.millisecond / 60000) * 6
  $: dayAngle = (time.hour + time.minute / 60 + time.second / 3600) * 15
</script>

<div
  class="day-dial-clock"
  role="img"
  aria-label={`24-hour analogue clock showing ${time.hh}:${time.mm}`}
>
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <g class="hour-scale">
      {#each hours as mark}
        <line x1={mark.tickX1} y1={mark.tickY1} x2={mark.tickX2} y2={mark.tickY2} />
        <text x={mark.x} y={mark.y}>{String(mark.hour).padStart(2, '0')}</text>
      {/each}
    </g>

    <line
      class="minute-hand"
      x1="50"
      y1="53.5"
      x2="50"
      y2="14.5"
      transform={`rotate(${minuteAngle} 50 50)`}
      vector-effect="non-scaling-stroke"
    />
    <line
      class="day-hand"
      x1="50"
      y1="54.5"
      x2="50"
      y2="23"
      transform={`rotate(${dayAngle} 50 50)`}
      vector-effect="non-scaling-stroke"
    />
    <circle class="pin" cx="50" cy="50" r="1.15" />
  </svg>
</div>

<style>
  .day-dial-clock {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    background: #f4f3ef;
    background: #000;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    shape-rendering: geometricPrecision;
  }

  .hour-scale line {
    stroke: #1d1d19;
    stroke-width: 0.28;
  }

  .hour-scale text {
    fill: #1d1d19;
    font: 400 2.75px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    fill: #fff;
    font-family: Inter, sans-serif;
    font-size: 2.75px;
    font-weight: 400;
    text-anchor: middle;
    dominant-baseline: central;
    font-variant-numeric: tabular-nums;
    font-variant-numeric: lining-nums tabular-nums;
    font-feature-settings: 'lnum' 1, 'tnum' 1;
  }

  .minute-hand,
  .day-hand {
    stroke: #1d1d19;
    stroke-linecap: round;
    stroke: #fff;
    stroke-linecap: butt;
  }

  .minute-hand {
    stroke-width: 0.52;
    opacity: 0.52;
    stroke-width: 1;
    opacity: 0.5;
  }

  .day-hand {
    stroke-width: 1.05;
    stroke-width: 2;
  }

  .pin {
    fill: #1d1d19;
  }
</style>