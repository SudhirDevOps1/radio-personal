import type { RadioStation } from '@/types';

const RADIO_BROWSER_HOSTS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

async function fetchRadio(path: string): Promise<any[]> {
  for (const host of RADIO_BROWSER_HOSTS) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${host}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'PrivMITLab/1.0' },
      });
      clearTimeout(tid);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // try next host
    }
  }
  return [];
}

function sanitize(stations: any[]): RadioStation[] {
  return stations
    .filter((s) => s.url_resolved || s.url)
    .map((s) => ({
      stationuuid: s.stationuuid || s.id || Math.random().toString(),
      name: s.name?.trim() || 'Unknown Station',
      url: s.url || '',
      url_resolved: s.url_resolved || s.url || '',
      favicon: s.favicon || '',
      tags: s.tags || '',
      country: s.country || '',
      language: s.language || '',
      bitrate: Number(s.bitrate) || 0,
      codec: s.codec || 'MP3',
      votes: Number(s.votes) || 0,
      clickcount: Number(s.clickcount) || 0,
      clicktrend: Number(s.clicktrend) || 0,
    }));
}

export async function getTopStations(limit = 50): Promise<RadioStation[]> {
  const data = await fetchRadio(`/json/stations/topclick/${limit}`);
  return sanitize(data);
}

export async function searchStations(query: string, limit = 50): Promise<RadioStation[]> {
  const data = await fetchRadio(
    `/json/stations/search?name=${encodeURIComponent(query)}&limit=${limit}&order=clickcount&reverse=true`,
  );
  return sanitize(data);
}

export async function getStationsByCountry(country: string, limit = 50): Promise<RadioStation[]> {
  const data = await fetchRadio(
    `/json/stations/bycountry/${encodeURIComponent(country)}?limit=${limit}&order=clickcount&reverse=true`,
  );
  return sanitize(data);
}

export async function getStationsByLanguage(lang: string, limit = 50): Promise<RadioStation[]> {
  const data = await fetchRadio(
    `/json/stations/bylanguage/${encodeURIComponent(lang)}?limit=${limit}&order=clickcount&reverse=true`,
  );
  return sanitize(data);
}

export async function getStationsByTag(tag: string, limit = 50): Promise<RadioStation[]> {
  const data = await fetchRadio(
    `/json/stations/bytag/${encodeURIComponent(tag)}?limit=${limit}&order=clickcount&reverse=true`,
  );
  return sanitize(data);
}

// Curated popular radio categories
export const RADIO_CATEGORIES = [
  { id: 'bollywood', label: '🎬 Bollywood', query: 'bollywood', type: 'tag' },
  { id: 'hindi', label: '🇮🇳 Hindi', query: 'hindi', type: 'language' },
  { id: 'bhojpuri', label: '🎤 Bhojpuri', query: 'bhojpuri', type: 'tag' },
  { id: 'punjabi', label: '🥁 Punjabi', query: 'punjabi', type: 'tag' },
  { id: 'classical', label: '🎻 Classical', query: 'classical', type: 'tag' },
  { id: 'devotional', label: '🕉️ Devotional', query: 'devotional', type: 'tag' },
  { id: 'pop', label: '🎵 Pop', query: 'pop', type: 'tag' },
  { id: 'news', label: '📰 News', query: 'news', type: 'tag' },
  { id: 'english', label: '🌍 English', query: 'english', type: 'language' },
  { id: 'top', label: '🔥 Top Stations', query: 'top', type: 'top' },
];
