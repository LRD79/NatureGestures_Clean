// 📁 /ui/controls.js

import {
  getChimeGain,
  getDroneGain,
  getAmbientGain,
  getNoiseGain,
  getDrumGain,
  getPianoGain,
  getBassGain,
  getStringsGain,
  getWindsGain,
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
    if (!gainNode?.gain) {
      console.warn(`⚠️ ${label} gainNode not ready`);
      return;
    }
    gainNode.gain.value = parseFloat(slider.value) / 100;
  };

  applyVolume();

  slider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value) / 100;
    saveVolume(key, volume);
    if (gainNode?.gain) {
      gainNode.gain.value = volume;
    }
  });
}

// ✅ Exported function to safely initialize all sliders
export function setupAllVolumeControls() {
  const elements = [
    { key: 'chime', label: 'Chimes', slider: 'chimeVolumeSlider', gain: getChimeGain() },
    { key: 'drone', label: 'Drone', slider: 'droneVolumeSlider', gain: getDroneGain() },
    { key: 'ambient', label: 'Ambient', slider: 'ambientVolumeSlider', gain: getAmbientGain() },
    { key: 'drum', label: 'Drums', slider: 'drumVolumeSlider', gain: getDrumGain() },
    { key: 'noise', label: 'Noise', slider: 'noiseVolumeSlider', gain: getNoiseGain() },
    { key: 'piano', label: 'Piano', slider: 'pianoVolumeSlider', gain: getPianoGain() },
    { key: 'bass', label: 'Bass', slider: 'bassVolumeSlider', gain: getBassGain() },
    { key: 'strings', label: 'Strings', slider: 'stringsVolumeSlider', gain: getStringsGain() },
    { key: 'winds', label: 'Winds', slider: 'windsVolumeSlider', gain: getWindsGain() },
  ];

  for (const { key, label, slider, gain } of elements) {
    const sliderEl = document.getElementById(slider);
    if (sliderEl && gain) {
      setupVolumeControl(sliderEl, gain, `${key}Volume`, label);
    }
  }
}
