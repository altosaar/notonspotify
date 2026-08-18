<script>
  export let time

  const BUFFER_SIZE = 19
  const BUFFER_CENTER = Math.floor(BUFFER_SIZE / 2)
  const FONT_SIZE_CQW = 750 / 1952 * 100
  const OVERLAP_CQW = FONT_SIZE_CQW * (320 / 500)
  const SCROLL_PER_SECOND_CQW = FONT_SIZE_CQW * (16 / 600)
  const MINUTE_19_PADDING_CQW = 70 / 1952 * 100

  let cachedMinute = -1
  let cachedHour = -1
  let bufferRows = []

  function rowDigits(currentMinute, minute) {
    const minuteText = String(minute).padStart(2, '0')
    const onesOnly = ['', minuteText[1]]

    if (currentMinute % 10 === 0) {
      return minute % 10 === 9 ? [...minuteText] : onesOnly
    }

    if (currentMinute % 10 === 1 && minute % 10 === 0) return onesOnly
    return minute % 10 === 0 ? [...minuteText] : onesOnly
  }

  function createBuffer(minute, hour) {
    const nextHour = hour % 12 + 1

    return Array.from({ length: BUFFER_SIZE }, (_, index) => {
      const rowMinute = (minute + index - BUFFER_CENTER + 60) % 60
      let embeddedHour = null

      if (rowMinute === 0 && minute >= 2) embeddedHour = nextHour
      if (rowMinute === 59 && minute === 0) embeddedHour = (hour + 10) % 12 + 1

      return {
        minute: rowMinute,
        digits: rowDigits(minute, rowMinute),
        embeddedHour,
      }
    })
  }

  $: if (time.minute !== cachedMinute || time.hour12 !== cachedHour) {
    cachedMinute = time.minute
    cachedHour = time.hour12
    bufferRows = createBuffer(cachedMinute, cachedHour)
  }

  $: smoothSeconds = time.second + time.millisecond / 1000
  $: scrollOffset = -smoothSeconds * SCROLL_PER_SECOND_CQW
  $: rollingTens = time.minute % 10 === 9
  $: rollingHour = time.minute === 59
</script>

<div
  class="euclid-clock"
  role="img"
  aria-label={`Euclid clock showing ${time.hh12}:${time.mm}`}
  style={`font-size:${FONT_SIZE_CQW}cqw`}
>
  <div class="clock" aria-hidden="true">
    <div
      class="hours"
      style={`margin-top:${rollingHour ? scrollOffset : 0}cqw;padding-right:${time.minute === 19 ? MINUTE_19_PADDING_CQW : 0}cqw`}
    >{time.hour12}:</div>

    <div class="minute-tens" style={`margin-top:${rollingTens ? scrollOffset : 0}cqw`}>
      <div class="digit-row">
        <div class="digit">{Math.floor(time.minute / 10)}</div>
      </div>
    </div>

    <div
      class="minute-roll"
      style={`margin-left:-${OVERLAP_CQW}cqw;margin-top:${scrollOffset}cqw`}
    >
      {#each bufferRows as row (row.minute)}
        <div class="minute-row">
          <div class="digit-row" class:has-hour={row.embeddedHour !== null}>
            {#each row.digits as digit}
              <div class="digit">{digit}</div>
            {/each}
            {#if row.embeddedHour !== null}
              <span class="embedded-hour">{row.embeddedHour}:</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .euclid-clock {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
    color: #fff;
    background: #000;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    font-weight: 300;
    font-synthesis: none;
    line-height: 80%;
    text-align: center;
    user-select: none;
  }

  .euclid-clock,
  .euclid-clock * {
    box-sizing: border-box;
  }

  .clock {
    display: flex;
    align-items: center;
  }

  .minute-roll {
    display: flex;
    flex-direction: column;
  }

  .digit-row {
    display: flex;
    flex-direction: row;
  }

  .digit {
    width: 0.65em;
  }

  .has-hour {
    position: relative;
  }

  .embedded-hour {
    position: absolute;
    right: 1.31em;
    white-space: nowrap;
  }
</style>
