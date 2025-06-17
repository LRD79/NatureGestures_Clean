import { getSoundEnvironment, getCurrentWeather } from '../env/soundEnvironment.js';
import { generateMusicProfile } from './musicProfile.js';
import {
  drumGain, noiseGain, bassGain, pianoGain, chimeGain,
  fadeGainToSaved, fadeAllToZero
} from './volume.js';
import { masterCompressor } from './master.js';
import { updateNowPlaying } from '../ui/nowPlaying.js';
import { getCurrentAmbientTrack } from './ambient.js';

let scheduled = false;
let instruments = {};
let loops = [];

function createBass() {
  return new Tone.MonoSynth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.8 },
    filter: { Q: 1, type: 'lowpass', rolloff: -12 },
  }).connect(bassGain);
}

function createEPiano() {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 1.5 },
  }).connect(pianoGain);
}

function createDrums() {
  const kick = new Tone.MembraneSynth().connect(drumGain);
  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0 },
  }).connect(drumGain);
  return { kick, snare };
}

function createChimes() {
  return new Tone.MetalSynth({
    frequency: 600,
    envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  }).connect(chimeGain);
}

function createStrings() {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 1.2, decay: 0.4, sustain: 0.6, release: 2 },
  }).connect(masterCompressor);
}

function createWinds() {
  return new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    filter: { type: 'lowpass', frequency: 1200 },
    envelope: { attack: 0.2, decay: 0.1, sustain: 0.5, release: 1 },
  }).connect(masterCompressor);
}

function createNoise(type) {
  const noise = new Tone.Noise(type).connect(noiseGain);
  noiseGain.gain.value = 0;
  noise.start();
  return noise;
}

function expandChord(chordName, octave) {
  const chordMap = {
    'C': ['C', 'E', 'G'], 'Cm': ['C', 'Eb', 'G'],
    'D': ['D', 'F#', 'A'], 'Dm': ['D', 'F', 'A'],
    'E': ['E', 'G#', 'B'], 'Em': ['E', 'G', 'B'],
    'F': ['F', 'A', 'C'], 'Fm': ['F', 'Ab', 'C'],
    'G': ['G', 'B', 'D'], 'Gm': ['G', 'Bb', 'D'],
    'A': ['A', 'C#', 'E'], 'Am': ['A', 'C', 'E'],
    'B': ['B', 'D#', 'F#'], 'Bm': ['B', 'D', 'F#'],
  };
  const base = chordMap[chordName] || ['C', 'E', 'G'];
  return base.map(note => note + octave);
}

function getNow() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }),
  };
}

function scheduleSong() {
  const env = getSoundEnvironment();
  const weather = getCurrentWeather();
  const profile = generateMusicProfile(env);

  console.log('[🎼 Music Profile]', profile);
  Tone.Transport.bpm.value = profile.bpm;

  const bass = createBass();
  const piano = createEPiano();
  const drums = createDrums();
  const chimes = createChimes();
  const strings = createStrings();
  const winds = createWinds();
  const noise = createNoise(profile.noiseType);

  instruments = { bass, piano, drums, chimes, strings, winds, noise };

  [drumGain, noiseGain, chimeGain, pianoGain, bassGain].forEach(gain => {
    const key =
      gain === drumGain ? 'drumVolume' :
      gain === chimeGain ? 'chimeVolume' :
      gain === noiseGain ? 'noiseVolume' :
      gain === pianoGain ? 'pianoVolume' :
      'bassVolume';

    fadeGainToSaved(gain, key, 10);
  });

  const now = Tone.now();
  let time = now + 0.1;

  const { kick, snare } = drums;
  const density = profile.drumDensity;

  const drumLoop = new Tone.Loop(t => {
    kick.triggerAttackRelease('C1', '8n', t);
    if (density !== 'sparse') {
      snare.triggerAttackRelease('8n', t + Tone.Time(density === 'medium' ? '1m' : '0.5m'));
    }
  }, density === 'sparse' ? '2m' : density === 'medium' ? '2m' : '1m');
  drumLoop.start(0);
  loops.push(drumLoop);

  const chords = (Array.isArray(profile.chords) && profile.chords.length >= 4)
    ? profile.chords
    : ['C', 'F', 'G', 'Am'];

  console.log("🎵 Chords in use:", chords);

  const rootNotes = chords.map(chord => chord.replace(/m$/, '') + '1');

  const bassPattern = [];
  for (let i = 0; i < 16; i++) {
    bassPattern.push(rootNotes[i % rootNotes.length]);
  }

  console.log("🔁 Bass pattern:", bassPattern);

  const bassSeq = new Tone.Sequence((time, note) => {
    if (bassGain?.gain?.value > 0.001) {
      bass.triggerAttackRelease(note, '1m', time);
      console.log(`[🎸 Bass] Playing ${note} at ${Tone.Transport.seconds.toFixed(2)}s`);
    }
  }, bassPattern, '4n');
  bassSeq.start(0);
  loops.push(bassSeq);

  const structure = [
    { name: 'Intro', length: 4 },
    { name: 'Verse1', length: 8 },
    { name: 'Chorus1', length: 8 },
    { name: 'Verse2', length: 8 },
    { name: 'Chorus2', length: 8 },
    { name: 'Outro', length: 4 },
  ];

  structure.forEach((section, i) => {
    const chordName = chords[i % chords.length];
    const chordNotes = expandChord(chordName, profile.melodyOctave);

    const sectionTime = time;
    Tone.Transport.scheduleOnce((time) => {
      if (pianoGain?.gain?.value > 0.001) piano.triggerAttackRelease(chordNotes, '1n', time);

      if (section.name.includes('Chorus')) {
        if (masterCompressor?.output?.gain?.value > 0.001) {
          strings.triggerAttackRelease(chordNotes, '1n', time);
          winds.triggerAttackRelease(chordNotes[0], '2n', time + 0.5);
        }
        if (chimeGain?.gain?.value > 0.001) {
          chimes.triggerAttackRelease('G6', '2n', time + 1);
        }
      }
    }, sectionTime);

    time += Tone.Time(`${section.length}m`).toSeconds();
  });

  Tone.Transport.scheduleOnce(() => {
    console.log("🎚️ Fading out Weather Band...");
    fadeAllToZero(10);
  }, now + (5 * 60 - 10));

  Tone.Transport.scheduleOnce(() => {
    stopSong();
  }, now + (5 * 60));

  Tone.Transport.start();

  setTimeout(() => {
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
    });
  }, 1000);
}

function stopSong() {
  fadeAllToZero(10);
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

  console.log("🛑 Weather Band stopped and cleaned up.");
}

export async function startWeatherBand() {
  if (!scheduled) {
    await Tone.start();
    scheduleSong();
    scheduled = true;
  }
}

export function stopWeatherBand() {
  stopSong();
}

export async function preloadWeatherBand() {
  console.log("🎧 Preloading band...");
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("✅ Band preloaded");
      resolve();
    }, 500);
  });
}
