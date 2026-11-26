#!/usr/bin/env node
// Morning briefing builder. Run once a day (GitHub Actions does it at ~06:15 Munich time):
//   node scripts/morning-update.mjs                 fetch everything, write extension/data/today.{json,js}
//   node scripts/morning-update.mjs --offline       no network: curated events + saved roadworks only
//   node scripts/morning-update.mjs --refresh-roads-layer   also rewrite the full roadworks map layer (~5 MB)
//   options: --no-mvg  --no-news  --now 2026-11-27T07:00:00+01:00
import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { makeSnapshot, sourceUrl as roadsUrl } from './import-munich.mjs';
import { createRequire } from 'node:module';
import {
  DISTRICTS, normalizeMvg, stopDirectory, wantsAlternatives, alternativeCandidates, computeAlternatives, linesFromApi, matchTips, normalizeEvents, normalizeWeather, normalizeAlerts,
  normalizeNews, summarizeRoads, buildBriefing, CITY_CENTRE,
} from './briefing.mjs';

const Network = createRequire(import.meta.url)('../extension/network.js');
const root = new URL('../', import.meta.url);
const paths = {
  events: new URL('data/events.json', root),
  tips: new URL('data/tips.json', root),
  snapshot: new URL('extension/munich-snapshot.js', root),
  json: new URL('extension/data/today.json', root),
  js: new URL('extension/data/today.js', root),
};
const USER_AGENT = 'TransportGapsMap-prototype/0.7 (+https://github.com/evanjw2/Transport-gaps-map)';
const NEWS_FEEDS = [{ id: 'news-tz', name: 'tz.de München (headlines)', url: 'https://www.tz.de/muenchen/rssfeed.rdf' }];

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const offline = flag('--offline');
const now = option('--now') ? new Date(option('--now')) : new Date();
if (Number.isNaN(now.getTime())) throw new Error('Invalid --now value');

async function get(url, { type = 'json', timeout = 30000, retries = 1 } = {}) {
  try {
    const response = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: type === 'json' ? 'application/json' : '*/*' }, signal: AbortSignal.timeout(timeout) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await (type === 'json' ? response.json() : response.text());
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 3000));
    return get(url, { type, timeout, retries: retries - 1 });
  }
}

const sources = [];
function record(source) {
  sources.push({ fetchedAt: now.toISOString(), ...source });
  const mark = { ok: '✓', stale: '~', failed: '✗', off: '-' }[source.status];
  console.log(`${mark} ${source.name}: ${source.status}${source.count !== undefined ? ` (${source.count})` : ''}${source.note ? ` · ${source.note}` : ''}`);
}

async function attempt(meta, enabled, work) {
  if (!enabled) { record({ ...meta, status: 'off', note: offline ? 'offline run' : 'disabled' }); return null; }
  try { return await work(); } catch (error) { record({ ...meta, status: 'failed', note: error.message }); return null; }
}

async function loadSavedSnapshot() {
  const text = await readFile(paths.snapshot, 'utf8');
  return JSON.parse(text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')));
}

async function writeAtomic(url, contents) {
  const path = fileURLToPath(url);
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, contents);
  await rename(temporary, path);
}

