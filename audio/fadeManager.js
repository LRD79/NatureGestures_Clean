import { fadeGainToZero } from './volume.js';
import {
  droneGain,
  chimeGain,
  ambientGain,
  noiseGain,
  drumGain,
  pianoGain,
  bassGain,
  stringsGain,
  windsGain
} from './volume.js';

export async function fadeOutAllLayers() {
  try {
    fadeGainToZero(droneGain);
    fadeGainToZero(chimeGain);
    fadeGainToZero(ambientGain);
    fadeGainToZero(noiseGain);
    fadeGainToZero(drumGain);
    fadeGainToZero(pianoGain);
    fadeGainToZero(bassGain);
    fadeGainToZero(stringsGain);
    fadeGainToZero(windsGain);
    return new Promise(resolve => setTimeout(resolve, 5000)); // wait for fade to complete
  } catch (err) {
    console.warn("⚠️ fadeOutAllLayers error:", err);
  }
}
