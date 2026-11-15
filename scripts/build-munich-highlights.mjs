import { writeFile, rename } from 'node:fs/promises';
import '../extension/munich-snapshot.js';

const snapshot = globalThis.TransportGapsMunichSnapshot;
const selected = [];
const seen = new Set();
for (const address of ['Ohlmüllerstraße 1 - 19', 'Karlsfelder Straße']) {
  const feature = snapshot.collection.features.find(feature => feature.properties.strasse_hausnr?.includes(address));
  if (feature && !seen.has(feature.properties.strasse_hausnr)) {
    selected.push(feature);
    seen.add(feature.properties.strasse_hausnr);
  }
}
for (const kind of ['Baumaßnahme', 'Vorübergehendes Haltverbot']) {
  const limit = kind === 'Baumaßnahme' ? 9 : 3;
  let count = selected.filter(feature => feature.properties.art === kind).length;
  for (const feature of snapshot.collection.features) {
    if (count >= limit) break;
    const properties = feature.properties;
    if (properties.art !== kind || !properties.strasse_hausnr || seen.has(properties.strasse_hausnr) || (!properties.beeintraechtigung && kind === 'Baumaßnahme')) continue;
    selected.push(feature);
    seen.add(properties.strasse_hausnr);
    count += 1;
  }
}
if (!selected.length) throw new Error('No usable source highlights; previous file was not replaced');
const highlights = { ...snapshot, selection: `${selected.length} selected source features, not a representative or complete city listing`, collection: { type: 'FeatureCollection', features: selected } };
const output = new URL('../extension/munich-highlights.js', import.meta.url);
const temporary = new URL('../extension/munich-highlights.js.tmp', import.meta.url);
const serialized = JSON.stringify(highlights).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
await writeFile(temporary, `globalThis.TransportGapsMunichHighlights = Object.freeze(${serialized});\n`);
await rename(temporary, output);
console.log(`Selected ${selected.length} original records from the ${snapshot.snapshotDay} snapshot. No new fetch or verification is claimed.`);
