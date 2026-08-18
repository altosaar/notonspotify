<script>
  export let time

  $: hourProgress = ((time.hour % 12) + time.minute / 60 + time.second / 3600) / 12
  $: minuteProgress = (time.minute + time.second / 60 + time.millisecond / 60000) / 60
  $: secondProgress = (time.second + time.millisecond / 1000) / 60

  function pointOnSide(start, end, progress) {
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
    }
  }

  const apex = { x: 50, y: 17 }
  const left = { x: 17, y: 75 }
  const right = { x: 83, y: 75 }

  $: hourTip = pointOnSide(apex, left, hourProgress)
  $: minuteTip = pointOnSide(left, right, minuteProgress)
  $: secondTip = pointOnSide(right, apex, secondProgress)
</script>

<div class="triad-clock">
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label={`Triangular clock showing ${time.hh}:${time.mm}:${time.ss}`}
  >
    <defs>
      <linearGradient id="triad-hours" gradientUnits="userSpaceOnUse" x1="50" y1="17" x2="17" y2="75">
        <stop offset="0" stop-color="#f1ffad" />
        <stop offset="1" stop-color="#ff755f" />
      </linearGradient>
      <linearGradient id="triad-minutes" gradientUnits="userSpaceOnUse" x1="17" y1="75" x2="83" y2="75">
        <stop offset="0" stop-color="#ff755f" />
        <stop offset="1" stop-color="#a86dff" />
      </linearGradient>
      <linearGradient id="triad-seconds" gradientUnits="userSpaceOnUse" x1="83" y1="75" x2="50" y2="17">
        <stop offset="0" stop-color="#a86dff" />
        <stop offset="0.52" stop-color="#64dfff" />
        <stop offset="1" stop-color="#f1ffad" />
      </linearGradient>
    </defs>

    <g class="tracks" aria-hidden="true">
      <line x1={apex.x} y1={apex.y} x2={left.x} y2={left.y} />
      <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} />
      <line x1={right.x} y1={right.y} x2={apex.x} y2={apex.y} />
    </g>

    <g class="progress" aria-hidden="true">
      <line
        class="hours"
        x1={apex.x} y1={apex.y} x2={left.x} y2={left.y}
        pathLength="1"
        stroke-dasharray={`${hourProgress} 1`}
      />
      <line
        class="minutes"
        x1={left.x} y1={left.y} x2={right.x} y2={right.y}
        pathLength="1"
        stroke-dasharray={`${minuteProgress} 1`}
      />
      <line
        class="seconds"
        x1={right.x} y1={right.y} x2={apex.x} y2={apex.y}
        pathLength="1"
        stroke-dasharray={`${secondProgress} 1`}
      />
    </g>

    <g class="tips" aria-hidden="true">
      <circle class="hour-tip" cx={hourTip.x} cy={hourTip.y} r="1.35" />
      <circle class="minute-tip" cx={minuteTip.x} cy={minuteTip.y} r="1" />
      <circle class="second-tip" cx={secondTip.x} cy={secondTip.y} r="0.72" />
    </g>

    <g class="values">
      <text class="hour-value" x="50" y="10.5" text-anchor="middle">{time.hh12}</text>
      <text x="10.5" y="82.5" text-anchor="middle">{time.mm}</text>
      <text x="89.5" y="82.5" text-anchor="middle">{time.ss}</text>
    </g>
  </svg>
</div>

<style>
  .triad-clock {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    background: #050505;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .tracks line {
    stroke: rgb(255 255 255 / 11%);
    stroke-width: 0.42;
  }

  .progress line {
    stroke-linecap: round;
  }

  .hours {
    stroke: url(#triad-hours);
    stroke-width: 2.5;
  }

  .minutes {
    stroke: url(#triad-minutes);
    stroke-width: 1.7;
  }

  .seconds {
    stroke: url(#triad-seconds);
    stroke-width: 0.9;
  }

  .tips circle {
    filter: drop-shadow(0 0 1.7px currentColor);
  }

  .hour-tip {
    color: #ff8b67;
    fill: currentColor;
  }

  .minute-tip {
    color: #d076d5;
    fill: currentColor;
  }

  .second-tip {
    color: #83e6f3;
    fill: currentColor;
  }

  .values {
    fill: rgb(255 255 255 / 45%);
    font: 400 3.4px/1 ui-monospace, 'SFMono-Regular', Menlo, monospace;
    letter-spacing: 0.08em;
  }

  .values .hour-value {
    font-size: 4.2px;
    fill: rgb(255 255 255 / 68%);
  }
</style>
