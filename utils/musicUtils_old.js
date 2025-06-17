// 📁 /utils/musicUtils.js

// --- Scales ---
export const scales = {
  major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  dorian: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
  phrygian: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  lydian: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
  mixolydian: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
  locrian: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
  wholeTone: ['C', 'D', 'E', 'F#', 'G#', 'A#'],
  chromatic: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  pentatonic: ['C', 'D', 'E', 'G', 'A'],
  blues: ['C', 'Eb', 'F', 'F#', 'G', 'Bb'],
  harmonicMinor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
  melodicMinor: ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
};

// --- Chords ---
export function getChordNotes(root, type = 'major') {
  const base = root.replace(/m$/, '');
  const scale = type === 'minor' || root.includes('m') ? scales.minor : scales.major;
  const index = scale.indexOf(base);
  if (index === -1) return [base];

  return [
    scale[index % scale.length],
    scale[(index + 2) % scale.length],
    scale[(index + 4) % scale.length],
  ];
}

// --- Expand chord into arpeggio ---
export function expandChord(root, type = 'major') {
  const notes = getChordNotes(root, type);
  return Array(8).fill(0).map((_, i) => notes[i % notes.length]);
}

// --- Get full scale notes ---
export function getScaleNotes(scaleName) {
  return scales[scaleName] || scales.major;
}

// --- Genre beat patterns ---
export function getBeatPattern(genre = 'ambient') {
  const patterns = {
    ambient: [
      { kick: true, snare: false, hats: true },
      { kick: false, snare: false, hats: true },
      { kick: true, snare: true, hats: false },
      { kick: false, snare: false, hats: true },
    ],
    house: [
      { kick: true, snare: false, hats: true },
      { kick: false, snare: false, hats: true },
      { kick: true, snare: false, hats: true },
      { kick: false, snare: true, hats: true },
    ],
    hiphop: [
      { kick: true, snare: false, hats: false },
      { kick: false, snare: false, hats: true },
      { kick: true, snare: true, hats: false },
      { kick: false, snare: false, hats: true },
    ],
    dnb: [
      { kick: true, snare: false, hats: true },
      { kick: false, snare: true, hats: false },
      { kick: true, snare: false, hats: true },
      { kick: false, snare: true, hats: false },
    ],
    dubstep: [
      { kick: true, snare: false, hats: false },
      { kick: false, snare: false, hats: true },
      { kick: false, snare: true, hats: false },
      { kick: true, snare: false, hats: true },
    ]
  };
  return patterns[genre] || patterns.ambient;
}

// --- Genre bass patterns ---
export function getBasslinePattern(genre = 'ambient') {
  const patterns = {
    ambient: ['C2', 'G2', 'F2', 'E2'],
    house: ['C2', 'E2', 'G2', 'A2'],
    hiphop: ['C2', 'D#2', 'G2', 'A#1'],
    dnb: ['C2', 'A1', 'F2', 'G2'],
    dubstep: ['C2', 'D2', 'F2', 'G1'],
  };
  return patterns[genre] || patterns.ambient;
}

// --- Get one note from a chord ---
export function getNoteFromChord(chord, index = 0) {
  const type = chord.includes('m') ? 'minor' : 'major';
  const notes = getChordNotes(chord, type);
  return notes[index % notes.length];
}
