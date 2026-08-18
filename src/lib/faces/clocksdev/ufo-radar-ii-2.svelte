<!-- by arthusiasm.be -->
<script>
  let { time } = $props();

  const pad = (v) => String(v).padStart(2, "0");

  let sweepAngle = $derived(
    ((time.second + time.millisecond / 1000) / 60) * 360
  );

  let secAngle = $derived((time.second / 60) * 360);
  let minAngle = $derived((time.minute / 60) * 360);
  let hrAngle  = $derived((((time.hour % 12) + time.minute / 60) / 12) * 360);

  const R = { sec: 82, min: 60, hr: 38 };

  const toXY = (angleDeg, radius, cx = 100, cy = 100) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + Math.cos(rad) * radius, y: cy + Math.sin(rad) * radius };
  };

  let secPos = $derived(toXY(secAngle, R.sec));
  let minPos = $derived(toXY(minAngle, R.min));
  let hrPos  = $derived(toXY(hrAngle, R.hr));

  const trailOffsets = [-6, -12, -18, -24];
  let secTrail = $derived(trailOffsets.map((d) => toXY(secAngle + d, R.sec)));
  let minTrail = $derived(trailOffsets.map((d) => toXY(minAngle + d * 0.4, R.min)));

  const rangeRings = [R.hr, R.min, R.sec, 100];
  const bearingLines = Array.from({ length: 12 }, (_, i) => i * 30);

  // ── UFO incursion ──────────────────────────────────────────
  const UFO_CYCLE = 9000;
  const UFO_DURATION = 1400;

  let cycleT = $derived(
    (time.hour * 3600000 + time.minute * 60000 + time.second * 1000 + time.millisecond) % UFO_CYCLE
  );
  let ufoActive = $derived(cycleT < UFO_DURATION);
  let ufoProgress = $derived(Math.min(cycleT / UFO_DURATION, 1));

  let ufoPos = $derived.by(() => {
    if (!ufoActive) return { x: -20, y: -20 };
    const t = ufoProgress;
    const startX = -10, startY = 170;
    const endX = 210, endY = 20;
    const jinkX = 90 + Math.sin(t * Math.PI * 6) * 14;
    const jinkY = 60 + Math.cos(t * Math.PI * 4) * 10;
    const wobble = Math.sin(t * Math.PI);
    return {
      x: startX + (endX - startX) * t + (jinkX - 100) * wobble * 0.4,
      y: startY + (endY - startY) * t + (jinkY - 90) * wobble * 0.4,
    };
  });

  let glitchOn = $derived(ufoActive && (Math.floor(time.millisecond / 45) % 3 !== 0));
  let glitchOffsetX = $derived(ufoActive ? (Math.sin(time.millisecond * 0.9) * 2.4) : 0);
  let glitchOffsetY = $derived(ufoActive ? (Math.cos(time.millisecond * 1.3) * 1.6) : 0);

  let ufoTrail = $derived.by(() => {
    if (!ufoActive) return [];
    return [0.05, 0.1, 0.16, 0.22].map((d) => {
      const t = Math.max(ufoProgress - d, 0);
      const startX = -10, startY = 170, endX = 210, endY = 20;
      const wobble = Math.sin(t * Math.PI);
      const jinkX = 90 + Math.sin(t * Math.PI * 6) * 14;
      const jinkY = 60 + Math.cos(t * Math.PI * 4) * 10;
      return {
        x: startX + (endX - startX) * t + (jinkX - 100) * wobble * 0.4,
        y: startY + (endY - startY) * t + (jinkY - 90) * wobble * 0.4,
      };
    });
  });

  let alertOn = $derived(ufoActive && ufoProgress > 0.08);
  let alertFlicker = $derived(alertOn && (Math.floor(time.millisecond / 90) % 5 !== 0));

  // ── Pulsing HR/MN, driven purely by time (no free-running CSS animation) ──
  const TWO_PI = Math.PI * 2;

  const HR_PERIOD = 2200;
  let hrElapsed = $derived((time.second * 1000 + time.millisecond) % HR_PERIOD);
  let hrPulse = $derived((Math.sin((hrElapsed / HR_PERIOD) * TWO_PI - Math.PI / 2) + 1) / 2);
  let hrScale = $derived(1 + hrPulse * 0.7);
  let hrOpacity = $derived(1 - hrPulse * 0.45);
  let hrGlow = $derived(3 + hrPulse * 5);

  const MN_PERIOD = 1400;
  let mnElapsed = $derived((time.second * 1000 + time.millisecond) % MN_PERIOD);
  let mnPulse = $derived((Math.sin((mnElapsed / MN_PERIOD) * TWO_PI - Math.PI / 2) + 1) / 2);
  let mnScale = $derived(1 + mnPulse * 0.7);
  let mnOpacity = $derived(1 - mnPulse * 0.45);
  let mnGlow = $derived(3 + mnPulse * 5);
</script>

<div
  class="radar-clock"
  role="timer"
  aria-live="off"
  aria-label={`${pad(time.hh)}:${pad(time.mm)}:${pad(time.ss)}`}
