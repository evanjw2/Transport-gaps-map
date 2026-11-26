import { readFile, writeFile, rename } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const sourceUrl = 'https://geoportal.muenchen.de/geoserver/mor_wfs/ows?outputFormat=application%2Fjson&request=GetFeature&service=WFS&typeName=mor_wfs%3Abaustellen_opendata&version=1.1.0&maxFeatures=20000&srsName=EPSG%3A4326';
const fields = ['strasse_hausnr', 'betroffene_bereiche', 'beschreibung', 'beeintraechtigung', 'art', 'beginn_datum_kombiniert', 'ende_datum_kombiniert'];

export function makeSnapshot(response, fetchedAt) {
  if (response.type !== 'FeatureCollection' || !Array.isArray(response.features)) throw new Error('Expected a GeoJSON FeatureCollection');
  const matched = Number(response.numberMatched ?? response.totalFeatures);
  if (!Number.isSafeInteger(matched) || matched < 1 || matched !== response.features.length || Number(response.numberReturned) !== matched) throw new Error('Incomplete or empty snapshot; existing data must not be replaced');
  if (!response.crs?.properties?.name?.endsWith('EPSG::4326')) throw new Error('Expected requested WGS84 coordinates');
  if (!Number.isFinite(Date.parse(fetchedAt)) || !Number.isFinite(Date.parse(response.timeStamp))) throw new Error('Invalid retrieval or response timestamp');
  const identifiers = new Set();
  const features = response.features.map(feature => {
    if (typeof feature.id !== 'string' || identifiers.has(feature.id)) throw new Error('Missing or duplicate source ID');
    identifiers.add(feature.id);
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) throw new Error(`Unsupported geometry: ${feature.id}`);
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    if (!Array.isArray(polygons) || !polygons.length) throw new Error(`Empty geometry: ${feature.id}`);
    for (const polygon of polygons) {
      if (!Array.isArray(polygon) || !polygon.length) throw new Error(`Empty polygon: ${feature.id}`);
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4) throw new Error(`Invalid ring: ${feature.id}`);
        for (const point of ring) {
          if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) || point[0] < 11 || point[0] > 12 || point[1] < 47.8 || point[1] > 48.5) throw new Error(`Invalid Munich coordinate: ${feature.id}`);
        }
        if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) throw new Error(`Unclosed ring: ${feature.id}`);
      }
    }
    const properties = {};
    for (const field of fields) {
      const value = feature.properties?.[field] ?? null;
      if (value !== null && typeof value !== 'string') throw new Error(`Invalid ${field}: ${feature.id}`);
      properties[field] = value;
    }
    return { type: 'Feature', id: feature.id, geometry: feature.geometry, properties };
  });
  return {
    fetchedAt,
    sourceResponseAt: response.timeStamp,
    snapshotDay: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(fetchedAt)),
    provider: 'Landeshauptstadt München · Mobilitätsreferat',
    catalogUrl: 'https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata',
    requestUrl: sourceUrl,
    licenseUrl: 'https://www.govdata.de/dl-de/by-2-0',
    matchedCount: matched,
    collection: { type: 'FeatureCollection', features },
  };
}

async function main() {
  const argumentsList = process.argv.slice(2);
  function option(name) {
    const position = argumentsList.indexOf(name);
    if (position === -1) return null;
    const value = argumentsList[position + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
    return value;
  }
  const input = option('--input');
  const fetchedAt = option('--fetched-at');
  if (input && !fetchedAt) throw new Error('Cached input requires --fetched-at with its original retrieval timestamp');
  if (!input && fetchedAt) throw new Error('--fetched-at is only for a cached input');
  const output = option('--output') ?? new URL('../extension/munich-snapshot.js', import.meta.url);
  if (argumentsList.some((argument, index) => index % 2 === 0 && !['--input', '--output', '--fetched-at'].includes(argument))) throw new Error('Use --input FILE, --fetched-at TIMESTAMP and/or --output FILE');
  let response;
  if (input) response = JSON.parse(await readFile(input, 'utf8'));
  else {
    const result = await fetch(sourceUrl, { signal: AbortSignal.timeout(90000) });
    if (!result.ok) throw new Error(`Source returned HTTP ${result.status}`);
    const body = await result.text();
    if (body.length > 30000000) throw new Error('Source response exceeds prototype size limit');
    response = JSON.parse(body);
  }
  const snapshot = makeSnapshot(response, fetchedAt ?? new Date().toISOString());
  const serialized = JSON.stringify(snapshot).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const outputPath = output instanceof URL ? fileURLToPath(output) : output;
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `globalThis.TransportGapsMunichSnapshot = Object.freeze(${serialized});\n`);
  await rename(temporaryPath, outputPath);
  console.log(`Saved ${snapshot.matchedCount} source features; response ${snapshot.sourceResponseAt}; retrieved ${snapshot.fetchedAt}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
