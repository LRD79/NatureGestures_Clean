// 📁 /audio/instruments/strings.js

import { getStringsGain } from '../volume.js';

let strings;

// ✅ Setup gain routing after setupGains()
export function setupStrings() {
  try {
    const stringsGain = getStringsGain();
    if (!stringsGain || !stringsGain.connect) {
      console.warn("⚠️ stringsGain is not available — did you run setupGains()?");
    } else {
      stringsGain.disconnect();
      stringsGain.connect(Tone.getDestination());
      console.log("🎻 Strings gain routed to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupStrings", err);
  }
}

export function createStrings() {
  const stringsGain = getStringsGain(); // 🔁 dynamic gain
  strings = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 1.2, decay: 0.4, sustain: 0.6, release: 2 },
  }).connect(stringsGain);
  return strings;
}

const chordMap = {
  'C': ['C', 'E', 'G'], 'Cm': ['C', 'Eb', 'G'],
  'D': ['D', 'F#', 'A'], 'Dm': ['D', 'F', 'A'],
  'E': ['E', 'G#', 'B'], 'Em': ['E', 'G', 'B'],
  'F': ['F', 'A', 'C'], 'Fm': ['F', 'Ab', 'C'],
  'G': ['G', 'B', 'D'], 'Gm': ['G', 'Bb', 'D'],
  'A': ['A', 'C#', 'E'], 'Am': ['A', 'C', 'E'],
  'B': ['B', 'D#', 'F#'], 'Bm': ['B', 'D', 'F#'],
};

function applyInversion(baseNotes) {
  const inversions = [
    baseNotes,
    [baseNotes[1], baseNotes[2], Tone.Frequency(baseNotes[0] + '2').transpose(12).toNote()],
    [baseNotes[2], Tone.Frequency(baseNotes[0] + '2').transpose(12).toNote(), Tone.Frequency(baseNotes[1] + '2').transpose(12).toNote()]
  ];
  return inversions[Math.floor(Math.random() * inversions.length)];
}

function formatChordNotes(chordName, octave = 3) {
  const raw = chordMap[chordName] || ['C', 'E', 'G'];
  const baseNotes = raw.map(n => n + octave);
  return applyInversion(baseNotes);
}

export function playStrings(structure, chords, octave = 3) {
  let time = Tone.now() + 0.1;

  structure.forEach((section, i) => {
    const chordName = chords[i % chords.length];
    const chordNotes = formatChordNotes(chordName, octave);

    Tone.Transport.scheduleOnce((t) => {
      strings?.triggerAttackRelease(chordNotes, '1n', t);
      console.log(`[🎻 Strings] Playing ${chordNotes.join(', ')} at ${t.toFixed(2)}s`);
    }, time);

    time += Tone.Time(`${section.length}m`).toSeconds();
  });
}

export function disposeStrings() {
  strings?.dispose();
  strings = null;
}
