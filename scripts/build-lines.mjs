#!/usr/bin/env node
// Builds extension/data/lines.js: the station-by-station path of every U-Bahn, S-Bahn and tram line,
// from MVV's official GTFS timetable (CC BY, "Münchner Verkehrs- und Tarifverbund GmbH (MVV)").
// The feed has no track shapes, so lines are drawn through their real stations in order.
//   node scripts/build-lines.mjs                 download the feed (~19 MB) and rebuild
//   node scripts/build-lines.mjs --input gesamt_gtfs.zip
// Re-run when MVV publishes a new timetable (roughly monthly / at timetable changes).
import { readFile, writeFile, rename } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FEED_URL = 'https://www.mvv-muenchen.de/fileadmin/mediapool/developer/opendata/gesamt_gtfs.zip';

// ---------- pure helpers (tested in briefing.test.mjs) ----------
export function parseCsvLine(line) {
  const out = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (quoted && line[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (ch === ',' && !quoted) { out.push(field); field = ''; }
    else field += ch;
  }
  out.push(field);
  return out;
}
export function lineKind(route) {
  const name = route.route_short_name;
  if (/^U\d$/.test(name) && route.route_type === '1') return 'ubahn';
  if (/^S\d+$/.test(name) && route.agency_id.startsWith('ddb')) return 'sbahn';
  if (/^\d{2}$/.test(name) && /\|T:_/.test(route.route_id)) return 'tram';
  return null;
}
// patterns: Map(patternKey "a>b>c" -> trip count). Returns paths (arrays of station ids) covering every
// edge of the commonly used patterns once, plus termini.
export function selectPaths(patterns, { minShare = 0.02, maxPatterns = 10, coords = null } = {}) {
  const sorted = [...patterns].map(([key, count]) => ({ stops: key.split('>'), count })).sort((a, b) => b.count - a.count || b.stops.length - a.stops.length);
  if (!sorted.length) return { paths: [], termini: [] };
  const threshold = Math.max(3, sorted[0].count * minShare);
  const chosen = sorted.filter(p => p.count >= threshold).slice(0, maxPatterns);
  const edge = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  // 1. all station-to-station connections of the common patterns
  const adjacency = new Map();
  const link = (a, b) => { if (!adjacency.has(a)) adjacency.set(a, new Set()); adjacency.get(a).add(b); };
  for (const p of chosen) for (let i = 1; i < p.stops.length; i++) if (p.stops[i - 1] !== p.stops[i]) { link(p.stops[i - 1], p.stops[i]); link(p.stops[i], p.stops[i - 1]); }
  // 2. drop express "shortcuts": longest connections first, a connection goes if the line also links its
  //    two ends through intermediate stations by a route of similar length (loops are much longer, so they stay).
  const dist = (a, b) => {
    const p = coords?.get(a); const q = coords?.get(b);
    if (!p || !q) return 1;
    const x = (q[1] - p[1]) * Math.cos(((p[0] + q[0]) / 2) * Math.PI / 180); const y = q[0] - p[0];
    return Math.sqrt(x * x + y * y) * 111320;
  };
  const edges = [];
  for (const [a, near] of adjacency) for (const b of near) if (a < b) edges.push([a, b, dist(a, b)]);
  edges.sort((x, y) => y[2] - x[2]);
  const shortcut = new Set();
  for (const [a, b, length] of edges) {
    const limit = coords ? length * 1.3 : Infinity;
    // Dijkstra from a to b without the direct connection
    const best = new Map([[a, 0]]);
    const queue = [[0, a]];
    let found = false;
    while (queue.length) {
      queue.sort((x, y) => x[0] - y[0]);
      const [d, x] = queue.shift();
      if (d > (best.get(x) ?? Infinity) || d > limit) continue;
      if (x === b) { found = true; break; }
      for (const y of adjacency.get(x)) {
        if ((x === a && y === b) || (x === b && y === a)) continue;
        const nd = d + dist(x, y);
        if (nd < (best.get(y) ?? Infinity)) { best.set(y, nd); queue.push([nd, y]); }
      }
    }
    if (found) { shortcut.add(edge(a, b)); adjacency.get(a).delete(b); adjacency.get(b).delete(a); }
  }
  // 3. walk the patterns again, emitting each remaining connection once as continuous runs
  const covered = new Set();
  const paths = [];
  for (const pattern of chosen) {
    let run = null;
    for (let i = 1; i < pattern.stops.length; i++) {
      const a = pattern.stops[i - 1];
      const b = pattern.stops[i];
      const key = edge(a, b);
      if (a === b || covered.has(key) || shortcut.has(key)) { if (run) { paths.push(run); run = null; } continue; }
      covered.add(key);
      if (!run) run = [a];
      run.push(b);
    }
    if (run) paths.push(run);
  }
  // 4. termini = stations with a single neighbour once shortcuts are gone
  const degree = new Map();
  for (const key of covered) for (const id of key.split('|')) degree.set(id, (degree.get(id) || 0) + 1);
  const termini = [...degree].filter(([, d]) => d === 1).map(([id]) => id);
  return { paths, termini };
}

// ---------- build ----------
function* linesOf(bytes) {
  const decoder = new TextDecoder();
  let start = 0;
  while (start < bytes.length) {
    let end = bytes.indexOf(10, start);
    if (end === -1) end = bytes.length;
    const line = decoder.decode(bytes.subarray(start, end)).replace(/\r$/, '').replace(/^﻿/, '');
    if (line) yield line;
    start = end + 1;
  }
}
function table(bytes) {
  const it = linesOf(bytes);
  const header = parseCsvLine(it.next().value);
  const rows = [];
  for (const line of it) { const values = parseCsvLine(line); rows.push(Object.fromEntries(header.map((h, i) => [h, values[i]]))); }
  return rows;
}

export async function buildLines(zipBytes) {
  const fflate = createRequire(import.meta.url)('../extension/vendor/fflate.js');
  const wanted = new Set(['routes.txt', 'trips.txt', 'stops.txt', 'stop_times.txt', 'feed_info.txt']);
  const files = fflate.unzipSync(zipBytes, { filter: file => wanted.has(file.name) });
  for (const name of wanted) if (!files[name]) throw new Error(`Feed is missing ${name}`);

  const feed = table(files['feed_info.txt'])[0] || {};
  const routes = new Map();
  for (const r of table(files['routes.txt'])) { const kind = lineKind(r); if (kind) routes.set(r.route_id, { name: r.route_short_name, kind }); }
  const tripLine = new Map();
  for (const t of table(files['trips.txt'])) { const route = routes.get(t.route_id); if (route) tripLine.set(t.trip_id, route); }
  const stops = new Map();
  for (const s of table(files['stops.txt'])) stops.set(s.stop_id, { parent: s.parent_station || s.stop_id, name: s.stop_name, lat: Number(s.stop_lat), lng: Number(s.stop_lon) });
  delete files['routes.txt']; delete files['trips.txt'];

  // stop_times is ~270 MB: stream it line by line and count stopping patterns per line.
  const patterns = new Map(); // line name -> Map(pattern -> count)
  const kinds = new Map();
  let tripId = null;
  let seq = [];
  const flush = () => {
    const line = tripLine.get(tripId);
    if (line && seq.length > 1) {
      seq.sort((a, b) => a[0] - b[0]);
      const ids = [];
      for (const [, id] of seq) if (ids.at(-1) !== id) ids.push(id);
      if (!patterns.has(line.name)) patterns.set(line.name, new Map());
      const key = ids.join('>');
      patterns.get(line.name).set(key, (patterns.get(line.name).get(key) || 0) + 1);
      kinds.set(line.name, line.kind);
    }
  };
  const it = linesOf(files['stop_times.txt']);
  const header = parseCsvLine(it.next().value);
  const iTrip = header.indexOf('trip_id');
  const iStop = header.indexOf('stop_id');
  const iSeq = header.indexOf('stop_sequence');
  for (const line of it) {
    const comma = line.indexOf('",');
    const id = line.slice(1, comma);
    if (id !== tripId) { flush(); tripId = id; seq = []; }
    if (!tripLine.has(id)) continue;
    const values = parseCsvLine(line);
    const stop = stops.get(values[iStop]);
    if (stop) seq.push([Number(values[iSeq]), stops.has(stop.parent) ? stop.parent : values[iStop]]);
  }
  flush();
  if (iTrip !== 0) throw new Error('Expected trip_id as first stop_times column');

  const stationIndex = new Map();
  const stations = [];
  const indexOf = id => {
    if (!stationIndex.has(id)) {
      const s = stops.get(id);
      stationIndex.set(id, stations.length);
      stations.push([id, Math.round(s.lat * 1e5) / 1e5, Math.round(s.lng * 1e5) / 1e5, s.name]);
    }
    return stationIndex.get(id);
  };
  const lines = {};
  const order = { ubahn: 0, sbahn: 1, tram: 2 };
  for (const name of [...patterns.keys()].sort((a, b) => order[kinds.get(a)] - order[kinds.get(b)] || a.localeCompare(b, 'de', { numeric: true }))) {
    const coords = new Map();
    for (const key of patterns.get(name).keys()) for (const id of key.split('>')) { const st = stops.get(id); if (st) coords.set(id, [st.lat, st.lng]); }
    const { paths, termini } = selectPaths(patterns.get(name), { coords });
    if (!paths.length) continue;
    lines[name] = { mode: kinds.get(name), paths: paths.map(p => p.map(indexOf)), termini: termini.map(indexOf) };
  }
  return { source: 'Münchner Verkehrs- und Tarifverbund GmbH (MVV), GTFS, CC BY', sourceUrl: 'https://www.mvv-muenchen.de/fahrplanauskunft/fuer-entwickler/opendata/index.html', feedVersion: feed.feed_version || null, feedValid: [feed.feed_start_date, feed.feed_end_date], builtAt: new Date().toISOString(), stations, lines };
}

async function main() {
  const i = process.argv.indexOf('--input');
  let bytes;
  if (i > 0) bytes = new Uint8Array(await readFile(process.argv[i + 1]));
  else {
    console.log(`Downloading ${FEED_URL}`);
    const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    bytes = new Uint8Array(await response.arrayBuffer());
  }
  const result = await buildLines(bytes);
  const out = fileURLToPath(new URL('../extension/data/lines.js', import.meta.url));
  await writeFile(`${out}.tmp`, `// Generated by scripts/build-lines.mjs from MVV GTFS (CC BY). Do not edit by hand.\nglobalThis.TransportGapsLines = ${JSON.stringify(result)};\n`);
  await rename(`${out}.tmp`, out);
  const names = Object.keys(result.lines);
  console.log(`Saved ${names.length} lines (${names.join(' ')}) through ${result.stations.length} stations · feed ${result.feedVersion}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error); process.exitCode = 1; });
