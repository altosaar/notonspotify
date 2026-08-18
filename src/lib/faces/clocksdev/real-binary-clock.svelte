<script>
  export let time
  
  function toBinary(num) {
    return num.toString(2).padStart(8, '0');
  }
  
</script>

<div class="clock">
  <div class="group">
    <div class="label">HOURS</div>
    <div class="binary-row">
      {toBinary(time.hour)}
    </div>
  </div>
  <div class="separator"></div>
  <div class="group">
    <div class="label">MINUTES</div>
    <div class="binary-row">
      {toBinary(time.minute)}
    </div>
  </div>
  <div class="separator"></div>
  <div class="group">
    <div class="label">SECONDS</div>
    <div class="binary-row">
      {toBinary(time.second)}
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
    background: #1a1a;
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
    background: linear-gradient(90deg, transparent, rgba(109, 174, 35, 0.5), transparent);
    margin: 8px 0;
  }
</style>