import { setManualSoundEnvironment, getSoundEnvironment, updateSoundEnvironment } from '../env/soundEnvironment.js';
import { playAmbientFromWeather } from '../audio/ambient.js';
import { ambientConditionMap } from '../data/ambientConditionMap.js';
import { updateMusicFromWeather } from '../utils/musicFromWeather.js'; // ✅ NEW
import { updateNowPlaying } from '../ui/nowPlaying.js'; // ✅ NEW

export function setupEnvironmentControls() {
  const applyButton = document.getElementById("applyEnv");
  const conditionSelect = document.getElementById("conditionSelect");

  if (!applyButton || !conditionSelect) {
    console.warn("❌ applyEnv or conditionSelect not found");
    return;
  }

  const allConditions = Object.keys(ambientConditionMap).sort((a, b) =>
    a.localeCompare(b)
  );

  allConditions.forEach(condition => {
    const option = document.createElement("option");
    option.value = condition;
    option.textContent = condition;
    conditionSelect.appendChild(option);
  });

  applyButton.addEventListener("click", () => {
    const biome = document.getElementById("biomeSelect").value;
    const condition = conditionSelect.value;
    const season = document.getElementById("seasonSelect").value;
    const timeOfDay = document.getElementById("timeOfDaySelect").value;

    console.log("🧪 Apply clicked:", { biome, condition, season, timeOfDay });

    // 🌱 Simulate a fake weather object with current condition
    const fakeWeather = {
      current: {
        condition: { text: condition },
        temp_c: 18,
        humidity: 55,
        cloud: 40,
        wind_kph: 10,
        wind_dir: 'N',
        uv: 5
      },
      location: {
        name: 'Testville',
        country: 'Nowhere',
        lat: 51.5,
        localtime: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }
    };

    const fakeAstro = {
      sunrise: '06:00 AM',
      sunset: '08:30 PM',
      moonrise: '12:00 AM',
      moonset: '05:00 AM',
      moon_phase: 'Waning Gibbous'
    };

    const fakeTime = new Date();

    // ✅ Apply everything including lunarPhase
    setManualSoundEnvironment({
      biome,
      condition,
      season,
      timeOfDay,
      ambientTrack: 'Auto',
      lunarPhase: fakeAstro.moon_phase // 🌝 Now included
    });

    updateSoundEnvironment(fakeWeather, fakeTime, fakeAstro);
    updateMusicFromWeather(fakeWeather); // 🎵 Now the key, bpm, mood get updated
    updateNowPlaying({
      time: fakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: fakeTime.toDateString(),
      condition,
      biome,
      season,
      timeOfDay,
      ambientTrack: 'Auto',
      droneStatus: 'Active',
      chimeStatus: 'Enabled',
      weather: fakeWeather,
      astro: fakeAstro
    });

    playAmbientFromWeather();
  });
}
