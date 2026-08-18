<script>
  // Destructure time from props as required by the template
  let { time } = $props();

  // Pad a string with leading zeros
  function padZero(str, len) {
    while (str.length < len) str = "0" + str;
    return str;
  }

  // Derived states that re-calculate automatically when 'time' changes
  let derivedData = $derived.by(() => {
    // Parse numeric values from the incoming time properties
    const rawH = parseInt(time.hh, 10) || 0;
    const m = parseInt(time.mm, 10) || 0;
    const s = parseInt(time.ss, 10) || 0;

    // Convert to binary strings (Using 24-hour mode as standard for full 6-bit grid)
    const hBin = padZero(rawH.toString(2), 6);
    const mBin = padZero(m.toString(2), 6);
    const sBin = padZero(s.toString(2), 6);
    
    const fullBinary = hBin + mBin + sBin;

    // Generate array states for the 18 physical bars
    const barArray = Array.from({ length: 18 }, (_, i) => {
      const type = i < 6 ? 'hour' : i < 12 ? 'minute' : 'second';
      const isGroup = i === 6 || i === 12;
      const isOn = fullBinary.charAt(i) === '1';

      return { type, isGroup, isOn };
    });

    // Build the string for the passive digital readout
    const displayH = padZero(rawH.toString(), 2);
    const displayM = padZero(m.toString(), 2);
    const displayS = padZero(s.toString(), 2);
    const digitalString = `${displayH}:${displayM}:${displayS}`;

    return { barArray, digitalString };
  });
</script>

<div class="clock-container">
  <!-- Binary Bars Grid -->
  <div class="clock-bars">
    {#each derivedData.barArray as bar}
      <div 
        class="bar {bar.type}" 
        class:group={bar.isGroup} 
        class:on={bar.isOn}
        class:off={!bar.isOn}
      ></div>
    {/each}
  </div>
  
  <!-- Passive Footer Readout -->
  <div class="footer">
    <div class="digital-time">{derivedData.digitalString}</div>
    <div class="mode-zone">
      Mode: <span class="mode-label">24H</span>
    </div>
  </div>
</div>

<style>
  /* Layout styled to comply with the base parent template bounds */
  .clock-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    min-height: 100%;
    padding: 32px;
    box-sizing: border-box;
    background: #1e1e1e;
    font-family: 'Segoe UI', Inter, sans-serif;
  }

  .clock-bars { 
    display: flex; 
    flex-direction: row; 
    align-items: center; 
    height: 100px; 
    margin-bottom: 15px; 
  }

  .bar { 
    width: 12px; 
    height: 80px; 
    margin: 0 3px; 
    transition: all 0.3s ease; 
    border-radius: 2px; 
  }
  
  .hour { background: #2ec27e; } 
  .minute { background: #3584e4; }  
  .second { background: #e01b24; }  
  
  .on { opacity: 1; }
  .off { opacity: 0.15; }
  .group { margin-left: 15px; }

  .footer { 
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    user-select: none;
  }
  
  .digital-time {
    font-size: 0.9rem;
    font-weight: 600;
    color: #888;
    font-family: 'Consolas', monospace;
    padding-right: 50px;
  }

  /* Completely static styling—no cursor changes, no hover transformations */
  .mode-zone { 
    font-size: 0.75rem; 
    color: #888; 
    text-transform: uppercase; 
    letter-spacing: 1px;
  }
  
  .mode-label { font-weight: bold; }
</style>
