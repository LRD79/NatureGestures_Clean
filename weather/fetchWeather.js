// 📁 /js/weather/fetchWeather.js

import { getUserLocation } from './location.js';

const API_KEY = '7f1161fb44284aa6a5d54641252905'; // 🔐 Replace with your WeatherAPI key

export async function fetchWeatherWithLocation() {
  const { lat, lon } = await getUserLocation();
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=1&aqi=no`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API request failed");

  const raw = await res.json();

  const astro = raw.forecast?.forecastday?.[0]?.astro || {};
  console.log("🌞 Astro sent to sheet:", astro);

  return {
    weather: raw,       // ✅ Send full weather object, not just raw.current
    astro,              // ✅ Still include moon/sun info
    lat,
    lon
  };
}
