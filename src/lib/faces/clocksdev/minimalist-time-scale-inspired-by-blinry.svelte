<script>
  let { time } = $props();

  const center = 250;
  const radius = 240;
  const hand_length = 240;
  const zoom = 3.5;

  let containerWidth = $state(500);
  let containerHeight = $state(500);
  
  let hh = $derived(Number(time.hh));
  let mm = $derived(Number(time.mm));
  let ss = $derived(Number(time.ss));

  let totalHours = $derived((hh % 12) + mm / 60 + ss / 3600);
  let rotationAngle = $derived(totalHours * 30); 

  let angleRad = $derived(((rotationAngle - 90) * Math.PI) / 180);
  let handTipX = $derived(center + (hand_length - 20) * Math.cos(angleRad));
  let handTipY = $derived(center + (hand_length - 20) * Math.sin(angleRad));

  let screenAspect = $derived(containerWidth / containerHeight || 1);
  let viewSize = $derived(500 / zoom);
  let viewWidth = $derived(screenAspect >= 1 ? viewSize * screenAspect : viewSize);
  let viewHeight = $derived(screenAspect >= 1 ? viewSize : viewSize / screenAspect);
  let viewBoxX = $derived(handTipX - viewWidth / 2);
  let viewBoxY = $derived(handTipY - viewHeight / 2);

  const hoursList = Array.from({ length: 12 }, (_, h) => {
    const angle = ((h * 30 - 90) * Math.PI) / 180;
    return {
      label: h === 0 ? 12 : h,
      x: center + (radius - 45) * Math.cos(angle),
      y: center + (radius - 45) * Math.sin(angle)
    };
  });

  const TICKS_PER_HOUR = 12;
  const ticksList = Array.from({ length: 12 * TICKS_PER_HOUR }, (_, idx) => {
    const h = Math.floor(idx / TICKS_PER_HOUR);
    const i = idx % TICKS_PER_HOUR;
    const angle = ((h * 30 + i * 2.5 - 90) * Math.PI) / 180;

    let tickLength = 10;
    let tickClass = "minor";
    if (i === 0) {
      tickLength = 28;
      tickClass = "major";
    } else if (i === 3 || i === 6 || i === 9) {
      tickLength = 18;
      tickClass = "medium";
    }

    return {
      x1: center + radius * Math.cos(angle),
      y1: center + radius * Math.sin(angle),
      x2: center + (radius - tickLength) * Math.cos(angle),
      y2: center + (radius - tickLength) * Math.sin(angle),
      class: `tick ${tickClass}`
    };
  });
</script>

<div class="watch-container" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
  <svg viewBox="{viewBoxX} {viewBoxY} {viewWidth} {viewHeight}" preserveAspectRatio="none">
    <circle cx={center} cy={center} r="245" class="dial-bg" />

    <g>
      {#each ticksList as tick}
        <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} class={tick.class} />
      {/each}
    </g>

    <g>
      {#each hoursList as hr}
        <text x={hr.x} y={hr.y} class="hour-text">{hr.label}</text>
      {/each}
    </g>

    <line
      class="hand"
      x1={center}
      y1="390"
      x2={center}
      y2="-350"
      transform="rotate({rotationAngle}, {center}, {center})"
    />
  </svg>
</div>

<style>
  .watch-container {
    width: 100%;
    height: 100%;
    min-height: 100%;
    background-color: #000;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .dial-bg {
    fill: #000;
  }
  .hand {
    stroke: #ff7043;
    stroke-width: 3;
    stroke-linecap: round;
  }
  .tick {
    stroke-linecap: round;
  }
  .tick.major {
    stroke-width: 2.5;
    stroke: #e0e0e0;
  }
  .tick.medium {
    stroke-width: 1.5;
    stroke: #cfcfcf;
  }
  .tick.minor {
    stroke-width: 0.8;
    stroke: #8a8a8a;
  }
  .hour-text {
    fill: #f2f2f2;
    font-size: 34px;
    font-weight: 400;
    text-anchor: middle;
    dominant-baseline: central;
  }
</style>