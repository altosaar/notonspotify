<script>
  let { time } = $props();

  const periods = [
    { branch: "子", pinyin: "ZǏ", english: "MIDNIGHT", name: "夜半", range: "23:00—01:00", copy: "长夜正深，日期在此交界" },
    { branch: "丑", pinyin: "CHǑU", english: "COCKCROW", name: "鸡鸣", range: "01:00—03:00", copy: "夜色未退，微声先起" },
    { branch: "寅", pinyin: "YÍN", english: "DAYBREAK", name: "平旦", range: "03:00—05:00", copy: "天色将明，万物初醒" },
    { branch: "卯", pinyin: "MǍO", english: "SUNRISE", name: "日出", range: "05:00—07:00", copy: "东方既白，光线展开" },
    { branch: "辰", pinyin: "CHÉN", english: "BREAKFAST", name: "食时", range: "07:00—09:00", copy: "晨光稳定，日事始作" },
    { branch: "巳", pinyin: "SÌ", english: "LATE MORNING", name: "隅中", range: "09:00—11:00", copy: "日影渐短，光势上升" },
    { branch: "午", pinyin: "WǓ", english: "MIDDAY", name: "日中", range: "11:00—13:00", copy: "太阳当空，昼意最盛" },
    { branch: "未", pinyin: "WÈI", english: "AFTERNOON", name: "日昳", range: "13:00—15:00", copy: "日过中天，影子东移" },
    { branch: "申", pinyin: "SHĒN", english: "LATE DAY", name: "晡时", range: "15:00—17:00", copy: "午后渐深，光色转暖" },
    { branch: "酉", pinyin: "YǑU", english: "SUNSET", name: "日入", range: "17:00—19:00", copy: "太阳西沉，昼夜交接" },
    { branch: "戌", pinyin: "XŪ", english: "DUSK", name: "黄昏", range: "19:00—21:00", copy: "暮色合拢，灯火初上" },
    { branch: "亥", pinyin: "HÀI", english: "NIGHT REST", name: "人定", range: "21:00—23:00", copy: "人声渐息，夜归于静" },
  ];

  const palettes = [
    { a: "#05070d", b: "#111831", c: "#080b14", accent: "#9eb8ff", muted: "#7081ad" },
    { a: "#080812", b: "#1a1830", c: "#0b0c17", accent: "#b9b1e8", muted: "#7b769a" },
    { a: "#100b17", b: "#322035", c: "#160f1e", accent: "#df9fa8", muted: "#936d7a" },
    { a: "#20131a", b: "#674139", c: "#2a171b", accent: "#ffd0a1", muted: "#b38669" },
    { a: "#202019", b: "#5d6042", c: "#24241c", accent: "#e6d28d", muted: "#9a9168" },
    { a: "#292317", b: "#75613a", c: "#2a2116", accent: "#f3d77b", muted: "#a78d56" },
    { a: "#2b2518", b: "#85713d", c: "#2d2619", accent: "#fff1aa", muted: "#b6a267" },
    { a: "#282017", b: "#745136", c: "#2c2119", accent: "#efbd83", muted: "#a27e5f" },
    { a: "#211817", b: "#60413a", c: "#271b1b", accent: "#e7a190", muted: "#986d68" },
    { a: "#171117", b: "#4d2b3b", c: "#211620", accent: "#d893ad", muted: "#8d6579" },
    { a: "#0d0c15", b: "#2d2440", c: "#14121f", accent: "#b6a5da", muted: "#756c91" },
    { a: "#070912", b: "#17213b", c: "#0a0d18", accent: "#9eb0df", muted: "#667697" },
  ];

  const two = (value) => String(value).padStart(2, "0");

  // BEGIN_DOUBLE_HOUR_LOGIC
  function getPeriodState(hour, minute, second = 0, millisecond = 0) {
    const totalMinutes =
      hour * 60 + minute + second / 60 + millisecond / 60000;
    const shiftedMinutes = (totalMinutes + 60) % 1440;
    const index = Math.floor(shiftedMinutes / 120);
    const progress = (shiftedMinutes % 120) / 120;

    return {
      index,
      progress,
      cycleProgress: shiftedMinutes / 1440,
      half: shiftedMinutes % 120 < 60 ? "初" : "正",
    };
  }
  // END_DOUBLE_HOUR_LOGIC

  let state = $derived(
    getPeriodState(
      time.hour,
      time.minute,
      time.second,
      time.millisecond,
    ),
  );
  let current = $derived(periods[state.index]);
  let next = $derived(periods[(state.index + 1) % periods.length]);
  let palette = $derived(palettes[state.index]);
  let dateLabel = $derived(
    `${time.year}.${two(time.month)}.${two(time.day)}`,
  );
  let timezoneLabel = $derived(time.timezone.replaceAll("_", " "));
  // 24-hour ellipse: midnight below, dawn left, noon above, dusk right.
  let sunX = $derived(
    50 - Math.sin(time.progress.day * Math.PI * 2) * 40,
  );
  let sunY = $derived(
    55 + Math.cos(time.progress.day * Math.PI * 2) * 40,
  );
  let styleVars = $derived(
    `--cycle:${state.cycleProgress};--period:${state.progress};--second:${time.progress.second};--sun-x:${sunX}%;--sun-y:${sunY}%;--bg-a:${palette.a};--bg-b:${palette.b};--bg-c:${palette.c};--accent:${palette.accent};--muted:${palette.muted}`,
  );
