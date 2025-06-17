import { ambientGain, fadeGainToSaved } from './volume.js';
import { getSoundEnvironment } from '../env/soundEnvironment.js';
import { ambientConditionMap } from '../data/ambientConditionMap.js';
import { updateNowPlaying } from '../ui/nowPlaying.js';
import { getCurrentTimeAndDate } from '../utils/time.js';

function extractTrackName(filePath) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(mp3|wav)$/i, '');
}

function formatTrackName(rawName) {
  return rawName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

let ambientPlayer = null;

import { fadeGainToZero } from './volume.js';

function stopAmbient() {
  if (ambientPlayer) {
    fadeGainToZero(ambientGain); // ⬅️ smooth fade out
    setTimeout(() => {
      ambientPlayer.stop();
      ambientPlayer.dispose();
      ambientPlayer = null;
    }, 10000); // Wait for fade to finish
  }
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
  const timePath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/shared/timeOfDay/${timeOfDay}/${selectedFile}`;
  const commonPath = `/assets/AmbientSoundMP3s/AmbientWeatherSounds/common/${selectedFile}`;

  const tryLoad = (url, fallbackUrl) => {
  stopAmbient(); // fade + cleanup if needed
  const trackName = formatTrackName(extractTrackName(url));

  ambientPlayer = new Tone.Player({
    url,
    loop: true,
    autostart: true,
    onload: () => {
      console.log(`🎧 Ambient loaded: ${url}`);
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
        ambientTrack: trackName,
        droneStatus: 'On',
        chimeStatus: 'On'
      });
    },
    onloaderror: () => {
      console.warn(`⚠️ Failed to load: ${url}. Falling back to: ${fallbackUrl}`);
      if (ambientPlayer) ambientPlayer.dispose();

      const fallbackTrackName = formatTrackName(extractTrackName(fallbackUrl));

      ambientPlayer = new Tone.Player({
        url: fallbackUrl,
        loop: true,
        autostart: true,
        onload: () => {
          fadeGainToSaved(ambientGain, 'ambientVolume', 10);
          console.log(`🌍 Fallback ambient playing: ${fallbackUrl}`);

          // ⏱️ Also fade out fallback after 5 mins
          setTimeout(() => {
            console.log("🌙 Fading out fallback ambient after 5 mins...");
            stopAmbient();
          }, 300000);

          const { time, date } = getCurrentTimeAndDate?.() || { time: '--:--', date: 'Today' };
          updateNowPlaying({
            time,
            date,
            condition,
            biome,
            season,
            timeOfDay,
            ambientTrack: fallbackTrackName,
            droneStatus: 'On',
            chimeStatus: 'On'
          });
        }
      }).connect(ambientGain);
    }
  }).connect(ambientGain);

  console.log(`🎧 Attempting ambient: ${url}`);
};

  tryLoad(timePath, commonPath);
}
