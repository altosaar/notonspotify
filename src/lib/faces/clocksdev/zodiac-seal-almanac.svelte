<script>
  let { time } = $props();

  const zodiac = [
    { branch: "子", animal: "鼠", pinyin: "SHǓ", english: "RAT", range: "23:00—01:00", short: "23—01" },
    { branch: "丑", animal: "牛", pinyin: "NIÚ", english: "OX", range: "01:00—03:00", short: "01—03" },
    { branch: "寅", animal: "虎", pinyin: "HǓ", english: "TIGER", range: "03:00—05:00", short: "03—05" },
    { branch: "卯", animal: "兔", pinyin: "TÙ", english: "RABBIT", range: "05:00—07:00", short: "05—07" },
    { branch: "辰", animal: "龙", pinyin: "LÓNG", english: "DRAGON", range: "07:00—09:00", short: "07—09" },
    { branch: "巳", animal: "蛇", pinyin: "SHÉ", english: "SNAKE", range: "09:00—11:00", short: "09—11" },
    { branch: "午", animal: "马", pinyin: "MǍ", english: "HORSE", range: "11:00—13:00", short: "11—13" },
    { branch: "未", animal: "羊", pinyin: "YÁNG", english: "GOAT", range: "13:00—15:00", short: "13—15" },
    { branch: "申", animal: "猴", pinyin: "HÓU", english: "MONKEY", range: "15:00—17:00", short: "15—17" },
    { branch: "酉", animal: "鸡", pinyin: "JĪ", english: "ROOSTER", range: "17:00—19:00", short: "17—19" },
    { branch: "戌", animal: "狗", pinyin: "GǑU", english: "DOG", range: "19:00—21:00", short: "19—21" },
    { branch: "亥", animal: "猪", pinyin: "ZHŪ", english: "PIG", range: "21:00—23:00", short: "21—23" },
  ];

  // BEGIN_ZODIAC_PALETTES
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
  // END_ZODIAC_PALETTES

  const two = (value) => String(value).padStart(2, "0");

  // BEGIN_ZODIAC_LOGIC
  function getZodiacState(hour, minute, second = 0, millisecond = 0) {
    const totalSeconds =
      hour * 3600 + minute * 60 + second + millisecond / 1000;
    const shiftedSeconds = (totalSeconds + 3600) % 86400;
    const index = Math.floor(shiftedSeconds / 7200);
    const progress = (shiftedSeconds % 7200) / 7200;

    return { index, progress };
  }
  // END_ZODIAC_LOGIC

  let state = $derived(
    getZodiacState(
      time.hour,
      time.minute,
      time.second,
      time.millisecond,
    ),
  );
  let current = $derived(zodiac[state.index]);
  let next = $derived(zodiac[(state.index + 1) % zodiac.length]);
  let palette = $derived(palettes[state.index]);
  let periodPercent = $derived(Math.round(state.progress * 100));
  let dateLabel = $derived(
    `${time.year}.${two(time.month)}.${two(time.day)}`,
  );
  let styleVars = $derived(
    `--period-width:${state.progress * 100}%;--scene-a:${palette.a};--scene-b:${palette.b};--scene-c:${palette.c};--scene-accent:${palette.accent};--scene-muted:${palette.muted}`,
  );
</script>

<div
  class="clock"
  style={styleVars}
  role="img"
  aria-label={`当前生肖 ${current.animal}，${current.pinyin}, ${current.english}；${current.branch}时；现代时间 ${current.range}；一个生肖对应两个小时；当前 ${time.hh}:${time.mm}:${time.ss}`}
