// Pure functions that turn raw sources into the "Munich this morning" briefing.
// No network access here — scripts/morning-update.mjs does the fetching. Tested by briefing.test.mjs.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const Weather = require('../extension/weather-codes.js');

export const TIME_ZONE = 'Europe/Berlin';
export const CITY_CENTRE = { lat: 48.1372, lng: 11.5755 };
const HOUR = 3600000;
const DAY = 24 * HOUR;

// Approximate district centres used for weather sampling. Labels, not boundaries.
export const DISTRICTS = [
  { id: 'altstadt', name: 'Altstadt', lat: 48.1372, lng: 11.5755 },
  { id: 'schwabing', name: 'Schwabing', lat: 48.1650, lng: 11.5860 },
  { id: 'maxvorstadt', name: 'Maxvorstadt', lat: 48.1500, lng: 11.5680 },
  { id: 'neuhausen', name: 'Neuhausen', lat: 48.1550, lng: 11.5330 },
  { id: 'pasing', name: 'Pasing', lat: 48.1490, lng: 11.4610 },
  { id: 'sendling', name: 'Sendling', lat: 48.1180, lng: 11.5400 },
  { id: 'giesing', name: 'Giesing', lat: 48.1100, lng: 11.5850 },
  { id: 'haidhausen', name: 'Haidhausen', lat: 48.1300, lng: 11.6000 },
  { id: 'bogenhausen', name: 'Bogenhausen', lat: 48.1530, lng: 11.6150 },
  { id: 'trudering', name: 'Trudering-Riem', lat: 48.1260, lng: 11.6650 },
  { id: 'milbertshofen', name: 'Milbertshofen', lat: 48.1830, lng: 11.5700 },
  { id: 'moosach', name: 'Moosach', lat: 48.1800, lng: 11.5100 },
  { id: 'freimann', name: 'Freimann', lat: 48.2030, lng: 11.6100 },
  { id: 'hadern', name: 'Hadern', lat: 48.1150, lng: 11.4850 },
];

export const CAUSES = {
  accident: { icon: '💥', label: 'Accident', group: 'disruptions' },
  emergency: { icon: '🚑', label: 'Emergency services', group: 'disruptions' },
  technical: { icon: '🔧', label: 'Technical fault', group: 'disruptions' },
  traffic: { icon: '🚗', label: 'Heavy traffic', group: 'disruptions' },
  disruption: { icon: '🚨', label: 'Disruption', group: 'disruptions' },
  access: { icon: '♿', label: 'Step-free access', group: 'disruptions' },
  strike: { icon: '✊', label: 'Strike', group: 'strikes' },
  protest: { icon: '📣', label: 'Protest / demonstration', group: 'strikes' },
  event: { icon: '🎟️', label: 'Big event / crowds', group: 'events' },
  works: { icon: '🚧', label: 'Planned works', group: 'works' },
  roadworks: { icon: '🦺', label: 'Roadworks', group: 'works' },
  weather: { icon: '❄️', label: 'Weather', group: 'weather' },
  news: { icon: '📰', label: 'News lead', group: 'news' },
};
const CAUSE_WORDS = { accident: 'traffic accident', emergency: 'emergency services', technical: 'technical fault', traffic: 'heavy traffic', strike: 'strike', protest: 'demonstration', access: 'lift / escalator', event: 'event', weather: 'weather' };

// ---------- time helpers (Europe/Berlin) ----------
const partsFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function zoneParts(date) {
  const out = {};
  for (const part of partsFormat.formatToParts(date)) if (part.type !== 'literal') out[part.type] = Number(part.value);
  return out;
}
export function localDay(date) {
  const p = zoneParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
function offsetMs(date) {
  const p = zoneParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}
// Local Munich wall-clock time -> Date.
export function zoned(day, time = '00:00') {
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - offsetMs(new Date(guess));
  return new Date(guess - offsetMs(new Date(first)));
}
export function addDays(day, n) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}
export function whenOf(start, end, now) {
  if (end && end <= now) return 'past';
  if (!start || start <= now) return 'now';
  return localDay(start) === localDay(now) ? 'today' : 'upcoming';
}

// ---------- small utilities ----------
export function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
export function decodeEntities(text = '') {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}
export function stripHtml(html = '') {
  return decodeEntities(html.replace(/<br\s*\/?>|<\/p>/gi, ' ').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}
function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text;
}
export function distanceM(a, b) {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.sqrt(x * x + y * y) * 6371000;
}
const inMunichArea = (lat, lng) => lat > 47.95 && lat < 48.35 && lng > 11.2 && lng < 11.9;

