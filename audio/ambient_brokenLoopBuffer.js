import { ambientGain, fadeGainToSaved, fadeGainToZero } from './volume.js';
import { getSoundEnvironment } from '../env/soundEnvironment.js';
import { ambientConditionMap } from '../data/ambientConditionMap.js';
import { updateNowPlaying } from '../ui/nowPlaying.js';
import { getCurrentTimeAndDate } from '../utils/time.js';

let ambientPlayer = null;
let currentPlayer = null;
let crossfadeTimer = null;
let crossfadeClock = null;
let ambientLoopStarted = false; // ✅ New flag to prevent multiple loops

function extractTrackName(filePath) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(mp3|wav)$/i, '');
}

function formatTrackName(rawName) {
  return rawName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function stopAmbient() {
  if (ambientPlayer?.stop) {
    fadeGainToZero(ambientGain);
    setTimeout(() => {
      try {
        ambientPlayer.stop();
        ambientPlayer.dispose();
      } catch (e) {
        console.warn("⚠️ Error stopping ambientPlayer:", e);
      }
      ambientPlayer = null;
    }, 10000);
  }

  if (currentPlayer?.stop) {
    try {
      currentPlayer.stop();
      currentPlayer.dispose();
    } catch (e) {
      console.warn("⚠️ Error stopping currentPlayer:", e);
    }
    currentPlayer = null;
  }

  if (crossfadeTimer) {
    clearInterval(crossfadeTimer);
    crossfadeTimer = null;
  }

  if (crossfadeClock) {
    try {
      crossfadeClock.stop();
      crossfadeClock.dispose();
      console.log("🧹 Disposed current Tone.Clock");
    } catch (e) {
      console.warn("⚠️ Error disposing Tone.Clock:", e);
    }
    crossfadeClock = null;
  }

  ambientLoopStarted = false; // ✅ Reset loop guard
}

function setupCrossfadeLoopWithPreloadedBuffer(buffer, fallbackDuration = 180, trackLabel, env) {
  stopAmbient();

  const duration = buffer.duration || fallbackDuration;
  const crossfadeTime = 10;
  const loopInterval = duration - crossfadeTime;

  console.log(`✅ Buffer ready for looping: (${duration.toFixed(2)}s)`);
  console.log(`🔁 Will crossfade every ${loopInterval}s`);

  const playLoop = () => {
    console.log("🔁 Crossfade loop triggered");

    if (!buffer._buffer || !(buffer._buffer instanceof AudioBuffer)) {
  console.warn("⛔ AudioBuffer not ready. Delaying loop...");
  setTimeout(playLoop, 100); // try again shortly
  return;
}

const rawBuffer = buffer._buffer;


    const player = new Tone.Player({
      loop: false,
      autostart: false,
      buffer: rawBuffer
    }).connect(ambientGain);

    const now = Tone.now();
    player.volume.value = -Infinity;
    player.start(now);
    player.volume.linearRampToValueAtTime(0, now + crossfadeTime);

    if (currentPlayer) {
      currentPlayer.volume.linearRampToValueAtTime(-Infinity, now + crossfadeTime);
      setTimeout(() => {
        try {
          currentPlayer.stop();
          currentPlayer.dispose();
        } catch (e) {
          console.warn("⚠️ Error stopping previous player:", e);
        }
      }, (crossfadeTime + 1) * 1000);
    }

    currentPlayer = player;
    ambientPlayer = player;
  };

  Tone.loaded().then(() => {
    if (ambientLoopStarted) {
      console.warn("⚠️ Ambient loop already running — skipping duplicate loop.");
      return;
    }

    ambientLoopStarted = true;

    playLoop();

    if (crossfadeClock) {
      try {
        crossfadeClock.stop();
        crossfadeClock.dispose();
      } catch (e) {
        console.warn("⚠️ Error disposing previous Tone.Clock:", e);
      }
    }

    crossfadeClock = new Tone.Clock(() => {
      playLoop();
    }, loopInterval);

    crossfadeClock.start();
    console.log(`⏱️ CrossfadeClock started: every ${loopInterval.toFixed(2)}s`);
  });

  fadeGainToSaved(ambientGain, 'ambientVolume', 10);

  const { time, date } = getCurrentTimeAndDate?.() || { time: '--:--', date: 'Today' };
  updateNowPlaying({
    time,
    date,
    ambientTrack: trackLabel,
    condition: env.condition,
    biome: env.biome,
    season: env.season,
    timeOfDay: env.timeOfDay,
    droneStatus: 'On',
    chimeStatus: 'On'
  });
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

  const nightOnlyFiles = ['birds-14.mp3', 'owl-night.mp3', 'crickets.mp3'];
  const filteredFiles = files.filter(file => {
    if (timeOfDay === 'day' && nightOnlyFiles.includes(file)) {
      console.warn(`🚫 Skipping night-only file during daytime: ${file}`);
      return false;
    }
    return true;
  });

  if (filteredFiles.length === 0) {
    console.warn("⚠️ No valid ambient files left after filtering. Skipping.");
    return;
  }

  const selectedFile = filteredFiles[Math.floor(Math.random() * filteredFiles.length)];
  const trackName = formatTrackName(extractTrackName(selectedFile));

  const timePath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/shared/timeOfDay/${timeOfDay}/${selectedFile}`;
  const fallbackPath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/common/${selectedFile}`;

  const tryPlay = async (url) => {
    if (!url || typeof url !== 'string' || !/\.(mp3|wav)$/i.test(url)) {
      console.error("❌ Invalid or missing ambient URL:", url);
      return;
    }

    console.log("🎧 Loading ambient file:", url);

    try {
      const toneBuffer = new Tone.Buffer();
      await toneBuffer.load(url);
      console.log(`🎧 Fully loaded Tone.Buffer: ${url}`);
      setupCrossfadeLoopWithPreloadedBuffer(toneBuffer, 180, trackName, env);
    } catch (err) {
      console.warn(`⚠️ Failed to load buffer: ${url}`, err);
    }
  };

  fetch(timePath, { method: 'HEAD' })
    .then(res => {
      if (res.ok) {
        console.log(`🎧 Using time-specific ambient path: ${timePath}`);
        tryPlay(timePath);
      } else {
        throw new Error(`Not found at timePath`);
      }
    })
    .catch(() => {
      console.warn("⚠️ Falling back to common path");
      tryPlay(fallbackPath);
    });
}
