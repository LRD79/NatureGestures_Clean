// 📁 /utils/musicFromWeather.js

import { calculateEnergyLevel } from './energyLevel.js';
import { setMusicSettings } from '../env/soundEnvironment.js';

export function updateMusicFromWeather(weather) {
  if (!weather || !weather.current) return;

  const { temp_c: temp, humidity, cloud } = weather.current;
  const energy = calculateEnergyLevel(temp, humidity, cloud);

  const bpmMap = { low: 60, medium: 80, high: 110 };
  const moodMap = { low: 'ambient', medium: 'groove', high: 'intense' };

  // This is a static test key for now, but will be dynamic soon
  const key = 'F#';

  setMusicSettings({
    key,
    bpm: bpmMap[energy],
    mood: moodMap[energy],
    genre: 'electronica',
    energy
  });

  console.log(`🎛️ Set music from weather: key=${key}, bpm=${bpmMap[energy]}, mood=${moodMap[energy]}, energy=${energy}`);
}
