<script>
  let { time } = $props();

  // the time IS the color: #HHMMSS
  const hex = $derived(`#${time.hh}${time.mm}${time.ss}`);

  // hours max out at 23, so red stays low and the field is always dark-ish,
  // but seconds can push blue up — compute luminance anyway
  const light = $derived.by(() => {
    const r = parseInt(time.hh, 16) || 0;
    const g = parseInt(time.mm, 16) || 0;
    const b = parseInt(time.ss, 16) || 0;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 128;
  });
</script>

<div class="field" style:background={hex} class:light>
  <code class="value">{hex}</code>
  <p class="note">
    the day only ever visits 86 400 of 16 777 216 colors.<br />
    this is the one for right now.
  </p>
</div>

<style>
  .field {
    display: grid;
    place-content: center;
    gap: 28px;
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: 32px;
    color: rgba(255, 255, 255, 0.92);
    text-align: center;
    transition: background 0.9s linear;
  }

  .field.light {
    color: rgba(0, 0, 0, 0.85);
  }

  .value {
    font: 300 clamp(48px, 10vw, 120px) / 1 ui-monospace, 'SF Mono', Menlo, monospace;
    letter-spacing: 0.06em;
    font-variant-numeric: tabular-nums;
  }

  .note {
    margin: 0;
    font: 400 clamp(11px, 1.4vw, 14px) / 1.7 ui-monospace, 'SF Mono', Menlo, monospace;
    letter-spacing: 0.08em;
    opacity: 0.55;
  }
</style>