// ---------- classification of German notice text ----------
export function classifyCause(text, type = 'INCIDENT') {
  const cause = rawCause(text, type);
  // Planned timetable changes that mention signals/points are construction, not a breakdown.
  return type === 'SCHEDULE_CHANGE' && cause === 'technical' ? 'works' : cause;
}
function rawCause(text, type) {
  const t = text.toLocaleLowerCase('de-DE');
  if (/streik/.test(t)) return 'strike';
  if (/demonstration|versammlung|kundgebung|\bdemo\b|protest/.test(t)) return 'protest';
  if (/unfall|kollision|zusammensto/.test(t)) return 'accident';
  if (/notarzt|polizeieinsatz|feuerwehr|rettungs|person(en)? im gleis|notfall|ärztliche versorgung/.test(t)) return 'emergency';
  if (/verkehrsaufkommen|\bstau\b|verkehrsbehinderung|verkehrslage/.test(t)) return 'traffic';
  if (/aufzug|\blift|rolltreppe/.test(t)) return 'access';
  if (/schnee|glätte|glatteis|unwetter|sturm|witterung|blitzeis/.test(t)) return 'weather';
  if (/störung|stoerung|defekt|weiche|signal|stellwerk|fahrzeugschaden|oberleitung|technisch|reparatur|bahnübergang/.test(t)) return 'technical';
  if (/veranstaltung|fußballspiel|messe|konzert|festival|christkindl|oktoberfest/.test(t)) return 'event';
  if (/bau|gleisarbeit|ersatzverkehr|sperrung|umleitung|haltestelle|fahrplan|verleg|takt/.test(t)) return 'works';
  return type === 'INCIDENT' ? 'disruption' : 'works';
}
const EFFECTS = [
  [/ersatzverkehr|schienenersatz|\bsev\b|ersatzbus/, 'replacement buses', 3],
  [/unterbrech|unterbrochen|kein zugverkehr|eingestellt/, 'service interrupted', 3],
  [/vollsperr|gesperrt|sperrung/, 'closure', 3],
  [/umleitung|umgeleitet/, 'diverted', 2],
  [/verspät|verzöger/, 'delays', 2],
  [/ausfall|entfall|entfällt|fallen aus|ausgelassen/, 'stops or trips cancelled', 2],
  [/verleg/, 'stop moved', 1],
  [/takt|fahrplan|fahrzeit/, 'timetable change', 1],
];
export function describeEffect(text) {
  const t = text.toLocaleLowerCase('de-DE');
  for (const [pattern, label, weight] of EFFECTS) if (pattern.test(t)) return { label, weight };
  return { label: 'service change', weight: 1 };
}

// ---------- lines ----------
const MODE_BY_TYPE = { UBAHN: 'ubahn', SBAHN: 'sbahn', TRAM: 'tram', BUS: 'bus', REGIONAL_BUS: 'regionalbus', BAHN: 'train' };
const CITY_TYPES = new Set(['UBAHN', 'SBAHN', 'TRAM', 'BUS']);
const MODE_PREFIX = { tram: 'Tram', bus: 'Bus', regionalbus: 'Bus', train: '' };
export function linesLabel(lines) {
  const groups = new Map();
  for (const line of lines) {
    if (!groups.has(line.mode)) groups.set(line.mode, []);
    groups.get(line.mode).push(line.label);
  }
  return [...groups].map(([mode, labels]) => {
    const shown = labels.length > 5 ? [...labels.slice(0, 4), `+${labels.length - 4}`] : labels;
    const prefix = MODE_PREFIX[mode];
    return prefix ? `${prefix} ${shown.join('/')}` : shown.join('/');
  }).join(' · ');
}
export function guessMode(label) {
  if (/^U\d/.test(label)) return 'ubahn';
  if (/^S\d/.test(label)) return 'sbahn';
  if (/^N?(1[0-9]|2[0-9])$/.test(label)) return 'tram';
  return 'bus';
}

