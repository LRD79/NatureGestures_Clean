// 📁 /ui/debugPanel.js

export function updateNowPlaying({
  env,
  ambientPath,
  chimePaths,
  droneType,
  noiseType,
  activeLayers = {}
}) {
  const panel = document.getElementById("nowPlayingContent");
  if (!panel || !env) return;

  const lines = [
    `🗓️ ${new Date().toLocaleString()}`,
    `🌤️ Condition: ${env.condition}`,
    `🕰️ Time of Day: ${env.timeOfDay}`,
    `🍃 Biome: ${env.biome}`,
    `☀️ Season: ${env.season}`,
    env.moon_phase ? `🌙 Moon: ${env.moon_phase}` : '',
    '',
    `🎶 Ambient: ${ambientPath ? ambientPath.split('/').pop() : 'None'}`,
    `🔔 Chimes: ${chimePaths?.length || 0} loaded`,
    `🌬️ Noise: ${noiseType || 'off'}`,
    `🎛️ Drone: ${droneType || 'off'}`,
    '',
    `🧠 Layers:`,
    `• Ambient: ${activeLayers.ambient ? 'on' : 'off'}`,
    `• Chimes: ${activeLayers.chimes ? 'on' : 'off'}`,
    `• Noise: ${activeLayers.noise ? 'on' : 'off'}`,
    `• Drone: ${activeLayers.drone ? 'on' : 'off'}`
  ].filter(Boolean);

  panel.innerText = lines.join('\n');
}

// Add this HTML somewhere in index.html or layout template:
/*
<div id="nowPlayingPanel" style="
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 1rem;
  border-radius: 1rem;
  max-width: 300px;
  font-family: monospace;
  font-size: 0.8rem;
  z-index: 1000;
">
  <strong>🎧 Now Playing</strong><br>
  <div id="nowPlayingContent">Loading...</div>
</div>
*/
