import { useMemo } from 'react';
import forecastRaw from '../data/forecast.json';

const FORCED_REGIONS = new Map([
  ['Luhansk', { probability: 0.99, binary: true, score: 1.0 }],
  ['Crimea', { probability: 0.99, binary: true, score: 1.0 }]
]);

function applyForcedRegions(regions, allTimestamps) {
  const newRegions = { ...regions };
  for (const [regionName, forcedData] of FORCED_REGIONS.entries()) {
    if (!newRegions[regionName]) {
      newRegions[regionName] = {};
    }
    const regionHours = newRegions[regionName];
    for (const ts of allTimestamps) {
      if (!regionHours[ts]) {
        regionHours[ts] = { ...forcedData };
      } else {
        regionHours[ts] = { ...regionHours[ts], ...forcedData };
      }
    }
  }
  return newRegions;
}

function getKyivHourFromUTC(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kyiv',
    hour: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find(p => p.type === 'hour');
  return parseInt(hourPart.value, 10);
}

function getKyivLabelFromUTC(date) {
  const hour = getKyivHourFromUTC(date);
  return hour.toString().padStart(2, '0') + ':00';
}

function reorderTimestampsStartingAtHour6(allKeys) {
  const sorted = [...allKeys].sort((a, b) => new Date(a) - new Date(b));
  const hour6Index = sorted.findIndex(k => new Date(k).getUTCHours() === 6);
  if (hour6Index === -1) return sorted;
  return [...sorted.slice(hour6Index), ...sorted.slice(0, hour6Index)];
}

export function useForecast() {
  return useMemo(() => {
    const rawRegions = forecastRaw.regions_forecast;
    const firstRegionKey = Object.keys(rawRegions)[0];
    const allTimestamps = Object.keys(rawRegions[firstRegionKey]);
    const regionsWithForced = applyForcedRegions(rawRegions, allTimestamps);
    const orderedKeys = reorderTimestampsStartingAtHour6(allTimestamps);
    const orderedTimestamps = orderedKeys.map(k => {
      const date = new Date(k);
      return {
        key: k,
        label: getKyivLabelFromUTC(date),
        hour: getKyivHourFromUTC(date),
        utcHour: date.getUTCHours()
      };
    });
    return { regions: regionsWithForced, orderedTimestamps, meta: forecastRaw };
  }, []);
}