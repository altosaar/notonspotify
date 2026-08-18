<script>
  // Live, read-only snapshot of the viewer's local time (Time API).
  // A new frozen object arrives continuously, driving every redraw.
  let { time } = $props();

  // ── Coordinate constants (match Android Clock.kt: WIDTH=HEIGHT=400) ──────
  const W = 400, H = 400, CX = 200, CY = 200;
  const DIST_OUTER  = 180;  // hour-marker ring distance from center (W/2 - 20)
  const SHORT_HAND  = 140;  // city label / sun-moon radius (W/2 - 60)
  const LINE_HAND   = 170;  // time-line endpoint radius (W/2 - 30)
  const SMALL_DOT_R = 3;    // radius of odd-hour dots

  // Approx advance width of one digit in the 35px-bold day-number font. SVG
  // has no measureText, so we estimate to place the weekday left of the day.
  const DAY_DIGIT_W = 19;

  // ── Fixed configuration ─────────────────────────────────────────────────
  // Center date/time, sun/moon, time line, minute arc, and sphere all on.
  const features = {
    showDate:      true,
    showSunMoon:   true,
    showTimeLine:  true,
    showMinuteArc: true,
    showSphere:    true,
    timeLineLength: 0.66,
    sphereAlpha:   89,
  };

  // Fixed cities: PEK, JFK, LAX, HNL — no weather.
  const slots = [
    { code: 'PEK', tzId: 'Asia/Shanghai',       showTime: true },
    { code: 'JFK', tzId: 'America/New_York',    showTime: true },
    { code: 'LAX', tzId: 'America/Los_Angeles', showTime: true },
    { code: 'HNL', tzId: 'Pacific/Honolulu',    showTime: true },
  ];

  // 3-letter labels (index 0 = Sunday / January).
  const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  const sphereAlpha = (features.sphereAlpha / 255).toFixed(3);

  // ── Clock math ────────────────────────────────────────────────────────────

  // Map a 24h time-step (0–71) onto the clock face.
  // 72 steps = 24 hours × 3 ticks/hour.
  // Noon (step 36) → top; midnight (step 0) → bottom; clockwise.
  function pos(timeStep, radius) {
    const t = 2 * Math.PI * (timeStep + 18) / 72;
    return { x: CX + radius * Math.cos(t), y: CY + radius * Math.sin(t) };
  }

  // City local time, seeded from the viewer's timestamp so it advances in
  // lockstep with the Time API snapshot. formatToParts accepts a Unix-ms number.
  function getTzTime(tzId, timestamp) {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tzId, hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(timestamp);
    let h = parseInt(parts.find(p => p.type === 'hour').value)   || 0;
    const m = parseInt(parts.find(p => p.type === 'minute').value) || 0;
    if (h === 24) h = 0;
    return { h, m };
  }

  // Return +25 (draw time-label below city code) for daytime, -25 for nighttime.
  function timeOffset(hour) { return (hour > 6 && hour < 18) ? 25 : -25; }

  // A full circle as an SVG path subpath (two half-arcs), for even-odd fills.
  function circlePath(cx, cy, r) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  }

  // ── Static geometry (time-independent) ─────────────────────────────────────

  // Two semicircles: day tint on top, night tint on the bottom.
  const spherePaths = {
    day:   `M ${CX - DIST_OUTER} ${CY} A ${DIST_OUTER} ${DIST_OUTER} 0 0 1 ${CX + DIST_OUTER} ${CY} Z`,
    night: `M ${CX + DIST_OUTER} ${CY} A ${DIST_OUTER} ${DIST_OUTER} 0 0 1 ${CX - DIST_OUTER} ${CY} Z`,
  };

  // Even hours → number label; odd hours → dot.
  const hourMarkers = (() => {
    const arr = [];
    for (let i = 0; i <= 71; i += 3) {
      const p = pos(i, DIST_OUTER);
      if (i % 6 === 0) arr.push({ type: 'num', p, label: String(i / 3) });
      else             arr.push({ type: 'dot', p });
    }
    return arr;
  })();

  // ── Reactive geometry (recomputed on each time snapshot) ───────────────────

  // Minute arc: white segments along the outer ring, one per hour gap, swept
  // proportionally to the current minute (0→60 maps to 0→360°).
  const minuteArc = $derived.by(() => {
    const minute = time.minute;
    if (minute === 0) return [];
    const sweepDeg  = minute / 60 * 360;
    const r         = DIST_OUTER;
    const hourSweep = h => (15 * h + 180) % 360;
    const halfGap   = h => (h % 2 === 0) ? 5 : 2;
    let segStart = halfGap(12);
    const segs = [];
    for (let i = 0; i < 24; i++) {
      const nextH     = (13 + i) % 24;
      const nextSweep = (nextH === 12) ? 360 : hourSweep(nextH);
      const segEnd    = nextSweep - halfGap(nextH);
      if (segStart < sweepDeg && segEnd > segStart) {
        const draw = Math.min(segEnd, sweepDeg) - segStart;
        if (draw > 0) {
          const startA = (-90 + segStart) * Math.PI / 180;
          const endA   = startA + draw * Math.PI / 180;
          const x0 = CX + r * Math.cos(startA), y0 = CY + r * Math.sin(startA);
          const x1 = CX + r * Math.cos(endA),   y1 = CY + r * Math.sin(endA);
          segs.push(`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`);
        }
      }
      segStart = nextSweep + halfGap(nextH);
      if (segStart >= sweepDeg) break;
    }
    return segs;
  });

  const timeLine = $derived.by(() => {
    const ts  = time.hour * 3 + Math.floor(time.minute / 20);
    const p   = pos(ts, LINE_HAND);
    const len = features.timeLineLength;
    return { x2: CX + (p.x - CX) * len, y2: CY + (p.y - CY) * len };
  });

  const dateInfo = $derived.by(() => {
    const timeY  = H - 150;             // HH:mm baseline
    const dayW   = String(time.day).length * DAY_DIGIT_W;
    return { timeY, dayW, weekdayX: CX - dayW / 2 - 10 };
  });

  const cities = $derived.by(() =>
    slots.map(slot => {
      const { h, m } = getTzTime(slot.tzId, time.timestamp);
      const ts = h * 3 + Math.floor(m / 20);
      const p  = pos(ts, SHORT_HAND);
      return {
        code:   slot.code,
        p,
        hidden: features.showSunMoon && h === time.hour,
        showTime: slot.showTime,
        off:    timeOffset(h),
        label:  `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
      };
    })
  );

  const sunMoon = $derived.by(() => {
    const ts  = time.hour * 3 + Math.floor(time.minute / 20);
    const p   = pos(ts, SHORT_HAND);
    const cx  = p.x, cy = p.y, r = 10;
    const isDaytime = time.hour >= 6 && time.hour < 18;
    const rays = [];
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      rays.push({
        x1: cx + (r + 3) * Math.cos(a), y1: cy + (r + 3) * Math.sin(a),
        x2: cx + (r + 7) * Math.cos(a), y2: cy + (r + 7) * Math.sin(a),
      });
    }
    // Crescent: outer circle minus an offset bite via even-odd fill.
    const moonPath = circlePath(cx, cy, r) + ' ' + circlePath(cx + r * 0.45, cy - r * 0.1, r * 0.82);
    return { cx, cy, r, isDaytime, rays, moonPath };
  });
</script>

<div class="clock-host">
  <div class="clock-column">
    <div id="clock-wrap">
      <svg id="clock" viewBox="0 0 {W} {H}" role="img" aria-label="AI World Clock">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#30a7c7" />
            <stop offset="1" stop-color="#1b70a5" />
          </linearGradient>
        </defs>

        <!-- Background disc -->
        <circle cx={CX} cy={CY} r={CX} fill="url(#bg)" />

        <!-- Day/night sphere -->
        {#if features.showSphere}
          <path d={spherePaths.day}   fill="rgba(26,107,154,{sphereAlpha})" />
          <path d={spherePaths.night} fill="rgba(58,58,58,{sphereAlpha})" />
        {/if}

        <!-- Minute arc -->
        {#if features.showMinuteArc}
          {#each minuteArc as d}
            <path {d} fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="butt" />
          {/each}
        {/if}

        <!-- Time line -->
        {#if features.showTimeLine}
          <line x1={CX} y1={CY} x2={timeLine.x2} y2={timeLine.y2}
                stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        {/if}

        <!-- Center date / time -->
        {#if features.showDate}
          <g fill="#ffffff" text-anchor="middle">
            <text x={CX} y={dateInfo.timeY}      font-weight="700" font-size="25">{time.hh}:{time.mm}</text>
            <text x={CX} y={dateInfo.timeY - 38} font-weight="700" font-size="25">{MONTHS[time.month - 1]} {time.year}</text>
            <text x={CX} y={dateInfo.timeY - 86} font-weight="700" font-size="35">{time.day}</text>
            <text x={dateInfo.weekdayX} y={dateInfo.timeY - 86} font-weight="700" font-size="18" text-anchor="end">{WEEKDAYS[time.weekday]}</text>
          </g>
        {/if}

        <!-- City labels -->
        <g fill="#ffffff" text-anchor="middle" dominant-baseline="central">
          {#each cities as c}
            {#if !c.hidden}
              <text x={c.p.x} y={c.p.y} font-weight="700" font-size="25">{c.code}</text>
              {#if c.showTime}
                <text x={c.p.x} y={c.p.y + c.off} font-size="16">{c.label}</text>
              {/if}
            {/if}
          {/each}
        </g>

        <!-- Hour markers -->
        <g fill="#ffffff" text-anchor="middle" dominant-baseline="central">
          {#each hourMarkers as mk}
            {#if mk.type === 'num'}
              <text x={mk.p.x} y={mk.p.y} font-weight="700" font-size="22">{mk.label}</text>
            {:else}
              <circle cx={mk.p.x} cy={mk.p.y} r={SMALL_DOT_R} />
            {/if}
          {/each}
        </g>

        <!-- Sun / moon indicator -->
        {#if features.showSunMoon}
          {#if sunMoon.isDaytime}
            <circle cx={sunMoon.cx} cy={sunMoon.cy} r={sunMoon.r} fill="rgba(255,220,50,1)" />
            {#each sunMoon.rays as ray}
              <line x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2}
                    stroke="rgba(255,210,40,1)" stroke-width="2" stroke-linecap="round" />
            {/each}
          {:else}
            <path d={sunMoon.moonPath} fill="rgba(210,220,255,1)" fill-rule="evenodd" />
          {/if}
        {/if}
      </svg>
    </div>
  </div>
</div>

<style>
  .clock-host {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .clock-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    font-family: 'K2D', sans-serif;
  }

  #clock-wrap {
    width: min(572px, 90vw);
    height: min(572px, 90vw);
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  #clock {
    display: block;
    width: 100%;
    height: 100%;
    font-family: 'K2D', sans-serif;
  }
</style>
