import { fetch } from '@tauri-apps/plugin-http';

const cache = new Map();

export async function fetchLyrics(trackName, artistName, durationMs) {
  const key = `${trackName}||${artistName}`;
  if (cache.has(key)) return cache.get(key);

  const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(trackName)}&artist_name=${encodeURIComponent(artistName)}&duration=${Math.round(durationMs / 1000)}`;

  try {
    const res = await fetch(url, { method: 'GET' });

    if (res.status === 404) {
      cache.set(key, null);
      return null;
    }

    const data = JSON.parse(await res.text());
    if (!data?.syncedLyrics) {
      cache.set(key, null);
      return null;
    }

    const lines = parseLRC(data.syncedLyrics);
    cache.set(key, lines);
    return lines;
  } catch (e) {
    console.error('lyrics fetch failed', e);
    return null;
  }
}

export function parseLRC(lrc) {
  const lines = [];
  const re = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const raw of lrc.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const matches = [...line.matchAll(re)];
    if (!matches.length) continue;

    const text = line.replace(re, '').trim();

    for (const m of matches) {
      const ms = m[3].length === 2
        ? parseInt(m[3], 10) * 10
        : parseInt(m[3], 10);
      lines.push({
        time: parseInt(m[1], 10) * 60_000 + parseInt(m[2], 10) * 1_000 + ms,
        text,
      });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export function getActiveLine(lines, positionMs) {
  if (!lines?.length) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= positionMs) idx = i;
    else break;
  }
  return idx;
}
