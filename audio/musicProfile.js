import { getSoundEnvironment } from '../env/soundEnvironment.js';

export function generateMusicProfile(env) {
  const {
    temperature,
    wind_kph,
    gust_kph,
    uv,
    cloud,
    condition,
    lunarPhase,
    season,
    timeOfDay,
  } = env;

  // 🎵 BPM: Wind speed
  const bpm = wind_kph < 10 ? 65 : wind_kph < 20 ? 80 : 95;

  // 🎵 Key: UV index
  const key = uv < 3 ? 'A minor' : 'C major';

  // 🎵 Chord progression: season + moon
  let chords = ['C', 'Am', 'F', 'G'];
  if (season === 'winter') chords = ['Am', 'F', 'Dm', 'E'];
  else if (season === 'spring') chords = ['C', 'F', 'Am', 'G'];
  else if (season === 'autumn') chords = ['Dm', 'G', 'Am', 'E'];
  else if (season === 'summer') chords = ['C', 'G', 'Am', 'F'];
  if ((lunarPhase || '').includes('New')) chords.reverse();

  // 🎵 Melody range: temperature
  const melodyOctave = temperature < 10 ? 3 : temperature > 25 ? 5 : 4;

  // 🎵 Drum pattern: cloud cover
  const drumDensity = cloud < 25 ? 'sparse' : cloud < 70 ? 'medium' : 'dense';

  // 🎵 Noise type: cloud and gust
  let noiseType = 'white';
  if (gust_kph > 25) noiseType = 'brown';
  else if (cloud < 50) noiseType = 'pink';

  // 🌦️ Weather Mood
  let weatherMood = 'clear';
  const cond = (condition || '').toLowerCase();
  if (!condition) console.warn("⚠️ Missing condition in env:", env);

  if (cond.includes('rain')) weatherMood = 'wet';
  else if (cond.includes('snow') || cond.includes('sleet')) weatherMood = 'frozen';
  else if (cond.includes('thunder') || cond.includes('storm')) weatherMood = 'stormy';
  else if (cond.includes('fog') || cond.includes('mist')) weatherMood = 'hazy';
  else if (cond.includes('overcast') || cond.includes('cloud')) weatherMood = 'cloudy';

  // 🌕 Moon Influence
  const moon = (lunarPhase || '').toLowerCase();
  if (!lunarPhase) console.warn("⚠️ Missing lunarPhase in env:", env);

  let moonInfluence = 'none';
  if (moon.includes('new')) moonInfluence = 'reversed';
  else if (moon.includes('full')) moonInfluence = 'lush';
  else if (moon.includes('waning')) moonInfluence = 'detuned';
  else if (moon.includes('waxing')) moonInfluence = 'bright';

  // 🎵 Time-of-day influence
  const mood =
    timeOfDay === 'dawn'
      ? 'gentle'
      : timeOfDay === 'dusk'
      ? 'lowpassed'
      : 'bright';

  const profile = {
    bpm,
    key,
    chords,
    melodyOctave,
    drumDensity,
    noiseType,
    mood,
    weatherMood,
    moonInfluence,
    env, // for debugging
  };

  console.log("🎼 Music Profile Generated:", profile);
  return profile;
}

export function getCurrentMusicProfile() {
  const env = getSoundEnvironment();
  const profile = generateMusicProfile(env);
  console.log("🎼 Current Music Profile:", profile);
  return profile;
}

// ✅ NEW: alias for chimes.js compatibility
export function getMusicSettings() {
  return getCurrentMusicProfile();
}
