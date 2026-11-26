globalThis.TransportGapsTransitMap = function (map) {
  const data = globalThis.TransportGapsTransit;
  const list = document.getElementById('transit-records');
  const detail = document.getElementById('transit-detail');
  const results = document.getElementById('transit-results');
  const count = document.getElementById('transit-count');
  const search = document.getElementById('transit-search');
  const mode = document.getElementById('transit-mode');
  const timing = document.getElementById('transit-timing');
  const access = document.getElementById('transit-access');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stations = {
    Marienplatz: [48.1372, 11.5755],
    'Sendlinger Tor': [48.1334, 11.5668],
    Hauptbahnhof: [48.1402, 11.5586],
    Ostbahnhof: [48.1281, 11.6040],
    'Hauptbahnhof Süd': [48.1385, 11.5586],
    'Karlsplatz (Stachus)': [48.1390, 11.5654],
    Odeonsplatz: [48.1429, 11.5777],
  };
  const colors = { pink: '#bc155a', amber: '#94600b', blue: '#246483', purple: '#70518c' };
  const layer = L.layerGroup();
  const markers = [];
  let selected = null;
  let active = false;
  let matched = [];

  function node(tag, text, className) {
    const result = document.createElement(tag);
    if (text !== undefined) result.textContent = text;
    if (className) result.className = className;
    return result;
  }

  function places(notice) {
    return notice.stops.filter(stop => Object.hasOwn(stations, stop));
  }

  function closeDetail() {
    selected = null;
    detail.hidden = true;
    results.hidden = false;
    for (const entry of markers) entry.marker.setOpacity(1);
  }

  function fitPlaces(notices) {
    const points = notices.flatMap(notice => places(notice).map(stop => stations[stop]));
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [65, 85], maxZoom: 16, animate: !reducedMotion });
  }

  function openNotice(notice) {
    selected = notice.id;
    for (const entry of markers) entry.marker.setOpacity(entry.notices.includes(notice) ? 1 : 0.25);
    const back = node('button', '← Back to examples', 'back');
    back.type = 'button';
    back.addEventListener('click', () => {
      closeDetail();
      const previous = [...list.querySelectorAll('button')].find(button => button.dataset.notice === notice.id);
      (previous || search).focus({ preventScroll: true });
    });
    const title = node('h2', notice.title);
    title.tabIndex = -1;
    const facts = node('dl', undefined, 'detail-facts');
    for (const [name, value] of [
      ['Affected service', notice.place], ['Effect', notice.effect], ['What to do', notice.action],
      ['Extent / uncertainty', notice.scope], ['Scenario timing', notice.validity],
      ['Map precision', places(notice).length ? 'Approximate hand-placed station centres. Not entrances, lift locations, track paths or a closed area.' : 'No reliable location assigned. This notice is deliberately not plotted.'],
      ['Provenance', 'Fictional packaged example. No live operator feed, publication time or verified disruption.'],
    ]) {
      const row = node('div');
      row.append(node('dt', name), node('dd', value));
      facts.append(row);
    }
    const actions = node('div', undefined, 'detail-links');
    const operator = data.operators[notice.operator];
    const operatorUrl = new URL(operator.url);
    if (operatorUrl.protocol === 'https:') {
      const link = node('a', operator.label);
      link.href = operatorUrl.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.append(link);
    }
    const mappedPlaces = places(notice);
    if (mappedPlaces.length) {
      const point = stations[mappedPlaces[0]];
      const link = node('a', 'Open approximate station location in Google Maps ↗');
      link.href = `https://www.google.com/maps/search/?api=1&query=${point[0]},${point[1]}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.append(link);
      fitPlaces([notice]);
    }
    detail.replaceChildren(back, title, node('span', 'DEMO · NOT A LIVE ALERT', 'scenario-badge'), node('p', notice.detail), facts, actions,
      node('p', 'Operator links are places to check independently, not evidence confirming this scenario. No alternative route is calculated.', 'credit'));
    results.hidden = true;
    detail.hidden = false;
    document.getElementById('transit-scroll').scrollTop = 0;
    title.focus({ preventScroll: true });
  }

  function render() {
    closeDetail();
    const query = search.value.toLocaleLowerCase('de-DE').trim();
    matched = data.notices.filter(notice => (mode.value === 'all' || notice.modes.includes(mode.value)) &&
      (timing.value === 'all' || notice.timing === timing.value) && (!access.checked || notice.accessibility) &&
      (!query || [notice.title, notice.place, notice.effect, notice.summary, ...notice.stops,
        ...(notice.lines.length ? notice.lines : data.lines.filter(line => notice.modes.includes(line.mode)).map(line => line.id)),
        ...notice.modes.map(name => data.modes[name].label)].join(' ').toLocaleLowerCase('de-DE').includes(query)));
    const located = matched.filter(notice => places(notice).length);
    count.textContent = `${matched.length} examples · ${located.length} located`;
    list.replaceChildren();
    layer.clearLayers();
    markers.length = 0;
    const sharedPlaces = new Map();
    for (const notice of matched) {
      for (const stop of places(notice)) {
        if (!sharedPlaces.has(stop)) sharedPlaces.set(stop, []);
        sharedPlaces.get(stop).push(notice);
      }
      const button = node('button', undefined, 'record');
      button.type = 'button';
      button.dataset.notice = notice.id;
      button.style.setProperty('--record-color', colors[notice.tone] || colors.pink);
      button.append(node('span', `DEMO · ${notice.effect}`, 'record-type'), node('strong', notice.place), node('span', notice.summary),
        node('span', places(notice).length ? `${places(notice).length} approximate station location(s) · view details ↗` : 'Not plotted · no reliable location supplied'));
      button.addEventListener('click', () => openNotice(notice));
      list.append(button);
    }
    for (const [stop, notices] of sharedPlaces) {
      const content = node('span', notices.length > 1 ? `${notices.length}×` : notices[0].lines.join('/'));
      content.style.setProperty('--station-color', colors[notices[0].tone] || colors.pink);
      const marker = L.marker(stations[stop], {
        icon: L.divIcon({ html: content, className: 'station-marker', iconSize: [38, 38], iconAnchor: [19, 38] }),
        title: `DEMO · ${stop} · ${notices.length} example(s)`, keyboard: true,
      });
      const popup = node('div');
      popup.append(node('strong', `${stop} · DEMO`), node('p', 'Approximate station centre. Not a confirmed disruption.'));
      for (const notice of notices) {
        const button = node('button', `${notice.lines.join('/') || 'Access'} · ${notice.effect}`);
        button.type = 'button';
        button.addEventListener('click', () => { map.closePopup(); openNotice(notice); });
        popup.append(button);
      }
      marker.bindPopup(popup).addTo(layer);
      markers.push({ marker, notices });
    }
    if (!matched.length) list.append(node('p', 'No matching examples. This is not evidence of clear travel.', 'empty'));
    if (matched.length && !located.length) list.prepend(node('p', 'These notices have no reliable geographic extent. We keep them visible here rather than inventing a blocked area.', 'caution'));
  }

  if (!data?.notices?.length) {
    count.textContent = 'Transit examples unavailable, not zero disruptions';
    for (const control of document.querySelectorAll('#transit-workspace input, #transit-workspace select, #transit-workspace button, #transit-fit')) control.disabled = true;
    return { show() {}, hide() {} };
  }
  for (const [name, value] of Object.entries(data.modes)) {
    const option = node('option', value.label);
    option.value = name;
    mode.append(option);
  }
  search.addEventListener('input', render);
  for (const control of [mode, timing, access]) control.addEventListener('change', render);
  document.getElementById('transit-reset').addEventListener('click', () => {
    search.value = '';
    mode.value = 'all';
    timing.value = 'all';
    access.checked = false;
    render();
    fitPlaces(matched);
  });
  document.getElementById('transit-fit').addEventListener('click', () => fitPlaces(matched));
  document.addEventListener('keydown', event => {
    if (active && selected && event.key === 'Escape') { closeDetail(); search.focus(); }
  });
  render();
  return {
    show() { active = true; layer.addTo(map); fitPlaces(matched); },
    hide() { active = false; map.closePopup(); map.removeLayer(layer); closeDetail(); },
  };
};
