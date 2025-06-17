let manualEnv = null;

export function setManualSoundEnvironment(env) {
  manualEnv = env;
}

export const soundEnvironment = {
  condition: null,
  isDay: true,
  timeOfDay: 'day',
  hemisphere: 'northern',
  season: 'summer',
  biome: 'forest',
  lunarPhase: 'Full Moon',
  sunSign: 'Gemini',
  weather: {}, // ✅ Full weather object
  music: {
    key: 'C',
    bpm: 60,
    mood: 'ambient',
    genre: 'minimal',
    energy: 'medium'
  }
};

export function updateSoundEnvironment(weather, time = new Date(), astro) {
  if (!weather || !weather.current || !weather.location || !astro) return;

  soundEnvironment.weather = weather; // ✅ Store full weather object
  soundEnvironment.condition = weather.current.condition.text;

  const now = time.getTime();
  const dateStr = weather.location.localtime.split(' ')[0];
  const toTimestamp = (t) => new Date(`${dateStr} ${t}`).getTime();

  const sunrise = toTimestamp(astro.sunrise);
  const sunset = toTimestamp(astro.sunset);

  const dawnStart = sunrise - 60 * 60 * 1000;
  const dawnEnd   = sunrise + 30 * 60 * 1000;
  const duskStart = sunset - 45 * 60 * 1000;
  const duskEnd   = sunset + 30 * 60 * 1000;

  console.log(`🕰️ Time check: now=${new Date(now).toLocaleTimeString()}, dawnStart=${new Date(dawnStart).toLocaleTimeString()}, dawnEnd=${new Date(dawnEnd).toLocaleTimeString()}, duskStart=${new Date(duskStart).toLocaleTimeString()}, duskEnd=${new Date(duskEnd).toLocaleTimeString()}`);

  if (now >= dawnStart && now < dawnEnd) {
    soundEnvironment.timeOfDay = 'dawn';
  } else if (now >= dawnEnd && now < duskStart) {
    soundEnvironment.timeOfDay = 'day';
  } else if (now >= duskStart && now < duskEnd) {
    soundEnvironment.timeOfDay = 'dusk';
  } else {
    soundEnvironment.timeOfDay = 'night';
  }

  console.log(`🌅 Detected timeOfDay: ${soundEnvironment.timeOfDay}`);

  soundEnvironment.isDay = ['dawn', 'day'].includes(soundEnvironment.timeOfDay);
  soundEnvironment.hemisphere = weather.location.lat >= 0 ? 'northern' : 'southern';

  const month = time.getMonth();
  const seasonsNorth = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  const seasonsSouth = ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer'];
  soundEnvironment.season = soundEnvironment.hemisphere === 'northern' ? seasonsNorth[month] : seasonsSouth[month];

  const moonPhases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const moonIndex = Math.floor((time.getDate() % 29.5) / 3.7);
  soundEnvironment.lunarPhase = moonPhases[moonIndex];

  const zodiac = [
    { sign: 'Capricorn', end: 19 }, { sign: 'Aquarius', end: 18 },
    { sign: 'Pisces', end: 20 }, { sign: 'Aries', end: 19 },
    { sign: 'Taurus', end: 20 }, { sign: 'Gemini', end: 20 },
    { sign: 'Cancer', end: 22 }, { sign: 'Leo', end: 22 },
    { sign: 'Virgo', end: 22 }, { sign: 'Libra', end: 22 },
    { sign: 'Scorpio', end: 21 }, { sign: 'Sagittarius', end: 21 },
  ];
  const day = time.getDate();
  const signIndex = day > zodiac[month].end ? (month + 1) % 12 : month;
  soundEnvironment.sunSign = zodiac[signIndex].sign;

  soundEnvironment.biome = 'forest'; // TODO: Dynamic from lat/lon or user prefs
}

export function getSoundEnvironment() {
  if (manualEnv) return manualEnv;
  return { ...soundEnvironment };
}

export function getCurrentWeather() {
  return soundEnvironment.weather || {};
}

export function calculateTimeOfDay(date = new Date(), sunrise = "06:00 AM", sunset = "06:00 PM", locationDate = null) {
  const now = date.getTime();
  const dateStr = locationDate || date.toISOString().split('T')[0];
  const toTimestamp = (t) => new Date(`${dateStr} ${t}`).getTime();

  const sunriseTime = toTimestamp(sunrise);
  const sunsetTime = toTimestamp(sunset);

  const dawnStart = sunriseTime - 60 * 60 * 1000;
  const dawnEnd   = sunriseTime + 30 * 60 * 1000;
  const duskStart = sunsetTime - 45 * 60 * 1000;
  const duskEnd   = sunsetTime + 30 * 60 * 1000;

  if (now >= dawnStart && now < dawnEnd) return 'dawn';
  if (now >= dawnEnd && now < duskStart) return 'day';
  if (now >= duskStart && now < duskEnd) return 'dusk';
  return 'night';
}

export function setMusicSettings({ key, bpm, mood, genre, energy }) {
  if (key) soundEnvironment.music.key = key;
  if (bpm) soundEnvironment.music.bpm = bpm;
  if (mood) soundEnvironment.music.mood = mood;
  if (genre) soundEnvironment.music.genre = genre;
  if (energy) soundEnvironment.music.energy = energy;
}

export function getMusicSettings() {
  return soundEnvironment.music;
}
