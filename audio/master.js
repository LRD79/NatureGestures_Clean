// 📁 /js/audio/master.js

export const masterLimiter = new Tone.Limiter(-4);
export const masterCompressor = new Tone.Compressor({
  threshold: -20,
  ratio: 3,
  attack: 0.005,
  release: 0.1
}).connect(masterLimiter).toDestination();
