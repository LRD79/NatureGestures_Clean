import { getCurrentAmbientTrack } from '../audio/ambient.js';
import { getMusicSettings } from '../env/soundEnvironment.js';
import { togglePitchTestMode } from '../audio/chimes.js'; // ✅ NEW

export function updateNowPlaying({
  time,
  date,
  condition,
  biome,
  season,
  timeOfDay,
  ambientTrack,
  droneStatus,
  chimeStatus,
  weather = {},
  astro = {},
}) {
  const panel = document.getElementById("nowPlayingContent");
  if (!panel) {
    console.warn("⚠️ nowPlayingContent panel not found in DOM.");
    return;
  }

  console.log("🧭 updateNowPlaying called with:", {
    time, date, condition, biome, season, timeOfDay,
    ambientTrack, droneStatus, chimeStatus, weather, astro
  });

  const displayedAmbient =
    ambientTrack && ambientTrack !== 'Auto'
      ? ambientTrack
      : getCurrentAmbientTrack();

  let html = `
    📅 ${date} @ ${time}<br>
    🌦️ Weather: ${condition}<br>
    🌍 Biome: ${biome}, ${season}, ${timeOfDay}<br>
    🎶 Ambient: ${displayedAmbient || 'None'}<br>
    🌫️ Drone: ${droneStatus}<br>
    🔔 Chimes: ${chimeStatus}<br><br>
  `;

  const location = weather.location || {};
  const current = weather.current || {};

  if (!weather.location) console.warn("⚠️ weather.location missing:", weather);
  if (!weather.current) console.warn("⚠️ weather.current missing:", weather);

  const {
    temp_c,
    wind_kph,
    wind_dir,
    condition: weatherCondition,
    uv,
    cloud
  } = current;

  const {
    moon_phase,
    sunrise,
    sunset,
    moonrise,
    moonset
  } = astro;

  html += `
    <strong>🌍 Location:</strong> ${location.name || 'Unknown'}, ${location.country || ''}<br>
    <strong>🌤️ Condition:</strong> ${weatherCondition?.text || 'Unknown'}<br>
    <strong>🌡️ Temp:</strong> ${temp_c ?? '--'}°C<br>
    <strong>🌬️ Wind:</strong> ${wind_kph ? Math.round(wind_kph / 1.609) : '--'} mph ${wind_dir || ''}<br>
    <em>→ Drives: Chimes, Drone panning</em><br><br>

    <strong>🌕 Moon Phase:</strong> ${moon_phase || '--'}<br>
    <em>→ Drives: Ambient sound variation</em><br><br>

    <strong>🌅 Sunrise:</strong> ${sunrise || '--'}<br>
    <strong>🌇 Sunset:</strong> ${sunset || '--'}<br>
    <strong>🌙 Moonrise:</strong> ${moonrise || '--'}<br>
    <strong>🌘 Moonset:</strong> ${moonset || '--'}<br>
    <em>→ Drives: Ambient mood + Time of Day layers</em><br><br>

    <strong>☁️ Cloud Cover:</strong> ${cloud ?? '--'}%<br>
    <strong>☀️ UV Index:</strong> ${uv ?? '--'}<br>
    <em>→ Drives: Genre, Mood, Reverb</em><br>
  `;

  const { key, bpm, genre, mood, energy } = getMusicSettings();

  html += `
    <br><hr><br>
    <strong>🎼 Weather Music Profile</strong><br>
    <strong>Key:</strong> ${key}<br>
    <strong>BPM:</strong> ${bpm}<br>
    <strong>Genre:</strong> ${genre}<br>
    <strong>Mood:</strong> ${mood}<br>
    <strong>Energy:</strong> ${energy}<br>
    <em>→ Driven by: Temperature, Humidity, Cloud Cover, UV</em><br><br>

    <button id="pitchToggleBtn" style="margin-top:8px;padding:4px 10px;border-radius:6px;border:none;background:#333;color:#fff;cursor:pointer;">
      🎛️ Toggle Pitch Test (Chimes)
    </button>
  `;

  panel.innerHTML = html;

  // 🧪 Wire up toggle button
  const pitchButton = document.getElementById("pitchToggleBtn");
  if (pitchButton) {
    pitchButton.addEventListener("click", () => {
      togglePitchTestMode();
      pitchButton.textContent = pitchButton.textContent.includes("Octave")
        ? "🎛️ Toggle Pitch Test (Chimes)"
        : "🎛️ Toggle Pitch Test (Octave Down)";
    });
  }

  console.log("✅ NowPlaying panel updated");
}