</script>

<div
  class="clock"
  style={styleVars}
  role="img"
  aria-label={`${current.name}，${current.branch}时；${current.pinyin}, ${current.english}；现代时间 ${current.range}；当前 ${time.hh}:${time.mm}:${time.ss}`}
>
  <div class="atmosphere" aria-hidden="true">
    <div class="sun"></div>
    <div class="grain"></div>
  </div>

  <header class="topbar">
    <div class="identity">
      <div class="title">
        <strong>十二时辰</strong>
        <span>TWELVE DOUBLE HOURS</span>
      </div>
      <span class="time-rule">1 SHICHEN = 2 HOURS · 12 PERIODS = 24 HOURS</span>
    </div>

    <time class="digital" datetime={`${time.hh}:${time.mm}:${time.ss}`}>
      <span>{time.hh}:{time.mm}</span>
      <small>{time.ss}</small>
    </time>
  </header>

  <main class="composition">
    <section class="reading">
      <div class="index-line">
        <span>{two(state.index + 1)} / 12</span>
        <span>{current.range}</span>
      </div>

      <div class="period-heading">
        <div class="glyph">{current.branch}</div>
        <div class="period-copy">
          <span class="traditional-name">{current.name}</span>
          <span class="branch-name">{current.branch}{state.half} · {current.pinyin} · {current.english}</span>
        </div>
      </div>

      <p class="descriptor">{current.copy}</p>

      <div class="period-progress" aria-hidden="true">
        <div class="progress-label">
          <span>本时辰</span>
          <span>{Math.floor(state.progress * 100)}%</span>
        </div>
        <div class="bar"><i></i></div>
      </div>

      <div class="next-period">
        <span>下一时辰</span>
        <strong>{next.branch} · {next.name}</strong>
      </div>
    </section>

    <aside class="clepsydra" aria-label="十二时辰刻度">
      <div class="scale-title">一日 · 十二辰</div>
      <div class="channel">
        <div class="water"></div>
        <div class="surface"></div>

        {#each periods as period, index}
          <div
            class="tick"
            class:current={index === state.index}
            class:elapsed={index < state.index}
            style={`top:${((index + 0.5) / periods.length) * 100}%`}
          >
            <span class="notch"></span>
            <span class="tick-branch">{period.branch}</span>
            <span class="tick-name">{period.name}</span>
          </div>
        {/each}
      </div>
    </aside>
  </main>

  <footer class="footer">
    <span>{dateLabel}</span>
    <span class="footer-rule"></span>
    <span>{timezoneLabel}</span>
  </footer>
</div>

<style>
  @property --bg-a {
    syntax: "<color>";
    inherits: true;
    initial-value: #05070d;
  }

  @property --bg-b {
    syntax: "<color>";
    inherits: true;
    initial-value: #111831;
  }

  @property --bg-c {
    syntax: "<color>";
    inherits: true;
    initial-value: #080b14;
  }

  @property --accent {
    syntax: "<color>";
    inherits: true;
    initial-value: #9eb8ff;
  }

  @property --muted {
    syntax: "<color>";
    inherits: true;
    initial-value: #7081ad;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .clock {
    container: double-hours / size;
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    isolation: isolate;
    padding: clamp(16px, 5cqw, 44px);
    color: #f4f1e9;
    background:
      radial-gradient(circle at 72% 24%, var(--bg-b) 0, transparent 48%),
      linear-gradient(155deg, var(--bg-a), var(--bg-c) 62%, #050608);
    font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    transition:
      --bg-a 1.8s cubic-bezier(0.4, 0, 0.2, 1),
      --bg-b 1.8s cubic-bezier(0.4, 0, 0.2, 1),
      --bg-c 1.8s cubic-bezier(0.4, 0, 0.2, 1),
      --accent 1.8s cubic-bezier(0.4, 0, 0.2, 1),
      --muted 1.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .clock::before {
    position: absolute;
    z-index: -1;
    inset: 0;
    content: "";
    opacity: 0.3;
    background:
      repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent calc(8.333% - 1px),
        color-mix(in srgb, var(--accent) 12%, transparent) calc(8.333% - 1px),
        color-mix(in srgb, var(--accent) 12%, transparent) 8.333%
      ),
      repeating-linear-gradient(
        0deg,
        transparent 0,
        transparent calc(8.333% - 1px),
        rgba(255, 255, 255, 0.025) calc(8.333% - 1px),
        rgba(255, 255, 255, 0.025) 8.333%
      );
    mask-image: linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
  }

  .atmosphere,
  .grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .atmosphere {
    z-index: -1;
  }

  .sun {
    position: absolute;
    top: var(--sun-y);
    left: var(--sun-x);
    width: clamp(96px, 34cqw, 280px);
    aspect-ratio: 1;
    border-radius: 50%;
    opacity: 0.22;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--accent) 88%, white) 0,
      color-mix(in srgb, var(--accent) 38%, transparent) 34%,
      transparent 74%
    );
    filter: blur(clamp(10px, 3cqw, 28px));
  }

  .grain {
    opacity: 0.07;
    background-image:
      repeating-radial-gradient(circle at 17% 23%, white 0 0.6px, transparent 0.7px 4px),
      repeating-radial-gradient(circle at 73% 61%, white 0 0.45px, transparent 0.55px 5px);
    background-size: 11px 13px, 17px 19px;
    mix-blend-mode: soft-light;
  }

  .topbar,
  .footer {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    display: flex;
    align-items: baseline;
    gap: clamp(8px, 2cqw, 18px);
  }

  .identity {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: clamp(3px, 0.7cqw, 6px);
  }

  .title strong {
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(13px, 3.2cqw, 24px);
    font-weight: 500;
    letter-spacing: 0.12em;
  }

  .title span,
  .time-rule,
  .scale-title,
  .index-line,
  .progress-label,
  .next-period span,
  .footer {
    color: color-mix(in srgb, var(--muted) 78%, white);
    font-size: clamp(7px, 1.5cqw, 11px);
    font-weight: 500;
    letter-spacing: 0.18em;
  }

  .time-rule {
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(7px, 1.2cqw, 9px);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .digital {
    display: flex;
    align-items: flex-start;
    gap: 0.22em;
    color: #f8f5ed;
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(14px, 3.4cqw, 26px);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.06em;
  }

  .digital small {
    margin-top: 0.12em;
    color: var(--accent);
    font-size: 0.48em;
    letter-spacing: 0;
  }

  .composition {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(92px, 28cqw, 190px);
    gap: clamp(14px, 4cqw, 40px);
    height: calc(100% - clamp(62px, 15cqw, 108px));
    min-height: 0;
  }

  .reading {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    padding-top: 2cqh;
  }

  .index-line {
    display: flex;
    width: min(100%, 370px);
    align-items: center;
    justify-content: space-between;
    padding-bottom: clamp(8px, 2cqw, 16px);
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 24%, transparent);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .period-heading {
    display: flex;
    align-items: flex-end;
    gap: clamp(12px, 3cqw, 28px);
    margin: clamp(18px, 4cqh, 44px) 0 clamp(12px, 2.5cqh, 28px);
  }

  .glyph {
    color: #f8f3e8;
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(76px, 28cqw, 220px);
    font-weight: 500;
    line-height: 0.72;
    text-shadow: 0 0 38px color-mix(in srgb, var(--accent) 26%, transparent);
  }

  .period-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: clamp(4px, 1cqw, 9px);
    padding-bottom: 0.2em;
  }

  .traditional-name {
    color: var(--accent);
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(18px, 5cqw, 42px);
    letter-spacing: 0.18em;
    white-space: nowrap;
  }

  .branch-name {
    color: color-mix(in srgb, var(--muted) 75%, white);
    font-size: clamp(8px, 1.8cqw, 13px);
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .descriptor {
    width: min(100%, 370px);
    margin: 0;
    color: color-mix(in srgb, #e8e2d5 72%, var(--muted));
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(11px, 2.5cqw, 18px);
    line-height: 1.7;
    letter-spacing: 0.08em;
  }

  .period-progress {
    width: min(100%, 370px);
    margin-top: clamp(20px, 5cqh, 46px);
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: clamp(6px, 1cqw, 10px);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .bar {
    position: relative;
    height: 1px;
    overflow: visible;
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .bar i {
    position: absolute;
    top: -1px;
    left: 0;
    width: calc(var(--period) * 100%);
    height: 3px;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 70%, transparent);
  }

  .next-period {
    display: flex;
    width: min(100%, 370px);
    align-items: baseline;
    justify-content: space-between;
    margin-top: clamp(18px, 4cqh, 38px);
  }

  .next-period strong {
    color: color-mix(in srgb, var(--accent) 80%, white);
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(10px, 2.4cqw, 17px);
    font-weight: 500;
    letter-spacing: 0.12em;
  }

  .clepsydra {
    display: flex;
    min-height: 0;
    flex-direction: column;
    align-items: flex-end;
    padding-top: clamp(22px, 5cqh, 48px);
    padding-bottom: clamp(12px, 3cqh, 28px);
  }

  .scale-title {
    margin-right: clamp(3px, 1cqw, 10px);
    writing-mode: vertical-rl;
  }

  .channel {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    margin-top: clamp(12px, 2cqh, 22px);
    border-left: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .water {
    position: absolute;
    top: 0;
    left: -1px;
    width: 2px;
    height: calc(var(--cycle) * 100%);
    background: linear-gradient(to bottom, transparent, var(--accent));
    box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 66%, transparent);
  }

  .surface {
    position: absolute;
    z-index: 3;
    top: calc(var(--cycle) * 100%);
    left: -5px;
    width: 10px;
    height: 10px;
    border: 2px solid #f8f4e9;
    border-radius: 50%;
    transform: translateY(-50%);
    background: var(--accent);
    box-shadow:
      0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent),
      0 0 24px var(--accent);
  }

  .surface::after {
    position: absolute;
    inset: -8px;
    content: "";
    border: 1px solid var(--accent);
    border-radius: 50%;
    opacity: calc(1 - var(--second));
    transform: scale(calc(0.62 + var(--second) * 1.05));
  }

  .tick {
    position: absolute;
    left: 0;
    display: grid;
    grid-template-columns: clamp(9px, 2cqw, 15px) clamp(15px, 4cqw, 28px) 1fr;
    width: 100%;
    align-items: center;
    gap: clamp(4px, 1.1cqw, 9px);
    color: color-mix(in srgb, var(--muted) 60%, transparent);
    transform: translateY(-50%);
  }

  .notch {
    width: 100%;
    height: 1px;
    background: currentColor;
  }

  .tick-branch {
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(10px, 2.4cqw, 17px);
    text-align: center;
  }

  .tick-name {
    overflow: hidden;
    max-width: 0;
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(7px, 1.6cqw, 11px);
    letter-spacing: 0.1em;
    opacity: 0;
    white-space: nowrap;
  }

  .tick.elapsed {
    color: color-mix(in srgb, var(--accent) 30%, var(--muted));
  }

  .tick.current {
    color: var(--accent);
  }

  .tick.current .notch {
    height: 2px;
    box-shadow: 0 0 10px var(--accent);
  }

  .tick.current .tick-branch {
    color: #fff9ea;
    font-size: clamp(14px, 3.4cqw, 25px);
    text-shadow: 0 0 14px var(--accent);
  }

  .tick.current .tick-name {
    max-width: 100%;
    opacity: 1;
  }

  .footer {
    gap: clamp(8px, 2cqw, 18px);
    height: clamp(18px, 4cqw, 30px);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }

  .footer-rule {
    height: 1px;
    flex: 1;
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }

  @container double-hours (max-width: 340px) {
    .branch-name {
      font-size: 7px;
      letter-spacing: 0.02em;
    }
  }

  @container double-hours (max-height: 430px) {
    .clock {
      padding: clamp(14px, 4cqw, 24px);
    }

    .title span,
    .time-rule,
    .descriptor,
    .period-progress,
    .next-period,
    .scale-title,
    .footer {
      display: none;
    }

    .composition {
      height: calc(100% - 34px);
      grid-template-columns: minmax(0, 1fr) clamp(80px, 32cqw, 120px);
      gap: 8px;
    }

    .reading {
      justify-content: center;
      padding-top: 0;
    }

    .index-line {
      width: 85%;
      padding-bottom: 7px;
    }

    .period-heading {
      display: block;
      margin: 22px 0 0;
    }

    .glyph {
      font-size: clamp(72px, 32cqw, 118px);
    }

    .period-copy {
      gap: 3px;
      margin-top: 14px;
    }

    .traditional-name {
      font-size: clamp(16px, 6cqw, 25px);
    }

    .branch-name {
      font-size: clamp(7px, 2.5cqw, 10px);
    }

    .clepsydra {
      padding: 4px 0 8px;
    }

    .channel {
      margin-top: 0;
    }

    .tick {
      grid-template-columns: 9px 18px 1fr;
      gap: 3px;
    }

    .tick-name {
      font-size: 7px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .clock {
      transition: none;
    }

    .surface::after {
      display: none;
    }
  }
</style>
