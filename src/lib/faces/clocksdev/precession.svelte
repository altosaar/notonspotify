<script>
  let { time } = $props();

  const TAU = Math.PI * 2;
  const HALF_PI = Math.PI / 2;
  const MODE = "relative";

  const origin = { x: 0, y: 0 };

  const lengths = {
    hour: 11,
    minute: 17,
    second: 27
  };

  function endpoint(start, length, angle) {
    return {
      x: start.x + Math.cos(angle) * length,
      y: start.y + Math.sin(angle) * length
    };
  }

  let hours = $derived(Number(time.hh) % 12);
  let minutes = $derived(Number(time.mm));
  let seconds = $derived(Number(time.ss));

  let hourText = $derived(
    String(time.hh).padStart(2, "0")
  );

  let minuteText = $derived(
    String(time.mm).padStart(2, "0")
  );

  let secondText = $derived(
    String(time.ss).padStart(2, "0")
  );

  let hourPhase = $derived(
    TAU * (hours + minutes / 60 + seconds / 3600) / 12
  );

  let minutePhase = $derived(
    TAU * (minutes + seconds / 60) / 60
  );

  let secondPhase = $derived(
    TAU * seconds / 60
  );

  /*
    Chain order:
    hour → minute → second
  */

  let hourAngle = $derived(
    hourPhase - HALF_PI
  );

  let minuteAngle = $derived(
    MODE === "relative"
      ? hourAngle + minutePhase
      : minutePhase - HALF_PI
  );

  let secondAngle = $derived(
    MODE === "relative"
      ? minuteAngle + secondPhase
      : secondPhase - HALF_PI
  );

  let hourEnd = $derived(
    endpoint(origin, lengths.hour, hourAngle)
  );

  let minuteEnd = $derived(
    endpoint(hourEnd, lengths.minute, minuteAngle)
  );

  let secondEnd = $derived(
    endpoint(minuteEnd, lengths.second, secondAngle)
  );
</script>

<div class="clock">
  <svg
    viewBox="-60 -60 120 120"
    preserveAspectRatio="xMidYMid meet"
    aria-label={`Vector clock showing ${time.hh}:${time.mm}:${time.ss}`}
  >
    <g class="orbits">
      <circle
        cx={origin.x}
        cy={origin.y}
        r={lengths.hour}
      />

      <circle
        cx={hourEnd.x}
        cy={hourEnd.y}
        r={lengths.minute}
      />

      <circle
        cx={minuteEnd.x}
        cy={minuteEnd.y}
        r={lengths.second}
      />
    </g>

    <!-- Values remain at the ends of their arms -->
    <g class="values" aria-hidden="true">
      <text
        class="value hour-value"
        x={hourEnd.x}
        y={hourEnd.y}
      >
        {hourText}
      </text>

      <text
        class="value minute-value"
        x={minuteEnd.x}
        y={minuteEnd.y}
      >
        {minuteText}
      </text>

      <text
        class="value second-value"
        x={secondEnd.x}
        y={secondEnd.y}
      >
        {secondText}
      </text>
    </g>

    <g class="vectors">
      <line
        class="vector hour"
        x1={origin.x}
        y1={origin.y}
        x2={hourEnd.x}
        y2={hourEnd.y}
      />

      <line
        class="vector minute"
        x1={hourEnd.x}
        y1={hourEnd.y}
        x2={minuteEnd.x}
        y2={minuteEnd.y}
      />

      <line
        class="vector second"
        x1={minuteEnd.x}
        y1={minuteEnd.y}
        x2={secondEnd.x}
        y2={secondEnd.y}
      />
    </g>

    <g class="joints">
      <circle
        class="joint origin"
        cx={origin.x}
        cy={origin.y}
        r="1.7"
      />

      <circle
        class="joint hour"
        cx={hourEnd.x}
        cy={hourEnd.y}
        r="1.4"
      />

      <circle
        class="joint minute"
        cx={minuteEnd.x}
        cy={minuteEnd.y}
        r="1.2"
      />

      <circle
        class="joint second"
        cx={secondEnd.x}
        cy={secondEnd.y}
        r="1.5"
      />
    </g>

    <text
      class="time"
      x="0"
      y="56"
      text-anchor="middle"
    >
      {time.hh}:{time.mm}:{time.ss}
    </text>
  </svg>
</div>

<style>
  .clock {
    display: grid;
    place-content: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    background:
      radial-gradient(
        circle at center,
        #17202a 0%,
        #080a0d 65%
      );
    color: white;
  }

  svg {
    width: min(92vmin, 100%);
    height: min(92vmin, 100%);
    overflow: visible;
  }

  .orbits circle {
    fill: none;
    stroke: rgba(255, 255, 255, 0.12);
    stroke-width: 0.45;
    stroke-dasharray: 1 2.4;
    vector-effect: non-scaling-stroke;
  }

  .values {
    pointer-events: none;
    user-select: none;
  }

  .value {
    fill: white;
    font-family: Inter, sans-serif;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.09em;
    text-anchor: middle;
    dominant-baseline: central;
  }

  .hour-value {
    font-size: 12px;
    opacity: 0.12;
  }

  .minute-value {
    font-size: 14px;
    opacity: 0.085;
  }

  .second-value {
    font-size: 16px;
    opacity: 0.055;
  }

  .vector {
    fill: none;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  .vector.hour {
    stroke: rgba(255, 255, 255, 0.96);
    stroke-width: 2.6;
  }

  .vector.minute {
    stroke: rgba(255, 255, 255, 0.7);
    stroke-width: 1.65;
  }

  .vector.second {
    stroke: #72e7ff;
    stroke-width: 0.9;
    filter: drop-shadow(0 0 1.5px #72e7ff);
  }

  .joint {
    vector-effect: non-scaling-stroke;
  }

  .joint.origin {
    fill: #080a0d;
    stroke: white;
    stroke-width: 0.8;
  }

  .joint.hour,
  .joint.minute {
    fill: #080a0d;
    stroke: rgba(255, 255, 255, 0.75);
    stroke-width: 0.65;
  }

  .joint.second {
    fill: #72e7ff;
    stroke: #d8faff;
    stroke-width: 0.5;
    filter: drop-shadow(0 0 2px #72e7ff);
  }

  .time {
    fill: rgba(255, 255, 255, 0.35);
    font: 400 3px/1 Inter, sans-serif;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.12em;
  }
</style>