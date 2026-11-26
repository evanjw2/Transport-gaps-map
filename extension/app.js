// Transport Gaps · Munich morning briefing (works as a website, from file://, and as a Chrome extension page).
(() => {
  'use strict';
  const PUBLIC_URL = 'https://evanjw2.github.io/Transport-gaps-map/';
  const TZ = 'Europe/Berlin';
  const data = globalThis.TransportGapsToday;
  const Weather = globalThis.TransportGapsWeather;
  const Network = globalThis.TransportGapsNetwork;
  const LINES = globalThis.TransportGapsLines;
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAY = 864e5;

  // ---------- tiny DOM helper (textContent only, no HTML injection) ----------
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
      else if (key === 'style') for (const [prop, val] of Object.entries(value)) el.style.setProperty(prop, val);
      else el.setAttribute(key, value === true ? '' : value);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
    return el;
  }
  const safeUrl = url => (typeof url === 'string' && /^https:\/\//.test(url) ? url : null);
  const ext = (text, url, className = 'btn') => safeUrl(url) && h('a', { class: className, href: url, target: '_blank', rel: 'noopener noreferrer' }, text);
  const gmapsUrl = loc => `https://www.google.com/maps/search/?api=1&query=${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
  const walkUrl = loc => `https://www.google.com/maps/dir/?api=1&destination=${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}&travelmode=walking`;

  if (!data?.items) {
    $('freshness').textContent = 'No data';
    $('app').replaceChildren(h('div', { class: 'no-data' },
      h('h2', { text: 'No briefing yet' }),
      h('p', {}, 'Run ', h('code', { text: 'npm run morning' }), ' in the project folder (or wait for the 06:15 GitHub Action), then reload this page.')));
    return;
  }

  // ---------- vocabulary ----------
  const CAUSES = data.causes;
  const LEVELS = [
    { emoji: '🟢', label: 'Smooth so far', sentence: 'Nothing major spotted for Munich right now.' },
    { emoji: '🟢', label: 'Mostly smooth', sentence: 'A few things to know, nothing major.' },
    { emoji: '🟠', label: 'Allow extra time', sentence: 'Some disruption and slower conditions: leave a little earlier.' },
    { emoji: '🔴', label: 'Expect disruption', sentence: 'Significant disruption today: check your trip before leaving.' },
  ];
  const STATUS = { live: 'Live', official: 'Official', announced: 'Announced', expected: 'Expected', lead: 'News lead', demo: 'Example' };
  const GROUPS = [
    { id: 'all', icon: '✨', label: 'All' },
    { id: 'disruptions', icon: '🚨', label: 'Disruptions' },
    { id: 'strikes', icon: '✊', label: 'Strikes & protests' },
    { id: 'events', icon: '🎟️', label: 'Events' },
    { id: 'works', icon: '🚧', label: 'Works' },
    { id: 'weather', icon: '❄️', label: 'Weather' },
    { id: 'news', icon: '📰', label: 'News' },
  ];
  const LINE_COLORS = {
    U1: '#3c7233', U2: '#c4022e', U3: '#ed6720', U4: '#00ab85', U5: '#bc7a00', U6: '#0065ae', U7: '#3c7233', U8: '#c4022e',
    S1: '#16bae7', S2: '#76b82a', S3: '#951b81', S4: '#e30613', S6: '#00975f', S7: '#943126', S8: '#1a1a1a', S20: '#ea516d',
  };
  const MODE_COLORS = { tram: '#d82020', bus: '#00586a', regionalbus: '#00586a', train: '#555', ubahn: '#0065ae', sbahn: '#408335' };
  const lineChip = line => h('span', { class: 'line', style: { '--lc': LINE_COLORS[line.label] || MODE_COLORS[line.mode] || '#555', '--lt': line.label === 'S8' ? '#ffcc00' : '#fff' }, text: line.label });

  // ---------- time ----------
  const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const fmtDay = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
  const fmtLong = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
  const dayKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const asDate = value => (value ? new Date(value) : null);

  const untilLabel = date => (dayKey(date) === dayKey(new Date()) ? fmtTime.format(date) : `${fmtDay.format(date)} ${fmtTime.format(date)}`);

  function isOngoing(item) {
    if (item.cause !== 'works' || item.status === 'live') return false;
    const start = asDate(item.start); const end = asDate(item.end);
    return Boolean((start && Date.now() - start > 7 * DAY) || (start && end && end - start > 14 * DAY));
  }
  function whenOf(item, now = new Date()) {
    const start = asDate(item.start); const end = asDate(item.end);
    if (end && end <= now) return 'past';
    if (item.cause === 'roadworks') return 'roadworks';
    if (item.status === 'lead') return 'news';
    if (isOngoing(item)) return 'ongoing';
    if (!start || start <= now) return 'now';
    return dayKey(start) === dayKey(now) ? 'today' : 'upcoming';
  }
  function timeLabel(item) {
    const start = asDate(item.start); const end = asDate(item.end); const now = new Date();
    const at = date => (dayKey(date) === dayKey(now) ? fmtTime.format(date) : `${fmtDay.format(date)} ${fmtTime.format(date)}`);
    const series = item.series ? ` · daily until ${fmtDay.format(new Date(`${item.series.to}T12:00:00Z`))}` : '';
    switch (whenOf(item)) {
      case 'now': return (end ? `Now · until ${at(end)}` : 'Now') + series;
      case 'news': return start ? `Published ${at(start)}` : 'News';
      case 'today': return `Today ${fmtTime.format(start)}${end ? `–${fmtTime.format(end)}` : ''}${series}`;
      case 'upcoming': return `${fmtDay.format(start)}, ${fmtTime.format(start)}${series}`;
      case 'ongoing': case 'roadworks': return end ? `Until ${fmtDay.format(end)}` : 'Ongoing';
      default: return '';
    }
  }

  // ---------- items (plus weather cards synthesised from the forecast and DWD warnings) ----------
  const items = data.items.slice();
  for (const alert of data.alerts || []) {
    items.push({ id: alert.id, cause: 'weather', status: 'official', severity: alert.level, title: `DWD warning: ${alert.headline}`, details: alert.description, advice: alert.instruction, place: 'Munich', lines: [], start: alert.start, end: alert.end, location: null, points: [], source: alert.source });
  }
  const byId = new Map(items.map(item => [item.id, item]));

  // ---------- state ----------
  const state = { filter: 'all', query: '', examples: true, ongoing: false, selected: null, expanded: new Set(), roadsShown: 6, line: null };
  let network = data.network || null;
  let networkLive = false;

  function visible(item) {
    if (whenOf(item) === 'past') return false;
    if (!state.examples && item.status === 'demo') return false;
    return true;
  }
  function matches(item) {
    if (state.filter !== 'all' && CAUSES[item.cause].group !== state.filter) return false;
    if (state.line && !(item.lines || []).some(l => l.label === state.line)) return false;
    if (!state.query) return true;
    const haystack = [item.title, item.original, item.place, item.details, CAUSES[item.cause].label, ...(item.lines || []).map(l => l.label)].join(' ').toLocaleLowerCase('de-DE');
    return state.query.split(/\s+/).every(word => haystack.includes(word));
  }

  // ---------- header + hero ----------
  function renderFreshness() {
    const generated = new Date(data.generatedAt);
    const hours = (Date.now() - generated) / 36e5;
    const el = $('freshness');
    el.title = `Briefing generated ${generated.toLocaleString('en-GB', { timeZone: TZ })} (Munich time)`;
    if (dayKey(generated) === dayKey(new Date())) { el.className = 'fresh ok'; el.textContent = `Updated ${fmtTime.format(generated)}`; }
    else if (hours < 48) { el.className = 'fresh stale'; el.textContent = `From yesterday ${fmtTime.format(generated)}`; }
    else { el.className = 'fresh old'; el.textContent = `Outdated · ${fmtDay.format(generated)}`; }
  }

  // Heads-ups from the live line board (computed in the browser, so they follow the live data)
  function networkHeadsUps() {
    if (!network?.lines) return [];
    const bad = network.lines.filter(l => (l.status === 'delayed' || l.status === 'disrupted') && !l.incident);
    const ups = [];
    const sbahn = bad.filter(l => l.mode === 'sbahn' && l.avg != null);
    if (sbahn.length >= 3) {
      const avg = Math.round(sbahn.reduce((sum, l) => sum + l.avg, 0) / sbahn.length);
      ups.push({ id: 'hu-net-sbahn', level: 2, icon: '🚆', title: `S-Bahn running late: ~${avg} min on average`, why: [sbahn.map(l => `${l.label} +${Math.round(l.avg)}′`).join(' · '), 'Measured at MVG departure boards across the city'], where: 'S-Bahn', location: null, related: [], live: true, lines: sbahn.map(l => l.label) });
    }
    for (const l of bad.filter(l => l.status === 'disrupted' && l.mode !== 'bus' && !(l.mode === 'sbahn' && sbahn.length >= 3)).slice(0, 3)) {
      ups.push({ id: `hu-net-${l.label}`, level: 2, icon: '⏱️', title: l.cancelled >= 2 ? `${l.label}: ${l.cancelled} cancelled departures right now` : `${l.label}: running ~${Math.round(l.avg || l.max)} min late`, why: [`Seen at ${l.hubs.slice(0, 3).join(', ')}`, 'No MVG notice yet: measured from live departures'], where: l.label, location: null, related: [], live: true, lines: [l.label] });
    }
    return ups;
  }
  function currentHeadsUps() {
    const fromData = (data.headsUps || []).filter(up => state.examples || !up.includesExamples);
    const today = fromData.filter(up => !up.upcoming);
    return [...today, ...networkHeadsUps(), ...fromData.filter(up => up.upcoming)];
  }

  function renderHero() {
    $('hero-date').textContent = `${fmtLong.format(new Date())} · Munich`;
    const ups = currentHeadsUps().filter(up => !up.upcoming);
    const level = Math.max(0, ...ups.map(up => up.level));
    const info = LEVELS[level];
    $('status-card').dataset.level = level;
    $('status-emoji').textContent = info.emoji;
    $('status-title').textContent = info.label;
    $('status-sentence').textContent = ups.length ? `${info.sentence} ${ups.length} heads-up${ups.length > 1 ? 's' : ''} for today below.` : info.sentence;

    const wx = data.weather?.city;
    const strip = $('weather-strip');
    if (wx) {
      const centre = data.weather.districts[0];
      const today = wx.today || {};
      const bits = [];
      if (Number.isFinite(today.min)) bits.push(`Today ${Math.round(today.min)}…${Math.round(today.max)}°`);
      if (today.snowfall > 0.2) bits.push(`❄️ ~${Math.round(today.snowfall * 10) / 10} cm snow`);
      else if (today.precipitation > 0.2) bits.push(`🌧️ ${Math.round(today.precipitation)} mm rain`);
      if (Number.isFinite(today.chance)) bits.push(`${today.chance}% chance`);
      strip.replaceChildren(
        h('span', { class: 'big', 'aria-hidden': 'true', text: centre.icon }),
        h('div', {}, h('strong', { text: `${Math.round(centre.temperature * 10) / 10}°C · ${centre.label}` }), h('div', { text: bits.join(' · ') }), wx.level >= 1 ? h('div', { text: wx.advice }) : null),
        h('span', { class: `tag ${liveWeatherAt ? 'live' : 'official'}`, text: liveWeatherAt ? `Live ${fmtTime.format(liveWeatherAt)}` : `At ${fmtTime.format(new Date(data.generatedAt))}` }));
      strip.hidden = false;
    }
    $('alerts').replaceChildren(...(data.alerts || []).map(alert => h('div', { class: 'alert-line' }, `⚠️ DWD: ${alert.headline}${alert.end ? ` · until ${untilLabel(new Date(alert.end))}` : ''}`)));

    const counts = {};
    for (const item of items) if (visible(item) && whenOf(item) !== 'ongoing') counts[CAUSES[item.cause].group] = (counts[CAUSES[item.cause].group] || 0) + 1;
    $('stats').replaceChildren(...GROUPS.filter(g => g.id !== 'all' && counts[g.id]).map(g => h('button', {
      class: 'stat', type: 'button', title: `Show ${g.label.toLowerCase()}`,
      onclick: () => { setFilter(g.id); $('search').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); },
    }, g.icon, h('b', { text: counts[g.id] }), g.label)));

    const demos = items.filter(item => item.status === 'demo' && whenOf(item) !== 'past').length;
    $('examples-note').hidden = !demos;
    $('examples-note').textContent = state.examples
      ? `Includes ${demos} made-up example scenarios (marked “Example”) to show how protests, strikes and lift faults would look. Everything else is real data.`
      : 'Example scenarios hidden: showing real data only.';
  }

  // ---------- heads-ups ----------
  function renderHeadsUps() {
    const ups = currentHeadsUps();
    const ahead = ups.filter(up => up.upcoming).length;
    $('headsup-count').textContent = ups.length ? `${ups.length - ahead} today${ahead ? ` · ${ahead} plan-ahead` : ''}` : '';
    if (!ups.length) { $('headsups').replaceChildren(h('p', { class: 'empty', text: 'No heads-ups. Nothing is stacking up right now.' })); return; }
    $('headsups').replaceChildren(...ups.map(up => h('article', { class: 'headsup', 'data-level': up.level },
      h('span', { class: 'hu-icon', 'aria-hidden': 'true', text: up.icon }),
      h('div', {},
        h('div', { class: 'hu-meta' }, up.live ? h('span', { class: 'tag live', text: 'Live' }) : null, up.upcoming ? h('span', { class: 'tag announced', text: 'Plan ahead' }) : h('span', { class: `tag impact-${up.level}`, text: up.level >= 3 ? 'Big impact' : up.level === 2 ? 'Allow extra time' : 'Good to know' }),
          up.includesExamples ? h('span', { class: 'tag demo', text: 'Includes example' }) : null, up.where && up.where !== up.title ? h('span', { text: up.where }) : null),
        h('h3', { text: up.title }),
        h('ul', {}, ...(up.why || []).map(line => h('li', { text: line })))),
      h('div', { class: 'hu-actions' },
        up.location ? h('button', { class: 'btn', type: 'button', onclick: () => showHeadsUp(up) }, '📍 Show on map') : null,
        up.location ? ext('Open in Google Maps ↗', gmapsUrl(up.location), 'btn gmaps') : null,
        up.related?.length ? h('button', { class: 'btn', type: 'button', onclick: () => openItem(up.related[0], true) }, 'Details') : null,
        up.lines?.length ? h('button', { class: 'btn', type: 'button', onclick: () => selectLine(up.lines[0], true) }, `See ${up.lines[0]} live`) : null))));
  }

  // ---------- filters + list ----------
  function setFilter(id) {
    state.filter = id;
    renderFilters();
    renderList();
    renderPins();
  }
  function renderFilters() {
    const counts = { all: 0 };
    for (const item of items) {
      if (!visible(item) || (!state.ongoing && whenOf(item) === 'ongoing')) continue;
      counts.all++;
      const group = CAUSES[item.cause].group;
      counts[group] = (counts[group] || 0) + 1;
    }
    $('filters').replaceChildren(...GROUPS.filter(g => g.id === 'all' || counts[g.id]).map(g => h('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(state.filter === g.id), onclick: () => setFilter(g.id),
    }, `${g.icon} ${g.label}`, h('span', { class: 'n', text: counts[g.id] || 0 }))));
  }

  function itemCard(item) {
    const meta = CAUSES[item.cause];
    const open = state.expanded.has(item.id);
    const card = h('article', { class: `item${item.status === 'demo' ? ' is-demo' : ''}${state.selected === item.id ? ' selected' : ''}`, 'data-sev': item.severity, id: `item-${item.id}` });
    const head = h('button', { class: 'item-head', type: 'button', 'aria-expanded': String(open), onclick: () => toggleItem(item.id) },
      h('span', { class: 'item-icon', 'aria-hidden': 'true', text: meta.icon }),
      h('span', {},
        h('span', { class: 'item-title' }, h('span', { text: item.title }), h('span', { class: `tag ${item.status}`, text: STATUS[item.status] || item.status })),
        h('span', { class: 'item-sub' }, ...(item.lines || []).slice(0, 8).map(lineChip), (item.lines || []).length > 8 ? `+${item.lines.length - 8}` : null,
          h('span', { text: [timeLabel(item), item.place && !item.place.endsWith('(line-wide)') ? item.place : null].filter(Boolean).join(' · ') }))));
    card.append(head);
    if (open) {
      const body = h('div', { class: 'item-body' });
      const fromMvg = item.id.startsWith('mvg-');
      if (item.details && !fromMvg) body.append(h('p', { text: item.details }));
      if (fromMvg && item.original) body.append(h('p', { class: 'mvg-headline', text: `“${item.original}”` }));
      if (item.segments?.length) body.append(h('ul', { class: 'segs' }, ...item.segments.map(text => h('li', { text: `🛤️ ${text}` }))));
      const named = (item.stops || []).filter(st => st.role !== 'listed');
      const shownStops = (named.length ? named : item.stops || []).slice(0, 16);
      if (shownStops.length) {
        body.append(h('div', { class: 'stops' },
          h('div', { class: 'mini-title', text: named.some(st => st.role === 'closed') ? 'Stops not served · tap for live departures' : 'Stops affected · tap for live departures' }),
          h('div', { class: 'stop-chips' }, ...shownStops.map(st => h('button', { class: `stop-chip ${st.role}`, type: 'button', title: st.role === 'end' ? 'Line turns back here' : st.role === 'closed' ? 'Not served' : 'Affected stop', onclick: () => focusStop(item, st) }, st.role === 'closed' ? '✕ ' : st.role === 'end' ? '⇥ ' : '', st.name)))));
      }
      if (item.operatorAdvice?.length) body.append(h('div', { class: 'mvg-says' }, h('div', { class: 'mini-title', text: '📢 What MVG says (translated)' }), h('ul', {}, ...item.operatorAdvice.map(text => h('li', { text })))));
      if (item.alternatives?.length || item.tips?.length) {
        body.append(h('div', { class: 'ways' },
          h('div', { class: 'mini-title', text: '🧭 Ways around it' }),
          ...(item.alternatives || []).map(a => h('div', { class: 'way' },
            h('span', { class: 'way-icon', 'aria-hidden': 'true', text: a.type === 'walk' ? '🚶' : '🔁' }),
            h('div', {},
              h('div', { class: 'way-text' }, a.type === 'walk' ? `From ${a.from}, walk ~${a.minutes} min to ` : `At `, h('strong', { text: a.to.name }), a.type === 'walk' ? ':' : ', other lines still stop:'),
              h('div', { class: 'way-lines' }, ...a.lines.map(l => hasPath(l.label) ? h('button', { class: 'line-btn', type: 'button', title: `Show where ${l.label} goes`, onclick: () => selectLine(l.label, true) }, lineChip(l)) : lineChip(l))),
              h('div', { class: 'way-actions' },
                h('button', { class: 'btn small', type: 'button', onclick: () => focusStop(item, { ...a.to, role: 'alt' }) }, '🚉 Live departures'),
                a.type === 'walk' ? ext('Walking route in Google Maps ↗', walkUrl(a.to), 'btn small gmaps') : null)))),
          ...(item.tips || []).map(t => h('div', { class: 'way tip' }, h('span', { class: 'way-icon', 'aria-hidden': 'true', text: '💡' }), h('div', {}, h('strong', { text: 'Local tip: ' }), t.text))),
          h('p', { class: 'original', text: 'Suggestions based on nearby stops and lines, not a route planner. Check the MVG app before switching.' })));
      }
      if (item.advice) body.append(h('p', { class: 'advice', text: `💡 ${item.advice}` }));
      if (fromMvg && item.details) body.append(h('details', { class: 'orig-text' }, h('summary', { text: 'Full MVG notice (German)' }), h('p', { text: item.details })));
      if (!fromMvg && item.original && item.original !== item.title) body.append(h('p', { class: 'original', text: `Original: “${item.original}”` }));
      body.append(h('div', { class: 'item-actions' },
        item.location ? h('button', { class: 'btn', type: 'button', onclick: () => focusItem(item, true) }, '📍 Show on map') : null,
        item.location ? ext('Open in Google Maps ↗', gmapsUrl(item.location), 'btn gmaps') : (item.lines?.length ? ext('Plan around it in Google Maps ↗', 'https://www.google.com/maps/dir/?api=1&travelmode=transit', 'btn gmaps') : null),
        item.source ? ext(`${item.status === 'lead' ? 'Read article' : 'Source'} ↗`, item.source.url) : null));
      if (item.source?.name) body.append(h('p', { class: 'original', style: { 'margin-top': '8px' }, text: `Source: ${item.source.name}${item.location ? ` · map position: ${item.location.precision}` : ''}` }));
      card.append(body);
    }
    return card;
  }

  const GROUP_TITLES = { now: 'Happening now', today: 'Later today', upcoming: 'Coming up (next 7 days)', roadworks: 'Roadworks affecting traffic (near the centre)', news: 'From the news (unconfirmed leads)', ongoing: 'Long-running planned changes' };
  function renderList() {
    const list = $('list');
    const shown = items.filter(item => visible(item) && matches(item) && (state.ongoing || whenOf(item) !== 'ongoing'));
    $('list-count').textContent = `${shown.length} shown`;
    const groups = { now: [], today: [], upcoming: [], roadworks: [], news: [], ongoing: [] };
    for (const item of shown) groups[whenOf(item)]?.push(item);
    const order = (a, b) => b.severity - a.severity || String(a.start).localeCompare(String(b.start));
    groups.upcoming.sort((a, b) => String(a.start).localeCompare(String(b.start)));
    const out = [];
    for (const [key, group] of Object.entries(groups)) {
      if (!group.length) continue;
      if (key !== 'upcoming') group.sort(order);
      out.push(h('h3', { class: 'group-title', text: `${GROUP_TITLES[key]} · ${group.length}` }));
      const limit = key === 'roadworks' && !state.query && state.filter === 'all' ? state.roadsShown : Infinity;
      out.push(h('div', { style: { display: 'grid', gap: '8px' } }, ...group.slice(0, limit).map(itemCard)));
      if (group.length > limit) out.push(h('button', { class: 'more', type: 'button', onclick: () => { state.roadsShown = Infinity; renderList(); } }, `Show ${group.length - limit} more roadworks`));
    }
    if (!state.ongoing) {
      const hidden = items.filter(item => visible(item) && matches(item) && whenOf(item) === 'ongoing').length;
      if (hidden) out.push(h('button', { class: 'more', type: 'button', style: { 'margin-top': '10px' }, onclick: () => { $('show-ongoing').checked = true; state.ongoing = true; renderAll(); } }, `+ ${hidden} long-running planned changes (S-Bahn works, moved stops…)`));
    }
    if (!shown.length) out.push(h('p', { class: 'empty', text: 'Nothing matches. Try another search or filter. No result does not mean all clear.' }));
    list.replaceChildren(...out);
  }

  function toggleItem(id) {
    if (state.expanded.has(id)) state.expanded.delete(id);
    else { state.expanded.add(id); const item = byId.get(id); if (item?.location) focusItem(item, false); }
    renderList();
  }
  function openItem(id, scroll) {
    const item = byId.get(id);
    if (!item) return;
    if (!visible(item)) { state.examples = true; $('show-examples').checked = true; }
    if (whenOf(item) === 'ongoing') { state.ongoing = true; $('show-ongoing').checked = true; }
    state.filter = 'all'; state.query = ''; $('search').value = '';
    state.expanded.add(id);
    state.selected = id;
    renderAll();
    if (item.location) focusItem(item, false);
    if (scroll) $(`item-${id}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  }

  // ---------- map ----------
  const map = L.map('map', { preferCanvas: true, minZoom: 9, maxZoom: 18, zoomAnimation: !reduced, fadeAnimation: !reduced, tap: true }).setView([48.137, 11.575], 12);
  L.tileLayer('https://wmtsod1.bayernwolke.de/wmts/by_webkarte_grau/smerc/{z}/{x}/{y}', {
    minZoom: 9, maxZoom: 18, bounds: [[47.2, 9.9], [50.6, 13.9]], keepBuffer: 1,
    attribution: '<a href="https://geodaten.bayern.de/odd/m/3/pdf/WMTS_Nutzungshinweise.pdf" target="_blank" rel="noopener noreferrer">© Bayerische Vermessungsverwaltung</a> · MVG · MVV (CC BY) · Open-Meteo · DWD · LH München',
  }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);
  map.createPane('lines').style.zIndex = 450;
  const lineLayer = L.layerGroup().addTo(map);
  const pinLayer = L.layerGroup().addTo(map);
  const ringLayer = L.layerGroup().addTo(map);
  const stopLayer = L.layerGroup().addTo(map);
  const weatherLayer = L.layerGroup().addTo(map);
  const hubLayer = L.layerGroup().addTo(map);
  const stopMarkers = new Map();
  let roadsLayer = null;
  const markers = new Map();

  function pinIcon(item, selected) {
    const classes = ['pin', `sev-${item.severity}`];
    if (item.status === 'demo') classes.push('demo');
    if (item.cause === 'roadworks') classes.push('small');
    if (selected) classes.push('selected');
    const html = document.createElement('div');
    html.className = classes.join(' ');
    html.append(h('span', { text: CAUSES[item.cause].icon }));
    const size = item.cause === 'roadworks' ? 24 : 34;
    return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size + 4], popupAnchor: [0, -size] });
  }

  function popupFor(item) {
    return h('div', {},
      h('span', { class: `tag ${item.status}`, text: STATUS[item.status] }),
      h('strong', { text: `${CAUSES[item.cause].icon} ${item.title}` }),
      h('div', { text: [timeLabel(item), item.place].filter(Boolean).join(' · ') }),
      h('div', { style: { display: 'flex', gap: '6px', 'flex-wrap': 'wrap' } },
        h('button', { class: 'popup-btn', type: 'button', onclick: () => { map.closePopup(); openItem(item.id, true); } }, 'Details'),
        ext('Google Maps ↗', gmapsUrl(item.location), 'popup-btn')));
  }

  function renderPins() {
    pinLayer.clearLayers();
    markers.clear();
    for (const item of items) {
      if (!item.location || !visible(item) || !matches(item) || (!state.ongoing && whenOf(item) === 'ongoing')) continue;
      if (state.line && (item.stops || []).some(st => st.role !== 'listed')) continue; // shown as stop markers on the highlighted line
      const marker = L.marker([item.location.lat, item.location.lng], { icon: pinIcon(item, state.selected === item.id), title: item.title, keyboard: true, riseOnHover: true, zIndexOffset: item.severity * 100 })
        .bindPopup(() => popupFor(item), { maxWidth: 260 })
        .addTo(pinLayer);
      markers.set(item.id, marker);
    }
    for (const item of items) {
      if (item.status !== 'live' || !visible(item) || !matches(item) || state.selected === item.id) continue;
      for (const st of (item.stops || []).filter(x => x.role === 'closed')) {
        const marker = L.marker([st.lat, st.lng], { icon: stopIcon('closed', st.name, false), title: `${st.name}: not served`, keyboard: false, zIndexOffset: 200 });
        bindBoard(marker, st, `✕ Not served: ${linesText(item)}`);
        marker.addTo(pinLayer);
      }
    }
    ringLayer.clearLayers();
    for (const up of currentHeadsUps()) {
      if (!up.location || up.upcoming) continue;
      const color = up.level >= 3 ? '#bc155a' : '#e08a12';
      L.circle([up.location.lat, up.location.lng], { radius: 450, color, weight: 2, dashArray: '6 6', fillColor: color, fillOpacity: 0.08, interactive: true })
        .bindTooltip(`${up.title} · busy area (approximate)`, { sticky: true }).addTo(ringLayer);
    }
  }

  // ---------- line paths (MVV timetable: drawn through each line's real stations) ----------
  const hasPath = label => Boolean(LINES?.lines?.[label]);
  function drawLine(label, strength = 'strong') {
    const def = LINES?.lines?.[label];
    if (!def) return [];
    const color = LINE_COLORS[label] || MODE_COLORS[def.mode] || '#555';
    const station = i => LINES.stations[i];
    const latlngs = def.paths.map(path => path.map(i => [station(i)[1], station(i)[2]]));
    const strong = strength === 'strong';
    L.polyline(latlngs, { pane: 'lines', color: '#ffffff', weight: strong ? 12 : 9, opacity: 0.95, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(lineLayer);
    L.polyline(latlngs, { pane: 'lines', color, weight: strong ? 6 : 4, opacity: strong ? 1 : 0.85, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(lineLayer);
    // true ends = stations with only one neighbour on this line
    const neighbours = new Map();
    for (const path of def.paths) path.forEach((i, k) => {
      if (!neighbours.has(i)) neighbours.set(i, new Set());
      if (k > 0) neighbours.get(i).add(path[k - 1]);
      if (k < path.length - 1) neighbours.get(i).add(path[k + 1]);
    });
    for (const [i, near] of neighbours) {
      const [id, lat, lng, name] = station(i);
      const end = near.size <= 1;
      const dot = L.circleMarker([lat, lng], { pane: 'lines', radius: end ? 6.5 : strong ? 4.5 : 3, color, weight: end ? 4 : 3, fillColor: '#fff', fillOpacity: 1 });
      dot.bindTooltip(end ? `${label} → ${name}` : name, { permanent: strong && end, direction: 'right', offset: [8, 0], className: `line-tip${end ? ' end' : ''}` });
      if (strong) bindBoard(dot, { id, name }, `${label} stops here`);
      dot.addTo(lineLayer);
    }
    return latlngs.flat();
  }
  function linesText(item) {
    return (item.lines || []).map(l => (l.mode === 'tram' ? `Tram ${l.label}` : l.mode === 'bus' ? `Bus ${l.label}` : l.label)).join(', ');
  }
  function stopIcon(role, name, showLabel) {
    const el = h('div', { class: `stop-mark ${role}` }, h('span', { class: 'stop-glyph', text: role === 'closed' ? '✕' : role === 'end' ? '⇥' : role === 'alt' ? '✓' : '' }), showLabel ? h('span', { class: 'stop-label', text: name }) : null);
    return L.divIcon({ html: el, className: '', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10] });
  }
  function bindBoard(marker, stop, note) {
    if (!stop.id) { marker.bindTooltip(stop.name); return; }
    // Build the board once per opening (a function as popup content would be re-run on every update → loop).
    marker.bindPopup('Loading…', { maxWidth: 320, minWidth: 250, autoPanPaddingTopLeft: L.point(10, 60), autoPanPaddingBottomRight: L.point(10, 24) });
    marker.on('popupopen', () => {
      const board = departureBoard(stop.id, stop.name, note);
      board.addEventListener('loaded', () => { if (marker.isPopupOpen()) marker.getPopup().update(); });
      marker.setPopupContent(board);
    });
  }
  function focusItem(item, scrollToMap) {
    state.selected = item.id;
    for (const [id, marker] of markers) marker.setIcon(pinIcon(byId.get(id), id === item.id));
    stopLayer.clearLayers();
    stopMarkers.clear();
    if (!state.line) {
      lineLayer.clearLayers();
      for (const l of (item.lines || []).filter(l => hasPath(l.label)).slice(0, 5)) drawLine(l.label, 'context');
    }
    const bounds = [];
    const stops = item.stops?.length ? item.stops : (item.points || []).slice(1).map(([lat, lng, name]) => ({ lat, lng, name, role: 'listed' }));
    const named = stops.filter(st => st.role !== 'listed').length;
    const notes = { closed: `✕ Not served: ${linesText(item)}`, end: `⇥ ${linesText(item)} turns back here`, listed: `Affected: ${linesText(item)}` };
    for (const st of stops) {
      const marker = L.marker([st.lat, st.lng], { icon: stopIcon(st.role, st.name, named <= 14 && st.role !== 'listed'), title: st.name, zIndexOffset: 700 });
      bindBoard(marker, st, notes[st.role]);
      marker.addTo(stopLayer);
      stopMarkers.set(st.id || st.name, marker);
      bounds.push([st.lat, st.lng]);
    }
    for (const a of item.alternatives || []) {
      if (a.type !== 'walk') continue;
      const rail = a.lines.filter(l => l.mode !== 'bus').map(l => l.label);
      const marker = L.marker([a.to.lat, a.to.lng], { icon: stopIcon('alt', `${a.to.name} · ${rail.length ? rail.join('/') : 'Bus'}`, true), title: a.to.name, zIndexOffset: 800 });
      bindBoard(marker, a.to, `✓ Alternative: ${a.lines.map(l => l.label).join(', ')}`);
      marker.addTo(stopLayer);
      stopMarkers.set(a.to.id, marker);
      bounds.push([a.to.lat, a.to.lng]);
      const from = stops.find(st => st.name === a.from);
      if (from) L.polyline([[from.lat, from.lng], [a.to.lat, a.to.lng]], { color: '#2f7d4f', weight: 4, dashArray: '1 8', lineCap: 'round' }).bindTooltip(`~${a.minutes} min walk (straight line, approximate)`).addTo(stopLayer);
    }
    if (item.location) bounds.push([item.location.lat, item.location.lng]);
    if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds), { padding: [60, 60], maxZoom: 16, animate: !reduced });
    else if (item.location) map.flyTo([item.location.lat, item.location.lng], Math.max(map.getZoom(), 15), { animate: !reduced, duration: 0.6 });
    if (scrollToMap && window.innerWidth < 900) document.querySelector('.map-wrap').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    document.querySelectorAll('.item.selected').forEach(el => el.classList.remove('selected'));
    $(`item-${item.id}`)?.classList.add('selected');
  }
  function focusStop(item, stop) {
    focusItem(item, true);
    let marker = stopMarkers.get(stop.id || stop.name);
    if (!marker) {
      marker = L.marker([stop.lat, stop.lng], { icon: stopIcon(stop.role || 'listed', stop.name, true), zIndexOffset: 900 }).addTo(stopLayer);
      bindBoard(marker, stop, '');
      stopMarkers.set(stop.id || stop.name, marker);
    }
    setTimeout(() => { map.setView([stop.lat, stop.lng], Math.max(map.getZoom(), 15), { animate: !reduced }); marker.openPopup(); }, reduced ? 0 : 450);
  }

  // ---------- live departure boards ----------
  const boardCache = new Map();
  async function loadBoard(id) {
    const cached = boardCache.get(id);
    if (cached && Date.now() - cached.at < 30000) return cached.list;
    const list = await Network.departures(id, { limit: 12 });
    boardCache.set(id, { at: Date.now(), list });
    return list;
  }
  function departureBoard(id, name, note) {
    const rowsBox = h('div', { class: 'board-rows', text: 'Loading live departures…' });
    const box = h('div', { class: 'board' },
      h('div', { class: 'board-head' }, h('strong', { text: name }), h('span', { class: 'tag live', text: 'Live' })),
      note ? h('div', { class: 'board-note', text: note }) : null,
      rowsBox,
      h('div', { class: 'board-foot', text: 'MVG departures' }));
    if (!Network) { rowsBox.textContent = 'Live departures unavailable.'; return box; }
    loadBoard(id).then(list => {
      const now = Date.now();
      const upcoming = list.filter(d => d.time > now - 60000).slice(0, window.innerWidth < 600 ? 6 : 8);
      if (!upcoming.length) rowsBox.textContent = 'No departures in the next while.';
      else rowsBox.replaceChildren(...upcoming.map(d => {
        const mins = Math.max(0, Math.round((d.time - now) / 60000));
        const [cls, text] = d.cancelled ? ['bad', 'Cancelled'] : d.delay == null ? ['plan', 'planned'] : d.delay === 0 ? ['ok', 'on time'] : [d.delay >= 5 ? 'bad' : 'late', `+${d.delay}′`];
        return h('div', { class: `dep${d.cancelled ? ' cancelled' : ''}` },
          h('span', { class: 'dep-time', text: mins === 0 ? 'now' : `${mins}′` }), lineChip({ label: d.line, mode: d.mode }),
          h('span', { class: 'dep-dest', text: d.destination }), h('span', { class: `dep-delay ${cls}`, text }));
      }));
      box.querySelector('.board-foot').textContent = `Live from MVG · ${fmtTime.format(new Date())}`;
      box.dispatchEvent(new Event('loaded'));
    }).catch(() => { rowsBox.textContent = 'Live departures unavailable right now.'; box.dispatchEvent(new Event('loaded')); });
    return box;
  }

  // ---------- lines right now (live network board) ----------
  const statusText = l => {
    if (l.status === 'ok') return '✓';
    if (l.status === 'unknown') return '·';
    if (l.cancelled >= 2 || (l.cancelled && !(l.avg >= 1))) return `✕${l.cancelled}`;
    if (l.avg != null && l.avg >= 1) return `+${Math.round(l.avg)}′`;
    return l.incident ? '⚠' : `+${l.max}′`;
  };
  const describeLine = l => {
    const bits = [l.status === 'ok' ? 'On time' : l.status === 'unknown' ? 'No departures seen' : l.status === 'delayed' ? 'Delayed' : 'Disrupted'];
    if (l.avg != null) bits.push(`average delay ${l.avg} min`);
    if (l.max) bits.push(`worst +${l.max} min${l.worstHub ? ` at ${l.worstHub}` : ''}`);
    if (l.cancelled) bits.push(`${l.cancelled} cancelled`);
    if (l.incident) bits.push('MVG incident notice');
    return bits.join(' · ');
  };
  function renderNetwork() {
    const section = $('netboard');
    if (!network?.lines?.length) { section.hidden = true; return; }
    section.hidden = false;
    const at = new Date(network.updatedAt);
    $('net-updated').replaceChildren(h('span', { class: `tag ${networkLive ? 'live' : 'official'}`, text: networkLive ? `Live ${fmtTime.format(at)}` : `At ${fmtTime.format(at)}` }));
    const counts = { disrupted: 0, delayed: 0, ok: 0 };
    for (const l of network.lines) if (l.mode !== 'bus' && counts[l.status] != null) counts[l.status]++;
    $('net-summary').textContent = `${counts.disrupted} disrupted · ${counts.delayed} delayed · ${counts.ok} on time. Checked at ${network.hubsOk} stations across Munich${networkLive ? ', refreshing every 2 minutes' : ''}. Tap a line.`;
    const rows = [['U-Bahn', l => l.mode === 'ubahn'], ['S-Bahn', l => l.mode === 'sbahn'], ['Tram', l => l.mode === 'tram'], ['Bus · only problems', l => l.mode === 'bus' && l.status !== 'ok' && l.status !== 'unknown']];
    $('net-rows').replaceChildren(...rows.map(([label, test]) => {
      const lines = network.lines.filter(test).slice(0, label.startsWith('Bus') ? 10 : 20);
      if (!lines.length) return null;
      return h('div', { class: 'lrow' }, h('span', { class: 'lrow-label', text: label }),
        h('div', { class: 'lchips' }, ...lines.map(l => h('button', { class: `lchip st-${l.status}`, type: 'button', title: `${l.label}: ${describeLine(l)}`, 'aria-pressed': String(state.line === l.label), onclick: () => selectLine(l.label) }, lineChip(l), h('span', { class: 'lstat', text: statusText(l) })))));
    }).filter(Boolean));
    const focus = $('line-focus');
    const l = state.line && network.lines.find(x => x.label === state.line);
    if (!state.line) { focus.hidden = true; return; }
    const notices = items.filter(i => visible(i) && (i.lines || []).some(x => x.label === state.line));
    focus.hidden = false;
    focus.replaceChildren(
      h('div', { class: 'lf-head' }, lineChip(l || { label: state.line, mode: 'bus' }), h('strong', { text: l ? describeLine(l) : 'No live departures seen for this line' }), h('button', { class: 'close small', type: 'button', 'aria-label': 'Show all lines', onclick: () => selectLine(null) }, '✕')),
      l?.hubs?.length ? h('div', { class: 'lf-sub', text: `Seen at: ${l.hubs.join(', ')}` }) : null,
      h('div', { class: 'lf-sub', text: notices.length ? `${notices.length} MVG notice${notices.length > 1 ? 's' : ''} for ${state.line} below.` : `No MVG notices for ${state.line}. Delays are measured live at stations.` }),
      hasPath(state.line) ? h('div', { class: 'lf-legend' }, h('span', { class: 'lf-swatch', style: { '--lc': LINE_COLORS[state.line] || MODE_COLORS[l?.mode] || '#555' } }), 'Highlighted on the map through its stations (MVV timetable). Tap a station for live departures.') : h('div', { class: 'lf-sub', text: 'No path available for this line (buses are not drawn).' }));
  }
  function selectLine(label, scroll) {
    state.line = state.line === label ? null : label;
    if (state.line) { state.filter = 'all'; state.ongoing = true; $('show-ongoing').checked = true; }
    state.selected = null;
    stopLayer.clearLayers();
    renderAll();
    renderLineFocus();
  }
  function renderLineFocus() {
    lineLayer.clearLayers();
    map.getContainer().classList.toggle('line-mode', Boolean(state.line));
    if (!state.line) return;
    const pts = drawLine(state.line, 'strong');
    // disruptions on this line: mark their stops on top of the path
    for (const item of items) {
      if (!visible(item) || !(item.lines || []).some(x => x.label === state.line)) continue;
      for (const st of (item.stops || []).filter(x => x.role !== 'listed')) {
        const marker = L.marker([st.lat, st.lng], { icon: stopIcon(st.role, st.name, st.role === 'closed'), title: `${st.name}: ${st.role === 'closed' ? 'not served' : 'line turns back here'}`, zIndexOffset: 900 });
        bindBoard(marker, st, st.role === 'closed' ? `✕ Not served: ${linesText(item)}` : `⇥ ${linesText(item)} turns back here`);
        marker.addTo(lineLayer);
        pts.push([st.lat, st.lng]);
      }
    }
    if (!pts.length) {
      const l = network?.lines.find(x => x.label === state.line);
      for (const hub of network?.hubs || []) if (l?.hubs.includes(hub.name)) pts.push([hub.lat, hub.lng]);
    }
    if (pts.length) {
      // Long S-Bahn lines: keep the view on greater Munich, where lines cross; the far ends stay drawn.
      const b = L.latLngBounds(pts);
      const clamp = L.latLngBounds([[Math.max(b.getSouth(), 47.99), Math.max(b.getWest(), 11.3)], [Math.min(b.getNorth(), 48.3), Math.min(b.getEast(), 11.82)]]);
      map.fitBounds(clamp.isValid() ? clamp : b, { paddingTopLeft: L.point(30, 95), paddingBottomRight: L.point(30, 30), maxZoom: 14, animate: !reduced });
    }
    if (window.innerWidth < 900) document.querySelector('.map-wrap').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  function renderHubs() {
    hubLayer.clearLayers();
    if (!network?.hubs || !$('layer-hubs').checked) return;
    const line = state.line && network.lines.find(x => x.label === state.line);
    for (const hub of network.hubs) {
      if (!hub.ok) continue;
      const level = hub.cancelled >= 2 || hub.avg >= 5 ? 'bad' : hub.avg >= 2 || hub.cancelled ? 'late' : 'ok';
      const dim = line && !line.hubs.includes(hub.name);
      const el = h('div', { class: `hub ${level}${dim ? ' dim' : ''}` }, h('i'), hub.avg >= 1 ? `+${Math.round(hub.avg)}′` : '✓', hub.cancelled ? h('em', { text: `✕${hub.cancelled}` }) : null);
      const marker = L.marker([hub.lat, hub.lng], { icon: L.divIcon({ html: el, className: '', iconSize: [46, 20], iconAnchor: [23, 10], popupAnchor: [0, -10] }), title: `${hub.name}: live departures`, zIndexOffset: dim ? -400 : 300 });
      bindBoard(marker, hub, `Average delay ${hub.avg ?? 0} min${hub.cancelled ? ` · ${hub.cancelled} cancelled` : ''} (next 40 min)`);
      marker.addTo(hubLayer);
    }
  }
  async function refreshNetwork() {
    if (!Network || navigator.onLine === false || document.visibilityState === 'hidden') return;
    try {
      const fresh = await Network.snapshot(items);
      if (!fresh.hubsOk) return;
      network = fresh;
      networkLive = true;
      renderNetwork(); renderHubs(); renderHero(); renderHeadsUps(); renderPins();
    } catch { /* keep the previous numbers */ }
  }

  function showHeadsUp(up) {
    const first = byId.get(up.related?.[0]);
    if (first?.location) focusItem(first, true);
    map.flyTo([up.location.lat, up.location.lng], 15, { animate: !reduced, duration: 0.6 });
  }

  function fitAll() {
    const points = [...markers.values()].map(marker => marker.getLatLng());
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14, animate: !reduced });
  }

  // ---------- weather on the map (+ live refresh in the browser) ----------
  let liveWeatherAt = null;
  function renderWeather() {
    weatherLayer.clearLayers();
    if (!data.weather || !$('layer-weather').checked) return;
    for (const d of data.weather.districts) {
      const chip = h('div', { class: 'wx-chip' }, h('span', { text: d.icon }), `${Math.round(d.temperature)}°`);
      const popup = h('div', {},
        h('strong', { text: `${d.icon} ${d.name}` }),
        h('div', { text: `${d.label}, ${d.temperature}°C${liveWeatherAt ? ' (live)' : ''}` }),
        h('div', { text: `Next 12 h: ${d.snowfallNext ? `${d.snowfallNext} cm snow` : `${d.precipitationNext} mm rain`}` }),
        d.today?.min != null ? h('div', { text: `Today ${d.today.min}…${d.today.max}°C · ${d.today.label}` }) : null,
        h('p', { style: { margin: '6px 0 0' }, text: d.advice }));
      L.marker([d.lat, d.lng], { icon: L.divIcon({ html: chip, className: 'wx-icon', iconSize: [58, 24], iconAnchor: [29, 12] }), keyboard: false, zIndexOffset: -500 })
        .bindPopup(popup, { maxWidth: 240 }).addTo(weatherLayer);
    }
  }
  async function refreshWeather() {
    if (!data.weather || !Weather || navigator.onLine === false) return;
    const districts = data.weather.districts;
    const query = new URLSearchParams({ latitude: districts.map(d => d.lat).join(','), longitude: districts.map(d => d.lng).join(','), current: 'temperature_2m,weather_code', timezone: TZ });
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return;
      const result = await response.json();
      (Array.isArray(result) ? result : [result]).forEach((r, i) => {
        const d = districts[i];
        if (!d || !r?.current) return;
        const now = Weather.assess({ code: r.current.weather_code, temperature: r.current.temperature_2m, snowfallNext: d.snowfallNext, precipitationNext: d.precipitationNext });
        Object.assign(d, { temperature: r.current.temperature_2m, code: r.current.weather_code, icon: now.icon, label: now.label });
      });
      liveWeatherAt = new Date();
      renderWeather();
      renderHero();
    } catch { /* keep the morning numbers */ }
  }

  // ---------- full roadworks layer (lazy: 5 MB) ----------
  function loadScript(src) {
    return new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = reject; document.head.append(s); });
  }
  async function toggleRoads(on) {
    const note = $('map-note');
    if (!on) { if (roadsLayer) map.removeLayer(roadsLayer); note.textContent = '✕ red = stop not served · 🚉 = live delays at big stations · rings = busy areas, not closures.'; return; }
    if (!roadsLayer) {
      note.textContent = 'Loading city roadworks (about 5 MB)…';
      try { if (!globalThis.TransportGapsMunichSnapshot) await loadScript('munich-snapshot.js'); } catch { note.textContent = 'Could not load the roadworks layer.'; $('layer-roads').checked = false; return; }
      const snapshot = globalThis.TransportGapsMunichSnapshot;
      const today = dayKey(new Date());
      const iso = value => { const m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(value || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };
      const features = snapshot.collection.features.filter(f => {
        const p = f.properties;
        const from = iso(p.beginn_datum_kombiniert); const to = iso(p.ende_datum_kombiniert);
        return p.art === 'Baumaßnahme' && from && to && from <= today && to >= today && (/fahrbahn/i.test(p.betroffene_bereiche || '') || /fahrbahn|straßensperr/i.test(p.beeintraechtigung || ''));
      });
      roadsLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
        style: { color: '#bc155a', weight: 3, fillOpacity: 0.35 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(() => h('div', {}, h('span', { class: 'tag official', text: 'Official' }), h('strong', { text: `🦺 ${p.strasse_hausnr || 'Roadworks'}` }),
            h('div', { text: [p.beeintraechtigung, p.betroffene_bereiche].filter(Boolean).join(' · ') || 'Restriction not specified' }),
            h('div', { text: `${p.beginn_datum_kombiniert || '?'} → ${p.ende_datum_kombiniert || '?'}` })));
        },
      });
      roadsLayer.count = features.length;
    }
    roadsLayer.addTo(map);
    note.textContent = `${roadsLayer.count} roadworks affecting the carriageway today (city open data, ${globalThis.TransportGapsMunichSnapshot.snapshotDay}). Zoom in to see them.`;
  }

  // ---------- share (QR) + about ----------
  function shareUrl() {
    const local = location.protocol === 'file:' || location.protocol.endsWith('extension:') || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
    return { url: local ? PUBLIC_URL : `${location.origin}${location.pathname.replace(/index\.html$/, '')}`, local };
  }
  function openShare() {
    const { url, local } = shareUrl();
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const svg = new DOMParser().parseFromString(qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true }), 'image/svg+xml').documentElement;
    $('qr').replaceChildren(document.importNode(svg, true));
    $('share-url').value = url;
    $('share-hint').hidden = !local;
    $('share-hint').textContent = 'You are viewing a local copy, so this QR code opens the published version on GitHub Pages.';
    $('share-dialog').showModal();
  }
  function openAbout() {
    $('sources').replaceChildren(...(data.sources || []).map(s => h('tr', {},
      h('td', {}, safeUrl(s.url) ? h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', text: s.name }) : s.name, s.note ? h('div', { style: { color: 'var(--muted)' }, text: s.note }) : null),
      h('td', { class: `src-status ${s.status}`, text: `${{ ok: '✓', failed: '✗ failed', stale: '~ saved copy', off: 'off' }[s.status] || s.status}${s.count != null && s.status === 'ok' ? ` · ${s.count}` : ''}` }))));
    $('about-dialog').showModal();
  }
  $('share-btn').addEventListener('click', openShare);
  $('about-btn').addEventListener('click', openAbout);
  $('copy-url').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('share-url').value); $('copy-url').textContent = 'Copied ✓'; } catch { $('share-url').select(); }
    setTimeout(() => { $('copy-url').textContent = 'Copy'; }, 1800);
  });
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('click', event => { if (event.target === dialog || event.target.closest('[data-close]')) dialog.close(); });
  }

  // ---------- wire up ----------
  function renderAll() { renderHero(); renderNetwork(); renderHeadsUps(); renderFilters(); renderList(); renderPins(); renderHubs(); }
  let searchTimer;
  $('search').addEventListener('input', event => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.query = event.target.value.toLocaleLowerCase('de-DE').trim(); renderList(); renderPins(); renderFilters(); }, 150);
  });
  $('show-examples').addEventListener('change', event => { state.examples = event.target.checked; renderAll(); });
  $('show-ongoing').addEventListener('change', event => { state.ongoing = event.target.checked; renderAll(); });
  $('layer-weather').addEventListener('change', renderWeather);
  $('layer-hubs').addEventListener('change', renderHubs);
  $('layer-roads').addEventListener('change', event => toggleRoads(event.target.checked));
  $('fit-all').addEventListener('click', fitAll);
  $('foot-sources').textContent = `Briefing built ${new Date(data.generatedAt).toLocaleString('en-GB', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' })} from ${(data.sources || []).filter(s => s.status === 'ok').length} sources: MVG notices, DWD warnings, Open-Meteo, City of Munich roadworks, local news headlines and our team’s event list.`;

  renderFreshness();
  renderAll();
  renderWeather();
  fitAll();
  refreshWeather();
  refreshNetwork();
  setInterval(refreshNetwork, 2 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - new Date(network?.updatedAt || 0) > 90000) refreshNetwork(); });
  setInterval(() => { refreshWeather(); renderFreshness(); renderAll(); }, 10 * 60 * 1000);
  if (location.hash === '#share') openShare();
})();
