(() => {
  const hostId = 'transport-gaps-demo';
  if (document.getElementById(hostId)) return;

  const { incidents, categories, modes } = globalThis.TransportGapsDemoData;
  const state = { query: '', category: 'all', mode: 'all', status: 'all', scope: 'all', transport: true, weather: false, selected: null };
  const icons = {
    barrier: '<path d="M4 10h16v6H4zM7 16v4m10-4v4M8 10l4 6m2-6 4 6M4 5h16"/>',
    flag: '<path d="M6 21V4m0 1c4-4 8 4 13 0v10c-5 4-9-4-13 0"/>',
    tool: '<path d="M15 4a6 6 0 0 0-7 8l-5 5a2 2 0 0 0 4 4l5-5a6 6 0 0 0 8-7l-4 4-4-4z"/>',
    car: '<path d="m5 10 2-5h10l2 5M4 10h16v8H4zM6 18v2m12-2v2M7 14h1m8 0h1"/>',
    rain: '<path d="M6 14a4 4 0 1 1 1-8 6 6 0 0 1 11 1 4 4 0 0 1 0 8M7 18l-1 3m7-3-1 3m7-3-1 3"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    bus: '<rect x="5" y="3" width="14" height="16" rx="4"/><path d="M5 11h14M8 19v2m8-2v2M8 15h1m6 0h1M9 6h6"/>',
    minus: '<path d="M5 12h14"/>',
    arrow: '<path d="m10 6-6 6 6 6M4 12h16"/>',
    leaf: '<path d="M19 4C7 2 2 9 6 16c6 5 14 0 13-12ZM5 21 15 9"/>',
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(name) {
    const node = element('span', 'icon');
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.bus}</svg>`;
    return node;
  }

  function categoryStyle(node, type) {
    node.style.setProperty('--category', categories[type].color);
    node.style.setProperty('--tint', categories[type].tint);
  }

  const host = element('div');
  host.id = hostId;
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:block;';
  const root = host.attachShadow({ mode: 'open' });
  const style = element('style');
  style.textContent = globalThis.TransportGapsDemoStyles;
  root.append(style);
  const svgNamespace = 'http://www.w3.org/2000/svg';
  function svgElement(tag, attributes) {
    const node = document.createElementNS(svgNamespace, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }
  const overlay = svgElement('svg', { viewBox: '0 0 1000 700', preserveAspectRatio: 'xMidYMin meet', 'aria-label': 'Fictional transport and weather plots. Screen positions, not real locations.' });
  overlay.classList.add('plots');
  const plots = new Map();
  for (const incident of incidents) {
    const group = svgElement('g', { role: 'button', tabindex: '0', 'aria-pressed': 'false', 'aria-label': `Sample ${incident.number}: ${incident.title}. ${incident.impact}.`, 'data-type': incident.type });
    group.classList.add('plot');
    categoryStyle(group, incident.type);
    const polygon = svgElement('polygon', { points: incident.points });
    const marker = svgElement('rect', { x: incident.marker.x - 17, y: incident.marker.y - 16, width: 34, height: 32, rx: 10 });
    const text = svgElement('text', { x: incident.marker.x, y: incident.marker.y });
    text.textContent = incident.number;
    group.append(polygon, marker, text);
    group.addEventListener('pointerdown', (event) => event.stopPropagation());
    group.addEventListener('click', (event) => { event.stopPropagation(); openIncident(incident, group); });
    group.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      openIncident(incident, group);
    });
    plots.set(incident.id, group);
    overlay.append(group);
  }

  const panel = element('section', 'panel');
  panel.id = 'tg-panel';
  panel.setAttribute('aria-label', 'Transport Gaps awareness demo');
  panel.innerHTML = `
    <header class="hero">
      <div class="brand-row"><span class="brand">TRANSPORT GAPS</span><div class="header-controls"><span class="badge">SAMPLE CITY</span><button type="button" class="icon-button minimize" aria-label="Minimize transport panel" aria-expanded="true" aria-controls="tg-panel"></button></div></div>
      <div class="hero-title"><div><h1>Little heads-up.<br>Smoother journeys.</h1><p>Your friendly transport information layer.</p></div>
        <svg class="mascot" viewBox="0 0 90 80" aria-hidden="true">
          <path class="mascot-star" d="m74 4 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#e3ab41"/>
          <ellipse cx="42" cy="74" rx="29" ry="4" fill="#d4dec0"/>
          <g class="mascot-body" stroke="#253731" stroke-width="2" stroke-linejoin="round">
            <rect x="15" y="14" width="56" height="54" rx="15" fill="#f7cbdc"/>
            <rect x="23" y="24" width="40" height="23" rx="8" fill="#fffdf7"/>
            <path d="M43 25v21" fill="none"/>
            <circle cx="33" cy="37" r="2" fill="#253731"/><circle cx="53" cy="37" r="2" fill="#253731"/>
            <path d="M37 54q6 7 12 0" fill="none" stroke-linecap="round"/>
            <rect x="23" y="65" width="9" height="8" rx="3" fill="#253731"/><rect x="54" y="65" width="9" height="8" rx="3" fill="#253731"/>
            <path d="M28 19h29" stroke-linecap="round"/><path d="M11 36H7v10h5m62-10h5v10h-4" fill="#f7cbdc"/>
          </g>
          <circle cx="25" cy="53" r="3" fill="#eb8fb3"/><circle cx="61" cy="53" r="3" fill="#eb8fb3"/>
        </svg>
      </div>
    </header>
    <div class="demo-banner"><strong>FICTIONAL DEMO · NOT LIVE</strong><br>Plots stay on screen, not real locations. Not travel advice.</div>
    <div class="scroller">
      <div class="browse">
        <label class="search"><span class="search-icon"></span><input type="search" aria-label="Search sample transport updates" placeholder="Find a place, service or disruption…" maxlength="120"></label>
        <div class="filter-row"><select class="mode-filter" aria-label="Travel mode"></select><select class="status-filter" aria-label="Sample timing"><option value="all">Now + upcoming</option><option value="now">Now (sample)</option><option value="upcoming">Upcoming (sample)</option></select></div>
        <div class="scope" aria-label="Information focus"><button type="button" data-scope="all" aria-pressed="true">All updates</button><button type="button" data-scope="avoid" aria-pressed="false">Avoid & plan ahead</button></div>
        <div class="chips" aria-label="Category filter and colour legend"></div>
        <div class="results-heading"><h2 class="result-count" role="status" aria-live="polite" aria-atomic="true"></h2><span class="results-note">Impact first · demo data</span></div>
        <div class="incident-list" aria-label="Fictional transport updates"></div>
        <div class="empty" hidden></div>
      </div>
      <div class="details" hidden></div>
    </div>
    <footer class="footer">
      <div class="layer-toggles"><label><input type="checkbox" class="transport-toggle" checked>Transport layer</label><label><input type="checkbox" class="weather-toggle">Rain sample</label></div>
      <details class="settings"><summary>Display settings</summary><div class="settings-body"><div class="range-row"><label for="tg-opacity">Plot opacity</label><input id="tg-opacity" type="range" min="10" max="55" value="25"><output for="tg-opacity">25%</output></div><label class="motion-row"><input type="checkbox" class="motion-toggle" checked>Small animations <span class="motion-hint"></span></label></div></details>
    </footer>
  `;
  const restore = element('button', 'restore');
  restore.type = 'button';
  restore.setAttribute('aria-controls', 'tg-panel');
  restore.setAttribute('aria-expanded', 'false');
  restore.append(icon('bus'), element('span', '', 'Transport Gaps'), element('small', '', 'DEMO'));
  restore.hidden = true;
  const browse = panel.querySelector('.browse');
  const details = panel.querySelector('.details');
  const scroller = panel.querySelector('.scroller');
  const list = panel.querySelector('.incident-list');
  const empty = panel.querySelector('.empty');
  const search = panel.querySelector('input[type="search"]');
  const categoryButtons = new Map();
  let returnFocus = null;
  let browseScroll = 0;
  panel.querySelector('.minimize').append(icon('minus'));
  panel.querySelector('.search-icon').append(icon('search'));
  for (const [value, label] of Object.entries(modes)) {
    const option = element('option', '', label);
    option.value = value;
    panel.querySelector('.mode-filter').append(option);
  }
  for (const [value, category] of [['all', { label: 'Everything', icon: 'leaf' }], ...Object.entries(categories)]) {
    const button = element('button', 'chip');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(value === 'all'));
    button.dataset.category = value;
    if (value !== 'all') categoryStyle(button, value);
    button.append(icon(category.icon), element('span', '', category.label));
    button.addEventListener('click', () => { state.category = value; render(); });
    panel.querySelector('.chips').append(button);
    categoryButtons.set(value, button);
  }

  function matchingIncidents() {
    const query = state.query.toLocaleLowerCase().trim();
    const priorities = { avoid: 0, check: 1, info: 2 };
    return incidents.filter((incident) => {
      if (incident.type === 'weather' ? !state.weather : !state.transport) return false;
      if (state.category !== 'all' && incident.type !== state.category) return false;
      if (state.mode !== 'all' && !incident.modes.includes(state.mode)) return false;
      if (state.status !== 'all' && incident.status !== state.status) return false;
      if (state.scope === 'avoid' && incident.priority === 'info') return false;
      return [incident.title, incident.place, incident.affected, incident.impact, incident.description, incident.type, categories[incident.type].label].join(' ').toLocaleLowerCase().includes(query);
    }).sort((first, second) => priorities[first.priority] - priorities[second.priority] || Number(first.status === 'upcoming') - Number(second.status === 'upcoming'));
  }

  function setExpanded(expanded) {
    panel.hidden = !expanded;
    restore.hidden = expanded;
    restore.setAttribute('aria-expanded', String(expanded));
    panel.querySelector('.minimize').setAttribute('aria-expanded', String(expanded));
  }

  function closeIncident(focusPrevious = true) {
    const previousId = state.selected;
    state.selected = null;
    details.hidden = true;
    browse.hidden = false;
    for (const plot of plots.values()) {
      plot.setAttribute('aria-pressed', 'false');
      plot.dataset.selected = 'false';
    }
    scroller.scrollTop = browseScroll;
    const focusTarget = returnFocus?.isConnected ? returnFocus : list.querySelector(`[data-incident="${previousId}"]`);
    if (focusPrevious && focusTarget) focusTarget.focus({ preventScroll: true });
  }

  function openIncident(incident, source) {
    if (!state.selected) browseScroll = scroller.scrollTop;
    returnFocus = source;
    state.selected = incident.id;
    setExpanded(true);
    browse.hidden = true;
    details.hidden = false;
    categoryStyle(details, incident.type);
    details.replaceChildren();
    const back = element('button', 'back');
    back.type = 'button';
    back.append(icon('arrow'), element('span', '', 'Back to updates'));
    back.addEventListener('click', () => closeIncident());
    const top = element('div', 'detail-top');
    const picture = element('span', 'incident-icon');
    picture.append(icon(categories[incident.type].icon), element('small', '', incident.number));
    const titleBlock = element('div');
    const heading = element('h2', '', incident.title);
    heading.tabIndex = -1;
    titleBlock.append(element('div', 'detail-category', `${categories[incident.type].label} · sample ${incident.number}`), heading);
    top.append(picture, titleBlock);
    const facts = element('dl', 'facts');
    for (const [label, value] of [
      ['Affected', incident.affected],
      ['Ways to travel', incident.modes.map(mode => modes[mode]).join(' · ')],
      ['Timing', incident.timing],
      ['Source & freshness', 'Local fictional fixture · no live source or update time'],
    ]) {
      const fact = element('div', 'fact');
      fact.append(element('dt', '', label), element('dd', '', value));
      facts.append(fact);
    }
    const note = element('div', 'travel-note');
    note.append(element('strong', '', 'A helpful nudge'), element('p', '', incident.note));
    details.append(back, top, element('p', 'detail-place', incident.place), element('span', 'impact', incident.impact), element('p', 'detail-description', incident.description), facts, note, element('p', 'provenance', 'Not verified · screen-positioned illustration · no routing or location awareness.'));
    for (const [id, plot] of plots) {
      plot.dataset.selected = String(id === incident.id);
      plot.setAttribute('aria-pressed', String(id === incident.id));
    }
    scroller.scrollTop = 0;
    heading.focus({ preventScroll: true });
  }

  function resetFilters() {
    Object.assign(state, { query: '', category: 'all', mode: 'all', status: 'all', scope: 'all' });
    search.value = '';
    panel.querySelector('.mode-filter').value = 'all';
    panel.querySelector('.status-filter').value = 'all';
  }

  function render() {
    const visible = matchingIncidents();
    const visibleIds = new Set(visible.map(incident => incident.id));
    for (const [id, plot] of plots) plot.toggleAttribute('hidden', !visibleIds.has(id));
    if (state.selected && !visibleIds.has(state.selected)) closeIncident(false);
    for (const [value, button] of categoryButtons) button.setAttribute('aria-pressed', String(state.category === value));
    for (const button of panel.querySelectorAll('[data-scope]')) button.setAttribute('aria-pressed', String(state.scope === button.dataset.scope));
    panel.querySelector('.result-count').textContent = `${visible.length} sample update${visible.length === 1 ? '' : 's'}`;
    list.replaceChildren();
    for (const incident of visible) {
      const button = element('button', 'incident');
      button.type = 'button';
      button.dataset.incident = incident.id;
      categoryStyle(button, incident.type);
      const picture = element('span', 'incident-icon');
      picture.append(icon(categories[incident.type].icon), element('small', '', incident.number));
      const copy = element('span', 'incident-copy');
      const metadata = element('span', 'incident-meta');
      metadata.append(element('span', 'impact', incident.impact), element('span', 'status', incident.status === 'now' ? 'Now · sample' : 'Upcoming · sample'));
      copy.append(element('span', 'incident-name', incident.title), element('span', 'incident-place', incident.place), metadata);
      const chevron = element('span', 'chevron', '›');
      chevron.setAttribute('aria-hidden', 'true');
      button.append(picture, copy, chevron);
      button.addEventListener('click', () => openIncident(incident, button));
      list.append(button);
    }
    empty.hidden = visible.length !== 0;
    if (!visible.length) {
      const layersOff = !state.transport && !state.weather;
      const rainOff = state.category === 'weather' && !state.weather;
      const title = layersOff ? 'The layers are taking a nap.' : rainOff ? 'The rain sample is switched off.' : 'No samples match just yet.';
      const message = layersOff || rainOff ? 'Switch on a sample layer to explore fictional updates.' : 'Try another category or travel mode. No matches here does not mean an area is clear.';
      const action = element('button', 'text-button', layersOff ? 'Enable transport samples' : rainOff ? 'Enable rain sample' : 'Reset filters');
      action.type = 'button';
      action.addEventListener('click', () => {
        if (layersOff) {
          resetFilters();
          state.transport = true;
          panel.querySelector('.transport-toggle').checked = true;
        } else if (rainOff) {
          state.weather = true;
          panel.querySelector('.weather-toggle').checked = true;
        } else resetFilters();
        render();
        search.focus();
      });
      empty.replaceChildren(icon('leaf'), element('h3', '', title), element('p', '', message), action);
    }
  }

  search.addEventListener('input', () => { state.query = search.value; render(); });
  panel.querySelector('.mode-filter').addEventListener('change', (event) => { state.mode = event.target.value; render(); });
  panel.querySelector('.status-filter').addEventListener('change', (event) => { state.status = event.target.value; render(); });
  for (const button of panel.querySelectorAll('[data-scope]')) button.addEventListener('click', () => { state.scope = button.dataset.scope; render(); });
  for (const [selector, key] of [['.transport-toggle', 'transport'], ['.weather-toggle', 'weather']]) {
    panel.querySelector(selector).addEventListener('change', (event) => { state[key] = event.target.checked; render(); });
  }
  panel.querySelector('#tg-opacity').addEventListener('input', (event) => {
    overlay.style.setProperty('--area-opacity', Number(event.target.value) / 100);
    panel.querySelector('output').textContent = `${event.target.value}%`;
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = panel.querySelector('.motion-toggle');
  function updateMotion() {
    host.dataset.motion = !motionToggle.checked || reducedMotion.matches ? 'off' : 'on';
    panel.querySelector('.motion-hint').textContent = reducedMotion.matches ? '(system reduced motion)' : '';
  }
  motionToggle.addEventListener('change', updateMotion);
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
  panel.querySelector('.minimize').addEventListener('click', () => { setExpanded(false); restore.focus(); });
  restore.addEventListener('click', () => { setExpanded(true); panel.querySelector('.minimize').focus(); });
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.stopPropagation();
    if (state.selected) closeIncident();
    else { setExpanded(false); restore.focus(); }
  });
  root.append(overlay, panel, restore);
  document.documentElement.append(host);
  render();
})();
