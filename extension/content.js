(() => {
  if (document.getElementById('transport-gaps-demo')) return;
  const transit = globalThis.TransportGapsTransit;
  if (!transit) return;
  const roads = globalThis.TransportGapsMunichHighlights;
  const state = { view: 'transit', mode: 'all', line: 'all', timing: 'all', query: '', access: false, roadQuery: '', parking: false, selected: null };
  const mapUrl = globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL('munich-map.html') : new URL('munich-map.html', location.href).href;

  function element(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }

  function link(label, url, internal = false) {
    const parsed = new URL(url, location.href);
    if (!internal && parsed.protocol !== 'https:') return element('span', '', 'Source link unavailable');
    const result = element('a', 'inline-link', label);
    result.href = parsed.href;
    result.target = '_blank';
    result.rel = 'noopener noreferrer';
    return result;
  }

  const host = element('div');
  host.id = 'transport-gaps-demo';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:block;';
  const root = host.attachShadow({ mode: 'open' });
  const style = element('style');
  style.textContent = globalThis.TransportGapsDemoStyles;
  const panel = element('section', 'panel');
  panel.id = 'tg-panel';
  panel.setAttribute('aria-label', 'Transport Gaps Munich companion');
  panel.innerHTML = `
    <header class="hero">
      <div class="brand-row"><span class="brand">TRANSPORT GAPS</span><span class="prototype">MUNICH · PROTOTYPE</span><button type="button" class="minimize" aria-label="Minimize transport companion" aria-expanded="true" aria-controls="tg-panel">−</button></div>
      <div class="hero-main"><div><h1>Know before you go.</h1><p>Your journey. Fewer surprises.</p></div>
        <svg class="mascot" viewBox="0 0 90 80" aria-hidden="true"><ellipse cx="44" cy="74" rx="29" ry="4" fill="#d4dec0"/><g class="bus-body" stroke="#253731" stroke-width="2" stroke-linejoin="round"><rect x="15" y="14" width="56" height="54" rx="15" fill="#f7cbdc"/><rect x="23" y="24" width="40" height="23" rx="8" fill="#fffdf7"/><path d="M43 25v21"/><circle cx="33" cy="37" r="2" fill="#253731"/><circle cx="53" cy="37" r="2" fill="#253731"/><path d="M37 54q6 7 12 0" fill="none" stroke-linecap="round"/><rect x="23" y="65" width="9" height="8" rx="3" fill="#253731"/><rect x="54" y="65" width="9" height="8" rx="3" fill="#253731"/></g><circle cx="25" cy="53" r="3" fill="#eb8fb3"/><circle cx="61" cy="53" r="3" fill="#eb8fb3"/></svg>
      </div>
    </header>
    <nav class="navigation" aria-label="Transport information"><button type="button" data-view="transit" aria-pressed="true">Public transport</button><button type="button" data-view="roads" aria-pressed="false">Roadworks</button><button type="button" data-view="about" aria-pressed="false">About</button></nav>
    <div class="trust-banner" role="status"></div>
    <div class="scroller">
      <section class="transit-browse" aria-label="Illustrative public transport scenarios">
        <div class="mode-chips" aria-label="Transport mode filter"></div>
        <div class="filter-grid"><label>Your line<select class="line-filter" aria-label="Filter examples by line"></select></label><label>Scenario timing<select class="timing-filter"><option value="all">In progress + next</option><option value="now">In progress · demo</option><option value="next">Upcoming · demo</option></select></label></div>
        <label class="search-label"><span class="sr-only">Search transit examples</span><input class="transit-search" type="search" placeholder="Find a station or type of disruption…" maxlength="160"></label>
        <label class="access-filter"><input type="checkbox" class="access-toggle"> Step-free access examples only</label>
        <p class="filter-explanation">Choose a line manually. We do not read your Google Maps route.</p>
        <div class="result-heading"><h2 class="transit-count" role="status" aria-live="polite"></h2><button type="button" class="reset-transit">Reset</button></div>
        <div class="transit-list"></div>
      </section>
      <section class="road-browse" aria-label="Saved municipal source highlights" hidden>
        <div class="section-intro"><h2>Real source. Clear limits.</h2><p>Selected Munich records with their original impacts and dates. These are saved notices, not live-checked conditions.</p></div>
        <label class="search-label"><span class="sr-only">Search selected roadworks</span><input class="road-search" type="search" placeholder="Find a street in the selected records…" maxlength="160"></label>
        <label class="access-filter"><input type="checkbox" class="parking-toggle"> Include temporary no-parking notices</label>
        <div class="result-heading"><h2 class="road-count" role="status" aria-live="polite"></h2></div>
        <div class="road-list"></div>
        <div class="map-option"></div>
      </section>
      <section class="about" aria-label="Prototype coverage and privacy" hidden></section>
      <section class="detail" aria-label="Disruption details" hidden></section>
    </div>
    <footer class="footer"><span class="footer-hint">Awareness first. Not rerouting or a safety guarantee.</span><span class="footer-note">No reports does not mean no disruption.</span></footer>
  `;
  const restore = element('button', 'restore', '🚎 Transport Gaps · open companion');
  restore.type = 'button';
  restore.hidden = true;
  restore.setAttribute('aria-controls', 'tg-panel');
  restore.setAttribute('aria-expanded', 'false');
  root.append(style, panel, restore);
  document.documentElement.append(host);
  const explorerLink = link('Explore disruptions on our map ↗', mapUrl, true);
  explorerLink.classList.add('explorer-launch');
  panel.querySelector('.hero').append(explorerLink);

  const scroller = panel.querySelector('.scroller');
  const detail = panel.querySelector('.detail');
  const browse = { transit: panel.querySelector('.transit-browse'), roads: panel.querySelector('.road-browse'), about: panel.querySelector('.about') };
  const lineSelect = panel.querySelector('.line-filter');
  const modeButtons = new Map();
  let returnFocus = null;
  let previousScroll = 0;

  function expanded(value) {
    panel.hidden = !value;
    restore.hidden = value;
    panel.querySelector('.minimize').setAttribute('aria-expanded', String(value));
    restore.setAttribute('aria-expanded', String(!value));
  }

  function lineBadge(line, mode) {
    const badge = element('span', 'line-badge', line);
    badge.style.setProperty('--line-color', transit.modes[mode].color);
    badge.style.setProperty('--line-tint', transit.modes[mode].tint);
    return badge;
  }

  function noticeBadges(notice) {
    const row = element('div', 'badge-row');
    if (notice.lines.length) {
      for (const id of notice.lines) row.append(lineBadge(id, transit.lines.find(line => line.id === id).mode));
    } else {
      for (const mode of notice.modes) row.append(lineBadge(transit.modes[mode].label, mode));
    }
    row.append(element('span', 'demo-badge', 'DEMO'));
    return row;
  }

  function populateLines() {
    lineSelect.replaceChildren();
    const all = element('option', '', 'All example lines');
    all.value = 'all';
    lineSelect.append(all);
    for (const line of transit.lines.filter(line => state.mode === 'all' || line.mode === state.mode)) {
      const option = element('option', '', `${transit.modes[line.mode].label} ${line.id}`);
      option.value = line.id;
      lineSelect.append(option);
    }
    lineSelect.value = state.line;
  }

  function matchingNotices() {
    const query = state.query.toLocaleLowerCase('de-DE').trim();
    const line = transit.lines.find(line => line.id === state.line);
    return transit.notices.filter(notice => (state.mode === 'all' || notice.modes.includes(state.mode)) &&
      (!line || (notice.lines.length ? notice.lines.includes(line.id) : notice.modes.includes(line.mode))) &&
      (state.timing === 'all' || notice.timing === state.timing) && (!state.access || notice.accessibility) &&
      (!query || [notice.title, notice.place, notice.effect, notice.summary, ...(notice.lines.length ? notice.lines : transit.lines.filter(line => notice.modes.includes(line.mode)).map(line => line.id)), ...notice.stops, ...notice.modes.map(mode => transit.modes[mode].label)].join(' ').toLocaleLowerCase('de-DE').includes(query)))
      .sort((first, second) => Number(first.timing === 'next') - Number(second.timing === 'next') || first.priority - second.priority);
  }

  function closeDetail(focus = true) {
    state.selected = null;
    detail.hidden = true;
    browse[state.view].hidden = false;
    scroller.scrollTop = previousScroll;
    if (focus) {
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      else panel.querySelector(`[data-view="${state.view}"]`).focus();
    }
  }

  function beginDetail(title, source) {
    previousScroll = scroller.scrollTop;
    returnFocus = source;
    for (const section of Object.values(browse)) section.hidden = true;
    detail.hidden = false;
    detail.replaceChildren();
    const back = element('button', 'back', '← Back to updates');
    back.type = 'button';
    back.addEventListener('click', () => closeDetail());
    const heading = element('h2', '', title);
    heading.tabIndex = -1;
    detail.append(back, heading);
    scroller.scrollTop = 0;
    return heading;
  }

  function facts(entries) {
    const list = element('dl', 'facts');
    for (const [name, value] of entries) {
      const row = element('div');
      row.append(element('dt', '', name), element('dd', '', value || 'Not supplied by the source'));
      list.append(row);
    }
    return list;
  }

  function openNotice(notice, source) {
    state.selected = notice.id;
    const heading = beginDetail(notice.title, source);
    detail.append(noticeBadges(notice), element('p', 'detail-place', notice.place), element('p', 'data-warning', 'Illustrative scenario—not an operator report. No live transit feed is connected.'), element('p', 'detail-copy', notice.detail));
    if (notice.stops.length) {
      const sketch = element('ol', 'stop-sketch');
      sketch.setAttribute('aria-label', 'Selected stations in this illustrative scenario');
      for (const stop of notice.stops) sketch.append(element('li', '', stop));
      detail.append(sketch, element('p', 'fine-print', 'Selected example stations only. Schematic, not a full network map, geographic trace or confirmed affected service.'));
    }
    detail.append(element('p', 'next-step', notice.action), facts([
      ['Impact', notice.effect], ['Extent / uncertainty', notice.scope], ['Scenario timing', notice.validity],
      ['Provenance & freshness', 'Packaged fictional scenario. Real line/station names; no source publication time, observation or independent verification.'],
    ]));
    const actions = element('div', 'detail-actions');
    const operator = transit.operators[notice.operator];
    actions.append(link(operator.label, operator.url), element('p', 'fine-print', 'Official information to check yourself—not evidence that this scenario is occurring. No alternative route is calculated.'));
    detail.append(actions);
    heading.focus({ preventScroll: true });
  }

  function roadLocation(feature) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const points = polygons.flat(2);
    const latitudes = points.map(point => point[1]);
    const longitudes = points.map(point => point[0]);
    return `${(Math.min(...latitudes) + Math.max(...latitudes)) / 2},${(Math.min(...longitudes) + Math.max(...longitudes)) / 2}`;
  }

  function openRoad(feature, source) {
    state.selected = feature.id;
    const properties = feature.properties;
    const heading = beginDetail(properties.strasse_hausnr, source);
    detail.append(element('span', 'source-badge', 'SAVED OFFICIAL RECORD'), element('p', 'detail-copy', properties.beschreibung || 'No description supplied.'),
      element('p', 'data-warning', 'A source footprint is not necessarily a whole-street closure. Parking notices are not road closures; source dates do not verify current conditions.'), facts([
        ['Source type', properties.art], ['Affected area / facility', properties.betroffene_bereiche], ['Reported restriction · original wording', properties.beeintraechtigung],
        ['Source start · Europe/Berlin', properties.beginn_datum_kombiniert], ['Source end · Europe/Berlin', properties.ende_datum_kombiniert],
        ['Retrieved (UTC)', roads.fetchedAt], ['Source response time', roads.sourceResponseAt], ['Provider', roads.provider],
      ]));
    const actions = element('div', 'detail-actions');
    actions.append(link('Inspect the official dataset ↗', roads.catalogUrl), link('View source footprints on our map ↗', `${mapUrl}#roads`, true),
      link('Open approximate location in Google Maps ↗', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(roadLocation(feature))}`),
      element('p', 'fine-print', 'The Google link uses the source footprint’s bounding-box centre, not a verified entrance or route.'),
      link('dl-de/by-2-0 · source license ↗', roads.licenseUrl), element('p', 'fine-print', 'Changes: selected records/fields, formatting and display styling. Source feature ID at retrieval: ' + feature.id + '; stability across imports unverified.'));
    detail.append(actions);
    heading.focus({ preventScroll: true });
  }

  function emptyState(message, reset) {
    const empty = element('div', 'empty');
    empty.append(element('h3', '', 'Nothing matches these filters.'), element('p', '', message), element('p', 'fine-print', 'No matches do not mean a line is running normally or an area is clear.'));
    const button = element('button', 'secondary-button', 'Reset filters');
    button.type = 'button';
    button.addEventListener('click', reset);
    empty.append(button);
    return empty;
  }

  function resetTransit() {
    Object.assign(state, { mode: 'all', line: 'all', timing: 'all', query: '', access: false });
    panel.querySelector('.transit-search').value = '';
    panel.querySelector('.timing-filter').value = 'all';
    panel.querySelector('.access-toggle').checked = false;
    populateLines();
    render();
  }

  function renderTransit() {
    const matching = matchingNotices();
    for (const [mode, button] of modeButtons) button.setAttribute('aria-pressed', String(state.mode === mode));
    panel.querySelector('.transit-count').textContent = `${matching.length} illustrative scenario${matching.length === 1 ? '' : 's'}`;
    const list = panel.querySelector('.transit-list');
    list.replaceChildren();
    if (!matching.length) list.append(emptyState('Try another example line, timing or search.', resetTransit));
    for (const notice of matching) {
      const card = element('article', `notice-card tone-${notice.tone}`);
      const top = noticeBadges(notice);
      top.append(element('span', 'timing', notice.timing === 'now' ? 'In progress · demo' : 'Upcoming · demo'));
      const button = element('button', 'details-button', 'Scope & details →');
      button.type = 'button';
      button.dataset.noticeId = notice.id;
      button.addEventListener('click', () => openNotice(notice, button));
      card.append(top, element('span', 'impact', notice.effect), element('h3', '', notice.title), element('p', 'place', notice.place),
        element('p', 'summary', notice.summary), element('p', 'next-step', notice.action), element('p', 'provenance', 'Illustrative scenario · not a live operator report'), button);
      list.append(card);
    }
  }

  function renderRoads() {
    const list = panel.querySelector('.road-list');
    list.replaceChildren();
    const sourceFeatures = roads?.collection?.features;
    if (!sourceFeatures?.length) {
      panel.querySelector('.road-count').textContent = 'Source unavailable—not zero restrictions';
      list.append(element('p', 'data-warning', 'No packaged municipal highlights could be loaded. Coverage cannot be determined.'));
      return;
    }
    const query = state.roadQuery.toLocaleLowerCase('de-DE').trim();
    const matching = sourceFeatures.filter(feature => (state.parking || feature.properties.art !== 'Vorübergehendes Haltverbot') &&
      (!query || Object.values(feature.properties).filter(Boolean).join(' ').toLocaleLowerCase('de-DE').includes(query)));
    panel.querySelector('.road-count').textContent = `${matching.length} selected source record${matching.length === 1 ? '' : 's'}`;
    if (!matching.length) list.append(emptyState('This panel contains only a selected subset, not every reported restriction.', () => {
      state.roadQuery = ''; state.parking = false;
      panel.querySelector('.road-search').value = ''; panel.querySelector('.parking-toggle').checked = false; render();
    }));
    for (const feature of matching) {
      const properties = feature.properties;
      const card = element('article', 'notice-card real-record');
      const button = element('button', 'details-button', 'Source & details →');
      button.type = 'button';
      button.dataset.sourceId = feature.id;
      button.addEventListener('click', () => openRoad(feature, button));
      card.append(element('span', 'source-badge', `SAVED SOURCE · ${roads.snapshotDay}`), element('h3', '', properties.strasse_hausnr),
        element('p', 'place', `${properties.art} · affected: ${properties.betroffene_bereiche || 'not supplied'}`),
        element('p', 'summary', `Reported restriction: ${properties.beeintraechtigung || 'detail not supplied'}`),
        element('p', 'fine-print', `${properties.beginn_datum_kombiniert || '?'} → ${properties.ende_datum_kombiniert || '?'} · source schedule, not verified current status`), button);
      list.append(card);
    }
  }

  function render() {
    if (state.selected) closeDetail(false);
    for (const [name, section] of Object.entries(browse)) section.hidden = state.view !== name;
    for (const button of panel.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === state.view));
    const banner = panel.querySelector('.trust-banner');
    const labels = {
      transit: ['TRANSIT EXAMPLES · NOT LIVE', 'Real Munich line names. Illustrative disruptions, not operator alerts.'],
      roads: ['OFFICIAL SOURCE · SAVED SNAPSHOT', roads ? `Selected records retrieved ${roads.fetchedAt}. No automatic refresh.` : 'Municipal snapshot unavailable.'],
      about: ['AWARENESS FIRST · HONEST ABOUT COVERAGE', 'Understand what might affect your journey—not a promise of complete or live coverage.'],
    };
    banner.replaceChildren(element('strong', '', labels[state.view][0]), element('span', '', labels[state.view][1]));
    renderTransit();
    renderRoads();
  }

  for (const [mode, label] of [['all', 'All'], ...Object.entries(transit.modes).map(([mode, value]) => [mode, value.label])]) {
    const button = element('button', 'mode-chip', label);
    button.type = 'button';
    button.dataset.mode = mode;
    button.setAttribute('aria-pressed', String(mode === 'all'));
    button.addEventListener('click', () => { state.mode = mode; state.line = 'all'; populateLines(); render(); });
    modeButtons.set(mode, button);
    panel.querySelector('.mode-chips').append(button);
  }
  populateLines();
  for (const button of panel.querySelectorAll('[data-view]')) button.addEventListener('click', () => { state.view = button.dataset.view; render(); scroller.scrollTop = 0; });
  lineSelect.addEventListener('change', () => { state.line = lineSelect.value; render(); });
  panel.querySelector('.timing-filter').addEventListener('change', event => { state.timing = event.target.value; render(); });
  panel.querySelector('.transit-search').addEventListener('input', event => { state.query = event.target.value; render(); });
  panel.querySelector('.access-toggle').addEventListener('change', event => { state.access = event.target.checked; render(); });
  panel.querySelector('.reset-transit').addEventListener('click', resetTransit);
  panel.querySelector('.road-search').addEventListener('input', event => { state.roadQuery = event.target.value; render(); });
  panel.querySelector('.parking-toggle').addEventListener('change', event => { state.parking = event.target.checked; render(); });
  panel.querySelector('.map-option').append(link('Open the disruption explorer ↗', mapUrl, true), element('p', 'fine-print', 'Our geographic explorer has approximate demo transit station markers and saved municipal footprints. This compact panel does not draw overlays on Google Maps. Neither view provides live transit alerts.'));

  const about = browse.about;
  about.innerHTML = `<div class="section-intro"><h2>Your journey, with context.</h2><p>Help people notice disruptions, understand affected services and avoid surprises—alongside Google Maps, not another navigation app.</p></div>
    <article class="about-card"><h3>What works in this prototype</h3><p>Line and station filters, in-panel impacts and next steps, step-free access examples, upcoming scenarios and selected real municipal records. The separate roadworks map has source-anchored geometry and KML export.</p></article>
    <article class="about-card"><h3>What is not connected yet</h3><p>No live U-Bahn, S-Bahn, tram or bus feed. No live news/weather, automatic route matching, saved journeys, notifications, rerouting or travel-history access. Transit events and delay minutes are explicitly fictional.</p></article>
    <article class="about-card"><h3>What comes next</h3><p>Authorized operator alerts first: affected lines/stops, departures, validity, corrections and freshness. Then reviewed advance-event notices and opt-in saved-line/journey alerts. A strike call or a public event alone is not a confirmed blockage.</p></article>
    <article class="about-card historical"><h3>Evidence for advance warnings</h3><p>Historical example—not a current warning: MVG published a notice on 30 January 2026 about the 2 February strike, distinguishing affected services from unaffected S-Bahn and regional services.</p></article>
    <article class="about-card"><h3>Private by default</h3><p>This panel makes no data requests and stores no preferences or travel history. You choose a line manually. External operator/Maps links open only when clicked; the optional roadworks map loads online street tiles when enabled.</p></article>
    <label class="motion-setting"><input type="checkbox" class="motion-toggle" checked> Small welcome animation</label><p class="fine-print">System reduced-motion preferences always take priority.</p>`;
  about.querySelector('.historical').append(link('Read the historical MVG notice ↗', 'https://www.mvg.de/presse/pressemeldungen/2026-01-30-mvg-wird-bestreikt.html'));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = about.querySelector('.motion-toggle');
  function updateMotion() { host.dataset.motion = motion.checked && !reducedMotion.matches ? 'on' : 'off'; }
  motion.addEventListener('change', updateMotion);
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
  panel.querySelector('.minimize').addEventListener('click', () => { expanded(false); restore.focus(); });
  restore.addEventListener('click', () => { expanded(true); panel.querySelector('.minimize').focus(); });
  root.addEventListener('pointerdown', event => event.stopPropagation());
  root.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
  root.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key !== 'Escape') return;
    if (state.selected) closeDetail();
    else { expanded(false); restore.focus(); }
  });
  if (document.documentElement.hasAttribute('data-transport-gaps-preview')) {
    document.querySelector('[data-try-u3]')?.addEventListener('click', () => {
      resetTransit(); state.view = 'transit'; state.mode = 'ubahn'; state.line = 'U3'; populateLines(); expanded(true); render(); scroller.scrollTop = 0; lineSelect.focus();
    });
  }
  render();
})();
