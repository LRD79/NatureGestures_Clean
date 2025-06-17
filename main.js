// 📁 main.js — Entry Point

import {
  setupChimes,
  preloadChimes,
  startChimes,
  stopChimes,
  setChimesEnabled,
  chimesLoaded
} from './audio/chimes.js';

import { startHeartbeat } from './ui/heartbeat.js';
import { fetchWeatherWithLocation } from './weather/fetchWeather.js';
import { postToSheet } from './weather/postToSheet.js';
import { stopDrone, setupDroneDependencies } from './audio/drone.js';
import { playAmbientFromWeather, stopAmbient, setupAmbient } from './audio/ambient.js';
import { setupNoise } from './audio/instruments/noise.js';
import { setupPiano } from './audio/instruments/piano.js';
import { setupBass } from './audio/instruments/bass.js';
import { setupStrings } from './audio/instruments/strings.js';
import { setupWinds } from './audio/instruments/wind.js';

import { updateSoundEnvironment } from './env/soundEnvironment.js';
import { setupEnvironmentControls } from './ui/envControls.js';
import { preloadWeatherBand, startWeatherBand, stopWeatherBand } from './audio/band.js';
import { setupGains, loadSavedVolumes } from './audio/volume.js';
import { setupAllVolumeControls } from './ui/controls.js';
import { fadeOutAllLayers } from './audio/fadeManager.js';
import { updateNowPlaying } from './ui/nowPlaying.js';

let isStarted = false;
let isCycleRunning = false;
let cycleTimer = null;
let lastKnownCoords = null;

function startCycleTimer() {
  if (cycleTimer) clearTimeout(cycleTimer);
  cycleTimer = setTimeout(() => {
    console.log("⏰ 5-minute runMusicCycle triggered at", new Date().toLocaleTimeString());
    initAndStartPlayback(lastKnownCoords);
  }, 300_000);
}

async function waitForAllAudioBuffers() {
  console.log("⏳ Waiting for audio buffers to load...");
  while (
    !window.__chimesReady ||
    !window.__ambientReady ||
    !window.__droneReady ||
    !window.__noiseReady ||
    !window.__bandReady
  ) {
    await new Promise(res => setTimeout(res, 100));
  }
  console.log("✅ All audio buffers ready.");
}

async function initAndStartPlayback(coordsOverride = null) {
  if (isCycleRunning) return;
  isCycleRunning = true;

  console.log("🌀 Starting music cycle at", new Date().toLocaleTimeString());

  try {
    await fadeOutAllLayers();
    stopDrone();
    stopAmbient();
    stopChimes();
    stopWeatherBand();

    await new Promise(res => setTimeout(res, 500));
    loadSavedVolumes();

    const { weather, lat, lon } = await fetchWeatherWithLocation(coordsOverride);
    lastKnownCoords = { lat, lon };

    const current = weather?.current;
    const location = weather?.location;
    const astro = weather?.forecast?.forecastday?.[0]?.astro;

    console.log("🛡️ Forecast raw:", weather?.forecast);
    console.log(`☁️ Condition: ${current?.condition?.text}, Cloud Cover: ${current?.cloud}%`);

    if (!current || !location) {
      console.warn("⚠️ Incomplete weather data:", { current, location, astro });
      document.getElementById("status").textContent = "⚠️ Incomplete weather data.";
      isCycleRunning = false;
      return;
    }

    updateSoundEnvironment(weather, new Date(), astro || {
      sunrise: "06:00 AM",
      sunset: "06:00 PM"
    });

    setChimesEnabled(true);

    // Track readiness flags
    window.__chimesReady = false;
    window.__ambientReady = false;
    window.__droneReady = false;
    window.__noiseReady = false;
    window.__bandReady = false;

    // Start loading assets
    const ambientPromise = playAmbientFromWeather().then(() => { window.__ambientReady = true });
    const chimesPromise = preloadChimes(current).then(() => { window.__chimesReady = true });
    const noisePromise = new Promise(res => {
      setupNoise(); // creates & starts noise
      window.__noiseReady = true;
      res();
    });
    const bandPromise = preloadWeatherBand().then(() => { window.__bandReady = true });

    // Drone doesn't preload, but we flag it ready now
    window.__droneReady = true;

    await Promise.all([ambientPromise, chimesPromise, noisePromise, bandPromise]);

    // Wait until all are fully ready before launching
    await waitForAllAudioBuffers();

    startWeatherBand();

    document.getElementById("status").textContent =
      `📍 ${location.name} | ${current.condition.text} | 🌡️ ${current.temp_c}°C | 💨 ${current.wind_kph} kph wind`;

    await postToSheet(current, weather, lat, lon);

    const now = new Date();
    updateNowPlaying({
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      condition: current.condition.text,
      biome: localStorage.getItem('biome') || 'Forest',
      season: localStorage.getItem('season') || 'Summer',
      timeOfDay: localStorage.getItem('timeOfDay') || 'Day',
      ambientTrack: localStorage.getItem('ambientTrack') || 'Auto',
      droneStatus: current.wind_kph > 5 ? 'Active' : 'Soft/Muted',
      chimeStatus: current.wind_kph > 2 ? 'Playing' : 'Silent',
      weather,
      astro: astro || {}
    });

    startHeartbeat(Date.now());
    startCycleTimer();
  } catch (err) {
    console.error("⚠️ initAndStartPlayback error:", err);
    document.getElementById("status").textContent = "⚠️ Failed to get weather/location.";
    if (lastKnownCoords && !coordsOverride) {
      console.log("🔁 Retrying with last known coordinates...");
      await initAndStartPlayback(lastKnownCoords);
    }
  }

  isCycleRunning = false;
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof setupEnvironmentControls === 'function') {
    setupEnvironmentControls();
  }

  document.getElementById("startButton").addEventListener("click", async () => {
    if (isStarted) return;

    try {
      await Tone.start();
      console.log("✅ Tone.js AudioContext started");

      setupGains();
      loadSavedVolumes();
      setupAllVolumeControls();

      setupChimes();
      setupDroneDependencies();
      setupAmbient();
      setupNoise();
      setupPiano();
      setupBass();
      setupStrings();
      setupWinds();

      isStarted = true;
      const { weather, lat, lon } = await fetchWeatherWithLocation();
      lastKnownCoords = { lat, lon };
      await initAndStartPlayback(lastKnownCoords);
    } catch (e) {
      console.error("❌ Failed to start Tone.js AudioContext:", e);
      document.getElementById("status").textContent = "❌ Audio failed to start.";
    }
  });
});
