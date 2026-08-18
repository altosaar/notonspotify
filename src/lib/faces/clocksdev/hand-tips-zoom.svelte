<script>
  export let time

  const ticks = Array.from({ length: 60 }, (_, index) => ({
    angle: index * 6,
    major: index % 5 === 0,
    cardinal: index % 15 === 0,
    // Store actual hours (1 to 12) for rendering numbers later
    number: index % 5 === 0 ? (index / 5 === 0 ? 12 : index / 5) : null
  }))

  $: secondAngle = (time.second + time.millisecond / 1000) * 6
  $: minuteAngle = (time.minute + time.second / 60 + time.millisecond / 60000) * 6
  $: hourAngle = ((time.hour % 12) + time.minute / 60 + time.second / 3600) * 30

  // 1. Hour hand tracking calculations (Pivot 52.3 to 32.2)
  const hourLength = 20.1
  $: hourRad = (hourAngle * Math.PI) / 180
  $: hourX = -hourLength * Math.sin(hourRad)
  $: hourY = hourLength * Math.cos(hourRad)

  // 2. Minute hand tracking calculations (Pivot 52.3 to 21.5)
  const minuteLength = 30.8
  $: minuteRad = (minuteAngle * Math.PI) / 180
  $: minuteX = -minuteLength * Math.sin(minuteRad)
  $: minuteY = minuteLength * Math.cos(minuteRad)

  // 3. Second hand tracking calculations (Pivot 52.3 to 20.7)
  const secondLength = 31.6
  $: secondRad = (secondAngle * Math.PI) / 180
  $: secondX = -secondLength * Math.sin(secondRad)
  $: secondY = secondLength * Math.cos(secondRad)
</script>

<div
  class="precision-dial-clock"
  role="img"
  aria-label="Triple zoomed analog clock"
