<!-- by arthusiasm.be -->
<script>
  let { time } = $props();

  const pad = (v) => String(v).padStart(2, "0");
  const TWO_PI = Math.PI * 2;

  let theta = $derived(
    ((time.second + time.millisecond / 1000) / 60) * TWO_PI
  );

  const CX = 50, CY = 50, RADIUS = 34;
  let px = $derived(CX + Math.cos(theta) * RADIUS);
  let py = $derived(CY - Math.sin(theta) * RADIUS);

  let sinVal = $derived(Math.sin(theta));
  let cosVal = $derived(Math.cos(theta));

  const SAMPLES = 120;
  let sinPoints = $derived.by(() => {
    return Array.from({ length: SAMPLES }, (_, i) => {
      const t = theta - (SAMPLES - i) * (TWO_PI / SAMPLES);
      const x = (i / (SAMPLES - 1)) * 96 + 2;
      const y = 50 - Math.sin(t) * 22;
      return `${x},${y}`;
    }).join(" ");
  });
  let cosPoints = $derived.by(() => {
    return Array.from({ length: SAMPLES }, (_, i) => {
      const t = theta - (SAMPLES - i) * (TWO_PI / SAMPLES);
      const x = (i / (SAMPLES - 1)) * 96 + 2;
      const y = 50 - Math.cos(t) * 22;
      return `${x},${y}`;
    }).join(" ");
  });

  let minuteAngle = $derived((time.minute / 60) * TWO_PI);
  let hourAngle = $derived((((time.hour % 12) + time.minute / 60) / 12) * TWO_PI);

  // ── E = mc² flavor readout ─────────────────────────────────
  // Purely decorative physics easter egg: a nominal "mass" oscillates
  // with the wave amplitude (|sin θ|, scaled to a tiny fictional unit),
  // run through the real speed of light to produce an "energy" value.
  const C = 299792458; // m/s, real speed of light
  const C2 = C * C;
  let massKg = $derived(1e-6 * (0.5 + 0.5 * Math.abs(sinVal))); // oscillates 0.5µg–1µg
  let energyJ = $derived(massKg * C2);

  function toSci(n) {
    if (n === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(n)));
    const mantissa = n / Math.pow(10, exp);
    return `${mantissa.toFixed(3)}×10^${exp}`;
  }
</script>

<div
  class="trig-clock"
  role="timer"
  aria-live="off"
  aria-label={`${pad(time.hh)}:${pad(time.mm)}:${pad(time.ss)}`}
