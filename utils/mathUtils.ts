import { CareProtocolMatrix } from "../types";

/**
 * Calculates a Complexity Index (0-100) based on care vectors.
 * Higher score means the plant is harder to maintain.
 */
export const computeMaintenanceEntropy = (protocol: CareProtocolMatrix): number => {
  let entropy = 0;

  // Water Sensitivity
  if (protocol.hydrationFrequencyHours < 48) entropy += 30; // Needs daily/frequent water
  else if (protocol.hydrationFrequencyHours > 168) entropy += 5; // Weekly or less is easy
  else entropy += 15;

  // Humidity Sensitivity (High humidity requirement is harder to maintain indoors)
  if (protocol.atmosphericHumidityPercent > 60) entropy += 25;
  
  // Temperature Tolerance Bandwidth
  const tempRange = protocol.temperatureRangeCelsius.max - protocol.temperatureRangeCelsius.min;
  if (tempRange < 5) entropy += 20; // Very narrow range
  else if (tempRange > 20) entropy += 0; // Wide range is robust

  // Light Specificity
  if (protocol.photonicFluxRequirements === 'DIRECT') entropy += 10; // Needs specific window placement

  return Math.min(100, Math.max(0, entropy));
};

/**
 * Heuristic text parser to convert natural language frequency to hours
 */
export const parseHydrationToHours = (description: string): number => {
  const lower = description.toLowerCase();
  if (lower.includes('day') || lower.includes('daily')) return 24;
  if (lower.includes('week')) return 168;
  if (lower.includes('month')) return 720;
  // Fallback algorithmic approximation based on string length (mock heuristic for unparsable)
  return 72; 
};
