// 📁 /audio/instruments/bass.js

import { getBassGain } from '../volume.js';
import { expandChord } from '../../utils/musicUtils.js';

let synth;

// ✅ Safe gain setup
export function setupBass() {
  try {
    const bassGain = getBassGain();
    if (!bassGain || !bassGain.connect) {
      console.warn("⚠️ bassGain is not available — did you run setupGains()?");
    } else {
      bassGain.disconnect();
      bassGain.connect(Tone.getDestination());
      console.log("🎸 Bass gain routed to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupBass", err);
  }
}

export function createBass() {
  const bassGain = getBassGain();

  synth = new Tone.MonoSynth({
    oscillator: { type: 'square' },
    envelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.2,
      release: 0.8
    },
    filter: {
      Q: 2,
      type: 'lowpass',
      rolloff: -24
    },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 0.4,
      release: 2,
      baseFrequency: 50,
      octaves: 2.6,
      exponent: 1
    }
  }).connect(bassGain);

  return synth;
}

function getBassNotes(profile, count = 16) {
  const chordList = profile.chords || ['C', 'F', 'G', 'Am'];
  const notes = [];

  for (let i = 0; i < count; i++) {
    const chord = expandChord(chordList[i % chordList.length]);
    const root = chord[0];
    let note = root;

    const roll = Math.random();
    if (roll < 0.4) {
      note = chord[0]; // root
    } else if (roll < 0.7 && chord[2]) {
      note = chord[2]; // 5th
    } else {
      note = chord[0]; // octave
    }

    notes.push(`${note}1`);
  }

  return notes;
}

function scheduleBassPart(profile, startTime, noteCount = 16, stepDur = '8n') {
  if (!synth) return;

  const notes = getBassNotes(profile, noteCount);
  const stepSeconds = Tone.Time(stepDur).toSeconds();

  notes.forEach((note, i) => {
    const time = startTime + i * stepSeconds;
    Tone.Transport.schedule(timeNow => {
      synth.triggerAttackRelease(note, stepDur, timeNow);
    }, time);
  });
}

export function playBassIntro(profile) {
  scheduleBassPart(profile, Tone.now(), 8, '8n');
}

export function playBassVerse(profile) {
  scheduleBassPart(profile, Tone.now(), 16, '8n');
}

export function playBassChorus(profile) {
  scheduleBassPart(profile, Tone.now(), 16, '4n');
}

export function playBassOutro(profile) {
  scheduleBassPart(profile, Tone.now(), 4, '2n');
}
