import {
  getDroneGain,
  fadeGainToSaved,
  fadeGainToZero
} from './volume.js';

let osc1 = null;
let osc2 = null;
let env = null;
let cleanupTimer = null;
let oscType = "sine";
let frequency = 55; // fallback freq

function setupDroneDependencies() {
  try {
    const droneGain = getDroneGain();
    if (!droneGain || !droneGain.connect) {
      console.warn("⚠️ droneGain is not available — did you run setupGains()?");
    } else {
      droneGain.disconnect();
      droneGain.connect(Tone.getDestination());
      console.log("🎛️ Drone gain routed to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupDroneDependencies", err);
  }
}

function preloadDrone(current) {
  const { wind_kph, wind_dir } = current;
  const droneGain = getDroneGain();

  oscType = "sine";
  if (["E", "SE"].includes(wind_dir)) oscType = "square";
  else if (["S", "SW"].includes(wind_dir)) oscType = "triangle";
  else if (["W", "NW"].includes(wind_dir)) oscType = "sawtooth";

  frequency = Math.max(Tone.Frequency("A2").transpose(wind_kph / 3).toFrequency(), 20);

  window.__droneReady = true;
}

function startDrone(current) {
  if (!current || typeof current.uv === 'undefined' || typeof current.cloud === 'undefined') {
    console.warn("🚫 Missing UV or cloud data for drone — skipping startDrone.");
    return;
  }

  const { uv, cloud } = current;
  const droneGain = getDroneGain();

  env = new Tone.AmplitudeEnvelope({ attack: 2, decay: 1.5, sustain: 0.8, release: 5 });

  const filter = new Tone.Filter({
    type: "lowpass",
    frequency: 100 + (uv * 100),
    Q: uv > 5 ? 10 : 2
  });

  const reverb = new Tone.Reverb({ decay: 6, preDelay: 0.01, wet: cloud / 100 });

  osc1 = new Tone.Oscillator({ type: oscType, frequency });
  osc2 = new Tone.Oscillator({ type: oscType, frequency: frequency * 0.001 });

  const droneChain = new Tone.Gain();
  reverb.connect(droneChain);
  droneChain.connect(droneGain);

  osc1.chain(env, filter, reverb);
  osc2.chain(env, filter, reverb);

  osc1.start();
  osc2.start();
  env.triggerAttack();

  fadeGainToSaved(droneGain, 'droneVolume', 10);

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

function stopDrone() {
  const droneGain = getDroneGain();

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

export {
  setupDroneDependencies,
  preloadDrone,
  startDrone,
  stopDrone
};
