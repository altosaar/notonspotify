<script>
  export let time
  
  function toBinary(num) {
    return num.toString(2).padStart(4, '0');
  }
  
  $: hh1 = Math.floor(time.hh / 10);
  $: hh2 = time.hh % 10;
  $: mm1 = Math.floor(time.mm / 10);
  $: mm2 = time.mm % 10;
  $: ss1 = Math.floor(time.ss / 10);
  $: ss2 = time.ss % 10;
</script>

<div class="clock">
  <div class="group">
    <div class="label">HOURS</div>
    <div class="binary-row">
      {toBinary(hh1)}{toBinary(hh2)}
    </div>
  </div>
  <div class="separator"></div>
  <div class="group">
    <div class="label">MINUTES</div>
    <div class="binary-row">
      {toBinary(mm1)}{toBinary(mm2)}
    </div>
  </div>
  <div class="separator"></div>
  <div class="group">
    <div class="label">SECONDS</div>
    <div class="binary-row">
      {toBinary(ss1)}{toBinary(ss2)}
    </div>
  </div>
</div>

<style>
  .clock {
    display: flex;
    flex-direction: column;
    place-content: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: 32px;
    color: white;
    font: 400 clamp(16px, 3vw, 30px)/1 monospace;
    letter-spacing: -0.03em;
    background: #1a1a2e;
  }
  
  .group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
  }
  
  .label {
    font-size: clamp(10px, 1.5vw, 14px);
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .binary-row {
    font-size: clamp(24px, 5vw, 48px);
    font-weight: bold;
    letter-spacing: 0.2em;
  }
  
  .colon {
    margin: 0 8px;
    opacity: 0.8;
  }
 
  .separator {
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(109, 74, 255, 0.5), transparent);
    margin: 8px 0;
  }
</style>