>
  <header class="masthead">
    <div class="brand">
      <strong>十二生肖</strong>
      <span>ZODIAC SEAL ALMANAC</span>
    </div>

    <div class="rule-note">
      <strong>一兽值守两小时</strong>
      <span>1 ANIMAL = 2 HOURS</span>
    </div>

    <time class="digital" datetime={`${time.hh}:${time.mm}:${time.ss}`}>
      <span>{time.hh}:{time.mm}</span>
      <small class="second-seal" aria-label={`${time.ss}秒`}>{time.ss}</small>
    </time>
  </header>

  <main class="stage">
    <section class="current-panel" aria-label={`当前 ${current.animal}，${current.range}`}>
      <div class="current-kicker">
        <strong>当前生肖</strong>
        <span>CURRENT ZODIAC</span>
      </div>

      <div class="current-seal">
        <span class="branch-tag">{current.branch}时</span>
        <span class="main-animal" data-animal={current.animal}>{current.animal}</span>
        <span class="animal-name">{current.pinyin} · {current.english}</span>
      </div>

      <div class="current-meta">
        <div class="range-row">
          <span>值守时段</span>
          <strong>{current.range}</strong>
        </div>
        <div class="progress-track" aria-hidden="true">
          <div></div>
        </div>
        <div class="progress-row">
          <span>本时段进度</span>
          <strong>{periodPercent}%</strong>
        </div>
      </div>

      <span class="current-index">{two(state.index + 1)}<small>/12</small></span>
    </section>

    <section class="atlas" aria-label="十二生肖两小时时段印谱">
      <header class="atlas-head">
        <div>
          <strong>生肖印谱</strong>
          <span>TWELVE TWO-HOUR SEALS</span>
        </div>
      </header>

      <div class="zodiac-grid">
        {#each zodiac as sign, index}
          <article
            class="seal-card"
            class:past={index < state.index}
            class:current={index === state.index}
            class:future={index > state.index}
            data-phase={index < state.index ? "past" : index === state.index ? "current" : "future"}
            aria-label={`${sign.animal}，${sign.branch}时，${sign.range}，${index < state.index ? "值守已毕" : index === state.index ? "当前值守" : "等待值守"}`}
            style={`--card-a:${palettes[index].a};--card-accent:${palettes[index].accent}`}
          >
            <span class="completion-stamp" aria-hidden="true">毕</span>
            <span class="seal-animal">{sign.animal}</span>
            <div class="seal-meta">
              <strong>{sign.branch}</strong>
              <span>{sign.short}</span>
            </div>
          </article>
        {/each}
      </div>
    </section>
  </main>

  <footer class="footer">
    <span class="footer-rule">CYCLE START · RAT 23:00</span>
    <span class="footer-mark" aria-hidden="true">印</span>
    <span>{dateLabel}</span>
    <span class="next">NEXT · {next.animal}</span>
  </footer>
</div>

<style>
  @property --scene-a {
    syntax: "<color>";
    inherits: true;
    initial-value: #05070d;
  }

  @property --scene-b {
    syntax: "<color>";
    inherits: true;
    initial-value: #111831;
  }

  @property --scene-c {
    syntax: "<color>";
    inherits: true;
    initial-value: #080b14;
  }

  @property --scene-accent {
    syntax: "<color>";
    inherits: true;
    initial-value: #9eb8ff;
  }

  @property --scene-muted {
    syntax: "<color>";
    inherits: true;
    initial-value: #7081ad;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .clock {
    --paper: color-mix(in srgb, #dfd0af 78%, var(--scene-accent));
    --paper-light: color-mix(in srgb, #f4ecd9 88%, var(--scene-accent));
    --paper-edge: color-mix(in srgb, #c9b083 74%, var(--scene-b));
    --ink: color-mix(in srgb, #2d2017 76%, var(--scene-c));
    --ink-soft: color-mix(in srgb, #6c5540 74%, var(--scene-muted));
    --cinnabar: color-mix(in srgb, var(--scene-a) 66%, var(--scene-accent));
    --cinnabar-dark: color-mix(in srgb, var(--scene-a) 82%, var(--scene-accent));
    --shell-text: var(--scene-accent);
    --shell-muted: color-mix(in srgb, var(--scene-muted) 64%, #ffffff);

    container: zodiac-ledger / size;
    position: relative;
    display: grid;
    width: 100%;
    height: 100%;
    min-height: 100%;
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
    isolation: isolate;
    padding: clamp(17px, 3.9cqw, 32px);
    color: var(--shell-text);
    background:
      radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--scene-b) 72%, transparent), transparent 45%),
      radial-gradient(circle at 86% 84%, color-mix(in srgb, var(--scene-accent) 18%, transparent), transparent 36%),
      linear-gradient(145deg, var(--scene-a), var(--scene-c) 62%, color-mix(in srgb, var(--scene-b) 68%, var(--scene-c)));
    font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    transition:
      --scene-a 1.4s ease,
      --scene-b 1.4s ease,
      --scene-c 1.4s ease,
      --scene-accent 1.4s ease,
      --scene-muted 1.4s ease;
  }

  .clock::before,
  .clock::after {
    position: absolute;
    z-index: -1;
    inset: 0;
    content: "";
    pointer-events: none;
  }

  .clock::before {
    opacity: 0.18;
    background-image:
      repeating-linear-gradient(3deg, transparent 0 6px, rgba(255, 255, 255, 0.1) 7px, transparent 8px 14px),
      repeating-linear-gradient(93deg, transparent 0 9px, rgba(255, 255, 255, 0.08) 10px, transparent 11px 19px);
    mix-blend-mode: screen;
  }

  .clock::after {
    box-shadow:
      inset 0 0 clamp(32px, 9cqw, 76px) color-mix(in srgb, #000000 34%, transparent),
      inset 0 0 0 1px color-mix(in srgb, var(--scene-accent) 26%, transparent);
  }

  .masthead,
  .footer {
    position: relative;
    z-index: 3;
    display: grid;
    align-items: center;
  }

  .masthead {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: clamp(12px, 3cqw, 24px);
    padding-bottom: clamp(10px, 2.1cqw, 17px);
    border-bottom: 1px solid color-mix(in srgb, var(--shell-muted) 42%, transparent);
  }

  .brand {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: clamp(4px, 0.8cqw, 7px);
  }

  .brand strong {
    flex: none;
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(24px, 5cqw, 36px);
    font-weight: 600;
    letter-spacing: 0.14em;
  }

  .brand span,
  .rule-note span,
  .atlas-head span {
    color: var(--shell-muted);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(12px, 2cqw, 14px);
    font-weight: 650;
    letter-spacing: 0.1em;
  }

  .brand span {
    line-height: 1.1;
    white-space: nowrap;
  }

  .rule-note {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-left: clamp(10px, 2cqw, 16px);
    border-left: 2px solid color-mix(in srgb, var(--scene-accent) 76%, transparent);
  }

  .rule-note strong {
    color: var(--scene-accent);
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(15px, 2.8cqw, 20px);
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .digital {
    display: flex;
    align-items: center;
    gap: clamp(5px, 1.1cqw, 8px);
    color: var(--scene-accent);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(31px, 6.2cqw, 44px);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    letter-spacing: -0.055em;
  }

  .second-seal {
    display: grid;
    flex: none;
    width: clamp(23px, 4.8cqw, 33px);
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--scene-accent) 76%, transparent);
    color: var(--scene-accent);
    background: color-mix(in srgb, var(--scene-accent) 8%, transparent);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--scene-a) 52%, transparent);
    font-size: clamp(11px, 2.2cqw, 15px);
    line-height: 1;
    letter-spacing: 0;
  }

  .stage {
    position: relative;
    z-index: 1;
    display: grid;
    min-height: 0;
    grid-template-columns: minmax(0, 0.84fr) minmax(0, 1.36fr);
    gap: clamp(14px, 3.2cqw, 26px);
    padding: clamp(14px, 3.2cqh, 25px) 0;
  }

  .current-panel,
  .atlas {
    min-width: 0;
    min-height: 0;
  }

  .current-panel {
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    padding: clamp(12px, 2.7cqw, 21px);
    border: 2px solid var(--cinnabar);
    color: var(--cinnabar-dark);
    background:
      linear-gradient(150deg, var(--paper-light), var(--paper) 68%, var(--paper-edge));
    box-shadow:
      inset 0 0 0 3px color-mix(in srgb, var(--paper-light) 82%, transparent),
      0 7px 20px rgba(73, 43, 24, 0.12);
  }

  .current-panel::before,
  .current-panel::after {
    position: absolute;
    content: "";
    pointer-events: none;
  }

  .current-panel::before {
    inset: 5px;
    border: 1px solid color-mix(in srgb, var(--cinnabar) 55%, transparent);
  }

  .current-panel::after {
    inset: 0;
    opacity: 0.11;
    background: repeating-linear-gradient(
      12deg,
      transparent 0 8px,
      var(--cinnabar-dark) 9px,
      transparent 10px 20px
    );
    mix-blend-mode: multiply;
    mask: linear-gradient(125deg, transparent, black 34%, transparent 70%);
  }

  .current-kicker {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .current-kicker strong {
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(17px, 3.3cqw, 23px);
    letter-spacing: 0.12em;
  }

  .current-kicker span {
    color: color-mix(in srgb, var(--cinnabar-dark) 72%, transparent);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(12px, 2cqw, 14px);
    font-weight: 700;
    letter-spacing: 0.11em;
  }

  .current-seal {
    position: relative;
    z-index: 1;
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .branch-tag {
    position: absolute;
    top: 11%;
    right: 0;
    padding: 3px 4px;
    border: 1px solid color-mix(in srgb, var(--cinnabar) 55%, transparent);
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(13px, 2.4cqw, 17px);
    writing-mode: vertical-rl;
  }

  .main-animal {
    position: relative;
    display: inline-block;
    isolation: isolate;
    color: color-mix(in srgb, var(--cinnabar-dark) 22%, var(--paper-light));
    font-family: "Kaiti SC", "STKaiti", "KaiTi", serif;
    font-size: clamp(82px, 22cqw, 154px);
    font-weight: 600;
    line-height: 0.88;
    -webkit-text-stroke: 1px color-mix(in srgb, var(--cinnabar-dark) 62%, var(--paper-edge));
    paint-order: stroke fill;
    text-shadow: 1px 1px 0 color-mix(in srgb, var(--paper-light) 44%, transparent);
  }

  .main-animal::before {
    position: absolute;
    z-index: 2;
    inset: 0;
    content: attr(data-animal);
    clip-path: inset(calc(100% - var(--period-width) - 2%) 0 calc(var(--period-width) - 2%) 0);
    color: var(--cinnabar);
    -webkit-text-stroke: 0;
    text-shadow: 0 0 4px color-mix(in srgb, var(--cinnabar) 42%, transparent);
    pointer-events: none;
    transition: clip-path 140ms linear;
  }

  .main-animal::after {
    position: absolute;
    z-index: 1;
    inset: 0;
    content: attr(data-animal);
    clip-path: inset(calc(100% - var(--period-width)) 0 0 0);
    color: var(--cinnabar-dark);
    -webkit-text-stroke: 0;
    text-shadow: 1px 1px 0 color-mix(in srgb, var(--cinnabar) 22%, transparent);
    transition: clip-path 140ms linear;
  }

  .animal-name {
    max-width: 100%;
    margin-top: clamp(9px, 1.9cqw, 14px);
    overflow: visible;
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(13px, 2.5cqw, 18px);
    font-weight: 750;
    letter-spacing: 0.08em;
    line-height: 1.2;
    text-align: center;
    white-space: normal;
  }

  .current-meta {
    position: relative;
    z-index: 1;
  }

  .range-row,
  .progress-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .range-row {
    padding-top: clamp(8px, 1.8cqw, 13px);
    border-top: 1px solid color-mix(in srgb, var(--cinnabar) 34%, transparent);
    font-size: clamp(13px, 2.4cqw, 17px);
  }

  .range-row span,
  .progress-row span {
    color: var(--ink-soft);
  }

  .range-row strong,
  .progress-row strong {
    font-weight: 750;
  }

  .progress-track {
    height: clamp(5px, 1cqw, 7px);
    margin: clamp(8px, 1.6cqw, 12px) 0 5px;
    overflow: hidden;
    background: color-mix(in srgb, var(--cinnabar) 14%, transparent);
  }

  .progress-track div {
    width: var(--period-width);
    height: 100%;
    background: var(--cinnabar);
  }

  .progress-row {
    font-size: clamp(12px, 2cqw, 14px);
  }

  .current-index {
    position: absolute;
    z-index: 2;
    top: clamp(12px, 2.7cqw, 21px);
    right: clamp(12px, 2.7cqw, 21px);
    color: color-mix(in srgb, var(--cinnabar-dark) 58%, transparent);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(17px, 3.1cqw, 22px);
    font-weight: 700;
  }

  .current-index small {
    font-size: 0.55em;
  }

  .atlas {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: clamp(8px, 1.7cqw, 13px);
  }

  .atlas-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
  }

  .atlas-head div {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: clamp(7px, 1.5cqw, 11px);
  }

  .atlas-head strong {
    flex: none;
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(21px, 3.9cqw, 28px);
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  .zodiac-grid {
    display: grid;
    min-width: 0;
    min-height: 0;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: clamp(6px, 1.35cqw, 10px);
  }

  .seal-card {
    --card-color: color-mix(in srgb, var(--card-a) 66%, var(--card-accent));
    --card-dark: color-mix(in srgb, var(--card-a) 82%, var(--card-accent));

    position: relative;
    display: grid;
    min-width: 0;
    min-height: 0;
    grid-template-rows: minmax(0, 1fr) auto;
    place-items: center;
    padding: clamp(6px, 1.35cqw, 10px);
    border: 1px solid color-mix(in srgb, var(--card-color) 82%, transparent);
    color: var(--card-dark);
    background:
      linear-gradient(140deg, color-mix(in srgb, var(--card-accent) 34%, transparent), transparent 58%),
      color-mix(in srgb, var(--paper-light) 72%, var(--card-accent));
    box-shadow:
      inset 0 0 0 2px color-mix(in srgb, var(--paper) 66%, transparent),
      0 2px 6px rgba(67, 38, 20, 0.08);
    transition:
      color 360ms ease,
      background-color 360ms ease,
      border-color 360ms ease,
      box-shadow 360ms ease;
  }

  .seal-card::before {
    position: absolute;
    inset: 3px;
    content: "";
    border: 1px solid currentColor;
    opacity: 0.28;
    pointer-events: none;
  }

  .seal-card::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    width: 0;
    height: clamp(4px, 0.8cqw, 6px);
    content: "";
    opacity: 0;
    background: var(--card-color);
    transition:
      width 160ms linear,
      opacity 160ms ease;
  }

  .seal-card.past::before {
    opacity: 0.42;
  }

  .seal-card.future::before {
    opacity: 0.18;
  }

  .completion-stamp {
    --stamp-color: color-mix(in srgb, #761814 90%, var(--card-color));

    position: absolute;
    z-index: 4;
    top: clamp(4px, 0.9cqw, 7px);
    right: clamp(4px, 0.9cqw, 7px);
    display: grid;
    width: clamp(20px, 4.2cqw, 29px);
    aspect-ratio: 1;
    place-items: center;
    border: 1.5px solid var(--stamp-color);
    color: var(--stamp-color);
    background: color-mix(in srgb, #761814 10%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--stamp-color) 42%, transparent);
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(12px, 2.35cqw, 16px);
    font-weight: 800;
    line-height: 1;
    opacity: 0;
    text-shadow: 0 0 0.35px var(--stamp-color);
    pointer-events: none;
    transform: rotate(-8deg) scale(0.82);
    transition:
      opacity 260ms ease,
      transform 260ms ease;
  }

  .seal-card.past .completion-stamp {
    opacity: 0.96;
    transform: rotate(-8deg) scale(1);
  }

  .seal-card.past::after {
    width: 100%;
    opacity: 0.78;
  }

  .seal-card.current {
    border-color: var(--card-dark);
    color: var(--paper-light);
    background: var(--card-color);
    box-shadow:
      inset 0 0 0 2px color-mix(in srgb, var(--paper-light) 24%, transparent),
      0 5px 13px color-mix(in srgb, var(--card-dark) 34%, transparent);
  }

  .seal-card.current::after {
    width: var(--period-width);
    opacity: 1;
    background: var(--paper-light);
  }

  .seal-animal {
    align-self: end;
    font-family: "Kaiti SC", "STKaiti", "KaiTi", serif;
    font-size: clamp(38px, 7.5cqw, 54px);
    font-weight: 600;
    line-height: 0.92;
  }

  .seal-meta {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    padding-top: clamp(4px, 0.8cqw, 6px);
    border-top: 1px solid currentColor;
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .seal-meta strong {
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(14px, 2.35cqw, 16px);
  }

  .seal-meta span {
    overflow: hidden;
    font-size: clamp(13px, 2.25cqw, 16px);
    font-weight: 700;
    letter-spacing: -0.03em;
    text-overflow: clip;
    white-space: nowrap;
  }

  .footer {
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    gap: clamp(10px, 2.2cqw, 18px);
    min-height: clamp(24px, 4.3cqw, 32px);
    padding-top: clamp(8px, 1.7cqw, 13px);
    border-top: 1px solid color-mix(in srgb, var(--shell-muted) 42%, transparent);
    color: var(--shell-muted);
    font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    font-size: clamp(12px, 2.2cqw, 15px);
    font-variant-numeric: tabular-nums;
    font-weight: 650;
    letter-spacing: 0.06em;
  }

  .footer-rule {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .footer-mark {
    display: grid;
    width: clamp(19px, 3.7cqw, 27px);
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid var(--scene-accent);
    color: var(--scene-accent);
    font-family: "Songti SC", "STSong", "SimSun", serif;
    font-size: clamp(12px, 2.5cqw, 17px);
    letter-spacing: 0;
  }

  .next {
    color: var(--scene-accent);
  }

  @container zodiac-ledger (max-width: 420px) {
    .clock {
      padding: 14px;
    }

    .masthead {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 9px;
      padding-bottom: 8px;
    }

    .brand span,
    .rule-note,
    .atlas-head,
    .footer-rule,
    .seal-meta span {
      display: none;
    }

    .stage {
      grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);
      gap: 10px;
      padding: 11px 0;
    }

    .current-panel {
      padding: 10px;
    }

    .current-kicker strong {
      font-size: 17px;
    }

    .current-kicker span {
      display: none;
    }

    .animal-name {
      font-size: 13px;
    }

    .range-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .current-index {
      top: 10px;
      right: 10px;
    }

    .atlas {
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
    }

    .zodiac-grid {
      gap: 5px;
    }

    .seal-card {
      padding: 5px;
    }

    .seal-meta {
      justify-content: center;
      padding-top: 3px;
    }

    .seal-meta strong {
      font-size: 15px;
    }

    .footer {
      grid-template-columns: auto 1fr auto;
      font-size: 13px;
    }
  }

  @container zodiac-ledger (max-height: 330px) {
    .clock {
      padding: 10px;
    }

    .brand span,
    .rule-note,
    .footer-rule,
    .next,
    .atlas-head span,
    .progress-row span {
      display: none;
    }

    .masthead {
      padding-bottom: 7px;
    }

    .stage {
      gap: 9px;
      padding: 8px 0;
    }

    .current-panel {
      padding: 8px;
    }

    .current-kicker span,
    .branch-tag {
      display: none;
    }

    .animal-name {
      margin-top: 5px;
    }

    .range-row {
      padding-top: 5px;
    }

    .progress-track {
      margin: 5px 0 2px;
    }

    .atlas {
      gap: 5px;
    }

    .zodiac-grid {
      gap: 4px;
    }

    .seal-card {
      padding: 4px;
    }

    .footer {
      grid-template-columns: 1fr auto;
      min-height: 18px;
      padding-top: 5px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .clock,
    .seal-card,
    .seal-card::after,
    .completion-stamp,
    .main-animal::before,
    .main-animal::after {
      transition: none;
    }
  }
</style>
