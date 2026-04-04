// src/hooks/useForecast.js
import { useState, useEffect } from 'react';

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

export function useForecast() {
  const [state, setState] = useState({
    regions: null,
    orderedTimestamps: null,
    meta: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const API_KEY = import.meta.env.VITE_API_KEY;

        if (!API_URL) throw new Error('VITE_API_URL не задано в .env');
        if (!API_KEY) throw new Error('VITE_API_KEY не задано в .env');

        const response = await fetch(API_URL, {
          headers: { 'x-api-key': API_KEY }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const rawRegions = data.regions_forecast;
        if (!rawRegions) throw new Error('Invalid API response');

        const firstRegionKey = Object.keys(rawRegions)[0];
        const allTimestamps = Object.keys(rawRegions[firstRegionKey]).sort((a, b) => new Date(a) - new Date(b));

        const regionsWithForced = applyForcedRegions(rawRegions, allTimestamps);
        const orderedTimestamps = allTimestamps.map(k => {
          const date = new Date(k);
          return {
            key: k,
            label: getKyivLabelFromUTC(date),
            hour: getKyivHourFromUTC(date),
            utcHour: date.getUTCHours()
          };
        });

        if (isMounted) {
          setState({
            regions: regionsWithForced,
            orderedTimestamps,
            meta: {
              generated_at: data.generated_at,
              base_time: data.base_time,
              n_regions: data.n_regions,
              n_hours: data.n_hours,
              global_max_score: data.global_max_score
            },
            loading: false,
            error: null
          });
        }
      } catch (err) {
        if (isMounted) {
          setState(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  return state;
}