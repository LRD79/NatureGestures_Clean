import { ambientGain, fadeGainToSaved, fadeGainToZero } from './volume.js';
import { getSoundEnvironment } from '../env/soundEnvironment.js';
import { ambientConditionMap } from '../data/ambientConditionMap.js';
import { updateNowPlaying } from '../ui/nowPlaying.js';
import { getCurrentTimeAndDate } from '../utils/time.js';

let ambientPlayer = null;
let crossfadeTimer = null;

// Ensure ambientGain is connected
try {
  if (!ambientGain._connected) ambientGain.connect(Tone.Destination);
} catch (e) {
  console.warn("⚠️ Could not verify ambientGain connection:", e);
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
  if (ambientPlayer) {
    fadeGainToZero(ambientGain);
    setTimeout(() => {
      ambientPlayer.stop();
      ambientPlayer.dispose();
      ambientPlayer = null;
    }, 10000);
  }
  if (crossfadeTimer) {
    clearInterval(crossfadeTimer);
    crossfadeTimer = null;
  }
}

function setupCrossfadeLoop(url, duration = 180) {
  let currentPlayer = null;
  let nextPlayer = null;

  function playLoop() {
    console.log("🔁 Crossfading ambient loop...");
    nextPlayer = new Tone.Player({ url, loop: false, autostart: false }).connect(ambientGain);

    nextPlayer.onload = () => {
      const now = Tone.now();
      nextPlayer.volume.value = -Infinity;
      nextPlayer.start(now);
      nextPlayer.volume.linearRampToValueAtTime(0, now + 5);

      if (currentPlayer) {
        currentPlayer.volume.linearRampToValueAtTime(-Infinity, now + 5);
        setTimeout(() => {
          currentPlayer.stop();
          currentPlayer.dispose();
        }, 6000);
      }

      currentPlayer = nextPlayer;
      nextPlayer = null;
      ambientPlayer = currentPlayer;

      console.log("🎶 Ambient now playing via crossfade");
    };

    nextPlayer.onerror = (e) => {
      console.error("❌ Error loading nextPlayer:", e);
    };

    try {
      nextPlayer.load();
    } catch (e) {
      console.error("🚫 Failed to load crossfade player:", e);
    }
  }

  playLoop();
  crossfadeTimer = setInterval(playLoop, (duration - 5) * 1000);
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

  console.log("🌤️ Ambient sound environment:", { condition, season, biome, timeOfDay });

  const conditionKey = condition.trim();
  let files = ambientConditionMap[conditionKey];
  if (!files || files.length === 0) {
    console.warn(`⚠️ No ambient files for condition: ${conditionKey}. Falling back to 'Clear'`);
    files = ambientConditionMap["Clear"];
  }

  const selectedFile = files[Math.floor(Math.random() * files.length)];
  if (!selectedFile) {
    console.warn("⚠️ No selected ambient file found. Skipping.");
    return;
  }

  const timePath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/shared/timeOfDay/${timeOfDay}/${selectedFile}`;
  const commonPath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/common/${selectedFile}`;
  const trackName = formatTrackName(extractTrackName(selectedFile));

  const tryPlay = (url, trackLabel) => {
    if (!url || typeof url !== 'string' || !/\.(mp3|wav)$/i.test(url)) {
      console.error("❌ Invalid or missing ambient URL:", url);
      return;
    }

    console.log("🎯 Attempting ambient path:", url);
    stopAmbient();

    const tempPlayer = new Tone.Player({ url, autostart: false });

    tempPlayer.onload = () => {
      const duration = tempPlayer.buffer?.duration || 180;
      console.log("✅ Loaded file successfully", url, `⏱️ Duration: ${duration}s`);
      tempPlayer.dispose();

      setupCrossfadeLoop(url, duration);
      fadeGainToSaved(ambientGain, 'ambientVolume', 10);

      setTimeout(() => {
        console.log("🌫️ Fading out ambient track...");
        fadeGainToZero(ambientGain);
      }, 290000);

      const { time, date } = getCurrentTimeAndDate?.() || { time: '--:--', date: 'Today' };
      updateNowPlaying({
        time,
        date,
        condition,
        biome,
        season,
        timeOfDay,
        ambientTrack: trackLabel,
        droneStatus: 'On',
        chimeStatus: 'On'
      });
    };

    tempPlayer.onerror = (err) => {
      console.warn(`⚠️ Failed to load: ${url}`, err);
    };

    try {
      tempPlayer.load();
    } catch (err) {
      console.error("🚫 Player failed to load due to invalid URL or internal error:", err);
    }
  };

  fetch(timePath)
    .then(res => {
      if (!res.ok) throw new Error("404");
      tryPlay(timePath, trackName);
    })
    .catch(() => {
      console.warn("⚠️ Falling back to common path");
      tryPlay(commonPath, trackName);
    });
}