async function main() {
  console.log(`Building Munich briefing for ${now.toISOString()}${offline ? ' (offline)' : ''}`);
  const items = [];
  const problems = [];

  // 1. Curated strikes, protests and events
  const eventsFile = JSON.parse(await readFile(paths.events, 'utf8'));
  const events = normalizeEvents(eventsFile, now);
  items.push(...events.items);
  problems.push(...events.problems);
  record({ id: 'events', name: 'Team-curated events (data/events.json)', kind: 'curated', status: 'ok', count: events.items.length, url: 'https://github.com/evanjw2/Transport-gaps-map/blob/main/data/events.json' });

  // 2. MVG service notices (incidents + planned changes), placed on stations via MVG's station list
  const mvgMeta = { id: 'mvg', name: 'MVG service notices', kind: 'live', url: 'https://www.mvg.de/dienste/betriebsaenderungen.html', note: 'Headlines, lines and times only. Reuse permission still to be confirmed with MVG.' };
  const mvgOk = await attempt(mvgMeta, !offline && !flag('--no-mvg'), async () => {
    const [messages, stations] = await Promise.all([
      get('https://www.mvg.de/api/bgw-pt/v3/messages'),
      get('https://www.mvg.de/.rest/zdm/stations', { timeout: 60000 }).catch(() => []),
    ]);
    if (!Array.isArray(messages)) throw new Error('Unexpected response shape');
    const dir = stopDirectory(stations);
    const mvgItems = normalizeMvg(messages, dir, now);
    // Ways around it: look up which lines serve the affected stops and the stations nearby.
    const wanted = mvgItems.filter(wantsAlternatives);
    const ids = [...new Set(wanted.flatMap(item => alternativeCandidates(item, dir)))].slice(0, 120);
    const linesByStation = new Map();
    const queue = ids.slice();
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const id = queue.shift();
        try { linesByStation.set(id, linesFromApi(await get(`https://www.mvg.de/api/bgw-pt/v3/lines/${encodeURIComponent(id)}`, { timeout: 10000, retries: 0 }))); } catch { /* skip this station */ }
      }
    }));
    for (const item of wanted) item.alternatives = computeAlternatives(item, dir, linesByStation);
    items.push(...mvgItems);
    const closedStops = mvgItems.reduce((n, i) => n + (i.stops || []).filter(s => s.role === 'closed').length, 0);
    record({ ...mvgMeta, status: 'ok', count: mvgItems.length, note: `${mvgItems.filter(i => i.status === 'live').length} live incidents · ${mvgItems.filter(i => i.location).length} placed on the map · ${closedStops} stops not served · ${wanted.length} with ways around · ${mvgMeta.note}` });
    return true;
  });

  // 3. Weather per district (Open-Meteo) and official warnings (DWD via Bright Sky)
  const weatherMeta = { id: 'weather', name: 'Open-Meteo weather (14 districts)', kind: 'live', url: 'https://open-meteo.com/', license: 'CC BY 4.0' };
  const weather = await attempt(weatherMeta, !offline, async () => {
    const query = new URLSearchParams({
      latitude: DISTRICTS.map(d => d.lat).join(','), longitude: DISTRICTS.map(d => d.lng).join(','),
      current: 'temperature_2m,precipitation,snowfall,weather_code,wind_speed_10m',
      hourly: 'precipitation,snowfall', forecast_hours: '12',
      daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,snowfall_sum,precipitation_probability_max',
      timezone: 'Europe/Berlin', forecast_days: '1',
    });
    const result = normalizeWeather(await get(`https://api.open-meteo.com/v1/forecast?${query}`));
    if (!result) throw new Error('No weather data returned');
    record({ ...weatherMeta, status: 'ok', count: result.districts.length, note: `${result.city.icon} ${result.city.label}, ${result.city.temperature}°C` });
    return result;
  });
  const alertsMeta = { id: 'dwd', name: 'DWD official weather warnings (via Bright Sky)', kind: 'official', url: 'https://brightsky.dev/', license: 'DWD open data' };
  const alerts = (await attempt(alertsMeta, !offline, async () => {
    const result = normalizeAlerts(await get(`https://api.brightsky.dev/alerts?lat=${CITY_CENTRE.lat}&lon=${CITY_CENTRE.lng}`), now);
    record({ ...alertsMeta, status: 'ok', count: result.length });
    return result;
  })) || [];

  // 4. News headlines that mention strikes, demos, closures… (leads only)
  for (const feed of NEWS_FEEDS) {
    const meta = { id: feed.id, name: feed.name, kind: 'lead', url: feed.url, note: 'Headline + link only; never treated as confirmed.' };
    await attempt(meta, !offline && !flag('--no-news'), async () => {
      const news = normalizeNews(await get(feed.url, { type: 'text' }), feed.name, now);
      items.push(...news);
      record({ ...meta, status: 'ok', count: news.length });
    });
  }

  // 5. Municipal roadworks: fresh fetch for today's summary, saved layer as fallback
  const roadsMeta = { id: 'roads', name: 'Munich roadworks (Mobilitätsreferat open data)', kind: 'official', url: 'https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata', license: 'dl-de/by-2-0' };
  let snapshot = await attempt(roadsMeta, !offline, async () => {
    const fresh = makeSnapshot(await get(roadsUrl, { timeout: 120000 }), new Date().toISOString());
    if (flag('--refresh-roads-layer')) {
      const serialized = JSON.stringify(fresh).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
      await writeAtomic(paths.snapshot, `globalThis.TransportGapsMunichSnapshot = Object.freeze(${serialized});\n`);
      console.log(`  map layer rewritten with ${fresh.matchedCount} records`);
    }
    return fresh;
  });
  let roadsStatus = 'ok';
  if (!snapshot) { snapshot = await loadSavedSnapshot().catch(() => null); roadsStatus = 'stale'; }
  const roads = summarizeRoads(snapshot, now);
  if (roads) {
    items.push(...roads.items);
    record({ ...roadsMeta, status: roadsStatus, count: roads.onRoadToday, note: `${roads.activeWorks} works active today, ${roads.onRoadToday} affect the road · records from ${roads.snapshotDay}` });
  } else if (!sources.some(s => s.id === 'roads')) record({ ...roadsMeta, status: 'failed', note: 'No saved snapshot' });

  // 6. Local-knowledge tips (data/tips.json) for every disruption
  const tips = JSON.parse(await readFile(paths.tips, 'utf8')).tips || [];
  for (const item of items) { const matched = matchTips(item, tips); if (matched.length) item.tips = matched; }

  // 7. Live delays at 17 hubs (the page refreshes this every 2 minutes; this is the morning fallback)
  const netMeta = { id: 'departures', name: 'MVG live departures (17 hubs)', kind: 'live', url: 'https://www.mvg.de/', note: 'Delays and cancellations per line. Refreshed live in the browser.' };
  const network = await attempt(netMeta, !offline && !flag('--no-mvg'), async () => {
    const result = await Network.snapshot(items);
    if (!result.hubsOk) throw new Error('No hub answered');
    const late = result.lines.filter(l => l.status !== 'ok' && l.status !== 'unknown').map(l => l.label);
    record({ ...netMeta, status: 'ok', count: result.lines.length, note: `${result.hubsOk}/${result.hubsTotal} hubs · ${late.length ? `delayed/disrupted: ${late.slice(0, 8).join(', ')}` : 'all lines on time'}` });
    return result;
  });

  // Guard: never replace yesterday's briefing with an empty one because the network is down.
  if (!offline && !mvgOk && !weather) {
    console.error('Both MVG and weather failed. Keeping the previous briefing.');
    process.exitCode = 1;
    return;
  }

  const briefing = buildBriefing({ now, items, weather, alerts, roads, sources, problems, network });
  const json = JSON.stringify(briefing, null, 1);
  await writeAtomic(paths.json, `${json}\n`);
  await writeAtomic(paths.js, `// Generated by scripts/morning-update.mjs — do not edit by hand.\nglobalThis.TransportGapsToday = ${json.replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')};\n`);
  for (const problem of problems) console.warn(`! ${problem}`);
  console.log(`\n${briefing.overall.emoji} ${briefing.overall.label} — ${briefing.items.length} items, ${briefing.headsUps.length} heads-ups`);
  for (const up of briefing.headsUps) console.log(`  [${up.level}] ${up.title}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