>
  <svg viewBox="37.18 32.15 34.65 35.7" aria-hidden="true">
    
    <g class="layer-hour" transform={`translate(${hourX}, ${-2.3 + hourY})`}>
      <circle class="dial-ring" cx="54.5" cy="52.3" r="38.8" />
      
      <g class="ticks">
        {#each ticks as tick}
          <line
            class:major={tick.major}
            class:cardinal={tick.cardinal}
            x1="54.5"
            y1={tick.cardinal ? 13.5 : tick.major ? 14.3 : 14.5}
            x2="54.5"
            y2={tick.cardinal ? 20.7 : tick.major ? 20.4 : 17.2}
            transform={`rotate(${tick.angle} 54.5 52.3)`}
          />
          {#if tick.number !== null}
            <text
              class="clock-number"
              x="54.5"
              y="26"
              text-anchor="middle"
              transform={`rotate(${tick.angle} 54.5 52.3) rotate(${-tick.angle} 54.5 25)`}
            >
              {tick.number}
            </text>
          {/if}
        {/each}
      </g>
      <circle class="pin" cx="54.5" cy="52.3" r="1.65" />
      <circle class="pin-center" cx="54.5" cy="52.3" r="0.42" />
      <g class="second-hand" transform={`rotate(${secondAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="57" x2="54.5" y2="20.7" />
      </g>
      <g class="minute-hand" transform={`rotate(${minuteAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="52.3" x2="54.5" y2="21.5" />
      </g>
      <g class="hour-hand" transform={`rotate(${hourAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="52.3" x2="54.5" y2="32.2" />
      </g>
    </g>

    <g class="layer-minute" transform={`translate(${minuteX}, ${-2.3 + minuteY})`}>
      <circle class="dial-ring" cx="54.5" cy="52.3" r="38.8" />

      <g class="ticks">
        {#each ticks as tick}
          <line
            class:major={tick.major}
            class:cardinal={tick.cardinal}
            x1="54.5"
            y1={tick.cardinal ? 13.5 : tick.major ? 14.3 : 14.5}
            x2="54.5"
            y2={tick.cardinal ? 20.7 : tick.major ? 20.4 : 17.2}
            transform={`rotate(${tick.angle} 54.5 52.3)`}
          />
          {#if tick.number !== null}
            <text
              class="clock-number"
              x="54.5"
              y="26"
              text-anchor="middle"
              transform={`rotate(${tick.angle} 54.5 52.3) rotate(${-tick.angle} 54.5 25)`}
            >
              {tick.number}
            </text>
          {/if}
        {/each}
      </g>
      <circle class="pin" cx="54.5" cy="52.3" r="1.65" />
      <circle class="pin-center" cx="54.5" cy="52.3" r="0.42" />
      <g class="second-hand" transform={`rotate(${secondAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="57" x2="54.5" y2="20.7" />
      </g>
      <g class="minute-hand" transform={`rotate(${minuteAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="52.3" x2="54.5" y2="21.5" />
      </g>
      <g class="hour-hand" transform={`rotate(${hourAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="52.3" x2="54.5" y2="32.2" />
      </g>
    </g>

    <g class="layer-second" transform={`translate(${secondX}, ${-2.3 + secondY})`}>
      <circle class="dial-ring" cx="54.5" cy="52.3" r="38.8" />

      <g class="ticks">
        {#each ticks as tick}
          <line
            class:major={tick.major}
            class:cardinal={tick.cardinal}
            x1="54.5"
            y1={tick.cardinal ? 13.5 : tick.major ? 14.3 : 14.5}
            x2="54.5"
            y2={tick.cardinal ? 20.7 : tick.major ? 20.4 : 17.2}
            transform={`rotate(${tick.angle} 54.5 52.3)`}
          />
          {#if tick.number !== null}
            <text
              class="clock-number"
              x="54.5"
              y="26"
              text-anchor="middle"
              transform={`rotate(${tick.angle} 54.5 52.3) rotate(${-tick.angle} 54.5 25)`}
            >
              {tick.number}
            </text>
          {/if}
        {/each}
      </g>
      <circle class="pin" cx="54.5" cy="52.3" r="1.65" />
      <circle class="pin-center" cx="54.5" cy="52.3" r="0.42" />
      <g class="second-hand" transform={`rotate(${secondAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="57" x2="54.5" y2="20.7" />
      </g>
      <g class="minute-hand" transform={`rotate(${minuteAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="52.3" x2="54.5" y2="21.5" />
      </g>
      <g class="hour-hand" transform={`rotate(${hourAngle} 54.5 52.3)`}>
        <line x1="54.5" y1="52.3" x2="54.5" y2="32.2" />
      </g>
    </g>

  </svg>
</div>

<style>
  .precision-dial-clock {
    position: absolute;
    inset: 0;
    display: grid;
    overflow: hidden;
    border-radius: inherit;
    background: #000;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* Blending mode to let overlapping colors mix cleanly */
  .layer-hour,
  .layer-minute,
  .layer-second {
    mix-blend-mode: screen;
  }

  /* Dial outer ring common style */
  .dial-ring {
    fill: none;
  }

  /* Common Line & Text Styles */
  .ticks line {
    stroke-linecap: round;
  }
  .second-hand line,
  .minute-hand line,
  .hour-hand line {
    stroke-linecap: round;
  }
  .clock-number {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 3.5px;
    font-weight: 600;
    dominant-baseline: central;
  }

  /* =========================================================================
     1. HOUR LAYER (WHITE)
     ========================================================================= */
  .layer-hour .dial-ring {
    stroke: #ffffff;
    stroke-width: 0.34;
  }
  .layer-hour .ticks line {
    stroke: rgba(255, 255, 255, 0.4);
    stroke-width: 0.2;
  }
  .layer-hour .ticks .major {
    stroke: #ffffff;
    stroke-width: 0.34;
  }
  .layer-hour .ticks .cardinal {
    stroke-width: 0.38;
  }
  .layer-hour .clock-number {
    fill: #ffffff;
  }
  .layer-hour .second-hand line {
    stroke: rgba(255, 255, 255, 0.7);
    stroke-width: 0.28;
  }
  .layer-hour .minute-hand line {
    stroke: #ffffff;
    stroke-width: 0.9;
  }
  .layer-hour .hour-hand line {
    stroke: #ffffff;
    stroke-width: 1.48;
  }
  .layer-hour .pin {
    fill: #ffffff;
  }
  .layer-hour .pin-center {
    fill: #000000;
  }

  /* =========================================================================
     2. MINUTE LAYER (BLUE)
     ========================================================================= */
  .layer-minute .dial-ring {
    stroke: #00a2ff;
    stroke-width: 0.34;
  }
  .layer-minute .ticks line {
    stroke: rgba(0, 162, 255, 0.4);
    stroke-width: 0.2;
  }
  .layer-minute .ticks .major {
    stroke: #00a2ff;
    stroke-width: 0.34;
  }
  .layer-minute .ticks .cardinal {
    stroke-width: 0.38;
  }
  .layer-minute .clock-number {
    fill: #00a2ff;
  }
  .layer-minute .second-hand line {
    stroke: rgba(0, 162, 255, 0.7);
    stroke-width: 0.28;
  }
  .layer-minute .minute-hand line {
    stroke: #00a2ff;
    stroke-width: 0.9;
  }
  .layer-minute .hour-hand line {
    stroke: #00a2ff;
    stroke-width: 1.48;
  }
  .layer-minute .pin {
    fill: #00a2ff;
  }
  .layer-minute .pin-center {
    fill: #000000;
  }

  /* =========================================================================
     3. SECOND LAYER (RED)
     ========================================================================= */
  .layer-second .dial-ring {
    stroke: #ff3333;
    stroke-width: 0.34;
  }
  .layer-second .ticks line {
    stroke: rgba(255, 51, 51, 0.4);
    stroke-width: 0.2;
  }
  .layer-second .ticks .major {
    stroke: #ff3333;
    stroke-width: 0.34;
  }
  .layer-second .ticks .cardinal {
    stroke-width: 0.38;
  }
  .layer-second .clock-number {
    fill: #ff3333;
  }
  .layer-second .second-hand line {
    stroke: rgba(255, 51, 51, 0.7);
    stroke-width: 0.28;
  }
  .layer-second .minute-hand line {
    stroke: #ff3333;
    stroke-width: 0.9;
  }
  .layer-second .hour-hand line {
    stroke: #ff3333;
    stroke-width: 1.48;
  }
  .layer-second .pin {
    fill: #ff3333;
  }
  .layer-second .pin-center {
    fill: #000000;
  }
</style>