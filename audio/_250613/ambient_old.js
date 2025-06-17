import { ambientGain } from './volume.js';
import { getSoundEnvironment } from '../env/soundEnvironment.js';
import { ambientConditionMap } from '../data/ambientConditionMap.js';
import { ambientConditionAliases } from '../data/ambientConditionAliases.js';
import { getCurrentTimeAndDate } from '../utils/time.js';
import { fadeGainToSaved, fadeGainToZero } from './volume.js';

let ambientPlayer = null;
let ambientLoopTimer = null;
let ambientTrackName = 'Auto';

function extractTrackName(filePath) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(mp3|wav)$/i, '');
}

function formatTrackName(rawName) {
  return rawName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function stopAmbient() {
  if (!ambientPlayer) {
    console.log("ℹ️ No ambient player to stop.");
    return;
  }

  fadeGainToZero(ambientGain);

  setTimeout(() => {
    try {
      ambientPlayer?.stop();
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
      autostart: true,
      onload: () => {
        if (!ambientPlayer.buffer || !ambientPlayer.buffer.loaded) {
          console.warn("⚠️ Ambient buffer not loaded properly — aborting.");
          return;
        }

        const duration = ambientPlayer.buffer.duration;
        if (!duration || isNaN(duration)) {
          console.warn("⚠️ Ambient file loaded but duration is 0 — skipping.");
          return;
        }

        console.log(`🎧 Ambient loaded: ${actualUrl}`);
        fadeGainToSaved(ambientGain, 'ambientVolume', 10);

        setTimeout(() => {
          const gainVal = ambientGain.gain.value;
          console.log(`🎚️ ambientGain.gain.value = ${gainVal.toFixed(3)}`);
          if (gainVal < 0.01) {
            console.warn("⚠️ Ambient gain is very low — may be muted.");
          }
        }, 1200);

        const fadeTime = Math.max(duration - 10, 0);
        console.log(`⏱️ Ambient duration: ${duration}s — will fade out externally at ${fadeTime}s`);
      }
    }).connect(ambientGain);
  } catch (err) {
    console.warn("⚠️ Failed HEAD check, falling back immediately:", err);

    const fallbackTrackName = formatTrackName(extractTrackName(fallbackUrl));
    ambientTrackName = fallbackTrackName;

    const env = getSoundEnvironment();
    if (env) env.ambientTrack = ambientTrackName;

    ambientPlayer = new Tone.Player({
      url: fallbackUrl,
      loop: true,
      autostart: true,
      onload: () => {
        if (!ambientPlayer.buffer || !ambientPlayer.buffer.loaded) {
          console.warn("⚠️ Fallback ambient buffer not loaded — aborting.");
          return;
        }

        const duration = ambientPlayer.buffer.duration;
        if (!duration || isNaN(duration)) {
          console.warn("⚠️ Fallback ambient file has 0s duration — skipping.");
          return;
        }

        fadeGainToSaved(ambientGain, 'ambientVolume', 10);
        console.log(`🌍 Fallback ambient playing: ${fallbackUrl}`);

        setTimeout(() => {
          const gainVal = ambientGain.gain.value;
          console.log(`🎚️ fallback ambientGain.gain.value = ${gainVal.toFixed(3)}`);
          if (gainVal < 0.01) {
            console.warn("⚠️ Ambient gain is very low — may be muted.");
          }
        }, 1200);

        const fadeTime = Math.max(duration - 10, 0);
        console.log(`⏱️ Fallback ambient duration: ${duration}s — will fade out externally at ${fadeTime}s`);
      }
    }).connect(ambientGain);
  }
}

function resolveConditionKey(rawCondition) {
  if (!rawCondition) return "Clear";

  const trimmed = rawCondition.trim();
  const alias = ambientConditionAliases[trimmed];
  if (alias) return alias;

  return trimmed;
}

export async function playAmbientFromWeather() {
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
  const timeBlock = ambientConditionMap[timeOfDay];
  if (!timeBlock) {
    console.warn(`⚠️ No timeOfDay block for ${timeOfDay}`);
    return;
  }

  const fileList = timeBlock[conditionKey] || timeBlock["Clear"] || [];
  if (fileList.length === 0) {
    console.warn(`⚠️ No ambient files found for ${timeOfDay} / ${conditionKey}`);
    return;
  }

  const selectedFile = fileList[Math.floor(Math.random() * fileList.length)];
  const url = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/shared/timeOfDay/${timeOfDay}/${selectedFile}`;
  const fallbackUrl = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/common/${selectedFile}`;

  stopAmbient();
  return tryLoad(url, fallbackUrl);
}

export function getCurrentAmbientTrack() {
  return ambientTrackName;
}

export { stopAmbient };
