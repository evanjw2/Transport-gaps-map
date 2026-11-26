// Live network health from MVG departure boards at key hubs. Shared by the morning script (Node) and the page (browser).
// MVG's departures endpoint allows cross-origin requests, so phones can refresh this live.
(function (root) {
  const API = 'https://www.mvg.de/api/bgw-pt/v3';
  // Hubs chosen so every U-Bahn, S-Bahn and most tram lines are seen at least once.
  const HUBS = [
    { id: 'de:09162:2', name: 'Marienplatz', lat: 48.137245, lng: 11.575421 },
    { id: 'de:09162:1', name: 'Karlsplatz (Stachus)', lat: 48.139505, lng: 11.566133 },
    { id: 'de:09162:100', name: 'Hauptbahnhof', lat: 48.140291, lng: 11.559602 },
    { id: 'de:09162:50', name: 'Sendlinger Tor', lat: 48.133444, lng: 11.566681 },
    { id: 'de:09162:60', name: 'Odeonsplatz', lat: 48.142682, lng: 11.577487 },
    { id: 'de:09162:5', name: 'Ostbahnhof', lat: 48.12815, lng: 11.604545 },
    { id: 'de:09162:10', name: 'Pasing', lat: 48.149144, lng: 11.460697 },
    { id: 'de:09162:500', name: 'Münchner Freiheit', lat: 48.161962, lng: 11.586497 },
    { id: 'de:09162:400', name: 'Scheidplatz', lat: 48.171537, lng: 11.572933 },
    { id: 'de:09162:580', name: 'Max-Weber-Platz', lat: 48.135693, lng: 11.598355 },
    { id: 'de:09162:190', name: 'Rotkreuzplatz', lat: 48.153423, lng: 11.53312 },
    { id: 'de:09162:1130', name: 'Harras', lat: 48.116895, lng: 11.536668 },
    { id: 'de:09162:1110', name: 'Giesing', lat: 48.110861, lng: 11.595247 },
    { id: 'de:09162:1060', name: 'Innsbrucker Ring', lat: 48.120415, lng: 11.619196 },
    { id: 'de:09162:300', name: 'Moosach', lat: 48.180792, lng: 11.507643 },
    { id: 'de:09162:160', name: 'Kolumbusplatz', lat: 48.119323, lng: 11.576742 },
    { id: 'de:09162:9', name: 'Laim', lat: 48.143905, lng: 11.50326 },
  ];
  const MODES = { UBAHN: 'ubahn', SBAHN: 'sbahn', TRAM: 'tram', BUS: 'bus', REGIONAL_BUS: 'regionalbus', BAHN: 'train' };

  async function departures(stationId, { limit = 30, timeout = 12000 } = {}) {
    const url = `${API}/departures?globalId=${encodeURIComponent(stationId)}&limit=${limit}&transportTypes=UBAHN,SBAHN,TRAM,BUS`;
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const list = await response.json();
    if (!Array.isArray(list)) throw new Error('Unexpected departures response');
    return list.map(d => ({
      line: d.label, mode: MODES[d.transportType] || 'bus', destination: d.destination,
      planned: d.plannedDepartureTime, time: d.realtimeDepartureTime || d.plannedDepartureTime,
      delay: d.realtime ? Math.max(0, d.delayInMinutes || 0) : null, realtime: Boolean(d.realtime),
      cancelled: Boolean(d.cancelled), platform: d.platform ?? null, sev: Boolean(d.sev),
    }));
  }

  // results: [{ hub, departures: [...] | null }]; notices: briefing items (to mark lines with live incidents)
  function summarize(results, notices = [], now = Date.now()) {
    const lines = new Map();
    const hubs = [];
    for (const { hub, departures: list } of results) {
      if (!list) { hubs.push({ ...hub, ok: false }); continue; }
      const soon = list.filter(d => d.time - now < 40 * 60000);
      const rt = soon.filter(d => d.realtime && !d.cancelled);
      const hubAvg = rt.length ? rt.reduce((sum, d) => sum + d.delay, 0) / rt.length : null;
      hubs.push({ ...hub, ok: true, n: soon.length, avg: hubAvg == null ? null : Math.round(hubAvg * 10) / 10, max: Math.max(0, ...rt.map(d => d.delay)), cancelled: soon.filter(d => d.cancelled).length });
      for (const d of soon) {
        if (d.mode === 'bus' && !/^(X?\d{2,3})$/.test(d.line)) continue;
        if (!lines.has(d.line)) lines.set(d.line, { label: d.line, mode: d.mode, n: 0, rt: 0, sum: 0, max: 0, cancelled: 0, hubs: new Set(), worstHub: null, worstDelay: -1 });
        const line = lines.get(d.line);
        line.n++;
        line.hubs.add(hub.name);
        if (d.cancelled) line.cancelled++;
        else if (d.realtime) {
          line.rt++; line.sum += d.delay; line.max = Math.max(line.max, d.delay);
          if (d.delay > line.worstDelay) { line.worstDelay = d.delay; line.worstHub = hub.name; }
        }
      }
    }
    const live = new Map();
    for (const item of notices) {
      if (item.status !== 'live') continue;
      for (const l of item.lines || []) live.set(l.label, Math.max(live.get(l.label) || 0, item.severity));
    }
    const out = [];
    const labels = new Set([...lines.keys(), ...live.keys()]);
    for (const label of labels) {
      const line = lines.get(label) || { label, mode: guessMode(label), n: 0, rt: 0, sum: 0, max: 0, cancelled: 0, hubs: new Set(), worstHub: null };
      const avg = line.rt >= 2 ? Math.round((line.sum / line.rt) * 10) / 10 : null;
      const incident = live.get(label) || 0;
      let status = line.n ? 'ok' : 'unknown';
      if (incident >= 3 || line.cancelled >= 2 || (avg != null && avg >= 8)) status = 'disrupted';
      else if (incident >= 2 || line.cancelled >= 1 || (avg != null && avg >= 3) || line.max >= 10) status = 'delayed';
      out.push({ label, mode: line.mode, status, avg, max: line.max, cancelled: line.cancelled, seen: line.n, hubs: [...line.hubs], worstHub: line.worstHub, incident: incident > 0 });
    }
    const order = { ubahn: 0, sbahn: 1, tram: 2, bus: 3, regionalbus: 4, train: 5 };
    out.sort((a, b) => order[a.mode] - order[b.mode] || a.label.localeCompare(b.label, 'de', { numeric: true }));
    return { updatedAt: new Date(now).toISOString(), lines: out, hubs, hubsOk: hubs.filter(h => h.ok).length, hubsTotal: hubs.length };
  }

  function guessMode(label) {
    if (/^U\d/.test(label)) return 'ubahn';
    if (/^S\d/.test(label)) return 'sbahn';
    if (/^N?(1\d|2\d)$/.test(label)) return 'tram';
    return 'bus';
  }

  async function snapshot(notices = [], { concurrency = 6 } = {}) {
    const results = [];
    const queue = HUBS.slice();
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const hub = queue.shift();
        try { results.push({ hub, departures: await departures(hub.id) }); } catch { results.push({ hub, departures: null }); }
      }
    }));
    return summarize(results, notices);
  }

  const api = Object.freeze({ API, HUBS, departures, summarize, snapshot, guessMode });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TransportGapsNetwork = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
