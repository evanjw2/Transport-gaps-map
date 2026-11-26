import test from 'node:test';
import assert from 'node:assert/strict';
import {
  zoned, localDay, whenOf, classifyCause, describeEffect, normalizeMvg, eventOccurrence, normalizeEvents,
  normalizeWeather, normalizeAlerts, normalizeNews, summarizeRoads, buildHeadsUps, buildBriefing, linesLabel, Weather,
  extractNotice, stopDirectory, computeAlternatives, matchTips, normName,
} from './briefing.mjs';
import { createRequire } from 'node:module';
const Network = createRequire(import.meta.url)('../extension/network.js');

const now = new Date('2026-11-27T08:00:00+01:00');

test('Munich wall-clock conversion handles winter and summer time', () => {
  assert.equal(zoned('2026-11-27', '08:00').toISOString(), '2026-11-27T07:00:00.000Z');
  assert.equal(zoned('2026-07-01', '08:00').toISOString(), '2026-07-01T06:00:00.000Z');
  assert.equal(localDay(new Date('2026-11-26T23:30:00Z')), '2026-11-27');
});

test('whenOf separates now, later today, upcoming and past', () => {
  assert.equal(whenOf(new Date('2026-11-27T07:00:00+01:00'), null, now), 'now');
  assert.equal(whenOf(new Date('2026-11-27T14:00:00+01:00'), null, now), 'today');
  assert.equal(whenOf(new Date('2026-11-28T14:00:00+01:00'), null, now), 'upcoming');
  assert.equal(whenOf(new Date('2026-11-26T14:00:00+01:00'), new Date('2026-11-27T07:59:00+01:00'), now), 'past');
});

test('German notice text is classified into causes and effects', () => {
  assert.equal(classifyCause('Streckenunterbrechung wegen eines Verkehrsunfalls'), 'accident');
  assert.equal(classifyCause('Warnstreik bei der MVG'), 'strike');
  assert.equal(classifyCause('Notarzteinsatz auf der Strecke'), 'emergency');
  assert.equal(classifyCause('Verspätungen wegen starken Verkehrsaufkommens'), 'traffic');
  assert.equal(classifyCause('Weichenstörung am Ostbahnhof'), 'technical');
  assert.equal(classifyCause('Bauarbeiten am Bahnhof Laim', 'SCHEDULE_CHANGE'), 'works');
  assert.equal(classifyCause('Stellwerksarbeiten: Ersatzverkehr', 'SCHEDULE_CHANGE'), 'works');
  assert.equal(describeEffect('Ersatzverkehr eingerichtet').label, 'replacement buses');
  assert.equal(describeEffect('Verspätungen bis 10 Uhr').label, 'delays');
});

test('MVG notices: city lines only, duplicates merged, stations located, expired dropped', () => {
  const stations = new Map([['de:09162:2', { name: 'Marienplatz', lat: 48.137, lng: 11.575 }]]);
  const base = { description: '<p>Text</p>', validFrom: now - 3600000, validTo: now.getTime() + 3600000, stationGlobalIds: ['de:09162:2'] };
  const items = normalizeMvg([
    { ...base, type: 'INCIDENT', title: 'Streckenunterbrechung wegen eines Verkehrsunfalls', lines: [{ label: '16', transportType: 'TRAM' }, { label: '16', transportType: 'TRAM' }, { label: '17', transportType: 'TRAM' }] },
    { ...base, type: 'INCIDENT', title: 'Streckenunterbrechung wegen eines Verkehrsunfalls', lines: [{ label: '16', transportType: 'TRAM' }, { label: '17', transportType: 'TRAM' }] },
    { ...base, type: 'SCHEDULE_CHANGE', title: 'Regionalbus verlegt', lines: [{ label: '451', transportType: 'REGIONAL_BUS' }] },
    { ...base, type: 'INCIDENT', title: 'Alt', validTo: now - 1, lines: [{ label: 'U3', transportType: 'UBAHN' }] },
  ], stations, now);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Tram 16/17: service interrupted · traffic accident');
  assert.equal(items[0].status, 'live');
  assert.equal(items[0].severity, 3);
  assert.deepEqual(items[0].location, { lat: 48.137, lng: 11.575, precision: 'station' });
});

