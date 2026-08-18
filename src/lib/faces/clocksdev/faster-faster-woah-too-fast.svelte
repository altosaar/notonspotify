<script>
  let { time = null } = $props();

  const digitPoints = {
    "0": [
      [30, 6], [14, 6], [6, 18], [6, 82], [14, 94],
      [46, 94], [54, 82], [54, 18], [46, 6], [30, 6]
    ],
    "1": [
      [14, 22], [30, 6], [30, 94], [14, 94], [47, 94]
    ],
    "2": [
      [7, 20], [16, 7], [44, 7], [54, 18], [54, 38],
      [7, 92], [55, 92]
    ],
    "3": [
      [7, 9], [44, 9], [54, 19], [54, 39], [43, 50],
      [54, 61], [54, 82], [44, 93], [7, 93]
    ],
    "4": [
      [47, 94], [47, 7], [7, 62], [57, 62]
    ],
    "5": [
      [55, 8], [7, 8], [7, 48], [42, 48], [54, 60],
      [54, 82], [44, 93], [7, 93]
    ],
    "6": [
      [52, 11], [40, 6], [18, 6], [6, 20], [6, 80],
      [18, 94], [42, 94], [54, 82], [54, 62], [43, 50], [6, 50]
    ],
    "7": [
      [6, 8], [55, 8], [20, 94]
    ],
    "8": [
      [30, 50], [13, 42], [6, 26], [14, 8], [45, 8],
      [54, 26], [47, 42], [30, 50], [13, 58], [6, 76],
      [14, 93], [45, 93], [54, 76], [47, 58], [30, 50]
    ],
    "9": [
      [53, 50], [18, 50], [6, 39], [6, 18], [18, 6],
      [42, 6], [54, 18], [54, 81], [43, 94], [18, 94]
    ]
  };

  const trailFraction = 0.9;
  const slotWidth = 82;

  // --- Hue ---
  // Oscillation period shrinks from 60s at the start of the minute
  // to 1s at the top of the minute, so the color flickers fast right
  // before rollover, then relaxes.
  const huePeriodMaxS = 60;
  const huePeriodMinS = 1;
  const hueCenter = 265;
  const hueSpread = 85;

  // --- Sweep ---
  // Tracing speed builds across the minute: one leg takes sweepMsMax
  // at the start of the minute and accelerates to sweepMsMin at the
  // top of the minute, then relaxes back. The leg count is snapped to
  // an even integer so the ping-pong phase is continuous across the
  // minute rollover.
  const sweepMsMin = 80;
  const sweepMsMax = 1000;
  const slotPhaseOffset = 0.16;

  const legsPerMinute =
    2 *
    Math.round(
      ((60000 / (sweepMsMax - sweepMsMin)) *
        Math.log(sweepMsMax / sweepMsMin)) /
        2
    );

  // --- Weight ---
  // Strokes build from narrow to really bold across each minute,
  // peaking at the top of the minute, then snapping back.
  const weightMin = 0.5;
  const weightMax = 2.4;
  const weightEase = 2; // higher = boldness piles up near the end

  function buildPath(points) {
    const segmentLengths = [];
    let totalLength = 0;

    for (let index = 1; index < points.length; index += 1) {
      const [x1, y1] = points[index - 1];
      const [x2, y2] = points[index];
      const length = Math.hypot(x2 - x1, y2 - y1);
      segmentLengths.push(length);
      totalLength += length;
    }

    return {
      points,
      segmentLengths,
      totalLength,
      d: points
        .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
        .join(" ")
    };
  }

  const digitPaths = Object.fromEntries(
    Object.entries(digitPoints).map(([digit, points]) => [digit, buildPath(points)])
  );

  const characters = $derived(
    time
      ? [...String(time.hour12), ":", ...time.mm, ":", ...time.ss]
      : []
  );

  const viewBoxWidth = $derived(Math.max(1, characters.length) * slotWidth);

  // Chirped hue: the phase is the integral of 1/period(t) across the
  // minute, so the instantaneous period really is 60s -> 1s without
  // the jitter you'd get from plugging a moving period into sin(t/p).
  const hue = $derived.by(() => {
    if (!time) return hueCenter;
    const period =
      huePeriodMaxS - (huePeriodMaxS - huePeriodMinS) * time.progress.minute;
    const cycles =
      (huePeriodMaxS / (huePeriodMaxS - huePeriodMinS)) *
      Math.log(huePeriodMaxS / period);
    return hueCenter + hueSpread * Math.sin(cycles * Math.PI * 2);
  });

  const weight = $derived(
    time
      ? weightMin +
          (weightMax - weightMin) * Math.pow(time.progress.minute, weightEase)
      : 1
  );

  // Chirped sweep across the minute: phase is the integral of
  // 1/sweep(t), so the tracer genuinely moves at sweepMsMax per leg
  // early in the minute and sweepMsMin per leg at the top, smoothly
  // accelerating in between. No per-second events at all.
  function sweepPhase(slot) {
    const current =
      sweepMsMax - (sweepMsMax - sweepMsMin) * time.progress.minute;
    const legs =
      legsPerMinute *
      (Math.log(sweepMsMax / current) / Math.log(sweepMsMax / sweepMsMin));
    return legs + slot * slotPhaseOffset;
  }

  function motionState(slot) {
    const value = sweepPhase(slot);
    const wrapped = ((value % 2) + 2) % 2;
    const forward = wrapped <= 1;

    return {
      phase: forward ? wrapped : 2 - wrapped,
      forward
    };
  }

  function pointOnDigit(digit, slot) {
    const path = digitPaths[digit];
    const phase = motionState(slot).phase;
    const targetLength = phase * path.totalLength;
    let travelled = 0;

    for (let index = 0; index < path.segmentLengths.length; index += 1) {
      const segmentLength = path.segmentLengths[index];

      if (travelled + segmentLength >= targetLength) {
        const [x1, y1] = path.points[index];
        const [x2, y2] = path.points[index + 1];
        const localProgress = segmentLength === 0
          ? 0
          : (targetLength - travelled) / segmentLength;

        return {
          x: x1 + (x2 - x1) * localProgress,
          y: y1 + (y2 - y1) * localProgress
        };
      }

      travelled += segmentLength;
    }

    const [x, y] = path.points[path.points.length - 1];
    return { x, y };
  }

  function dotTransform(digit, slot) {
    const point = pointOnDigit(digit, slot);
    return `translate(${point.x} ${point.y})`;
  }

  // Trail = the last trailFraction of the dot's actual trajectory,
  // folded at the ping-pong turnarounds. The old version collapsed
  // the trail to zero length at every direction reversal, which
  // flashed -- and since reversals cluster right after each tick
  // (when the sweep is fastest), it read as a flicker spike every
  // second. Folding the history keeps the trail's visible length
  // continuous through reversals.
  function trailMetrics(slot) {
    const { phase, forward } = motionState(slot);
    const L = trailFraction;

    if (forward) {
      if (phase >= L) {
        return { start: phase - L, length: L };
      }
      // Part of the history is on the previous (backward) leg,
      // folded at 0.
      const end = Math.max(phase, L - phase);
      return { start: 0, length: Math.max(0.001, end) };
    }

    if (phase + L <= 1) {
      return { start: phase, length: L };
    }
    // Part of the history is on the previous (forward) leg,
    // folded at 1.
    const start = Math.min(phase, 2 - phase - L);
    return { start, length: Math.max(0.001, 1 - start) };
  }

  function trailDashArray(slot) {
    const length = trailMetrics(slot).length;
    return `${length} ${1 - length}`;
  }

  function trailDashOffset(slot) {
    return `${-trailMetrics(slot).start}`;
  }

  function colonOpacity() {
    return 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(time.timestamp / 150));
  }
