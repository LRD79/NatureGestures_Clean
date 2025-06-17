// 💽 /audio/band.js

import { getSoundEnvironment, getCurrentWeather, setMusicSettings } from '../env/soundEnvironment.js';
import { generateMusicProfile } from './musicProfile.js';
import {
  drumGain, noiseGain, bassGain, pianoGain, chimeGain,
  fadeGainToSaved, fadeAllToZero
} from './volume.js';
import { masterCompressor } from './master.js';
import { updateNowPlaying } from '../ui/nowPlaying.js';
import { getCurrentAmbientTrack } from './ambient.js';

import { setupDroneDependencies, stopDrone, startDrone } from './drone.js';
import { createBass, playBassIntro, playBassVerse, playBassChorus, playBassOutro } from './instruments/bass.js';
import { createPiano, playPianoChords } from './instruments/piano.js';
import { createDrums, scheduleDrums } from './instruments/drums.js';
import { createChimes, startChimes } from './chimes.js';
import { createStrings } from './instruments/strings.js';
import { createWinds } from './instruments/wind.js';
import { startNoise } from './instruments/noise.js';

let scheduled = false;
let instruments = {};
let loops = [];

function getNow() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }),
  };
}

function scheduleSong(startTime = Tone.now() + 1) {
  const env = getSoundEnvironment();
  const weather = getCurrentWeather();
  const profile = generateMusicProfile(env);
  setMusicSettings(profile);

  console.log('[🎼 Music Profile]', profile);
  Tone.Transport.bpm.value = profile.bpm;

  const bass = createBass();
  const piano = createPiano();
  const drums = createDrums();
  const chimes = createChimes();
  const strings = createStrings();
  const winds = createWinds();
  setupDroneDependencies(weather.current);

  instruments = { bass, piano, drums, chimes, strings, winds };

  const chords = Array.isArray(profile.chords) && profile.chords.length >= 4
    ? profile.chords
    : ['C', 'F', 'G', 'Am'];

  playPianoChords([startTime], chords, profile.melodyOctave);
  loops.push(scheduleDrums(profile));

  playBassIntro(profile, startTime);
  Tone.Transport.scheduleOnce((time) => playBassVerse(profile, time), startTime + 4);
  Tone.Transport.scheduleOnce((time) => playBassChorus(profile, time), startTime + 12);
  Tone.Transport.scheduleOnce((time) => playBassVerse(profile, time), startTime + 20);
  Tone.Transport.scheduleOnce((time) => playBassChorus(profile, time), startTime + 28);
  Tone.Transport.scheduleOnce((time) => playBassOutro(profile, time), startTime + 36);

  Tone.Transport.scheduleOnce(() => {
    console.log('🎹 Fading out Weather Band...');
    fadeAllToZero(10);
  }, startTime + (5 * 60 - 10));

  Tone.Transport.scheduleOnce(() => {
    stopSong();
  }, startTime + (5 * 60));

  Tone.Transport.start(startTime);

  // ✅ Start all preloaded audio layers together
  startDrone();
  startChimes();
  startNoise();

  setTimeout(() => {
    [drumGain, noiseGain, chimeGain, pianoGain, bassGain].forEach(gain => {
      const key =
        gain === drumGain ? 'drumVolume' :
        gain === chimeGain ? 'chimeVolume' :
        gain === noiseGain ? 'noiseVolume' :
        gain === pianoGain ? 'pianoVolume' :
        'bassVolume';
      fadeGainToSaved(gain, key, 10);
    });

    const gainInfo = {
      drum: drumGain?.gain?.value || 0,
      piano: pianoGain?.gain?.value || 0,
      bass: bassGain?.gain?.value || 0,
      noise: noiseGain?.gain?.value || 0,
      chime: chimeGain?.gain?.value || 0,
    };

    updateNowPlaying({
      time: getNow().time,
      date: getNow().date,
      condition: env.condition || 'Unknown',
      biome: env.biome || 'forest',
      season: env.season || 'summer',
      timeOfDay: env.timeOfDay || 'day',
      ambientTrack: getCurrentAmbientTrack(),
      droneStatus: gainInfo.noise > 0.01 ? 'On' : 'Off',
      chimeStatus: gainInfo.chime > 0.01 ? 'On' : 'Off',
      weather,
      astro: env.astro || {},
      bpm: profile.bpm,
      key: profile.key,
      genre: profile.genre,
    });
  }, 1000);
}

function stopSong() {
  fadeAllToZero(10);
  stopDrone();
  Tone.Transport.stop();
  Tone.Transport.cancel();

  Object.values(instruments).forEach(inst => {
    if (inst?.dispose) inst.dispose();
    else Object.values(inst).forEach(sub => sub.dispose?.());
  });

  loops.forEach(loop => loop.dispose());
  loops = [];
  instruments = {};
  scheduled = false;

  console.log('🚸 Weather Band stopped and cleaned up.');
}

export async function startWeatherBand() {
  if (!scheduled) {
    await waitForAllAudioBuffers();
    await Tone.start();
    scheduleSong();
    scheduled = true;
  }
}

export function stopWeatherBand() {
  stopSong();
}

export async function preloadWeatherBand() {
  console.log('🎿 Preloading band...');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('✅ Band preloaded');
      resolve();
    }, 500);
  });
}

async function waitForAllAudioBuffers() {
  console.log('⏳ Waiting for audio buffers to load...');
  while (
    !window.__chimesReady ||
    !window.__ambientReady ||
    !window.__droneReady ||
    !window.__noiseReady ||
    !window.__bandReady
  ) {
    await new Promise(res => setTimeout(res, 100));
  }
  console.log('✅ All audio buffers ready.');
}