test('line labels group by mode', () => {
  assert.equal(linesLabel([{ label: 'U3', mode: 'ubahn' }, { label: 'U6', mode: 'ubahn' }, { label: '19', mode: 'tram' }]), 'U3/U6 · Tram 19');
});

test('event timing: fixed, daily series and demo offsets', () => {
  assert.equal(eventOccurrence({ start: '2026-12-01T18:30:00+01:00' }, now).start.toISOString(), '2026-12-01T17:30:00.000Z');
  const market = eventOccurrence({ dateFrom: '2026-11-20', dateTo: '2026-12-24', dailyFrom: '10:00', dailyTo: '21:00' }, now);
  assert.equal(market.start.toISOString(), '2026-11-27T09:00:00.000Z');
  const late = eventOccurrence({ dateFrom: '2026-11-20', dateTo: '2026-12-24', dailyFrom: '10:00', dailyTo: '21:00' }, new Date('2026-11-27T22:00:00+01:00'));
  assert.equal(localDay(late.start), '2026-11-28');
  assert.equal(eventOccurrence({ dateFrom: '2026-11-01', dateTo: '2026-11-02' }, now), null);
  assert.equal(localDay(eventOccurrence({ demoDayOffset: 2, dailyFrom: '03:00' }, now).start), '2026-11-29');
});

test('events outside the horizon or with unknown causes are left out', () => {
  const { items, problems } = normalizeEvents({ events: [
    { id: 'a', cause: 'event', title: 'Soon', timing: { start: '2026-11-28T10:00:00+01:00' } },
    { id: 'b', cause: 'event', title: 'Far', timing: { start: '2027-03-01T10:00:00+01:00' } },
    { id: 'c', cause: 'alien', title: 'Bad', timing: { start: '2026-11-28T10:00:00+01:00' } },
  ] }, now);
  assert.deepEqual(items.map(i => i.id), ['event-a']);
  assert.equal(problems.length, 1);
});

test('weather levels: snow, freezing rain, dry frost, fine', () => {
  assert.equal(Weather.assess({ code: 71, temperature: -1, snowfallNext: 2 }).level, 2);
  assert.equal(Weather.assess({ code: 73, temperature: -1, snowfallNext: 6 }).level, 3);
  assert.equal(Weather.assess({ code: 66, temperature: 0 }).kind, 'ice');
  assert.equal(Weather.assess({ code: 0, temperature: -3 }).kind, 'frost');
  assert.equal(Weather.assess({ code: 1, temperature: 8 }).level, 0);
  const weather = normalizeWeather([{ current: { temperature_2m: -1, weather_code: 71 }, hourly: { snowfall: [0.5, 0.5], precipitation: [1, 1] }, daily: { weather_code: [71], temperature_2m_min: [-2], snowfall_sum: [1] } }], [{ id: 'x', name: 'X', lat: 48.1, lng: 11.5 }]);
  assert.equal(weather.city.kind, 'snow');
  assert.deepEqual(weather.city.snowyDistricts, ['X']);
});

test('DWD alerts: expired ones dropped, severity mapped', () => {
  const alerts = normalizeAlerts({ alerts: [
    { id: 1, severity: 'moderate', headline_en: 'Icy surfaces', expires: '2026-11-27T12:00:00+01:00' },
    { id: 2, severity: 'minor', headline_en: 'Old', expires: '2026-11-27T06:00:00+01:00' },
  ] }, now);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].level, 2);
});

test('news: only transport-disruption headlines, as leads with links', () => {
  const xml = `<rss><channel>
    <item><title>Warnstreik: U-Bahn und Tram stehen still</title><link>https://example.org/a</link><pubDate>Fri, 27 Nov 2026 06:00:00 +0100</pubDate></item>
    <item><title>Mann an U-Bahnstation beleidigt</title><link>https://example.org/b</link><pubDate>Fri, 27 Nov 2026 06:00:00 +0100</pubDate></item>
    <item><title>Neues Café in Schwabing</title><link>https://example.org/c</link><pubDate>Fri, 27 Nov 2026 06:00:00 +0100</pubDate></item>
    <item><title>Sperrung der Brücke</title><link>https://example.org/d</link><pubDate>Mon, 16 Nov 2026 06:00:00 +0100</pubDate></item>
  </channel></rss>`;
  const items = normalizeNews(xml, 'Test', now);
  assert.deepEqual(items.map(i => i.title), ['Warnstreik: U-Bahn und Tram stehen still']);
  assert.equal(items[0].status, 'lead');
  assert.equal(items[0].topic, 'strike');
});

