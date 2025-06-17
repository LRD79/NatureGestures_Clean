// 📁 /audio/instruments/drums.js

import { getDrumGain } from '../volume.js';
import { getBeatPattern } from '../../utils/musicUtils.js';

let kick, snare, hats, loop;

// ✅ Safe gain setup
export function setupDrums() {
  try {
    const drumGain = getDrumGain();
    if (!drumGain || !drumGain.connect) {
      console.warn("⚠️ drumGain is not available — did you run setupGains()?");
    } else {
      drumGain.disconnect();
      drumGain.connect(Tone.getDestination());
      console.log("🧡 Drum gain routed to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupDrums", err);
  }
}

export function createDrums() {
  const drumGain = getDrumGain();

  kick = new Tone.MembraneSynth({
    volume: -4,
    envelope: {
      attack: 0.001,
      decay: 0.5,
      sustain: 0,
      release: 0.2
    }
  }).connect(drumGain);

  snare = new Tone.NoiseSynth({
    volume: -4,
    noise: { type: 'white' },
    envelope: {
      attack: 0.005,
      decay: 0.2,
      sustain: 0
    }
  }).connect(drumGain);

  hats = new Tone.MetalSynth({
    volume: -8,
    frequency: 180,
    envelope: {
      attack: 0.001,
      decay: 0.15,
      release: 0.01
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 3000,
    octaves: 1.5
  }).connect(drumGain);

  console.log("✅ Drums created (Membrane, Noise, Metal)");

  setTimeout(() => {
    console.log("🧪 Manual test (real drums)");
    console.log("🔊 drumGain.gain.value =", drumGain.gain.value);
    const now = Tone.now();
    kick.triggerAttackRelease('C1', '8n', now);
    snare.triggerAttackRelease('16n', now);
    hats.triggerAttackRelease('16n', now);
  }, 2000);

  return { kick, snare, hats };
}

export function scheduleDrums(profile, loops = 1) {
  if (!kick || !snare || !hats) {
    console.warn("❌ Drums not initialized!");
    return;
  }

  let genre = (profile.genre || 'ambient').toLowerCase().split(' ')[0];
  let beatPattern = getBeatPattern(genre);

  if (!beatPattern || !beatPattern.length) {
    console.warn("⚠️ No beat pattern found for genre:", profile.genre, "→ Using fallback.");
    beatPattern = [
      { kick: true, snare: false, hats: true },
      { kick: false, snare: false, hats: true },
      { kick: true, snare: true, hats: false },
      { kick: false, snare: false, hats: true },
    ];
  }

  console.log("🧡 Beat pattern:", beatPattern);

  const eighthNote = '8n';
  let step = 0;

  const loopStartTime = Tone.now() + 0.5; // ⏱️ Buffer for accurate timing

  loop = new Tone.Loop((time) => {
    const pattern = beatPattern[step % beatPattern.length];

    if (pattern.kick) kick.triggerAttackRelease('C1', '8n', time);
    if (pattern.snare) snare.triggerAttackRelease('16n', time);
    if (pattern.hats) hats.triggerAttackRelease('16n', time);

    console.log("🔁 Drum step:", step, pattern);
    step++;
  }, eighthNote).start(loopStartTime);

  console.log("💨 Drum loop scheduled and started.");
  return loop;
}

export function stopDrums() {
  if (loop) {
    loop.stop();
    loop.cancel();
    loop = null;
    console.log("🛑 Drum loop stopped.");
  }
}
