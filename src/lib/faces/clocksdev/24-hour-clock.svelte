<script>
  export let time

  const hours = Array.from({ length: 24 }, (_, index) => {
    const hour = index + 1
    const angle = ((hour - 12) / 24) * Math.PI * 2 - Math.PI / 2

    return {
      hour,
      x: 50 + Math.cos(angle) * 48.2,
      y: 50 + Math.sin(angle) * 48.2,
      tickX1: 50 + Math.cos(angle) * 41.7,
      tickY1: 50 + Math.sin(angle) * 41.7,
      tickX2: 50 + Math.cos(angle) * 42.5,
      tickY2: 50 + Math.sin(angle) * 42.5,
    }
  })

  $: minuteAngle =
    (time.minute + time.second / 60 + time.millisecond / 60000) * 6

  $: dayAngle =
    (time.hour + time.minute / 60 + time.second / 3600 - 12) * 15
</script>

<div
  class="circadian-dial-clock"
  role="img"
  aria-label={`24-hour analogue clock showing ${time.hh}:${time.mm}`}
>
  <div class="dial-wrap" aria-hidden="true">
    <svg viewBox="0 0 100 100">
      <g class="dial">
        <g class="hour-scale">
          {#each hours as mark}
            <line
              x1={mark.tickX1}
              y1={mark.tickY1}
              x2={mark.tickX2}
              y2={mark.tickY2}
            />
            <text x={mark.x} y={mark.y}>{mark.hour}</text>
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
      </g>
    </svg>
  </div>
</div>

<style>
  .circadian-dial-clock {
    position: absolute;
    inset: 00px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: inherit;
    background: #000;
  }

  .dial-wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: 89%;
    aspect-ratio: 1;
  }

  .dial-wrap::before {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 88.76%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 50%;
    background:
      radial-gradient(
        circle at 50% 40%,
        transparent 25%,
        rgb(0 0 0 / 22%) 100%
      ),
      radial-gradient(
        circle at 7% 48%,
        rgb(167 223 255 / 24%) 0 3%,
        transparent 22%
      ),
      radial-gradient(
        circle at 93% 43%,
        rgb(255 193 100 / 22%) 0 2%,
        transparent 22%
      ),
      radial-gradient(
        circle at 26% 0%,
        rgb(255 236 115 / 14%) 0 2%,
        transparent 24%
      ),
      linear-gradient(
        90deg,
        rgb(153 205 216 / 19%) 0%,
        transparent 48%,
        rgb(119 77 43 / 28%) 100%
      ),
      linear-gradient(
        180deg,
        #e8e5dc 0%,
        #a2aa98 27%,
        #73737c 47%,
        #34313d 59%,
        #041021 75%,
        #020205 100%
      );
    box-shadow:
      inset 0 0 9cqw rgb(255 255 255 / 10%),
      0 1.5cqw 5cqw rgb(0 0 0 / 52%);
    content: "";
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  svg {
    position: absolute;
    z-index: 1;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    shape-rendering: geometricPrecision;
  }

  .dial {
    color: rgba(255, 255, 255, 0.8);
    
  }

  .hour-scale line {
    stroke: currentColor;
    stroke-width: 0.28;
    mix-blend-mode: difference;
  }

  .hour-scale text {
    fill: currentColor;
    font-family: Inter, sans-serif;
    font-size: 2.75px;
    font-weight: 400;
    text-anchor: middle;
    dominant-baseline: central;
    font-variant-numeric: lining-nums tabular-nums;
    font-feature-settings: "lnum" 1, "tnum" 1;
  }

  line {
    stroke: currentColor;
    stroke-linecap: butt;
    
  }

  .minute-hand,
  .day-hand {
    mix-blend-mode: difference;
  }

  .minute-hand {
    stroke-width: 1;
    opacity: 0.5;
  }

  .day-hand {
    stroke-width: 2;
  }
</style>