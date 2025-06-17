import { getAmbientGain, fadeGainToSaved, fadeGainToZero } from './volume.js';
import { getSoundEnvironment } from '../env/soundEnvironment.js';
import { ambientConditionMap } from '../data/ambientConditionMap.js';
import { ambientConditionAliases } from '../data/ambientConditionAliases.js';
import { getCurrentTimeAndDate } from '../utils/time.js';

let ambientPlayer = null;
let ambientLoopTimer = null;
let ambientTrackName = 'Auto';

function setupAmbient() {
  try {
    const ambientGain = getAmbientGain();
    if (!ambientGain || !ambientGain.connect) {
      console.warn("⚠️ ambientGain is not available — did you run setupGains()?");
    } else {
      console.log("🎧 Ambient gain already connected to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupAmbient", err);
  }
}

function extractTrackName(filePath) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(mp3|wav)$/i, '');
}

function formatTrackName(rawName) {
  return rawName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function stopAmbient() {
  const ambientGain = getAmbientGain();

  if (!ambientPlayer) {
    console.log("ℹ️ No ambient player to stop.");
    return;
  }

  fadeGainToZero(ambientGain);

  setTimeout(() => {
    try {
      if (ambientPlayer?.stop) ambientPlayer.stop();
      ambientPlayer?.dispose();
      console.log("🛑 Ambient player stopped and disposed.");
    } catch (err) {
      console.warn("⚠️ Error while stopping ambientPlayer:", err);
    }
    ambientPlayer = null;
  }, 10000);

  if (ambientLoopTimer) {
    clearTimeout(ambientLoopTimer);
    ambientLoopTimer = null;
  }
}

async function tryLoad(url, fallbackUrl) {
  console.log(`🎧 Attempting ambient: ${url}`);
  const ambientGain = getAmbientGain();

  try {
    const res = await fetch(url, { method: 'HEAD' });
    const actualUrl = res.ok ? url : fallbackUrl;
    const trackName = formatTrackName(extractTrackName(actualUrl));
    ambientTrackName = trackName;

    const env = getSoundEnvironment();
    if (env) env.ambientTrack = ambientTrackName;

    ambientPlayer = new Tone.Player({
      url: actualUrl,
      loop: true,
      autostart: false,
      onload: () => handleLoadedAmbient(actualUrl)
    }).connect(ambientGain);

    window.__ambientReady = true;
  } catch (err) {
    console.warn("⚠️ Failed HEAD check, falling back immediately:", err);
    const fallbackTrackName = formatTrackName(extractTrackName(fallbackUrl));
    ambientTrackName = fallbackTrackName;

    const env = getSoundEnvironment();
    if (env) env.ambientTrack = ambientTrackName;

    ambientPlayer = new Tone.Player({
      url: fallbackUrl,
      loop: true,
      autostart: false,
      onload: () => handleLoadedAmbient(fallbackUrl)
    }).connect(ambientGain);

    window.__ambientReady = true;
  }
}

function handleLoadedAmbient(url) {
  if (!ambientPlayer || !ambientPlayer.buffer || !ambientPlayer.buffer.loaded) {
    console.warn("⚠️ Ambient buffer not loaded properly — aborting.");
    return;
  }

  const duration = ambientPlayer.buffer.duration;
  if (!duration || isNaN(duration)) {
    console.warn("⚠️ Ambient file has no duration — skipping.");
    return;
  }

  fadeGainToSaved(getAmbientGain(), 'ambientVolume', 10);
  console.log(`🎧 Ambient loaded: ${url}`);

  setTimeout(() => {
    const gainVal = getAmbientGain().gain.value;
    console.log(`🎚️ ambientGain.gain.value = ${gainVal.toFixed(3)}`);
    if (gainVal < 0.01) {
      console.warn("⚠️ Ambient gain is very low — may be muted.");
    }
  }, 1200);

  const fadeTime = Math.max(duration - 10, 0);
  console.log(`⏱️ Ambient duration: ${duration}s — will fade out externally at ${fadeTime}s`);
}

function resolveConditionKey(rawCondition) {
  if (!rawCondition) return "Clear";
  const trimmed = rawCondition.trim();

  // Check for alias match
  const alias = ambientConditionAliases[trimmed];
  const baseKey = alias || trimmed;

  // Convert to Title Case (e.g., partly cloudy → Partly Cloudy)
  const titleCased = baseKey
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return titleCased;
}

async function playAmbientFromWeather() {
  const env = getSoundEnvironment();
  if (!env) {
    console.warn("❌ No sound environment available");
    return;
  }

  const { condition, season, biome, timeOfDay } = env;

  if (!condition) {
    console.warn("⚠️ No weather condition provided");
    return;
  }

  console.log("🌤️ Ambient sound environment:", { condition, season, biome, timeOfDay });

  const conditionKey = resolveConditionKey(condition);

  let files = ambientConditionMap[timeOfDay]?.[conditionKey];
  if (!files || !files.length) {
    console.warn(`❌ No ambient files found for condition "${conditionKey}" at timeOfDay "${timeOfDay}". Falling back to 'Clear'`);
    files = ambientConditionMap[timeOfDay]?.['Clear'] || ['fallback.mp3'];
  }

  const selectedFile = files[Math.floor(Math.random() * files.length)];
  const timePath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/shared/timeOfDay/${timeOfDay}/${selectedFile}`;
  const commonPath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/common/${selectedFile}`;

  stopAmbient();
  return tryLoad(timePath, commonPath);
}

function getCurrentAmbientTrack() {
  return ambientTrackName;
}

function startAmbientPlayback() {
  if (ambientPlayer?.buffer?.loaded) {
    ambientPlayer.start();
    console.log("▶️ Ambient playback started");
  } else {
    console.warn("⚠️ Ambient player not ready to start");
  }
}

export {
  setupAmbient,
  playAmbientFromWeather,
  stopAmbient,
  startAmbientPlayback,
  getCurrentAmbientTrack
};
