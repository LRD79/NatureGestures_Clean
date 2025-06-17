// 📁 /audio/instruments/piano.js

import { getPianoGain } from '../volume.js';

let piano;
let pianoLoop;

// ✅ Safely connect pianoGain
export function setupPiano() {
  try {
    const pianoGain = getPianoGain();
    if (!pianoGain || !pianoGain.connect) {
      console.warn("⚠️ pianoGain is not available — did you run setupGains()?");
    } else {
      pianoGain.disconnect();
      pianoGain.connect(Tone.getDestination());
      console.log("🎹 Piano gain routed to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupPiano", err);
  }
}

export function createPiano() {
  const pianoGain = getPianoGain();
  piano = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 1.5 },
  }).connect(pianoGain);
  return piano;
}

export function playPianoChords(structure, chords, octave = 3) {
  const chordMap = {
    'C':  ['C', 'E', 'G'],    'Cm':  ['C', 'Eb', 'G'],
    'D':  ['D', 'F#', 'A'],   'Dm':  ['D', 'F', 'A'],
    'E':  ['E', 'G#', 'B'],   'Em':  ['E', 'G', 'B'],
    'F':  ['F', 'A', 'C'],    'Fm':  ['F', 'Ab', 'C'],
    'G':  ['G', 'B', 'D'],    'Gm':  ['G', 'Bb', 'D'],
    'A':  ['A', 'C#', 'E'],   'Am':  ['A', 'C', 'E'],
    'B':  ['B', 'D#', 'F#'],  'Bm':  ['B', 'D', 'F#'],
  };

  function expandChord(chordName, octave = 3, inversion = 0) {
    const base = chordMap[chordName] || ['C', 'E', 'G'];
    const rotated = base.slice(inversion).concat(base.slice(0, inversion));
    return rotated.map((note, i) => note + (octave + (i < inversion ? 1 : 0)));
  }

  let time = Tone.now() + 0.1;
  const pianoGain = getPianoGain();

  structure.forEach((section, i) => {
    const chordName = chords[i % chords.length];
    const inversion = Math.floor(Math.random() * 3);
    const chordNotes = expandChord(chordName, octave, inversion);
    const sectionTime = time;

    Tone.Transport.scheduleOnce((time) => {
      if (piano && pianoGain?.gain?.value > 0.001) {
        piano.triggerAttackRelease(chordNotes, '1n', time);
        console.log(`[🎹 Piano] ${chordName} (inv${inversion}) → ${chordNotes.join(',')} @ ${Tone.Transport.seconds.toFixed(2)}s`);
      }
    }, sectionTime);

    time += Tone.Time(`${section.length}m`).toSeconds();
  });
}

export function stopPiano() {
  if (piano) piano.dispose();
  if (pianoLoop) pianoLoop.dispose();
  piano = null;
  pianoLoop = null;
}
