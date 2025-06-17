// 📁 /audio/instruments/noise.js

import { getNoiseGain } from '../volume.js';

let noise;
let noiseType = 'white'; // Default noise type

// ✅ Setup function for gain routing safety
export function setupNoise() {
  try {
    const noiseGain = getNoiseGain();
    if (!noiseGain || !noiseGain.connect) {
      console.warn("⚠️ noiseGain is not available — did you run setupGains()?");
    } else {
      noiseGain.disconnect();
      noiseGain.connect(Tone.getDestination());
      console.log("🌫️ Noise gain routed to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error in setupNoise()", err);
  }
}

// ✅ New preload: define type only
export function preloadNoise(type = 'white') {
  noiseType = type;
  window.__noiseReady = true;
}

// ✅ New start: actually create + play
export function startNoise() {
  const noiseGain = getNoiseGain();

  try {
    noise = new Tone.Noise(noiseType).connect(noiseGain);
    noiseGain.gain.value = 0.2;
    noise.start();

    console.log(`🌫️ Noise generator started with type "${noiseType}"`);
  } catch (err) {
    console.error("❌ Error starting noise:", err);
  }
}

// ✅ Clean up
export function disposeNoise() {
  if (noise) {
    try {
      noise.stop();
      noise.dispose();
      console.log("🛑 Noise disposed.");
    } catch (err) {
      console.warn("⚠️ Error disposing noise:", err);
    }
    noise = null;
  }
}