>
  <svg viewBox="0 0 100 170" role="presentation">
    <defs>
      <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7fe7ff" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#7fe7ff" stop-opacity="0.02" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="100" height="170" fill="url(#gridFade)" />
    <g stroke="#1c2b3a" stroke-width="0.25">
      {#each Array.from({ length: 11 }) as _, i}
        <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
        <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
      {/each}
    </g>

    <!-- ── UNIT CIRCLE ─────────────────────────────────────── -->
    <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#2a4356" stroke-width="0.6" />
    <line x1={CX - RADIUS - 4} y1={CY} x2={CX + RADIUS + 4} y2={CY} stroke="#2a4356" stroke-width="0.4" />
    <line x1={CX} y1={CY - RADIUS - 4} x2={CX} y2={CY + RADIUS + 4} stroke="#2a4356" stroke-width="0.4" />

    <line x1={px} y1={py} x2={px} y2={CY} stroke="#ff6ec7" stroke-width="0.5" stroke-dasharray="1.5,1.2" />
    <line x1={px} y1={py} x2={CX} y2={py} stroke="#7fe7ff" stroke-width="0.5" stroke-dasharray="1.5,1.2" />
    <line x1={CX} y1={CY} x2={px} y2={py} stroke="#ffd23f" stroke-width="0.7" />
    <circle cx={px} cy={py} r="1.8" fill="#ffd23f" style="filter: drop-shadow(0 0 2px #ffd23f)" />
    <circle cx={px} cy={CY} r="1.2" fill="#7fe7ff" style="filter: drop-shadow(0 0 2px #7fe7ff)" />
    <circle cx={CX} cy={py} r="1.2" fill="#ff6ec7" style="filter: drop-shadow(0 0 2px #ff6ec7)" />

    <text x={CX} y="12" text-anchor="middle" font-family="'Courier New', monospace"
      font-size="3.4" fill="#5c7a8f" letter-spacing="0.5">UNIT CIRCLE · θ FROM SECONDS</text>

    <!-- E=mc² flavor readout, top-right corner of the circle panel -->
    <text x="97" y="8" text-anchor="end" font-family="'Courier New', monospace"
      font-size="3.6" font-weight="700" fill="#ffd23f"
      style="filter: drop-shadow(0 0 2px #ffd23f)">E = mc²</text>
    <text x="97" y="16.5" text-anchor="end" font-family="'Courier New', monospace"
      font-size="2.6" fill="#a8b8c4">m={massKg.toExponential(2)}kg</text>
    <text x="97" y="21" text-anchor="end" font-family="'Courier New', monospace"
      font-size="2.6" fill="#a8b8c4">E={toSci(energyJ)}J</text>

    <!-- ── SINE WAVE ───────────────────────────────────────── -->
    <line x1="0" y1="112" x2="100" y2="112" stroke="#243748" stroke-width="0.3" />
    <polyline points={sinPoints} fill="none" stroke="#7fe7ff" stroke-width="0.9"
      style="filter: drop-shadow(0 0 1.5px #7fe7ff)" transform="translate(0,62)" />
    <circle cx="98" cy={112 + 20 - sinVal * 22} r="1.4" fill="#7fe7ff"
      style="filter: drop-shadow(0 0 2px #7fe7ff)" />
    <text x="4" y="96" font-family="'Courier New', monospace" font-size="3.2"
      fill="#7fe7ff">sin θ = {sinVal.toFixed(2)}</text>

    <!-- ── COSINE WAVE ─────────────────────────────────────── -->
    <line x1="0" y1="150" x2="100" y2="150" stroke="#243748" stroke-width="0.3" />
    <polyline points={cosPoints} fill="none" stroke="#ff6ec7" stroke-width="0.9"
      style="filter: drop-shadow(0 0 1.5px #ff6ec7)" transform="translate(0,100)" />
    <circle cx="98" cy={150 + 20 - cosVal * 22} r="1.4" fill="#ff6ec7"
      style="filter: drop-shadow(0 0 2px #ff6ec7)" />
    <text x="4" y="134" font-family="'Courier New', monospace" font-size="3.2"
      fill="#ff6ec7">cos θ = {cosVal.toFixed(2)}</text>

    <circle
      cx={CX + Math.cos(minuteAngle - Math.PI/2) * (RADIUS + 6)}
      cy={CY + Math.sin(minuteAngle - Math.PI/2) * (RADIUS + 6)}
      r="1" fill="#8fffb0" opacity="0.8" />
    <circle
      cx={CX + Math.cos(hourAngle - Math.PI/2) * (RADIUS + 10)}
      cy={CY + Math.sin(hourAngle - Math.PI/2) * (RADIUS + 10)}
      r="1.3" fill="#ffb26f" opacity="0.85" />

    <text x={CX} y="166" text-anchor="middle" font-family="'Courier New', monospace"
      font-size="5" font-weight="700" fill="#e8fbff"
      style="filter: drop-shadow(0 0 3px #7fe7ff)">{pad(time.hh)}:{pad(time.mm)}:{pad(time.ss)}</text>

    <text x="97" y="166" text-anchor="end" font-family="'Courier New', monospace"
      font-size="2.6" fill="#3a5568" letter-spacing="0.3">arthusiasm.be</text>
  </svg>
</div>

<style>
  .trig-clock {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: inherit;
    background: #0a0e17;
  }
  svg {
    width: 94%;
    height: 94%;
  }
</style>