test('roadworks summary keeps road-affecting works active today', () => {
  const square = (lng, lat) => ({ type: 'Polygon', coordinates: [[[lng, lat], [lng + 0.001, lat], [lng + 0.001, lat + 0.001], [lng, lat]]] });
  const feature = (id, props) => ({ id, geometry: square(11.57, 48.137), properties: { art: 'Baumaßnahme', beginn_datum_kombiniert: '01.11.2026', ende_datum_kombiniert: '30.11.2026', ...props } });
  const roads = summarizeRoads({ snapshotDay: '2026-11-27', collection: { features: [
    feature('a', { strasse_hausnr: 'A-Straße', betroffene_bereiche: 'Fahrbahn', beeintraechtigung: 'Vollsperre' }),
    feature('b', { strasse_hausnr: 'B-Straße', betroffene_bereiche: 'Gehweg' }),
    feature('c', { strasse_hausnr: 'C-Straße', betroffene_bereiche: 'Fahrbahn', ende_datum_kombiniert: '01.11.2026' }),
  ] } }, now);
  assert.equal(roads.activeWorks, 2);
  assert.equal(roads.items.length, 1);
  assert.equal(roads.items[0].title, 'A-Straße: full closure of the affected section');
});

test('heads-ups: stacked causes make a hotspot; roadworks alone do not', () => {
  const at = (id, cause, severity, lat, lng, status = 'announced') => ({ id, cause, severity, status, title: id, place: id, start: '2026-11-27T07:00:00+01:00', end: '2026-11-27T20:00:00+01:00', location: { lat, lng } });
  const items = [
    at('demo', 'protest', 2, 48.1429, 11.5777, 'demo'),
    at('market', 'event', 1, 48.1372, 11.5755),
    at('road1', 'roadworks', 2, 48.10, 11.50, 'official'),
    at('road2', 'roadworks', 2, 48.1001, 11.5001, 'official'),
  ];
  const ups = buildHeadsUps({ items, weather: { city: { level: 2, kind: 'snow', icon: '🌨️', label: 'Snow', advice: 'Snow' } }, now });
  const hotspots = ups.filter(u => u.icon === '📍');
  assert.equal(hotspots.length, 1);
  assert.equal(hotspots[0].level, 3);
  assert.ok(hotspots[0].includesExamples);
  assert.ok(ups.some(u => u.id === 'hu-weather'));
});

test('briefing overall level ignores plan-ahead items', () => {
  const strike = { id: 's', cause: 'strike', severity: 3, status: 'announced', title: 'Strike', start: '2026-11-29T03:00:00+01:00', end: null, location: null };
  const briefing = buildBriefing({ now, items: [strike], weather: null, alerts: [], roads: null, sources: [] });
  assert.equal(briefing.overall.level, 0);
  assert.equal(briefing.headsUps[0].title, 'Plan ahead: Strike');
});

