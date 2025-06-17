// 📁 /audio/instruments/wind.js

import { getWindsGain } from '../volume.js';

let windSynth;

// ✅ Setup gain routing after setupGains()
export function setupWinds() {
  try {
    const windsGain = getWindsGain();
    if (!windsGain || !windsGain.connect) {
      console.warn("⚠️ windsGain is not available — did you run setupGains()?");
    } else {
      windsGain.disconnect();
      windsGain.connect(Tone.getDestination());
      console.log("🌬️ Wind gain routed to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupWinds", err);
  }
}

export function createWinds() {
  const windsGain = getWindsGain(); // 🔁 Dynamic gain
  windSynth = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    filter: { type: 'lowpass', frequency: 1200 },
    envelope: { attack: 0.2, decay: 0.1, sustain: 0.5, release: 1 },
  }).connect(windsGain);
  return windSynth;
}

const chordMap = {
  'C': ['C', 'E', 'G', 'B'],
  'Cm': ['C', 'Eb', 'G', 'Bb'],
  'D': ['D', 'F#', 'A', 'C#'],
  'Dm': ['D', 'F', 'A', 'C'],
  'E': ['E', 'G#', 'B', 'D#'],
  'Em': ['E', 'G', 'B', 'D'],
  'F': ['F', 'A', 'C', 'E'],
  'Fm': ['F', 'Ab', 'C', 'Eb'],
  'G': ['G', 'B', 'D', 'F#'],
  'Gm': ['G', 'Bb', 'D', 'F'],
  'A': ['A', 'C#', 'E', 'G#'],
  'Am': ['A', 'C', 'E', 'G'],
  'B': ['B', 'D#', 'F#', 'A#'],
  'Bm': ['B', 'D', 'F#', 'A'],
};

function formatChordNotes(chordName, octave = 2) {
  const raw = chordMap[chordName] || ['C', 'E', 'G', 'B'];
  return raw.map(note => note + octave);
}

function selectWindNote(notes) {
  const roll = Math.random();

  if (roll < 0.3) {
    const pick = notes[Math.floor(Math.random() * 3)];
    return { note: pick, type: 'basic chord tone' };
  } else if (roll < 0.6) {
    return { note: notes[2], type: '5th' };
  } else if (notes[3]) {
    return { note: notes[3], type: '7th' };
  } else {
    return { note: notes[2], type: 'fallback 5th' };
  }
}

export function playWinds(structure, chords, octave = 2) {
  let time = Tone.now() + 0.1;

  structure.forEach((section, i) => {
    if (!section.name.includes('Chorus')) return;

    const chordName = chords[i % chords.length];
    const chordNotes = formatChordNotes(chordName, octave);
    const { note, type } = selectWindNote(chordNotes);

    Tone.Transport.scheduleOnce(t => {
      windSynth?.triggerAttackRelease(note, '2n', t + 0.5);
      console.log(`[🌬️ Wind] Playing ${note} (${type}) at ${t.toFixed(2)}s`);
    }, time);

    time += Tone.Time(`${section.length}m`).toSeconds();
  });
}

export function stopWinds() {
  windSynth?.dispose();
  windSynth = null;
}
