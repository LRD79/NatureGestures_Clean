// /weather/location.js
export async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        resolve({ lat, lon });
      },
      () => reject("Geolocation denied or unavailable.")
    );
  });
}

// /weather/fetchWeather.js
export async function getWeatherFromLocation(lat, lon, apiKey) {
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("❌ Weather API call failed");
  return await res.json();
}

// /weather/postToSheet.js
import { calculateEnergyLevel } from "../utils/energyLevel.js";

export async function postToSheet(sheetURL, current, weather, lat, lon) {
  const now = new Date();
  const payload = {
    Timestamp: now.toISOString(),
    formattedTimestamp: now.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    last_updated: current.last_updated || "",
    epoch: Math.floor(now.getTime() / 1000),
    ...current,
    energyLevel: calculateEnergyLevel(current.temp_c, current.humidity, current.cloud),
    Location: weather.location.name,
    Lat: lat,
    Lon: lon,
    Condition_Text: current.condition.text,
    Condition_Code: current.condition.code,
    Condition_Icon_URL: "https:" + current.condition.icon,
    NOTES: ""
  };

  try {
    await fetch(sheetURL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("📨 Weather data posted to sheet");
  } catch (err) {
    console.error("❌ Failed to POST to sheet:", err);
  }
}