const TRAM_NOTICE = 'Liebe Fahrgäste,<br>wegen eines Verkehrsunfalls kommt es bei den Linien 16 und 17 derzeit zu einer Streckenunterbrechung.<ul> <li>Die Linie 16 fährt nur im Abschnitt Effnerplatz &lt;&gt; Romanplatz.</li> <li>Die Haltestellen St. Emmeram, Fritz-Meyer-Weg und Arabellapark (Klinikum Bogenhausen) können leider nicht bedient werden.</li> <li>Den nicht angefahrenen Streckenabschnitt erreichen Sie mit SEV-Bussen und kostenlosen Taxis.</li></ul>Die Behinderungen werden noch voraussichtlich bis 10:00 Uhr dauern.';
const STATIONS = [
  { id: 'de:09162:600', name: 'St. Emmeram', place: 'München', products: ['TRAM', 'BUS'], latitude: 48.170, longitude: 11.630 },
  { id: 'de:09772:4019', name: 'St. Emmeram', place: 'Gersthofen', products: ['BUS'], latitude: 48.170, longitude: 11.631 },
  { id: 'de:09162:601', name: 'Fritz-Meyer-Weg', place: 'München', products: ['TRAM', 'BUS'], latitude: 48.165, longitude: 11.628 },
  { id: 'de:09162:655', name: 'Arabellapark/Klinikum Bogenh.', place: 'München', products: ['TRAM', 'BUS'], latitude: 48.1530, longitude: 11.6170 },
  { id: 'de:09162:670', name: 'Arabellapark', place: 'München', products: ['UBAHN', 'BUS'], latitude: 48.1535, longitude: 11.6180 },
  { id: 'de:09162:650', name: 'Effnerplatz', place: 'München', products: ['TRAM', 'BUS'], latitude: 48.155, longitude: 11.610 },
  { id: 'de:09162:215', name: 'Romanplatz', place: 'München', products: ['TRAM', 'BUS'], latitude: 48.155, longitude: 11.520 },
  { id: 'de:09162:5', name: 'München, Ostbahnhof', place: 'München', products: ['SBAHN', 'UBAHN'], latitude: 48.128, longitude: 11.604 },
];

test('MVG notice text: closed stops, sections and translated advice', () => {
  const notice = extractNotice(TRAM_NOTICE, 'Streckenunterbrechung wegen eines Verkehrsunfalls');
  assert.deepEqual(notice.closed, ['St. Emmeram', 'Fritz-Meyer-Weg', 'Arabellapark (Klinikum Bogenhausen)']);
  assert.deepEqual(notice.segments, [{ line: '16', from: 'Effnerplatz', to: 'Romanplatz', kind: 'runs-only' }]);
  assert.ok(notice.advice.includes('Replacement buses (SEV) cover the affected section.'));
  assert.ok(notice.advice.includes('Free taxis are provided for the section that is not served.'));
  assert.ok(notice.advice.includes('Expected to last until about 10:00.'));
  const between = extractNotice('', 'Ersatzverkehr zwischen Markt Schwaben und Erding (bis 30.11.)');
  assert.deepEqual(between.segments[0], { line: null, from: 'Markt Schwaben', to: 'Erding', kind: 'between' });
  assert.equal(extractNotice('', 'Umleitung zwischen Aberlestraße und Poccistraße umgeleitet').segments[0].to, 'Poccistraße');
});

test('stop names resolve to Munich stations with the right mode', () => {
  const dir = stopDirectory(STATIONS);
  assert.equal(dir.find('St. Emmeram', ['tram']).id, 'de:09162:600');
  assert.equal(dir.find('Arabellapark (Klinikum Bogenhausen)', ['tram']).id, 'de:09162:655');
  assert.equal(dir.find('Arabellapark', ['ubahn']).id, 'de:09162:670');
  assert.equal(dir.find('München Ost', ['sbahn']).id, 'de:09162:5');
  assert.equal(normName('Regina-Ullmann-Str.'), 'regina ullmann straße');
});

test('MVG incidents get highlighted stops, ways around and tips', () => {
  const dir = stopDirectory(STATIONS);
  const [item] = normalizeMvg([{ type: 'INCIDENT', title: 'Streckenunterbrechung wegen eines Verkehrsunfalls', description: TRAM_NOTICE, validFrom: now - 3600000, validTo: now.getTime() + 3600000, lines: [{ label: '16', transportType: 'TRAM' }, { label: '17', transportType: 'TRAM' }] }], dir, now);
  assert.equal(item.title, 'Tram 16/17: 3 stops not served · traffic accident');
  assert.deepEqual(item.stops.filter(s => s.role === 'closed').map(s => s.name), ['St. Emmeram', 'Fritz-Meyer-Weg', 'Arabellapark/Klinikum Bogenh.']);
  assert.deepEqual(item.segments, ['Tram 16 only runs Effnerplatz ↔ Romanplatz']);
  const lines = new Map([
    ['de:09162:670', [{ label: 'U4', mode: 'ubahn' }, { label: '150', mode: 'bus' }]],
    ['de:09162:650', [{ label: '16', mode: 'tram' }, { label: '59', mode: 'bus' }]],
  ]);
  const ways = computeAlternatives(item, dir, lines);
  assert.equal(ways[0].to.name, 'Arabellapark');
  assert.equal(ways[0].type, 'walk');
  assert.deepEqual(ways[0].lines.map(l => l.label), ['U4', '150']);
  assert.ok(ways.some(w => w.type === 'switch' && w.lines.every(l => l.label !== '16')), 'affected line is never suggested');
  const tips = matchTips(item, [{ id: 'tram', modes: ['tram'], effects: ['not served'], text: 't' }, { id: 'strike', causes: ['strike'], text: 's' }]);
  assert.deepEqual(tips.map(t => t.id), ['tram']);
});

