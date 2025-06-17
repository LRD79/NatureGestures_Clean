// --- Scales ---
export const scales = {
  major: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2'],
  minor: ['C2', 'D2', 'Eb2', 'F2', 'G2', 'Ab2', 'Bb2'],
  dorian: ['C2', 'D2', 'Eb2', 'F2', 'G2', 'A2', 'Bb2'],
  phrygian: ['C2', 'Db2', 'Eb2', 'F2', 'G2', 'Ab2', 'Bb2'],
  lydian: ['C2', 'D2', 'E2', 'F#2', 'G2', 'A2', 'B2'],
  mixolydian: ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'Bb2'],
  locrian: ['C2', 'Db2', 'Eb2', 'F2', 'Gb2', 'Ab2', 'Bb2'],
  wholeTone: ['C2', 'D2', 'E2', 'F#2', 'G#2', 'A#2'],
  chromatic: ['C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2'],
  pentatonic: ['C2', 'D2', 'E2', 'G2', 'A2'],
  blues: ['C2', 'Eb2', 'F2', 'F#2', 'G2', 'Bb2'],
  harmonicMinor: ['C2', 'D2', 'Eb2', 'F2', 'G2', 'Ab2', 'B2'],
  melodicMinor: ['C2', 'D2', 'Eb2', 'F2', 'G2', 'A2', 'B2'],
};

// --- Get a note in the given scale and key ---
export function getNoteInScale(key, scaleName = 'minor', octave = 2) {
  const scale = scales[scaleName] || scales.minor;
  const root = key.replace(/[^A-G#b]/g, '').toUpperCase() + octave;
  const rootIndex = scale.findIndex(n => n.startsWith(root[0]));
  return rootIndex >= 0 ? scale[rootIndex] : scale[0];
}

// --- Chords ---
export function getChordNotes(root, type = 'major') {
  const base = root.replace(/m$/, '') + '2';
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
