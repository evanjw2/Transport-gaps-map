(() => {
  const snapshot = globalThis.TransportGapsMunichSnapshot;
  const hasRoads = Boolean(snapshot?.collection?.features?.length);
  const mapElement = document.getElementById('map');
  if (!globalThis.L || typeof globalThis.TransportGapsTransitMap !== 'function') {
    document.getElementById('source-summary').textContent = 'Packaged data or map library unavailable. Reload the extension or reopen the complete extension folder.';
    document.getElementById('saved-at').textContent = 'SOURCE UNAVAILABLE';
    document.getElementById('result-count').textContent = 'Coverage unavailable, not zero restrictions';
    document.getElementById('transit-count').textContent = 'Map library unavailable';
    document.getElementById('map-notice').textContent = 'The packaged map could not load. Reopen the complete extension folder; this is not evidence of clear travel.';
    for (const control of document.querySelectorAll('input, select, button')) control.disabled = true;
    return;
  }
  const colors = { works: '#bc155a', parking: '#86580b' };
  const format = new Intl.NumberFormat('en-GB');
  const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeView = 'transit';
  const map = L.map(mapElement, { preferCanvas: true, minZoom: 10, maxZoom: 19, zoomAnimation: !motionReduced, fadeAnimation: !motionReduced });
  map.setView([48.1372, 11.5761], 13);
  L.control.scale({ imperial: false }).addTo(map);
  const tiles = L.tileLayer('https://wmtsod1.bayernwolke.de/wmts/by_webkarte_grau/smerc/{z}/{x}/{y}', {
    minZoom: 10, maxZoom: 19, bounds: [[47.95, 11.2], [48.35, 11.9]], keepBuffer: 1,
    attribution: '<a href="https://geodaten.bayern.de/odd/m/3/pdf/WMTS_Nutzungshinweise.pdf" target="_blank" rel="noopener noreferrer">© Datenquellen: Bayerische Vermessungsverwaltung, GeoBasis-DE / BKG 2021/2023 – Daten verändert</a>',
  });
  map.attributionControl.addAttribution('<a href="https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata" target="_blank" rel="noopener noreferrer">Munich MOR · dl-de/by-2-0</a>');
  const notice = document.getElementById('map-notice');
  let normalNotice = notice.textContent;
  let tileFailed = false;
  function refreshMapNotice() {
    if (!document.getElementById('basemap').checked) notice.textContent = 'Street tiles disabled. Markers and source footprints retain their geographic coordinates. Enable the street map for context.';
    else if (tileFailed) notice.textContent = 'Some street tiles are unavailable. Geographic layers remain positioned, but the background may be incomplete. Check connectivity or disable the street map.';
    else notice.textContent = normalNotice;
  }
  tiles.on('tileerror', () => {
    tileFailed = true;
    refreshMapNotice();
  });
  tiles.on('loading', () => { tileFailed = false; });
  tiles.on('load', refreshMapNotice);
  tiles.addTo(map);
  document.getElementById('basemap').addEventListener('change', event => {
    if (event.target.checked) tiles.addTo(map);
    else {
      map.removeLayer(tiles);
    }
    refreshMapNotice();
  });

  function node(tag, text, className) {
    const result = document.createElement(tag);
    if (text !== undefined) result.textContent = text;
    if (className) result.className = className;
    return result;
  }

  function link(text, url) {
    const result = node('a', text);
    result.href = url;
    result.target = '_blank';
    result.rel = 'noopener noreferrer';
    return result;
  }

  function sourceDay(value) {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})(?: (\d{2}):(\d{2}))?$/.exec(value || '');
    if (!match) return null;
    if (match[4] && (Number(match[4]) > 23 || Number(match[5]) > 59)) return null;
    const day = `${match[3]}-${match[2]}-${match[1]}`;
    const parsed = new Date(`${day}T12:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? day : null;
  }

  function schedule(properties) {
    const starts = sourceDay(properties.beginn_datum_kombiniert);
    const ends = sourceDay(properties.ende_datum_kombiniert);
    if (starts && ends && starts > ends) return 'unknown';
    if (ends && ends < snapshot.snapshotDay) return 'ended';
    if (starts && starts > snapshot.snapshotDay) return 'upcoming';
    if (starts && ends) return 'overlaps';
    return 'unknown';
  }

  const scheduleLabels = { overlaps: 'Schedule overlaps snapshot day', upcoming: 'Upcoming at snapshot', ended: 'Scheduled end before snapshot', unknown: 'Dates unknown / ambiguous' };
  const records = (hasRoads ? snapshot.collection.features : []).map((feature, index) => {
    const bounds = L.latLngBounds([]);
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) for (const point of ring) bounds.extend([point[1], point[0]]);
    return {
      feature, index, bounds,
      kind: feature.properties.art === 'Vorübergehendes Haltverbot' ? 'parking' : 'works',
      timing: schedule(feature.properties),
      searchable: Object.values(feature.properties).filter(Boolean).join(' ').toLocaleLowerCase('de-DE'),
    };
  });
  const byId = new Map(records.map(record => [record.feature.id, record]));
  const list = document.getElementById('records');
  const detail = document.getElementById('detail');
  const results = document.getElementById('results');
  const scroll = document.getElementById('record-scroll');
  let matched = [];
  let visible = [];
  let polygonLayer;
  let locatorLayer;
  let selectionLayer;
  let selected = null;
  let listLimit = 50;
  const savedDate = new Date(snapshot?.fetchedAt);
  const ageDays = Math.max(0, Math.floor((Date.now() - savedDate.getTime()) / 86400000));
  const savedLabel = hasRoads ? `SAVED ${snapshot.snapshotDay} · NOT LIVE${ageDays ? ` · ${ageDays} days old` : ''}` : 'ROAD SOURCE UNAVAILABLE';
  document.getElementById('source-summary').textContent = hasRoads ? `${format.format(records.length)} municipal source records, including parking notices—not that many confirmed road closures. Source schedule filters refer to ${snapshot.snapshotDay}, not today's verified conditions.` : 'Road source unavailable, not zero restrictions. Transit examples can still be explored.';
  if (hasRoads) document.getElementById('source-link').href = snapshot.catalogUrl;
  else for (const control of document.querySelectorAll('.road-only input, .road-only select, .road-only button, #export')) control.disabled = true;

  function clearSelection() {
    selected = null;
    if (selectionLayer) map.removeLayer(selectionLayer);
    detail.hidden = true;
    results.hidden = false;
  }

  function selectRecord(record, focusHeading = true) {
    selected = record;
    if (selectionLayer) map.removeLayer(selectionLayer);
    selectionLayer = L.geoJSON(record.feature, { style: { color: '#253731', weight: 4, fillColor: colors[record.kind], fillOpacity: 0.45 }, interactive: false }).addTo(map);
    map.fitBounds(record.bounds.pad(0.4), { maxZoom: 18, animate: !motionReduced });
    const properties = record.feature.properties;
    const back = node('button', '← Back to matching records', 'back');
    back.type = 'button';
    back.addEventListener('click', () => {
      clearSelection();
      const previous = list.querySelector(`[data-record-index="${record.index}"]`);
      if (previous) previous.focus();
      else document.getElementById('search').focus();
    });
    const heading = node('h2', properties.strasse_hausnr || 'Unnamed source location');
    heading.tabIndex = -1;
    const facts = node('dl', undefined, 'detail-facts');
    for (const [name, value] of [
      ['Source type', properties.art], ['Affected facility / area', properties.betroffene_bereiche],
      ['Reported restriction', properties.beeintraechtigung],
      ['Source description', properties.beschreibung],
      ['Source start (Europe/Berlin)', properties.beginn_datum_kombiniert],
      ['Source end (Europe/Berlin)', properties.ende_datum_kombiniert],
      ['Schedule interpretation', `${scheduleLabels[record.timing]} · day-level filter only; source time text is retained above`],
      ['Retrieved (UTC)', snapshot.fetchedAt], ['Source response time', snapshot.sourceResponseAt],
    ]) {
      const row = node('div');
      row.append(node('dt', name), node('dd', value || 'Not supplied by this source'));
      facts.append(row);
    }
    const centre = record.bounds.getCenter();
    const links = node('div', undefined, 'detail-links');
    links.append(link('Open approximate location in Google Maps ↗', `https://www.google.com/maps/search/?api=1&query=${centre.lat.toFixed(7)},${centre.lng.toFixed(7)}`),
      link('Inspect the official dataset ↗', snapshot.catalogUrl), link('Data license / attribution ↗', snapshot.licenseUrl));
    const original = node('details', undefined, 'source-fields');
    original.append(node('summary', 'Original German source fields'));
    for (const [name, value] of Object.entries(properties)) original.append(node('p', `${name}: ${value || 'Not supplied'}`));
    original.append(node('p', `Source ID at retrieval: ${record.feature.id}. Stability across imports is unverified.`));
    detail.replaceChildren(back, heading, node('p', properties.art || 'Source record'),
      node('p', 'This is the source footprint, not necessarily the whole affected street. A parking notice is not a road closure. Unknown effects on other modes remain unknown. Not live-checked or routing advice.', 'caution'), links, facts, original,
      node('p', `Source: ${snapshot.provider}. dl-de/by-2-0. Changes: selected fields, schedule grouping, locator dots and display styling. Map link opens the footprint bounding-box centre, not an entrance.`, 'credit'));
    detail.hidden = false;
    results.hidden = true;
    scroll.scrollTop = 0;
    if (focusHeading) heading.focus({ preventScroll: true });
  }

  function updateLocatorVisibility() {
    if (!locatorLayer || activeView !== 'roads') return;
    if (map.getZoom() < 16 && !map.hasLayer(locatorLayer)) locatorLayer.addTo(map);
    if (map.getZoom() >= 16 && map.hasLayer(locatorLayer)) map.removeLayer(locatorLayer);
  }

  function renderList() {
    if (activeView !== 'roads') return;
    visible = document.getElementById('in-view').checked ? matched.filter(record => map.getBounds().intersects(record.bounds)) : matched;
    document.getElementById('result-count').textContent = hasRoads ? `${format.format(visible.length)} listed / ${format.format(matched.length)} matching` : 'Source unavailable';
    list.replaceChildren();
    if (!visible.length) list.append(node('p', 'No matching records in this view. Zoom out, disable the map-view filter, or change your search. This does not mean the area is clear.', 'empty'));
    for (const record of visible.slice(0, listLimit)) {
      const properties = record.feature.properties;
      const button = node('button', undefined, 'record');
      button.type = 'button';
      button.dataset.recordIndex = record.index;
      button.style.setProperty('--record-color', colors[record.kind]);
      button.append(node('strong', properties.strasse_hausnr || 'Unnamed source location'),
        node('span', properties.art || 'Source record', 'record-type'),
        node('span', properties.beeintraechtigung || 'Restriction detail not supplied'),
        node('span', `${properties.beginn_datum_kombiniert || '?'} → ${properties.ende_datum_kombiniert || '?'} · ${scheduleLabels[record.timing]}`));
      button.addEventListener('click', () => selectRecord(record));
      list.append(button);
    }
    document.getElementById('more').hidden = visible.length <= listLimit;
  }

  function render() {
    if (activeView !== 'roads') return;
    const query = document.getElementById('search').value.toLocaleLowerCase('de-DE').trim();
    const kind = document.getElementById('type').value;
    const timing = document.getElementById('timing').value;
    matched = records.filter(record => (!query || record.searchable.includes(query)) && (kind === 'all' || record.kind === kind) &&
      (timing === 'all' || (timing === 'available' ? record.timing !== 'ended' : record.timing === timing)));
    clearSelection();
    listLimit = 50;
    if (polygonLayer) map.removeLayer(polygonLayer);
    if (locatorLayer) map.removeLayer(locatorLayer);
    polygonLayer = L.geoJSON({ type: 'FeatureCollection', features: matched.map(record => record.feature) }, {
      style: feature => ({ color: colors[byId.get(feature.id).kind], weight: 2, fillOpacity: 0.3 }),
      onEachFeature: (feature, layer) => layer.on('click', () => selectRecord(byId.get(feature.id))),
    }).addTo(map);
    locatorLayer = L.layerGroup(matched.map(record => L.circleMarker(record.bounds.getCenter(), { radius: 3.5, color: '#fffdf7', weight: 1, fillColor: colors[record.kind], fillOpacity: 0.9 }).on('click', () => selectRecord(record))));
    updateLocatorVisibility();
    renderList();
  }

  let searchTimer;
  document.getElementById('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(render, 180); });
  for (const name of ['type', 'timing']) document.getElementById(name).addEventListener('change', render);
  document.getElementById('in-view').addEventListener('change', () => { listLimit = 50; renderList(); });
  document.getElementById('more').addEventListener('click', () => { listLimit += 50; renderList(); });
  document.getElementById('fit').addEventListener('click', () => {
    if (matched.length) map.fitBounds(matched.reduce((bounds, record) => bounds.extend(record.bounds), L.latLngBounds([])), { padding: [25, 65], maxZoom: 17, animate: !motionReduced });
  });
  map.on('moveend', () => { listLimit = 50; renderList(); });
  map.on('zoomend', updateLocatorVisibility);
  document.addEventListener('keydown', event => {
    if (activeView === 'roads' && event.key === 'Escape' && selected) {
      clearSelection();
      document.getElementById('search').focus();
    }
  });
  document.getElementById('export').addEventListener('click', () => {
    const status = document.getElementById('export-status');
    if (!matched.length) { status.textContent = 'No matching records to export. Change the filters first.'; return; }
    try {
      const parts = globalThis.TransportGapsExport.makeParts(matched.map(record => record.feature), snapshot);
      const files = {};
      for (const part of parts) files[part.name] = fflate.strToU8(part.contents);
      files['READ-ME.txt'] = fflate.strToU8(`Munich reported restrictions. Saved ${snapshot.fetchedAt}. Not live or independently verified.\n${matched.length} source records matching the search/type/schedule filters; the list's map-view restriction is NOT applied to this export.\nUnzip this download. In https://www.google.com/mymaps create a map and import each .kml into a separate layer. Files are split at 1,000 source features and below 4.5 MB; Google can impose additional complexity/overall-map limits. No import success is guaranteed.\nSource: ${snapshot.provider}\n${snapshot.catalogUrl}\nLicense: dl-de/by-2-0 ${snapshot.licenseUrl}\nChanges: selected fields, filtering and KML styling. Footprints are not whole-road closures. Preserve attribution when sharing.\nThis export uploads no data automatically. It does not change Google Maps routing and does not auto-refresh.\n`);
      const blob = new Blob([fflate.zipSync(files)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const download = document.createElement('a');
      download.href = url;
      download.download = `munich-source-${snapshot.snapshotDay}.zip`;
      download.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status.textContent = `Exported ${format.format(matched.length)} filtered records in ${parts.length} KML file(s). Unzip, then import each into a separate My Maps layer. Map-view list filtering is not applied.`;
    } catch (error) {
      status.textContent = `Export failed: ${error.message}. Try a narrower search.`;
    }
  });
  const transitMap = globalThis.TransportGapsTransitMap(map);
  function setView(view) {
    activeView = view;
    if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
    for (const button of document.querySelectorAll('[data-layer]')) button.setAttribute('aria-pressed', String(button.dataset.layer === view));
    for (const element of document.querySelectorAll('.road-only')) element.hidden = view !== 'roads';
    for (const element of document.querySelectorAll('.transit-only')) element.hidden = view !== 'transit';
    document.getElementById('transit-workspace').hidden = view !== 'transit';
    document.getElementById('saved-at').textContent = view === 'transit' ? 'TRANSIT DEMO · NOT LIVE' : savedLabel;
    normalNotice = view === 'transit' ? 'Fictional transit examples · approximate station centres, not track paths, entrances or closed areas. Unlocated notices stay in the list.' : 'Saved source geometry, not independently verified. Dots locate small footprints; zoom in to inspect polygons. Not an entire-road closure map.';
    if (view === 'transit') {
      clearSelection();
      for (const layer of [polygonLayer, locatorLayer, selectionLayer]) if (layer) map.removeLayer(layer);
      transitMap.show();
    } else {
      transitMap.hide();
      render();
    }
    refreshMapNotice();
    map.invalidateSize();
  }
  for (const button of document.querySelectorAll('[data-layer]')) button.addEventListener('click', () => setView(button.dataset.layer));
  window.addEventListener('hashchange', () => setView(location.hash === '#transit' ? 'transit' : 'roads'));
  setView(location.hash === '#transit' ? 'transit' : 'roads');
})();
