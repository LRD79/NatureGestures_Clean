// 📁 /ui/controls.js

import {
  chimeGain,
  droneGain,
  ambientGain,
  noiseGain,
  drumGain,
  pianoGain,
  bassGain,
  stringsGain,
  windsGain,
  saveVolume
} from '../audio/volume.js';

function getSavedVolume(key, fallback = 0.5) {
  const saved = parseFloat(localStorage.getItem(key));
  return isNaN(saved) ? fallback : saved;
}

function setupVolumeControl(slider, gainNode, key, label) {
  const initialVolume = getSavedVolume(key, 0.5);
  slider.value = initialVolume * 100;

  const applyVolume = () => {
    const volume = parseFloat(slider.value) / 100;
    gainNode.gain.value = volume;
  };

  applyVolume();

  slider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value) / 100;
    saveVolume(key, volume);
    gainNode.gain.value = volume;
  });
}

// 🎚️ Only sliders, no mute buttons
const elements = [
  { key: 'chime', label: 'Chimes', slider: 'chimeVolumeSlider', gain: chimeGain },
  { key: 'drone', label: 'Drone', slider: 'droneVolumeSlider', gain: droneGain },
  { key: 'ambient', label: 'Ambient', slider: 'ambientVolumeSlider', gain: ambientGain },
  { key: 'drum', label: 'Drums', slider: 'drumVolumeSlider', gain: drumGain },
  { key: 'noise', label: 'Noise', slider: 'noiseVolumeSlider', gain: noiseGain },
  { key: 'piano', label: 'Piano', slider: 'pianoVolumeSlider', gain: pianoGain },
  { key: 'bass', label: 'Bass', slider: 'bassVolumeSlider', gain: bassGain },
  { key: 'strings', label: 'Strings', slider: 'stringsVolumeSlider', gain: stringsGain },
  { key: 'winds', label: 'Winds', slider: 'windsVolumeSlider', gain: windsGain },
];

for (const { key, label, slider, gain } of elements) {
  const sliderEl = document.getElementById(slider);
  if (sliderEl) {
    setupVolumeControl(sliderEl, gain, `${key}Volume`, label);
  }
}
