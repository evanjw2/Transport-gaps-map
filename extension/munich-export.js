(() => {
  function xml(value) {
    return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  }

  function polygonKml(rings) {
    return `<Polygon><altitudeMode>clampToGround</altitudeMode>${rings.map((ring, index) => {
      const boundary = index === 0 ? 'outerBoundaryIs' : 'innerBoundaryIs';
      return `<${boundary}><LinearRing><coordinates>${ring.map(point => `${point[0]},${point[1]},0`).join(' ')}</coordinates></LinearRing></${boundary}>`;
    }).join('')}</Polygon>`;
  }

  function placemark(feature, snapshot) {
    const properties = feature.properties;
    const description = [
      'Saved municipal source record; not live or independently verified. Footprint is not necessarily a whole-road closure.',
      ...Object.entries(properties).map(([name, value]) => `${name}: ${value || 'Not supplied'}`),
      `Source: ${snapshot.provider}`, `Retrieved: ${snapshot.fetchedAt}`, `Dataset: ${snapshot.catalogUrl}`,
      `License: dl-de/by-2-0 (${snapshot.licenseUrl}). Changes: selected fields and KML styling.`,
    ].join('\n');
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const geometry = polygons.length === 1 ? polygonKml(polygons[0]) : `<MultiGeometry>${polygons.map(polygonKml).join('')}</MultiGeometry>`;
    const style = properties.art === 'Vorübergehendes Haltverbot' ? 'parking' : 'works';
    return `<Placemark><name>${xml(properties.strasse_hausnr || 'Unnamed source location')}</name><description>${xml(xml(description))}</description><styleUrl>#${style}</styleUrl>${geometry}</Placemark>`;
  }

  function documentKml(placemarks, name, snapshot) {
    return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(name)}</name><description>${xml(`Municipal source snapshot retrieved ${snapshot.fetchedAt}; not a live feed. ${snapshot.provider}; ${snapshot.catalogUrl}; dl-de/by-2-0 ${snapshot.licenseUrl}; selected fields and styling changed.`)}</description><Style id="works"><LineStyle><color>ff5a15bc</color><width>2</width></LineStyle><PolyStyle><color>665a15bc</color></PolyStyle></Style><Style id="parking"><LineStyle><color>ff0b5886</color><width>2</width></LineStyle><PolyStyle><color>660b5886</color></PolyStyle></Style>${placemarks.join('')}</Document></kml>`;
  }

  function makeParts(features, snapshot) {
    const parts = [];
    let batch = [];
    let bytes = 0;
    const encoder = new TextEncoder();
    function flush() {
      if (!batch.length) return;
      const name = `munich-restrictions-${String(parts.length + 1).padStart(2, '0')}`;
      const contents = documentKml(batch, name, snapshot);
      if (encoder.encode(contents).length > 4500000) throw new Error('KML part exceeds conservative import size limit');
      parts.push({ name: `${name}.kml`, contents, featureCount: batch.length });
      batch = [];
      bytes = 0;
    }
    for (const feature of features) {
      const value = placemark(feature, snapshot);
      const size = encoder.encode(value).length;
      if (batch.length && (batch.length >= 1000 || bytes + size > 4000000)) flush();
      batch.push(value);
      bytes += size;
    }
    flush();
    return parts;
  }

  globalThis.TransportGapsExport = Object.freeze({ makeParts });
})();