test('live line status from departure boards', () => {
  const t = Date.now();
  const dep = (line, mode, delay, extra = {}) => ({ line, mode, destination: 'X', time: t + 5 * 60000, delay, realtime: delay != null, cancelled: false, ...extra });
  const result = Network.summarize([
    { hub: { id: 'a', name: 'A', lat: 0, lng: 0 }, departures: [dep('S3', 'sbahn', 6), dep('S3', 'sbahn', 5), dep('U6', 'ubahn', 0), dep('U6', 'ubahn', 0, { cancelled: true }), dep('U6', 'ubahn', 0, { cancelled: true }), dep('U3', 'ubahn', 0), dep('U3', 'ubahn', 1)] },
    { hub: { id: 'b', name: 'B', lat: 0, lng: 0 }, departures: null },
  ], [{ status: 'live', severity: 3, lines: [{ label: '16' }] }], t);
  const by = Object.fromEntries(result.lines.map(l => [l.label, l]));
  assert.equal(by.S3.status, 'delayed');
  assert.equal(by.S3.avg, 5.5);
  assert.equal(by.U6.status, 'disrupted');
  assert.equal(by.U3.status, 'ok');
  assert.equal(by['16'].status, 'disrupted');
  assert.equal(result.hubsOk, 1);
});

import { selectPaths, lineKind, parseCsvLine } from './build-lines.mjs';

test('GTFS helpers: CSV with quotes, which routes count as U/S/tram', () => {
  assert.deepEqual(parseCsvLine('"a","b, c","say ""hi"""'), ['a', 'b, c', 'say "hi"']);
  assert.equal(lineKind({ route_short_name: 'U3', route_type: '1', agency_id: 'swm-07', route_id: 'de:mvg:3|U3|U:_3' }), 'ubahn');
  assert.equal(lineKind({ route_short_name: 'S8', route_type: '0', agency_id: 'ddb-800725', route_id: 'x' }), 'sbahn');
  assert.equal(lineKind({ route_short_name: '19', route_type: '0', agency_id: 'swm-07', route_id: 'de:mvg:19|19|T:_3' }), 'tram');
  assert.equal(lineKind({ route_short_name: 'U3', route_type: '3', agency_id: 'swm-07', route_id: 'de:mvg:503|U3|B:_3' }), null, 'U3 replacement bus is not the U-Bahn');
});

test('line paths: branches kept, express shortcuts and duplicates dropped, loops kept', () => {
  // A-B-C-D main line, C-E branch, express A>D skipping B and C
  const coords = new Map([['A', [48.0, 11.0]], ['B', [48.0, 11.01]], ['C', [48.0, 11.02]], ['D', [48.0, 11.03]], ['E', [48.01, 11.02]]]);
  const patterns = new Map([['A>B>C>D', 100], ['D>C>B>A', 100], ['A>D', 20], ['A>B>C>E', 30], ['X>Y', 1]]);
  const { paths, termini } = selectPaths(patterns, { coords });
  const edges = new Set(paths.flatMap(p => p.slice(1).map((b, i) => [p[i], b].sort().join(''))));
  assert.deepEqual([...edges].sort(), ['AB', 'BC', 'CD', 'CE']);
  assert.deepEqual(termini.sort(), ['A', 'D', 'E']);
  // a one-way loop P>Q>R>P is not a shortcut: going round is much longer than any single hop
  const loop = selectPaths(new Map([['P>Q>R>S', 50]]), { coords: new Map([['P', [48, 11]], ['Q', [48.01, 11]], ['R', [48.01, 11.01]], ['S', [48, 11.01]]]) });
  assert.equal(loop.paths.flat().length, 4);
});
