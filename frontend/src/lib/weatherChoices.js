export const WEATHER_CHOICES = [
  {
    id: "hot",
    label: "Hot",
    summary: "Lightweight summer outfits",
    weather: {
      temperature_c: 34,
      feels_like_c: 38,
      humidity_percent: 72,
      precipitation_mm: 0,
      wind_kph: 7,
      condition: "hot and sunny",
      style_profile: "hot",
    },
  },
  {
    id: "cold",
    label: "Cold",
    summary: "Warm layered outfits",
    weather: {
      temperature_c: 8,
      feels_like_c: 5,
      humidity_percent: 55,
      precipitation_mm: 0,
      wind_kph: 28,
      condition: "cold and windy",
      style_profile: "cold_windy",
    },
  },
  {
    id: "rainy",
    label: "Rainy",
    summary: "Rain-ready combinations with cover",
    weather: {
      temperature_c: 21,
      feels_like_c: 20,
      humidity_percent: 88,
      precipitation_mm: 8,
      wind_kph: 18,
      condition: "rain",
      style_profile: "rainy",
    },
  },
  {
    id: "mild",
    label: "Mild",
    summary: "Comfortable all-day outfits",
    weather: {
      temperature_c: 23,
      feels_like_c: 23,
      humidity_percent: 62,
      precipitation_mm: 0,
      wind_kph: 10,
      condition: "mild",
      style_profile: "mild",
    },
  },
];

export function describeWeatherChoice(weather) {
  if (!weather) return "";

  const parts = [];
  if (typeof weather.temperature_c === "number") {
    parts.push(`${Math.round(weather.temperature_c)}°C`);
  }
  if (weather.condition) {
    parts.push(weather.condition);
  }
  if ((weather.precipitation_mm || 0) > 0) {
    parts.push("rain expected");
  }
  if ((weather.wind_kph || 0) >= 25) {
    parts.push("windy");
  }

  return parts.join(", ");
}
