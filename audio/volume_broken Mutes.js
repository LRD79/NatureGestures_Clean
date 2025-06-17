// 📁 /audio/volume.js

export const droneGain = window.droneGain = new Tone.Gain(0).connect(Tone.context.rawContext.destination);
export const chimeGain = window.chimeGain = new Tone.Gain(0).connect(Tone.context.rawContext.destination);
export const ambientGain = window.ambientGain = new Tone.Gain(0).connect(Tone.context.rawContext.destination);
export const noiseGain = window.noiseGain = new Tone.Gain(0).connect(Tone.context.rawContext.destination);

const bandCompressor = new Tone.Compressor(-20, 3).toDestination();
export const drumGain = window.drumGain = new Tone.Gain(0).connect(bandCompressor);
export const pianoGain = window.pianoGain = new Tone.Gain(0).connect(bandCompressor);
export const bassGain = window.bassGain = new Tone.Gain(0).connect(bandCompressor);
export const stringsGain = window.stringsGain = new Tone.Gain(0).connect(bandCompressor);
export const windsGain = window.windsGain = new Tone.Gain(0).connect(bandCompressor);

// Load saved volume or fallback to 0.5
function getSavedVolume(key, fallback = 0.5) {
  const val = parseFloat(localStorage.getItem(key));
  return isNaN(val) ? fallback : val;
}

// Save volume
function saveVolume(key, value) {
  localStorage.setItem(key, value);
}

// Fade gain to saved volume
function fadeGainToSaved(gainNode, volumeKey, duration = 10) {
  if (!gainNode?.gain) return;

  const target = getSavedVolume(volumeKey, 0.5);
  const now = Tone.now();

  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(target, now + duration);
}

// Fade gain to zero
function fadeGainToZero(gainNode, duration = 10) {
  if (!gainNode?.gain) return;

  const now = Tone.now();
  const current = gainNode.gain.value;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(current, now);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
}

// Apply all volumes from localStorage
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

// Fade all to zero before reset/reload
function fadeAllToZero(duration = 10) {
  [
    droneGain, chimeGain, ambientGain, noiseGain,
    drumGain, pianoGain, bassGain, stringsGain, windsGain
  ].forEach(gain => fadeGainToZero(gain, duration));
}

export {
  saveVolume,
  fadeGainToSaved,
  fadeGainToZero,
  fadeAllToZero,
  loadSavedVolumes
};
