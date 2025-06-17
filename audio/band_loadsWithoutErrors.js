import { getSoundEnvironment } from '../env/soundEnvironment.js';
import { generateMusicProfile } from './musicProfile.js';
import { drumGain, noiseGain, bassGain, pianoGain } from './volume.js';
import { masterCompressor } from './master.js';
import { fadeGainToSaved, fadeGainToZero } from './volume.js';
import { updateNowPlaying } from '../ui/nowPlaying.js';

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
  noiseGain.gain.value = 0; // Start silent for fade-in
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

function scheduleSong() {
  const env = getSoundEnvironment();
  const profile = generateMusicProfile(env);
  console.log('[🎼 Music Profile]', profile);

  updateNowPlaying(`Weather Band – ${profile.key}`);

  Tone.Transport.bpm.value = profile.bpm;

  const bass = createBass();
  const piano = createEPiano();
  const drums = createDrums();
  const strings = createStrings();
  const winds = createWinds();
  const noise = createNoise(profile.noiseType);

  instruments = { bass, piano, drums, strings, winds, noise };

  // Fade in instrument gains
  [drumGain, pianoGain, bassGain, noiseGain].forEach(gain => {
    if (gain) fadeGainToSaved(gain, gain === drumGain ? 'drumVolume' :
                                     gain === pianoGain ? 'pianoVolume' :
                                     gain === bassGain ? 'bassVolume' : 'noiseVolume', 10);
  });

  const now = Tone.now();
  let time = now + 0.1;

  // 🥁 Drums
  const { kick, snare } = drums;
  const density = profile.drumDensity;
  if (density === 'sparse') {
    const loop = new Tone.Loop(t => kick.triggerAttackRelease('C1', '8n', t), '2m');
    loop.start(0); loops.push(loop);
  } else if (density === 'medium') {
    const loop = new Tone.Loop(t => {
      kick.triggerAttackRelease('C1', '8n', t);
      snare.triggerAttackRelease('8n', t + Tone.Time('1m'));
    }, '2m');
    loop.start(0); loops.push(loop);
  } else {
    const loop = new Tone.Loop(t => {
      kick.triggerAttackRelease('C1', '8n', t);
      snare.triggerAttackRelease('8n', t + Tone.Time('0.5m'));
    }, '1m');
    loop.start(0); loops.push(loop);
  }

  // 🎵 Chords
  const structure = [
    { name: 'Intro', length: 4 },
    { name: 'Verse1', length: 8 },
    { name: 'Chorus1', length: 8 },
    { name: 'Verse2', length: 8 },
    { name: 'Chorus2', length: 8 },
    { name: 'Outro', length: 4 },
  ];

  const chords = Array.isArray(profile.chords) ? profile.chords : ['C', 'F', 'G', 'Am'];
  structure.forEach((section, i) => {
    const chordName = chords[i % chords.length];
    const chordNotes = expandChord(chordName, profile.melodyOctave);
    const rootNote = chordName.replace(/m$/, '') + '1';

    const sectionTime = time;
    Tone.Transport.scheduleOnce(() => {
      bass.triggerAttackRelease(rootNote, '2n', sectionTime);
      piano.triggerAttackRelease(chordNotes, '1n', sectionTime);
      if (section.name.includes('Chorus')) {
        strings.triggerAttackRelease(chordNotes, '1n', sectionTime);
        winds.triggerAttackRelease(chordNotes[0], '2n', sectionTime + 0.5);
      }
    }, `+${sectionTime - now}`);
    time += Tone.Time(`${section.length}m`).toSeconds();
  });

  // 🔚 Auto-stop and fade out
  const totalDuration = structure.reduce((sum, s) => sum + s.length, 0);
  Tone.Transport.scheduleOnce(() => stopSong(), `+${Tone.Time(`${totalDuration}m`).toSeconds()}`);
  Tone.Transport.start();
}

function stopSong() {
  [drumGain, pianoGain, bassGain, noiseGain].forEach(gain => {
    if (gain) fadeGainToZero(gain, 10);
  });

  Tone.Transport.stop();
  Tone.Transport.cancel();

  Object.values(instruments).forEach(inst => {
    if (inst.dispose) inst.dispose();
    else Object.values(inst).forEach(sub => sub.dispose?.());
  });

  loops.forEach(loop => loop.dispose());
  loops = [];

  instruments = {};
  scheduled = false;
}

export async function startWeatherBand() {
  if (!scheduled) {
    await Tone.start();
    scheduleSong();
    scheduled = true;

    setInterval(() => {
      if (!scheduled) {
        scheduleSong();
        scheduled = true;
      }
    }, 5 * 60 * 1000);
  }
}

export function stopWeatherBand() {
  stopSong();
}