>
  <svg viewBox="0 0 200 200" role="presentation">
    <defs>
      <radialGradient id="scopeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0a2a10" />
        <stop offset="100%" stop-color="#000800" />
      </radialGradient>
      <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#3cff7a" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#3cff7a" stop-opacity="0" />
      </linearGradient>
    </defs>

    <circle cx="100" cy="100" r="98" fill="url(#scopeGlow)" stroke="#173a1f" stroke-width="1.5" />

    {#each rangeRings as r}
      <circle cx="100" cy="100" r={r} fill="none" stroke="#1c4a26" stroke-width="0.7" />
    {/each}

    <g stroke="#12321a" stroke-width="0.6">
      {#each bearingLines as a}
        <line x1="100" y1="100" x2={toXY(a, 100).x} y2={toXY(a, 100).y} />
      {/each}
    </g>

    <line x1="100" y1="2" x2="100" y2="198" stroke="#1c4a26" stroke-width="0.5" />
    <line x1="2" y1="100" x2="198" y2="100" stroke="#1c4a26" stroke-width="0.5" />

    <g transform={`rotate(${sweepAngle} 100 100)`}>
      <path d="M100,100 L100,2 A98,98 0 0,1 129,10 Z" fill="url(#sweepGrad)" />
      <line x1="100" y1="100" x2="100" y2="2" stroke="#8dffb0" stroke-width="1"
        style="filter: drop-shadow(0 0 3px #3cff7a)" />
    </g>

    <!-- HOUR contact — pulsing, driven by time -->
    <circle
      cx={hrPos.x} cy={hrPos.y} r="3.2" fill="#3cff7a"
      opacity={hrOpacity}
      transform={`translate(${hrPos.x} ${hrPos.y}) scale(${hrScale}) translate(${-hrPos.x} ${-hrPos.y})`}
      style={`filter: drop-shadow(0 0 ${hrGlow}px #3cff7a)`}
    />
    <text x={hrPos.x + 5} y={hrPos.y - 4} font-family="'Courier New', monospace"
      font-size="5" fill="#8dffb0">HR{pad(time.hh)}</text>

    <!-- MINUTE contact — pulsing, driven by time -->
    {#each minTrail as p, i}
      <circle cx={p.x} cy={p.y} r="1.4" fill="#3cff7a" opacity={0.28 - i * 0.06} />
    {/each}
    <circle
      cx={minPos.x} cy={minPos.y} r="2.6" fill="#3cff7a"
      opacity={mnOpacity}
      transform={`translate(${minPos.x} ${minPos.y}) scale(${mnScale}) translate(${-minPos.x} ${-minPos.y})`}
      style={`filter: drop-shadow(0 0 ${mnGlow}px #3cff7a)`}
    />
    <text x={minPos.x + 5} y={minPos.y - 4} font-family="'Courier New', monospace"
      font-size="5" fill="#8dffb0">MN{pad(time.mm)}</text>

    <!-- SECOND contact — steady, no pulse -->
    {#each secTrail as p, i}
      <circle cx={p.x} cy={p.y} r="1.2" fill="#3cff7a" opacity={0.3 - i * 0.07} />
    {/each}
    <circle cx={secPos.x} cy={secPos.y} r="2" fill="#c9ffd8"
      style="filter: drop-shadow(0 0 3px #ffffff)" />

    <circle cx="100" cy="100" r="2.5" fill="#8dffb0" />

    <!-- ── UFO CONTACT ────────────────────────────────────── -->
    {#if ufoActive && glitchOn}
      <g transform={`translate(${ufoPos.x + glitchOffsetX}, ${ufoPos.y + glitchOffsetY})`}>
        {#each ufoTrail as p, i}
          <circle
            cx={p.x - ufoPos.x} cy={p.y - ufoPos.y}
            r={1.8 - i * 0.25}
            fill="#ff2b2b"
            opacity={0.35 - i * 0.08}
          />
        {/each}
        <circle r="3" fill="#ff2b2b"
          style="filter: drop-shadow(0 0 4px #ff2b2b)" />
        <text x="6" y="-4" font-family="'Courier New', monospace" font-size="5"
          fill="#ff6b6b" style="filter: drop-shadow(0 0 2px #ff2b2b)">unidentified aircraft</text>
      </g>
    {/if}

    <!-- breaking-news style alert banner -->
    {#if alertOn && alertFlicker}
      <g>
        <rect x="18" y="90" width="164" height="16" fill="#0a0000" stroke="#ff2b2b" stroke-width="0.6" opacity="0.9" />
        <text x="100" y="100.5" text-anchor="middle" font-family="'Courier New', monospace"
          font-size="7" font-weight="700" letter-spacing="1" fill="#ff6b6b"
          style="filter: drop-shadow(0 0 3px #ff2b2b)">⚠ UNIDENTIFIED CONTACT — BREAKING</text>
      </g>
    {/if}

    <rect x="6" y="182" width="60" height="12" fill="#000800" stroke="#1c4a26" stroke-width="0.6" />
    <text x="10" y="190.5" font-family="'Courier New', monospace" font-size="7"
      fill="#3cff7a" style="filter: drop-shadow(0 0 3px #3cff7a)">{pad(time.hh)}:{pad(time.mm)}:{pad(time.ss)}</text>

    <text x="194" y="12" text-anchor="end" font-family="'Courier New', monospace"
      font-size="5.5" fill="#4f8a5c" letter-spacing="1">ATC · SCOPE 01</text>

    <text x="194" y="196" text-anchor="end" font-family="'Courier New', monospace"
      font-size="4.5" fill="#2f5a38" letter-spacing="0.5">arthusiasm.be</text>
  </svg>
</div>

<style>
  .radar-clock {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: inherit;
    background: #000800;
  }
  svg {
    width: 94%;
    height: 94%;
  }
</style>