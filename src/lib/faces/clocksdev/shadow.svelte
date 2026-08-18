<script>
  export let time

  const centerX = 50
  const centerY = 50
  const shadowScale = 1.38

  $: hourAngle = ((time.hour % 12) + time.minute / 60 + time.second / 3600) * Math.PI / 6
  $: minuteAngle = (time.minute + time.second / 60 + time.millisecond / 60000) * Math.PI / 30
  $: secondAngle = (time.second + time.millisecond / 1000) * Math.PI / 30

  $: lightX = centerX + Math.sin(secondAngle) * 43
  $: lightY = centerY - Math.cos(secondAngle) * 43
  $: secondStartX = centerX - Math.sin(secondAngle) * 4
  $: secondStartY = centerY + Math.cos(secondAngle) * 4

  $: hourStartX = centerX - Math.sin(hourAngle) * 2.5
  $: hourStartY = centerY + Math.cos(hourAngle) * 2.5
  $: hourEndX = centerX + Math.sin(hourAngle) * 25
  $: hourEndY = centerY - Math.cos(hourAngle) * 25

  $: minuteStartX = centerX - Math.sin(minuteAngle) * 2.5
  $: minuteStartY = centerY + Math.cos(minuteAngle) * 2.5
  $: minuteEndX = centerX + Math.sin(minuteAngle) * 38
  $: minuteEndY = centerY - Math.cos(minuteAngle) * 38

  $: hourShadowStartX = lightX + (hourStartX - lightX) * shadowScale
  $: hourShadowStartY = lightY + (hourStartY - lightY) * shadowScale
  $: hourShadowEndX = lightX + (hourEndX - lightX) * shadowScale
  $: hourShadowEndY = lightY + (hourEndY - lightY) * shadowScale

  $: minuteShadowStartX = lightX + (minuteStartX - lightX) * shadowScale
  $: minuteShadowStartY = lightY + (minuteStartY - lightY) * shadowScale
  $: minuteShadowEndX = lightX + (minuteEndX - lightX) * shadowScale
  $: minuteShadowEndY = lightY + (minuteEndY - lightY) * shadowScale
</script>

<div
  class="clock"
  style:--light-x={`${lightX}%`}
  style:--light-y={`${lightY}%`}
  role="img"
  aria-label={`Clock showing ${time.hh}:${time.mm}:${time.ss}`}
>
  <div class="light"></div>

  <svg viewBox="0 0 100 100" aria-hidden="true">
    <g class="shadows">
      <line class="shadow soft" x1={hourShadowStartX} y1={hourShadowStartY} x2={hourShadowEndX} y2={hourShadowEndY} />
      <line class="shadow soft" x1={minuteShadowStartX} y1={minuteShadowStartY} x2={minuteShadowEndX} y2={minuteShadowEndY} />
      <line class="shadow core" x1={hourShadowStartX} y1={hourShadowStartY} x2={hourShadowEndX} y2={hourShadowEndY} />
      <line class="shadow core" x1={minuteShadowStartX} y1={minuteShadowStartY} x2={minuteShadowEndX} y2={minuteShadowEndY} />
    </g>

    <line class="hand" x1={hourStartX} y1={hourStartY} x2={hourEndX} y2={hourEndY} />
    <line class="hand" x1={minuteStartX} y1={minuteStartY} x2={minuteEndX} y2={minuteEndY} />
    <line class="seconds" x1={secondStartX} y1={secondStartY} x2={lightX} y2={lightY} />
  </svg>
</div>

<style>
  .clock {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #565656;
    isolation: isolate;
  }

  .light {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--light-x) var(--light-y),
      rgb(255 255 245 / 14%),
      rgb(255 255 245 / 6%) 12%,
      transparent 38%
    );
  }

  svg {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    shape-rendering: geometricPrecision;
  }

  line {
    fill: none;
    stroke-linecap: butt;
  }

  .shadow {
    stroke: #111;
    stroke-width: 5.52;
    vector-effect: non-scaling-stroke;
  }

  .shadow.soft {
    opacity: 0.34;
    filter: blur(3px);
  }

  .shadow.core {
    opacity: 0.22;
    filter: blur(1px);
  }

  .hand {
    stroke: #050505;
    stroke-width: 4;
    vector-effect: non-scaling-stroke;
  }

  .seconds {
    stroke: #fffef7;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
</style>
