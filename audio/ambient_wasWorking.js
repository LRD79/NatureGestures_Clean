// 📁 /audio/ambient.js
import { ambientGain, fadeGainToSaved, fadeGainToZero } from './volume.js';
import { getSoundEnvironment } from '../env/soundEnvironment.js';
import { ambientConditionMap } from '../data/ambientConditionMap.js';
import { ambientConditionAliases } from '../data/ambientConditionAliases.js';
import { getCurrentTimeAndDate } from '../utils/time.js';

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
  if (ambientPlayer && typeof ambientPlayer.stop === 'function') {
    fadeGainToZero(ambientGain);
    setTimeout(() => {
      try {
        ambientPlayer.stop();
        ambientPlayer.dispose();
        console.log("🛑 Ambient player stopped and disposed.");
      } catch (e) {
        console.warn("⚠️ Error stopping ambient player:", e);
      } finally {
        ambientPlayer = null;
      }
    }, 10000);
  } else {
    console.log("ℹ️ No valid ambient player to stop.");
  }

  if (ambientLoopTimer) {
    clearTimeout(ambientLoopTimer);
    ambientLoopTimer = null;
  }
}

function loopAmbient(url, fallbackUrl, duration) {
  ambientLoopTimer = setTimeout(() => {
    console.log('🌫️ Fading out ambient...');
    fadeGainToZero(ambientGain);

    setTimeout(() => {
      if (ambientPlayer) {
        ambientPlayer.stop();
        ambientPlayer.dispose();
        ambientPlayer = null;
      }
      console.log('🔁 Restarting ambient loop...');
      tryLoad(url, fallbackUrl);
    }, 10000);
  }, (duration * 1000) - 10000);
}

function tryLoad(url, fallbackUrl) {
  stopAmbient();

  fetch(url, { method: 'HEAD' })
    .then(res => {
      const actualUrl = res.ok ? url : fallbackUrl;
      const trackName = formatTrackName(extractTrackName(actualUrl));

      ambientTrackName = trackName;
      console.log(`🎶 Ambient Track Name Set: ${ambientTrackName}`);

      const env = getSoundEnvironment();
      if (env) env.ambientTrack = ambientTrackName;

      ambientPlayer = new Tone.Player({
        url: actualUrl,
        loop: true,
        autostart: true,
        onload: () => {
          console.log(`🎧 Ambient loaded: ${actualUrl}`);
          fadeGainToSaved(ambientGain, 'ambientVolume', 10);

          setTimeout(() => {
            const gainVal = ambientGain.gain.value;
            console.log(`🎚️ ambientGain.gain.value = ${gainVal.toFixed(3)}`);
            if (gainVal < 0.01) {
              console.warn("⚠️ Ambient gain is very low — may be muted.");
            }
          }, 1200);

          const duration = ambientPlayer.buffer.duration;
          console.log(`⏱️ Ambient duration: ${duration}s — fading out at ${duration - 10}s`);
          loopAmbient(url, fallbackUrl, duration);
        }
      }).connect(ambientGain);
    })
    .catch(err => {
      console.warn("⚠️ Failed HEAD check, falling back immediately:", err);

      const fallbackTrackName = formatTrackName(extractTrackName(fallbackUrl));
      ambientTrackName = fallbackTrackName;
      console.log(`🎶 Ambient Fallback Track Set: ${ambientTrackName}`);

      const env = getSoundEnvironment();
      if (env) env.ambientTrack = ambientTrackName;

      ambientPlayer = new Tone.Player({
        url: fallbackUrl,
        loop: true,
        autostart: true,
        onload: () => {
          fadeGainToSaved(ambientGain, 'ambientVolume', 10);
          console.log(`🌍 Fallback ambient playing: ${fallbackUrl}`);

          setTimeout(() => {
            const gainVal = ambientGain.gain.value;
            console.log(`🎚️ fallback ambientGain.gain.value = ${gainVal.toFixed(3)}`);
            if (gainVal < 0.01) {
              console.warn("⚠️ Ambient gain is very low — may be muted.");
            }
          }, 1200);

          const duration = ambientPlayer.buffer.duration;
          loopAmbient(fallbackUrl, fallbackUrl, duration);
        }
      }).connect(ambientGain);
    });

  console.log(`🎧 Attempting ambient: ${url}`);
}

export function playAmbientFromWeather() {
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

  const rawCondition = condition.trim();
  const normalizedCondition = ambientConditionAliases[rawCondition] || rawCondition;

  console.log("🌤️ Ambient sound environment:", { condition: normalizedCondition, season, biome, timeOfDay });

  let files = ambientConditionMap[normalizedCondition];

  if (!files || files.length === 0) {
    console.warn(`⚠️ No ambient files for condition: ${normalizedCondition}. Falling back to 'Clear'`);
    files = ambientConditionMap["Clear"];
  }

  if (!files || files.length === 0) {
    console.error("❌ No ambient files even for fallback 'Clear'. Aborting.");
    return;
  }

  const selectedFile = files[Math.floor(Math.random() * files.length)];
  const timePath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/shared/timeOfDay/${timeOfDay}/${selectedFile}`;
  const commonPath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/common/${selectedFile}`;

  tryLoad(timePath, commonPath);
}

export function getCurrentAmbientTrack() {
  return ambientTrackName;
}

export { stopAmbient };
