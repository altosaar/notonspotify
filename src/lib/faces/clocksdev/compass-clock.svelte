<script>
  let { time } = $props();

  const weekText = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const rings = [
    { size: 12, label: (j) => String(j + 1).padStart(2, '0') },
    { size: 31, label: (j) => String(j + 1).padStart(2, '0') },
    { size: 7, label: (j) => weekText[j] },
    { size: 24, label: (j) => String(j).padStart(2, '0') },
    { size: 60, label: (j) => String(j).padStart(2, '0') },
    { size: 60, label: (j) => String(j).padStart(2, '0') }
  ];
  const radii = [30, 75, 130, 175, 225, 285];

  const indices = $derived([
    time.month - 1,
    time.day - 1,
    time.weekday,
    time.hour,
    time.minute,
    time.second
  ]);

  const positions = $derived(
    rings.map((ring, i) =>
      Array.from({ length: ring.size }, (_, j) => {
        const current = indices[i] ?? 0;
        const deg = (360 / ring.size) * (j - current);
        const rad = (deg * Math.PI) / 180;
        const r = radii[i];
        return {
          left: `calc(50% + ${r * Math.sin(rad)}px)`,
          top: `calc(50% - ${r * Math.cos(rad)}px)`,
          transform: `rotate(${-90 + deg}deg)`
        };
      })
    )
  );

  const sweepAngle = $derived(time.progress.minute * 360);
  const dateStr = $derived(
    `${time.year}.${String(time.month).padStart(2, '0')}.${String(time.day).padStart(2, '0')}`
  );
</script>

<div class="blueprint">
  <!-- 角标 -->
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>
  <!-- 图框 -->
  <div class="frame"></div>

  <!-- 钟面（旋转 90°） -->
  <div class="clock">
    <!-- 同心圆 -->
    <div class="radar">
      {#each radii as r}
        <div class="ring" style="width: {r * 2}px; height: {r * 2}px;"></div>
      {/each}
    </div>
    <!-- 十字线 -->
    <div class="cross cross-h"></div>
    <div class="cross cross-v"></div>
    <!-- 中心标记 -->
    <div class="center-cross"></div>
    <div class="center-dot"></div>
    <!-- 数据标签 -->
    {#each rings as ring, i}
      {#each Array(ring.size) as _, j}
        <span
          class="label"
          class:current={j === indices[i]}
          style:left={positions[i][j].left}
          style:top={positions[i][j].top}
          style:transform={positions[i][j].transform}
        >{ring.label(j)}</span>
      {/each}
    {/each}
  </div>

  <!-- 标题栏 -->
  <div class="titlebar">
    <span class="tb-left">CHRONO-GRAPH</span>
    <span class="tb-center">{dateStr}</span>
    <span class="tb-right">SCALE 1:1 · REV-01</span>
  </div>
</div>

<style>
  .blueprint {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* ---- 图框 ---- */
  .frame {
    position: absolute;
    inset: 10px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    pointer-events: none;
  }

  /* ---- 角标 ---- */
  .corner {
    position: absolute;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.55);
    pointer-events: none;
  }
  .tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
  .tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
  .bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
  .br { bottom: 6px; right: 6px; border-left: none; border-top: none; }

  /* ---- 钟面 ---- */
  .clock {
    position: absolute;
    inset: 0;
    transform: rotate(90deg);
  }

  .radar {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .ring {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
  }

  .cross {
    position: absolute;
    background: rgba(255, 255, 255, 0.12);
    pointer-events: none;
  }
  .cross-h { left: 0; top: 50%; width: 100%; height: 1px; transform: translateY(-50%); }
  .cross-v { left: 50%; top: 0; width: 1px; height: 100%; transform: translateX(-50%); }

  /* 中心十字标记 */
  .center-cross {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 14px;
    height: 14px;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .center-cross::before,
  .center-cross::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.6);
  }
  .center-cross::before { left: 0; top: 50%; width: 100%; height: 1px; transform: translateY(-50%); }
  .center-cross::after { left: 50%; top: 0; width: 1px; height: 100%; transform: translateX(-50%); }

  .center-dot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4px;
    height: 4px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  /* ---- 数据标签 ---- */
  .label {
    position: absolute;
    transform-origin: 0% 0%;
    color: rgba(255, 255, 255, 0.35);
    text-align: center;
    padding: 0 5px;
    font-family: "IBM Plex Mono", "Courier New", "Consolas", monospace;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    letter-spacing: 0.05em;
    transition: left 1s, top 1s, color 0.3s, text-shadow 0.3s, font-size 0.3s;
  }
  .label.current {
    color: #67e8f9;
    font-size: 16px;
    font-weight: 700;
    text-shadow:
      0 0 4px #22d3ee,
      0 0 8px #22d3ee,
      0 0 16px rgba(34, 211, 238, 0.6),
      0 0 24px rgba(34, 211, 238, 0.3);
  }

  /* ---- 标题栏 ---- */
  .titlebar {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    height: 24px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-top: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    font-family: "IBM Plex Mono", "Courier New", "Consolas", monospace;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.12em;
    pointer-events: none;
  }
  .tb-center { color: rgba(255, 255, 255, 0.7); }
</style>