</script>

{#if time}
  <div
    class="clock"
    style={`--hue: ${hue}; --bold: ${weight};`}
    aria-label={`${time.hour12}:${time.mm}:${time.ss} ${time.ampm}`}
  >
    <div class="face">
      <svg
        viewBox={`0 0 ${viewBoxWidth} 110`}
        style={`aspect-ratio: ${viewBoxWidth} / 110;`}
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="path-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7.2" />
          </filter>

          <filter id="trail-glow" x="-180%" y="-180%" width="460%" height="460%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8.5" result="wide" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="middle" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="tight" />
            <feMerge>
              <feMergeNode in="wide" />
              <feMergeNode in="middle" />
              <feMergeNode in="tight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="dot-glow" x="-350%" y="-350%" width="800%" height="800%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8.2" result="wide" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="tight" />
            <feMerge>
              <feMergeNode in="wide" />
              <feMergeNode in="tight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {#each characters as character, slot}
          <g transform={`translate(${slot * slotWidth + 11}, 5)`}>
            {#if character === ":"}
              <g class="colon" opacity={colonOpacity()}>
                <circle cx="30" cy="37" r={2.5 * weight} />
                <circle cx="30" cy="65" r={2.5 * weight} />
              </g>
            {:else}
              <path
                class="afterimage"
                d={digitPaths[character].d}
                pathLength="1"
              />

              <path
                class="motion-trail"
                d={digitPaths[character].d}
                pathLength="1"
                stroke-dasharray={trailDashArray(slot)}
                stroke-dashoffset={trailDashOffset(slot)}
                filter="url(#trail-glow)"
              />

              <circle
                class="tracer"
                r={3 * weight}
                transform={dotTransform(character, slot)}
                filter="url(#dot-glow)"
              />
            {/if}
          </g>
        {/each}
      </svg>
    </div>
  </div>
{/if}

<style>
  .clock,
  .clock * {
    box-sizing: border-box;
  }

  .clock {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(20px, 5vh, 56px);
    padding: clamp(18px, 4vw, 48px);
    overflow: hidden;
    color: hsl(var(--hue) 100% 55%);
    background:
      radial-gradient(
        circle at 50% 50%,
        hsl(var(--hue) 100% 50% / 0.06),
        transparent 40%
      ),
      #000;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }

  .face {
    position: relative;
    width: min(92%, 1180px);
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 60vh;
    margin: 0 auto;
    overflow: visible;
  }

  .afterimage {
    fill: none;
    stroke: hsl(var(--hue) 100% 52%);
    stroke-width: calc(3.1px * var(--bold));
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.34;
    filter: url(#path-glow);
  }

  .motion-trail {
    fill: none;
    stroke: hsl(var(--hue) 100% 56%);
    stroke-width: calc(5.2px * var(--bold));
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.9;
  }

  .tracer,
  .colon circle {
    fill: hsl(var(--hue) 100% 62%);
  }

  .colon {
    filter: url(#dot-glow);
  }

  @media (prefers-reduced-motion: reduce) {
    .afterimage {
      opacity: 0.72;
    }

    .motion-trail,
    .tracer {
      display: none;
    }
  }
</style>