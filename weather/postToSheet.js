export async function postToSheet(current, weather, lat, lon) {
  const url = 'https://leafy-pavlova-8d84b3.netlify.app/.netlify/functions/proxy';

  const astro = weather.forecast?.forecastday?.[0]?.astro || {};

  const payload = {
    last_updated: current.last_updated,
    epoch: current.last_updated_epoch,
    temp_c: current.temp_c,
    temp_f: current.temp_f,
    feelslike_c: current.feelslike_c,
    feelslike_f: current.feelslike_f,
    windchill_c: current.windchill_c || "",
    windchill_f: current.windchill_f || "",
    heatindex_c: current.heatindex_c || "",
    heatindex_f: current.heatindex_f || "",
    dewpoint_c: current.dewpoint_c || "",
    dewpoint_f: current.dewpoint_f || "",
    condition_text: current.condition.text,
    condition_icon: current.condition.icon,
    condition_code: current.condition.code,
    wind_mph: current.wind_mph,
    wind_kph: current.wind_kph,
    wind_deg: current.wind_degree,
    wind_dir: current.wind_dir,
    pressure_mb: current.pressure_mb,
    pressure_in: current.pressure_in,
    precip_mm: current.precip_mm,
    precip_in: current.precip_in,
    humidity: current.humidity,
    cloud: current.cloud,
    is_day: current.is_day,
    uv: current.uv,
    gust_mph: current.gust_mph,
    gust_kph: current.gust_kph,
    energyLevel:
      current.temp_c > 18 && current.humidity < 65
        ? "low"
        : current.humidity > 75 || current.cloud > 70
        ? "high"
        : "medium",
    location: weather.location.name,
    lat,
    lon,
    condition: current.condition.text,
    condition_code: current.condition.code,
    condition_icon_url: "https:" + current.condition.icon,
    NOTES: "",
    formattedTimestamp: new Date().toLocaleString(),

    // 🌞 Astro data
    Sunrise: astro.sunrise || "",
    Sunset: astro.sunset || "",
    Moonrise: astro.moonrise || "",
    Moonset: astro.moonset || "",
    "Moon Phase": astro.moon_phase || "",
    "Moon Illumination": astro.moon_illumination || ""
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const result = await res.text();
    console.log("📨 Weather data posted via proxy:", result);
  } catch (err) {
    console.error("❌ Proxy post failed", err);
  }
}
