// 📁 /audio/drone.js

import * as Tone from 'https://cdn.skypack.dev/tone';
import {
  getDroneGain,
  fadeGainToSaved,
  fadeGainToZero
} from './volume.js';

let osc1 = null;
let osc2 = null;
let env = null;
let cleanupTimer = null;

export function setupDrone(current) {
  const { wind_kph, wind_dir, cloud, uv } = current;
  const droneGain = getDroneGain(); // 🔁 use getter

  let oscType = "sine";
  if (["E", "SE"].includes(wind_dir)) oscType = "square";
  else if (["S", "SW"].includes(wind_dir)) oscType = "triangle";
  else if (["W", "NW"].includes(wind_dir)) oscType = "sawtooth";

  const freq = Math.max(Tone.Frequency("A2").transpose(wind_kph / 3).toFrequency(), 20);
  env = new Tone.AmplitudeEnvelope({ attack: 2, decay: 1.5, sustain: 0.8, release: 5 });

  const filter = new Tone.Filter({ type: "lowpass", frequency: 100 + (uv * 100), Q: uv > 5 ? 10 : 2 });
  const reverb = new Tone.Reverb({ decay: 6, preDelay: 0.01, wet: cloud / 100 });

  osc1 = new Tone.Oscillator({ type: oscType, frequency: freq });
  osc2 = new Tone.Oscillator({ type: oscType, frequency: freq * 0.001 });

  const droneChain = new Tone.Gain();
  reverb.connect(droneChain);
  droneChain.connect(droneGain);

  osc1.chain(env, filter, reverb);
  osc2.chain(env, filter, reverb);

  osc1.start();
  osc2.start();
  env.triggerAttack();

  fadeGainToSaved(droneGain, 'droneVolume', 10);

  // ⏳ Schedule fade-out and disposal after 290s
  cleanupTimer = setTimeout(() => {
    if (env) env.triggerRelease();

    setTimeout(() => fadeGainToZero(droneGain), 2000);

    setTimeout(() => {
      if (osc1) { try { osc1.stop(); osc1.dispose(); } catch (e) {} osc1 = null; }
      if (osc2) { try { osc2.stop(); osc2.dispose(); } catch (e) {} osc2 = null; }
      if (env)  { try { env.dispose(); } catch (e) {} env = null; }
    }, 10000);
  }, 290000);
}

export function stopDrone() {
  const droneGain = getDroneGain(); // 🔁 use getter

  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  if (env) {
    try { env.triggerRelease(); } catch (e) {}
  }

  setTimeout(() => fadeGainToZero(droneGain), 2000);

  setTimeout(() => {
    if (osc1) { try { osc1.stop(); osc1.dispose(); } catch (e) {} osc1 = null; }
    if (osc2) { try { osc2.stop(); osc2.dispose(); } catch (e) {} osc2 = null; }
    if (env)  { try { env.dispose(); } catch (e) {} env = null; }
  }, 10000);

  console.log("🛑 Drone stopped");
}
