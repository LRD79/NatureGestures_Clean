import { chimeGain, fadeGainToSaved, fadeGainToZero, loadSavedVolumes } from './volume.js';

if (!chimeGain.toDestination) {
  console.warn("⚠️ chimeGain is not a Tone.Gain instance — check volume.js");
} else {
  chimeGain.disconnect();
  chimeGain.connect(Tone.Destination);
  console.log("🔊 Chime gain routed directly to Tone.Destination (no compression)");
}

let chimesEnabled = true;
let chimesLoaded = false;
let chimesEndTime = null;
let chimeLoopInterval = null;
let validBuffers = [];

export function setChimesEnabled(value) {
  chimesEnabled = value;
}

export async function scheduleChimesWithSamples(current, duration = 5 * 60 * 1000) {
  if (Tone.context.state !== "running") {
    console.warn("⚠️ scheduleChimesWithSamples called before AudioContext was started.");
    await Tone.start();
    if (Tone.Transport.state !== "started") Tone.Transport.start();
    console.log("✅ AudioContext started inside chime scheduler");
  }

  console.log("🎧 Loading chime buffers...");
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
  if (validBuffers.length === 0) {
    console.error("🚫 No chimes loaded.");
    return;
  }

  chimesLoaded = true;
  loadSavedVolumes();
  fadeGainToSaved(chimeGain, 'chimeVolume', 10);
  chimesEndTime = Tone.now() + duration / 1000;

  if (chimeLoopInterval) clearInterval(chimeLoopInterval);
  chimeLoopInterval = setInterval(() => tryPlayBurst(current), 3500);

  console.log("🌀 Chime loop active for", duration / 1000, "seconds");
  setTimeout(() => {
    console.log("🔕 Ending chimes and fading out...");
    clearInterval(chimeLoopInterval);
    fadeGainToZero(chimeGain);
  }, duration);
}

function tryPlayBurst(current) {
  if (!chimesEnabled || !chimesLoaded || Tone.now() > chimesEndTime) return;
  if (Tone.Transport.state !== "started") return;

  const wind = current.wind_kph || 10;
  const gust = current.gust_kph || 20;
  const burst = Math.floor(Math.random() * (Math.floor(gust / 4) + 2)) + 1;

  for (let i = 0; i < burst; i++) {
    const delay = i * (Math.random() * 0.2 + 0.05);
    const clip = validBuffers[Math.floor(Math.random() * validBuffers.length)];
    const pan = new Tone.Panner(Math.random() * 2 - 1);
    const preGain = new Tone.Gain(0.05);
    const player = new Tone.Player(clip.buffer).connect(preGain).connect(pan).connect(chimeGain);
    player.start(Tone.now() + delay);
    setTimeout(() => player.dispose(), 10000);
  }

  console.log(`🔔 Burst of ${burst} chimes`);
}

export function stopChimes() {
  if (chimeLoopInterval) clearInterval(chimeLoopInterval);
  fadeGainToZero(chimeGain);
  chimesLoaded = false;
  console.log("🛑 Chimes stopped");
}