// ---------- MVG stops: directory, name matching ----------
const PRODUCT_BY_MODE = { ubahn: 'UBAHN', sbahn: 'SBAHN', tram: 'TRAM', bus: 'BUS' };
const MODE_RANK = { ubahn: 0, sbahn: 1, tram: 2, bus: 3 };
export function normName(name = '') {
  return name.toLocaleLowerCase('de-DE')
    .replace(/^münchen,?\s*/, '')
    .replace(/str\.(?=\s|$|,|\)|\/)/g, 'straße')
    .replace(/\bbf\./g, 'bahnhof')
    .replace(/[()/,.\-–„“"]/g, ' ')
    .replace(/\s+/g, ' ').trim()
    .replace(/^(ost|ostbf|ostbahnhof)$/, 'ostbahnhof').replace(/^(hbf|hauptbahnhof)$/, 'hauptbahnhof');
}
// stations: MVG station list ([{ id, name, place, products, latitude, longitude }])
export function stopDirectory(stations) {
  const list = [];
  for (const s of stations || []) {
    if (!s?.id || !Number.isFinite(s.latitude) || !Number.isFinite(s.longitude) || !inMunichArea(s.latitude, s.longitude)) continue;
    list.push({ id: s.id, name: s.name, lat: s.latitude, lng: s.longitude, products: s.products || [], place: s.place, key: normName(s.name) });
  }
  const byId = new Map(list.map(s => [s.id, s]));
  function find(name, modes = []) {
    const q = normName(name);
    const base = normName(name.replace(/\(.*?\)/g, ''));
    if (base.length < 3) return null;
    let best = null;
    let bestScore = 0;
    for (const s of list) {
      let score;
      if (s.key === q) score = 10;
      else if (s.key === base) score = 8;
      else if (s.key.length > base.length && q.startsWith(s.key)) score = 7;
      else if (base.length >= 5 && s.key.startsWith(`${base} `)) score = 5;
      else continue;
      if (modes.some(m => s.products.includes(PRODUCT_BY_MODE[m]))) score += 3;
      if (s.place === 'München') score += 1;
      if (score > bestScore) { best = s; bestScore = score; }
    }
    return best;
  }
  function near(point, radius) {
    return list.map(s => ({ ...s, distance: distanceM(point, s) })).filter(s => s.distance <= radius).sort((a, b) => a.distance - b.distance);
  }
  return { byId, find, near, size: list.length };
}
// Backwards-compatible tiny index (id -> station) used by older callers.
export function stationIndex(stations) {
  return stopDirectory(stations).byId;
}

// ---------- reading MVG's German notice text ----------
const ADVICE = [
  [/schienenersatzverkehr|\bsev\b|ersatzbus|ersatzverkehr/i, 'Replacement buses (SEV) cover the affected section.'],
  [/taxi/i, 'Free taxis are provided for the section that is not served.'],
  [/eingeschränkte[nr]? kapazität/i, 'Replacement capacity is limited: expect queues.'],
  [/fahrbahnrand/i, 'Some replacement stops are at the kerb, not at the usual stop.'],
  [/umleitung|umgeleitet/i, 'Vehicles are diverted, so some stops are skipped.'],
  [/anerkannt|gegenseitige anerkennung/i, 'Tickets are accepted on alternative services.'],
  [/aufzug.*(außer betrieb|defekt|ausgefallen)/i, 'A lift is out of service: step-free access may be affected.'],
];
const SEP = '\\s*(?:<>|↔|–)\\s*|\\s+-\\s+|\\s+und\\s+';
const cleanName = s => s.replace(/[„“"]/g, '').replace(/\s+/g, ' ').trim();
export function extractNotice(html = '', title = '') {
  const text = decodeEntities(html.replace(/<li[^>]*>/gi, '\n').replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n').replace(/<[^>]*>/g, ' ')).replace(/[ \t]+/g, ' ');
  const sentences = text.split(/\n|(?<=[a-zäöüß]{3}[.!?])\s+(?=[A-ZÄÖÜ])/).map(s => s.trim()).filter(Boolean);
  const closed = [];
  const segments = [];
  const splitList = s => s.replace(/[„“"‚‘]/g, '').split(/\s*,\s*|\s+und\s+|\s+sowie\s+/).map(x => x.trim()).filter(x => x.length >= 3 && x.length <= 60);
  for (const s of sentences) {
    let m;
    if ((m = /Haltestellen?\s+(.+?)\s+(?:können|kann|werden|wird)\s+(?:\S+\s+){0,3}?nicht\s+(?:mehr\s+)?(?:bedient|angefahren)/i.exec(s))) closed.push(...splitList(m[1]));
    else if ((m = /Haltestellen?\s+(.+?)\s+(?:entfällt|entfallen|fällt aus|fallen aus)\b/i.exec(s))) closed.push(...splitList(m[1]));
    else if ((m = /(?:entfällt|entfallen)\s+(?:die\s+)?Haltestellen?\s+(.+?)\.?$/i.exec(s))) closed.push(...splitList(m[1]));
    const run = new RegExp(`(?:Linie\\s+)?\\b([A-Z]?\\d{1,3})\\s+fährt\\s+(?:nur|lediglich)\\s+(?:im\\s+Abschnitt|zwischen)\\s+(.+?)(?:${SEP})(.+?)\\s*[.,;]?$`, 'i').exec(s);
    if (run) segments.push({ line: run[1], from: cleanName(run[2]), to: cleanName(run[3]), kind: 'runs-only' });
  }
  if (!segments.length) {
    const between = new RegExp(`zwischen\\s+([A-ZÄÖÜ][^,.()]{2,40}?)(?:${SEP})([A-ZÄÖÜ][^,.()]{2,40}?)(?=\\s*(?:\\(|,|\\.|$|\\s(?:ist|sind|kein|keine|fahren|fährt|verkehr\\w*|unterbrochen|gesperrt|kommt|wird|werden|ab|bis|vom|am|von|aus|fallen|entfallen|statt|eingerichtet|wegen|nur|im|in|umgeleitet|stark|eingeschränkt|geändert|verlegt|ersetzt|bedient|möglich)\\b))`);
    for (const source of [title, ...sentences]) {
      const m = between.exec(source);
      if (m) { segments.push({ line: null, from: cleanName(m[1]), to: cleanName(m[2]), kind: 'between' }); break; }
    }
  }
  const advice = ADVICE.filter(([pattern]) => pattern.test(text)).map(([, english]) => english);
  const until = /(?:voraussichtlich\s+)?bis\s+(?:ca\.\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*Uhr/i.exec(text);
  if (until) advice.push(`Expected to last until about ${until[1].padStart(2, '0')}:${until[2] || '00'}.`);
  const suggest = /nutzen Sie\s+(?:bitte\s+)?(?:alternativ\s+)?(?:die\s+|den\s+)?((?:Linien?|Buslinien?|Tram\w*|U-Bahn\w*|S-Bahn\w*)\s+[^.]{1,60})/i.exec(text);
  if (suggest) advice.push(`MVG suggests: ${suggest[1].trim()}.`);
  return { closed: [...new Set(closed)], segments, advice: [...new Set(advice)] };
}

// ---------- MVG service notices ----------
export function normalizeMvg(messages, dir, now, horizonDays = 3) {
  const directory = dir?.find ? dir : { byId: dir instanceof Map ? dir : new Map(), find: () => null };
  const items = [];
  const seen = new Set();
  for (const message of messages || []) {
    const lines = [];
    const lineKeys = new Set();
    for (const line of message.lines || []) {
      if (!CITY_TYPES.has(line.transportType)) continue;
      const key = `${line.transportType}:${line.label}`;
      if (lineKeys.has(key)) continue;
      lineKeys.add(key);
      lines.push({ label: line.label, mode: MODE_BY_TYPE[line.transportType] });
    }
    if (!lines.length) continue; // regional-only notices are outside the city prototype
    const start = Number.isFinite(message.validFrom) ? new Date(message.validFrom) : null;
    const end = Number.isFinite(message.validTo) ? new Date(message.validTo) : null;
    if (end && end <= now) continue;
    if (start && start - now > horizonDays * DAY) continue;
    const key = `${message.title}|${lines.map(l => l.label).join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const details = stripHtml(message.description || '');
    const text = `${message.title} ${details}`;
    const incident = message.type === 'INCIDENT';
    const cause = classifyCause(text, message.type);
    const effect = describeEffect(text);
    const longTerm = start && end && end - start > 14 * DAY;
    const severity = incident ? Math.max(2, effect.weight) : longTerm ? 1 : Math.min(2, effect.weight);

    // Stops: MVG's station ids, plus stops named in the text ("… können nicht bedient werden", "fährt nur im Abschnitt A <> B")
    const notice = extractNotice(message.description || '', message.title || '');
    const modes = [...new Set(lines.map(l => l.mode))];
    const rank = { listed: 0, end: 1, closed: 2 };
    const stops = [];
    const add = (station, role) => {
      if (!station) return;
      const existing = stops.find(s => s.id === station.id);
      if (existing) { if (rank[role] > rank[existing.role]) existing.role = role; return; }
      stops.push({ id: station.id, name: station.name, lat: station.lat, lng: station.lng, role });
    };
    for (const name of notice.closed) add(directory.find(name, modes), 'closed');
    for (const segment of notice.segments) { add(directory.find(segment.from, modes), 'end'); add(directory.find(segment.to, modes), 'end'); }
    for (const id of message.stationGlobalIds || []) add(directory.byId.get(id), 'listed');
    const closedCount = stops.filter(s => s.role === 'closed').length;
    const segmentText = notice.segments.map(s => {
      const line = s.line ? lines.find(l => l.label === s.line) : null;
      const label = line ? linesLabel([line]) : s.line;
      return s.kind === 'runs-only' ? `${label || 'Line'} only runs ${s.from} ↔ ${s.to}` : `Affected section: ${s.from} ↔ ${s.to}`;
    });
    const anchor = stops.find(s => s.role === 'closed') || stops.find(s => s.role === 'end') || stops[0];
    const lineText = linesLabel(lines);
    const why = CAUSE_WORDS[cause] ? ` · ${CAUSE_WORDS[cause]}` : '';
    const effectLabel = closedCount ? `${closedCount} stop${closedCount > 1 ? 's' : ''} not served` : effect.label;
    const named = stops.filter(s => s.role !== 'listed');
    items.push({
      id: `mvg-${hash(key)}`,
      cause, status: incident ? 'live' : 'official', severity,
      title: `${lineText}: ${effectLabel}${why}`,
      original: message.title,
      details: truncate(details, 420),
      place: (named.length ? named : stops).length ? (named.length ? named : stops).slice(0, 3).map(s => s.name).join(' · ') + ((named.length ? named : stops).length > 3 ? ` +${(named.length ? named : stops).length - 3}` : '') : `${lineText} (line-wide)`,
      lines, start: start?.toISOString() ?? null, end: end?.toISOString() ?? null,
      location: anchor ? { lat: anchor.lat, lng: anchor.lng, precision: 'station' } : null,
      points: stops.slice(0, 16).map(s => [s.lat, s.lng, s.name]),
      stops: stops.slice(0, 24),
      segments: segmentText,
      operatorAdvice: notice.advice,
      advice: incident ? 'Check live departures in the MVG app before you leave.' : longTerm ? 'Long-running planned change: check your usual connection.' : 'Planned change: check the timetable for your trip.',
      source: { name: 'MVG service notices', url: 'https://www.mvg.de/dienste/betriebsaenderungen.html' },
    });
  }
  return items;
}

// ---------- ways around it ----------
export function linesFromApi(list) {
  const out = [];
  for (const l of list || []) {
    if (!CITY_TYPES.has(l.transportType) || l.sev || /^N/.test(l.label) || /^[US]$/.test(l.label)) continue;
    if (!out.some(x => x.label === l.label)) out.push({ label: l.label, mode: MODE_BY_TYPE[l.transportType] });
  }
  return out;
}
export const wantsAlternatives = item => Boolean(item.stops?.length) && item.severity >= 2 && ['live', 'official', 'demo'].includes(item.status);
function alternativeSources(item) {
  const ends = item.stops.filter(s => s.role === 'end');
  const closed = item.stops.filter(s => s.role === 'closed');
  const named = [...ends, ...closed];
  return (named.length ? named : item.stops).slice(0, 12);
}
export function alternativeCandidates(item, dir, radius = 700) {
  const ids = new Set();
  for (const s of alternativeSources(item)) {
    ids.add(s.id);
    for (const c of dir.near(s, radius).slice(0, 4)) ids.add(c.id);
  }
  return [...ids];
}
const lineName = l => (l.mode === 'tram' ? `Tram ${l.label}` : l.mode === 'bus' ? `Bus ${l.label}` : l.label);
export function computeAlternatives(item, dir, linesByStation, radius = 700) {
  const affected = new Set((item.lines || []).map(l => l.label));
  const affectedIds = new Set((item.stops || []).filter(s => s.role === 'closed').map(s => s.id));
  const usable = list => (list || []).filter(l => !affected.has(l.label)).sort((a, b) => MODE_RANK[a.mode] - MODE_RANK[b.mode] || a.label.localeCompare(b.label, 'de', { numeric: true }));
  const options = [];
  for (const s of alternativeSources(item)) {
    const own = usable(linesByStation.get(s.id));
    if (own.length) options.push({ type: 'switch', from: s.name, to: { id: s.id, name: s.name, lat: s.lat, lng: s.lng }, minutes: 0, lines: own.slice(0, 5) });
    for (const c of dir.near(s, radius).slice(0, 4)) {
      if (c.id === s.id || affectedIds.has(c.id)) continue;
      const lines = usable(linesByStation.get(c.id));
      if (!lines.length) continue;
      options.push({ type: 'walk', from: s.name, to: { id: c.id, name: c.name, lat: c.lat, lng: c.lng }, minutes: Math.max(1, Math.round((c.distance * 1.3) / 80)), lines: lines.slice(0, 5) });
    }
  }
  const score = o => (o.lines.some(l => l.mode !== 'bus') ? 0 : 50) + o.minutes;
  const best = new Map();
  for (const option of options.sort((a, b) => score(a) - score(b))) if (!best.has(option.to.id)) best.set(option.to.id, option);
  const ranked = [...best.values()];
  const rail = ranked.filter(o => o.lines.some(l => l.mode !== 'bus')).slice(0, 3);
  const bus = ranked.filter(o => !o.lines.some(l => l.mode !== 'bus')).slice(0, Math.min(2, 4 - rail.length));
  return [...rail, ...bus].map(o => ({
    ...o,
    text: o.type === 'switch' ? `At ${o.to.name}, other lines still stop: ${o.lines.map(lineName).join(', ')}` : `From ${o.from}, walk ~${o.minutes} min to ${o.to.name}: ${o.lines.map(lineName).join(', ')}`,
  }));
}
export function matchTips(item, tips = []) {
  if (!(item.severity >= 2 || ['live', 'demo', 'announced'].includes(item.status))) return [];
  const labels = new Set((item.lines || []).map(l => l.label));
  const modes = new Set([...(item.modes || []), ...(item.lines || []).map(l => l.mode)]);
  const names = [...(item.stops || []).map(s => s.name), item.place || ''];
  return tips.filter(t => {
    if (!(t.causes || t.lines || t.modes || t.stations)) return false;
    if (t.causes && !t.causes.includes(item.cause)) return false;
    if (t.lines && !t.lines.some(l => labels.has(l))) return false;
    if (t.modes && !t.modes.some(m => modes.has(m))) return false;
    if (t.stations && !t.stations.some(n => names.some(s => s.includes(n)))) return false;
    if (t.effects && !t.effects.some(e => item.title.includes(e))) return false;
    return true;
  }).slice(0, 2).map(t => ({ id: t.id, text: t.text }));
}

// ---------- curated events (data/events.json) ----------
export function eventOccurrence(timing = {}, now, horizonDays = 7) {
  const today = localDay(now);
  if (timing.start) return { start: new Date(timing.start), end: timing.end ? new Date(timing.end) : null };
  if (Number.isInteger(timing.demoDayOffset)) {
    const day = addDays(today, timing.demoDayOffset);
    return { start: zoned(day, timing.dailyFrom || '00:00'), end: zoned(day, timing.dailyTo || '23:59') };
  }
  if (timing.dateFrom && timing.dateTo) {
    for (let i = 0; i <= horizonDays; i++) {
      const day = addDays(today, i);
      if (day < timing.dateFrom || day > timing.dateTo) continue;
      const end = zoned(day, timing.dailyTo || '23:59');
      if (end <= now) continue;
      return { start: zoned(day, timing.dailyFrom || '00:00'), end, series: { from: timing.dateFrom, to: timing.dateTo } };
    }
  }
  return null;
}

export function normalizeEvents(file, now, horizonDays = 7) {
  const items = [];
  const problems = [];
  for (const event of file?.events || []) {
    if (!event?.id || !event.title || !CAUSES[event.cause]) { problems.push(`Skipped event with missing id/title/unknown cause: ${event?.id ?? '?'}`); continue; }
    const occurrence = eventOccurrence(event.timing, now, horizonDays);
    if (!occurrence || Number.isNaN(occurrence.start.getTime())) { if (!event.timing) problems.push(`No timing: ${event.id}`); continue; }
    if (occurrence.end && occurrence.end <= now) continue;
    if (occurrence.start - now > horizonDays * DAY) continue;
    const located = Number.isFinite(event.lat) && Number.isFinite(event.lng);
    const lines = (event.lines || []).map(label => ({ label, mode: guessMode(label) }));
    items.push({
      id: `event-${event.id}`,
      cause: event.cause,
      status: ['announced', 'expected', 'demo'].includes(event.status) ? event.status : 'expected',
      severity: Math.min(3, Math.max(1, Number(event.severity) || 1)),
      title: event.title, details: event.summary || '', place: event.place || '',
      lines, modes: event.modes || [...new Set(lines.map(l => l.mode))],
      start: occurrence.start.toISOString(), end: occurrence.end?.toISOString() ?? null,
      series: occurrence.series || null,
      location: located ? { lat: event.lat, lng: event.lng, precision: 'approximate' } : null,
      points: located ? [[event.lat, event.lng, event.place || event.title]] : [],
      crowd: Boolean(event.crowd), accessibility: Boolean(event.accessibility),
      advice: event.advice || '',
      source: event.source?.url?.startsWith('https://') ? event.source : null,
    });
  }
  return { items, problems };
}

// ---------- weather (Open-Meteo) and warnings (DWD via Bright Sky) ----------
export function normalizeWeather(responses, districts = DISTRICTS) {
  const list = Array.isArray(responses) ? responses : [responses];
  const out = [];
  list.forEach((response, i) => {
    const district = districts[i];
    if (!district || !response?.current) return;
    const current = response.current;
    const hourly = response.hourly || {};
    const sum = values => (values || []).reduce((total, value) => total + (Number(value) || 0), 0);
    const snowfallNext = sum(hourly.snowfall);
    const precipitationNext = sum(hourly.precipitation);
    const nowAssessment = Weather.assess({ code: current.weather_code, temperature: current.temperature_2m, snowfallNext, precipitationNext });
    const daily = response.daily || {};
    const dayAssessment = Weather.assess({ code: daily.weather_code?.[0], temperature: daily.temperature_2m_min?.[0], snowfallNext: daily.snowfall_sum?.[0] || 0, precipitationNext: daily.precipitation_sum?.[0] || 0 });
    const worst = dayAssessment.level > nowAssessment.level ? dayAssessment : nowAssessment;
    out.push({
      ...district,
      temperature: current.temperature_2m, code: current.weather_code, icon: nowAssessment.icon, label: nowAssessment.label,
      snowfallNext: Math.round(snowfallNext * 10) / 10, precipitationNext: Math.round(precipitationNext * 10) / 10,
      today: { min: daily.temperature_2m_min?.[0] ?? null, max: daily.temperature_2m_max?.[0] ?? null, snowfall: daily.snowfall_sum?.[0] ?? null, precipitation: daily.precipitation_sum?.[0] ?? null, chance: daily.precipitation_probability_max?.[0] ?? null, icon: dayAssessment.icon, label: dayAssessment.label },
      level: worst.level, kind: worst.kind, advice: worst.advice,
    });
  });
  if (!out.length) return null;
  const worst = out.reduce((a, b) => (b.level > a.level ? b : a));
  const centre = out[0];
  const avg = out.reduce((total, d) => total + d.temperature, 0) / out.length;
  return {
    districts: out,
    city: {
      level: worst.level, kind: worst.kind, advice: worst.advice, icon: centre.icon, label: centre.label,
      temperature: Math.round(avg * 10) / 10, today: centre.today,
      snowyDistricts: out.filter(d => d.kind === 'snow' || d.kind === 'ice').map(d => d.name),
      wetDistricts: out.filter(d => d.kind === 'rain').map(d => d.name),
    },
  };
}

const SEVERITY_LEVEL = { minor: 1, moderate: 2, severe: 3, extreme: 3 };
export function normalizeAlerts(response, now) {
  return (response?.alerts || [])
    .filter(alert => !alert.expires || new Date(alert.expires) > now)
    .map(alert => ({
      id: `dwd-${alert.id}`,
      level: SEVERITY_LEVEL[alert.severity] || 1,
      event: alert.event_en || alert.event_de || 'Weather warning',
      headline: alert.headline_en || alert.headline_de || 'Official weather warning',
      description: truncate(alert.description_en || alert.description_de || '', 300),
      instruction: truncate(alert.instruction_en || '', 240),
      start: alert.onset || alert.effective || null, end: alert.expires || null,
      source: { name: 'Deutscher Wetterdienst via Bright Sky', url: 'https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html' },
    }));
}

// ---------- news leads (RSS headlines only, never article text) ----------
const NEWS_DISRUPTION = /streik|\bdemo\b|demonstr|kundgebung|sperrung|gesperrt|störung|ausfall|ersatzverkehr|umleitung|unfall|\bstau\b|glätte|glatteis|blitzeis|schneechaos|verkehrschaos|baustelle|bauarbeiten|einschränkung|polizeieinsatz|sanierung/i;
const NEWS_TRANSPORT = /streik|demo|kundgebung|\bmvg\b|s-bahn|u-bahn|\btram|trambahn|\bbus|bahn|straße|brücke|verkehr|bahnhof|haltestelle|autobahn|\ba9[49]?\b|mittlerer ring/i;
export function normalizeNews(xml, sourceName, now, maxAgeHours = 48, limit = 8) {
  const items = [];
  for (const match of (xml || '').matchAll(/<item\b[\s\S]*?<\/item>/g)) {
    const block = match[0];
    const field = name => decodeEntities((new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(block) || [])[1] || '').trim();
    const title = stripHtml(field('title'));
    const url = field('link');
    const published = new Date(field('pubDate'));
    if (!title || !/^https:\/\//.test(url) || !NEWS_DISRUPTION.test(title) || !NEWS_TRANSPORT.test(title)) continue;
    if (Number.isFinite(published.getTime()) && now - published > maxAgeHours * HOUR) continue;
    items.push({
      id: `news-${hash(url)}`,
      cause: 'news', topic: classifyCause(title, 'NEWS'),
      status: 'lead', severity: 1,
      title, details: 'Headline from local news. Transport impact not confirmed: open the article to check.',
      place: 'Munich (location not extracted)', lines: [],
      start: Number.isFinite(published.getTime()) ? published.toISOString() : null, end: null,
      location: null, points: [], advice: 'Treat as a lead, not a confirmed disruption.',
      source: { name: sourceName, url },
    });
    if (items.length >= limit) break;
  }
  return items;
}

// ---------- municipal roadworks summary ----------
function sourceDate(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(value || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}
function roadEffect(properties) {
  const text = `${properties.beeintraechtigung || ''}`.toLocaleLowerCase('de-DE');
  if (/vollsperr/.test(text)) return { label: 'full closure of the affected section', severity: 2 };
  if (/halbseitig/.test(text)) return { label: 'half-road closure', severity: 2 };
  if (/fahrbahn (eingeengt|verengt)/.test(text)) return { label: 'lane narrowed', severity: 1 };
  if (/sperr/.test(text)) return { label: 'partial closure', severity: 1 };
  return { label: 'works on the carriageway', severity: 1 };
}
export function summarizeRoads(snapshot, now, limit = 15, radiusM = 5000) {
  if (!snapshot?.collection?.features?.length) return null;
  const today = localDay(now);
  let activeWorks = 0;
  const candidates = [];
  for (const feature of snapshot.collection.features) {
    const p = feature.properties || {};
    if (p.art !== 'Baumaßnahme') continue;
    const from = sourceDate(p.beginn_datum_kombiniert);
    const to = sourceDate(p.ende_datum_kombiniert);
    if (!from || !to || from > today || to < today) continue;
    activeWorks++;
    const onRoad = /fahrbahn/i.test(p.betroffene_bereiche || '') || /fahrbahn|straßensperr/i.test(p.beeintraechtigung || '');
    if (!onRoad) continue;
    const ring = (feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates[0])[0];
    const centre = ring.reduce((acc, [lng, lat]) => ({ lat: acc.lat + lat / ring.length, lng: acc.lng + lng / ring.length }), { lat: 0, lng: 0 });
    const effect = roadEffect(p);
    candidates.push({ feature, p, centre, effect, distance: distanceM(CITY_CENTRE, centre), to });
  }
  const items = candidates
    .filter(c => c.distance <= radiusM)
    .sort((a, b) => b.effect.severity - a.effect.severity || a.distance - b.distance)
    .slice(0, limit)
    .map(({ feature, p, centre, effect, to }) => ({
      id: `road-${hash(feature.id)}`,
      cause: 'roadworks', status: 'official', severity: effect.severity,
      title: `${p.strasse_hausnr || 'Roadworks'}: ${effect.label}`,
      original: [p.beeintraechtigung, p.betroffene_bereiche].filter(Boolean).join(' · '),
      details: p.beschreibung ? `Works: ${p.beschreibung}` : 'City roadworks record.',
      place: p.strasse_hausnr || 'Munich', lines: [],
      start: zoned(sourceDate(p.beginn_datum_kombiniert)).toISOString(), end: zoned(to, '23:59').toISOString(),
      location: { lat: centre.lat, lng: centre.lng, precision: 'footprint' },
      points: [[centre.lat, centre.lng, p.strasse_hausnr || 'Roadworks']],
      advice: 'Affects road traffic and buses on this street; footpaths may be narrowed.',
      source: { name: 'Landeshauptstadt München · Mobilitätsreferat (dl-de/by-2-0)', url: snapshot.catalogUrl },
    }));
  return { snapshotDay: snapshot.snapshotDay, fetchedAt: snapshot.fetchedAt, totalRecords: snapshot.collection.features.length, activeWorks, onRoadToday: candidates.length, items };
}

// ---------- heads-up rules ----------
export const LEVELS = [
  { level: 0, emoji: '🟢', label: 'Smooth so far', sentence: 'Nothing major spotted for Munich right now.' },
  { level: 1, emoji: '🟢', label: 'Mostly smooth', sentence: 'A few things to know, nothing major.' },
  { level: 2, emoji: '🟠', label: 'Allow extra time', sentence: 'Some disruption and slower conditions: leave a little earlier.' },
  { level: 3, emoji: '🔴', label: 'Expect disruption', sentence: 'Significant disruption today: check your trip before leaving.' },
];
const weekday = date => new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'short' }).format(date);
const hhmm = date => new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(date);

export function buildHeadsUps({ items, weather, alerts = [], now }) {
  const ups = [];
  const wx = weather?.city;
  const wxLevel = wx?.level ?? 0;
  const alertLevel = Math.max(0, ...alerts.map(a => a.level));

  // 1. Weather for the whole city
  if (wxLevel >= 2 || alertLevel >= 1) {
    const level = Math.max(wxLevel, alertLevel);
    const why = [];
    if (wx && wxLevel >= 1) why.push(`${wx.icon} ${wx.advice}`);
    if (wx?.kind === 'snow' || wx?.kind === 'ice') why.push('🚇 Tip: the U-Bahn runs underground and copes best with snow and ice.');
    for (const alert of alerts.slice(0, 2)) why.push(`⚠️ DWD: ${alert.headline}`);
    const title = wx?.kind === 'snow' ? 'Snow in Munich: buses and trams slower'
      : wx?.kind === 'ice' || /frost|glätte|glatteis|ice/i.test(alerts[0]?.event || '') ? 'Icy conditions: careful on stairs and platforms'
        : wx?.kind === 'storm' ? 'Storm risk: overhead lines and trees' : `Weather warning: ${alerts[0]?.event || wx?.label}`;
    ups.push({ id: 'hu-weather', level: Math.min(3, Math.max(1, level)), icon: wx?.icon || '⚠️', title, why, where: 'City-wide', location: null, related: [] });
  }

  // 2. Hotspots: today-specific things (events, demos, incidents…) stacking up in one place.
  //    Roadworks and long-running works can add to a hotspot but never start one on their own.
  const background = new Set(['roadworks', 'works']);
  const local = items.filter(i => i.location && i.status !== 'lead' && ['now', 'today'].includes(whenOf(i.start && new Date(i.start), i.end && new Date(i.end), now)))
    .sort((a, b) => b.severity - a.severity);
  const used = new Set();
  for (const anchor of local.filter(i => !background.has(i.cause))) {
    if (used.has(anchor.id)) continue;
    const cluster = local.filter(i => !used.has(i.id) && distanceM(anchor.location, i.location) <= 700);
    const main = cluster.filter(i => !background.has(i.cause));
    const kinds = new Set(main.map(i => i.cause)).size + (cluster.length > main.length ? 1 : 0);
    const base = Math.max(...main.map(i => i.severity));
    const level = Math.min(3, base + (kinds >= 2 ? 1 : 0) + (wxLevel >= 2 && base >= 2 ? 1 : 0));
    if (level < 2) continue;
    cluster.forEach(i => used.add(i.id));
    const where = (anchor.place || '').split(' · ')[0] || 'This area';
    const why = main.slice(0, 3).map(i => `${CAUSES[i.cause].icon} ${i.title}${i.status === 'demo' ? ' (example)' : ''}`);
    const roadCount = cluster.length - main.length;
    if (roadCount) why.push(`🦺 ${roadCount} roadworks/planned works nearby`);
    if (wxLevel >= 2) why.push(`${wx.icon} ${wx.label} makes everything a bit slower`);
    const mvgAnchor = anchor.id.startsWith('mvg-');
    ups.push({ id: `hu-${anchor.id}`, level, icon: mvgAnchor ? CAUSES[anchor.cause].icon : '📍', title: mvgAnchor ? anchor.title : `${where}: ${level >= 3 ? 'expect disruption' : 'allow extra time'}`, why, where, location: anchor.location, related: cluster.map(i => i.id), includesExamples: main.some(i => i.status === 'demo') });
  }

  // 3. Serious live incidents without a location (line-wide)
  for (const item of items.filter(i => i.status === 'live' && i.severity >= 3 && !i.location && !used.has(i.id))) {
    ups.push({ id: `hu-${item.id}`, level: 3, icon: CAUSES[item.cause].icon, title: item.title, why: [item.original || item.details].filter(Boolean), where: item.place, location: null, related: [item.id] });
  }

  // 4. Plan ahead: big things in the next days
  for (const item of items.filter(i => i.start && ['strike', 'protest', 'event'].includes(i.cause) && i.severity >= 2 && whenOf(new Date(i.start), i.end && new Date(i.end), now) === 'upcoming')) {
    const start = new Date(item.start);
    ups.push({ id: `hu-${item.id}`, level: item.cause === 'strike' ? 2 : 1, icon: CAUSES[item.cause].icon, title: `Plan ahead: ${item.title}`, includesExamples: item.status === 'demo', why: [`${weekday(start)}, from ${hhmm(start)}${item.status === 'demo' ? ' · example' : ''}`, item.advice].filter(Boolean), where: item.place, location: item.location, related: [item.id], upcoming: true });
  }

  return ups.sort((a, b) => Boolean(a.upcoming) - Boolean(b.upcoming) || b.level - a.level).slice(0, 6);
}

// ---------- assemble ----------
export function buildBriefing({ now, items, weather, alerts, roads, sources, problems = [], network = null }) {
  const all = items.slice().sort((a, b) => b.severity - a.severity || String(a.start).localeCompare(String(b.start)));
  const headsUps = buildHeadsUps({ items: all, weather, alerts, now });
  const todayUps = headsUps.filter(h => !h.upcoming);
  const overall = LEVELS[Math.max(0, ...todayUps.map(h => h.level))];
  const counts = {};
  for (const item of all) counts[CAUSES[item.cause].group] = (counts[CAUSES[item.cause].group] || 0) + 1;
  if (alerts.length) counts.weather = (counts.weather || 0) + alerts.length;
  return {
    schema: 1,
    city: 'Munich',
    generatedAt: now.toISOString(),
    localDay: localDay(now),
    timeZone: TIME_ZONE,
    overall,
    headsUps,
    items: all,
    weather,
    alerts,
    network,
    roads: roads ? { snapshotDay: roads.snapshotDay, fetchedAt: roads.fetchedAt, totalRecords: roads.totalRecords, activeWorks: roads.activeWorks, onRoadToday: roads.onRoadToday } : null,
    counts,
    sources,
    problems,
    causes: CAUSES,
    districts: DISTRICTS,
  };
}
