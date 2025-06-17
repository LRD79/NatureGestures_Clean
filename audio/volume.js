// 📁 /audio/volume.js
import { masterCompressor } from './master.js';

export let droneGain, chimeGain, ambientGain;
export let noiseGain, drumGain, pianoGain, bassGain, stringsGain, windsGain;

function setupGains() {
  // Ambient → connect directly to destination
  droneGain = new Tone.Gain(0).connect(Tone.getDestination());
  chimeGain = new Tone.Gain(0).connect(Tone.getDestination());
  ambientGain = new Tone.Gain(0).connect(Tone.getDestination());
  noiseGain = new Tone.Gain(0.2).connect(Tone.getDestination());

  // Band → through master compressor
  drumGain = new Tone.Gain(0).connect(masterCompressor);
  pianoGain = new Tone.Gain(0).connect(masterCompressor);
  bassGain = new Tone.Gain(0).connect(masterCompressor);
  stringsGain = new Tone.Gain(0).connect(masterCompressor);
  windsGain = new Tone.Gain(0).connect(masterCompressor);
}

function getSavedVolume(key, fallback = 0.5) {
  const val = parseFloat(localStorage.getItem(key));
  return isNaN(val) ? fallback : val;
}

function saveVolume(key, value) {
  localStorage.setItem(key, value);
}

function fadeGainToSaved(gainNode, volumeKey, duration = 10) {
  if (!gainNode?.gain) return;
  const target = getSavedVolume(volumeKey, 0.5);
  const now = Tone.now();
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(target, now + duration);
}

function fadeGainToZero(gainNode, duration = 10) {
  if (!gainNode?.gain) return;
  const now = Tone.now();
  const current = gainNode.gain.value;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(current, now);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
}

function loadSavedVolumes() {
  fadeGainToSaved(droneGain, 'droneVolume');
  fadeGainToSaved(chimeGain, 'chimeVolume');
  fadeGainToSaved(ambientGain, 'ambientVolume');
  fadeGainToSaved(noiseGain, 'noiseVolume');
  fadeGainToSaved(drumGain, 'drumVolume');
  fadeGainToSaved(pianoGain, 'pianoVolume');
  fadeGainToSaved(bassGain, 'bassVolume');
  fadeGainToSaved(stringsGain, 'stringsVolume');
  fadeGainToSaved(windsGain, 'windsVolume');
}

function fadeAllToZero(duration = 10) {
  [
    droneGain, chimeGain, ambientGain, noiseGain,
    drumGain, pianoGain, bassGain, stringsGain, windsGain
  ].forEach(gain => fadeGainToZero(gain, duration));
}

// 🎯 Export accessors too (just in case)
export function getDroneGain() { return droneGain; }
export function getChimeGain() { return chimeGain; }
export function getAmbientGain() { return ambientGain; }
export function getNoiseGain() { return noiseGain; }
export function getDrumGain() { return drumGain; }
export function getPianoGain() { return pianoGain; }
export function getBassGain() { return bassGain; }
export function getStringsGain() { return stringsGain; }
export function getWindsGain() { return windsGain; }

export {
  setupGains,
  saveVolume,
  fadeGainToSaved,
  fadeGainToZero,
  fadeAllToZero,
  loadSavedVolumes
};
