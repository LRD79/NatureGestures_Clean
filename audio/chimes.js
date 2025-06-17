import { getChimeGain, fadeGainToSaved, fadeGainToZero, loadSavedVolumes } from './volume.js';
import { getMusicSettings } from './musicProfile.js';

let chimesEnabled = true;
let chimesLoaded = false;
let chimesEndTime = null;
let chimeLoopInterval = null;
let validBuffers = [];
let pitchTestMode = false;

function setupChimes() {
  try {
    const chimeGain = getChimeGain();
    if (!chimeGain || !chimeGain.connect) {
      console.warn("⚠️ chimeGain is not available — did you run setupGains()?");
    } else {
      chimeGain.disconnect();
      chimeGain.connect(Tone.getDestination());
      console.log("🔊 Chime gain routed directly to Tone Destination");
    }
  } catch (err) {
    console.error("❌ Error connecting chimeGain", err);
  }
}

function setChimesEnabled(value) {
  chimesEnabled = value;
}

function togglePitchTestMode() {
  pitchTestMode = !pitchTestMode;
  console.log(`🎛️ Pitch Test Mode: ${pitchTestMode ? "Lowered" : "Normal"}`);
}

async function preloadChimes(current) {
  if (Tone.context.state !== "running") {
    console.warn("⚠️ preloadChimes called before AudioContext was started.");
    await Tone.start();
    if (Tone.Transport.state !== "started") Tone.Transport.start();
  }

  console.log("🎧 Preloading chime buffers...");
  chimesLoaded = false;

  const chimeFiles = [
    "/assets/AmbientSoundMP3s/38888__iainmccurdy__wind-chimes/696630__iainmccurdy__large-wind-chime-1-d574.wav",
    "/assets/AmbientSoundMP3s/38888__iainmccurdy__wind-chimes/696631__iainmccurdy__large-wind-chime-2-eb575.wav",
    "/assets/AmbientSoundMP3s/38888__iainmccurdy__wind-chimes/696632__iainmccurdy__large-wind-chime-3-g579.wav",
    "/assets/AmbientSoundMP3s/38888__iainmccurdy__wind-chimes/696633__iainmccurdy__large-wind-chime-4-a581.wav",
    "/assets/AmbientSoundMP3s/38888__iainmccurdy__wind-chimes/696634__iainmccurdy__large-wind-chime-5-bb582.wav",
    "/assets/AmbientSoundMP3s/38888__iainmccurdy__wind-chimes/696635__iainmccurdy__large-wind-chime-2-d686.wav"
  ];

  const buffers = await Promise.all(chimeFiles.map((url, i) => {
    return new Promise((resolve) => {
      const buffer = new Tone.Buffer({
        url,
        onload: () => resolve({ buffer, url, duration: buffer.duration }),
        onerror: () => {
          console.warn(`❌ Failed to load chime${i}`);
          resolve(null);
        }
      });
    });
  }));

  validBuffers = buffers.filter(Boolean);
  chimesLoaded = validBuffers.length > 0;

  if (chimesLoaded) {
    console.log(`✅ ${validBuffers.length} chimes loaded`);
    window.__chimesReady = true;
  } else {
    console.error("🚫 No chimes loaded.");
    window.__chimesReady = false;
  }
}

function startChimes(current, duration = 5 * 60 * 1000) {
  if (!chimesEnabled || !chimesLoaded) return;

  loadSavedVolumes();
  fadeGainToSaved(getChimeGain(), 'chimeVolume', 10);
  chimesEndTime = Tone.now() + duration / 1000;

  if (chimeLoopInterval) clearInterval(chimeLoopInterval);
  chimeLoopInterval = setInterval(() => tryPlayBurst(current), 3500);

  console.log("🔔 Chimes started, looping for", duration / 1000, "seconds");

  setTimeout(() => {
    console.log("🔕 Chimes ending, fading out...");
    clearInterval(chimeLoopInterval);
    fadeGainToZero(getChimeGain());
  }, duration);
}

function tryPlayBurst(current) {
  if (!chimesEnabled || !chimesLoaded || Tone.now() > chimesEndTime) return;
  if (Tone.Transport.state !== "started") return;

  if (!current || typeof current.wind_kph === 'undefined' || typeof current.gust_kph === 'undefined') {
    console.warn("⚠️ Missing wind data for chimes");
    return;
  }

  const wind = current.wind_kph || 10;
  const gust = current.gust_kph || 20;
  const burst = Math.floor(Math.random() * (Math.floor(gust / 4) + 2)) + 1;

  const { key: currentKey } = getMusicSettings();
  const keyToRate = {
    'C': 1.0, 'C#': 1.06, 'D': 1.12, 'D#': 1.19,
    'E': 1.26, 'F': 1.34, 'F#': 1.42, 'G': 1.5,
    'G#': 1.59, 'A': 1.68, 'A#': 1.78, 'B': 1.89
  };

  let rate = keyToRate[currentKey] || 1.0;
  if (pitchTestMode) rate *= 0.5;

  for (let i = 0; i < burst; i++) {
    const delay = i * (Math.random() * 0.2 + 0.05);
    const clip = validBuffers[Math.floor(Math.random() * validBuffers.length)];

    const pan = new Tone.Panner(Math.random() * 2 - 1);
    const preGain = new Tone.Gain(0.05);

    const player = new Tone.Player().connect(preGain).connect(pan).connect(getChimeGain());
    player.buffer = clip.buffer.get();
    player.playbackRate = rate;
    player.start(Tone.now() + delay);
    setTimeout(() => player.dispose(), 10000);
  }

  console.log(`🔔 Burst of ${burst} chimes (key: ${currentKey}, rate: ${rate.toFixed(2)})`);
}

function createChimes() {
  return {
    dispose: () => stopChimes()
  };
}

function stopChimes() {
  if (chimeLoopInterval) clearInterval(chimeLoopInterval);
  fadeGainToZero(getChimeGain());
  chimesLoaded = false;
  console.log("🛑 Chimes stopped");
}

export {
  setupChimes,
  preloadChimes,
  startChimes,
  stopChimes,
  setChimesEnabled,
  togglePitchTestMode,
  chimesLoaded,
  createChimes
};
