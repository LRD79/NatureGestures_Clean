// utils/energyLevel.js

export function calculateEnergyLevel(temp, humidity, cloud) {
  if (temp > 18 && humidity < 65) return "low";
  if (humidity > 75 || cloud > 70) return "high";
  return "medium";
}
