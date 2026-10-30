(() => {
  const hostId = 'transport-gaps-demo';

  if (document.getElementById(hostId)) return;

  const samples = [
    {
      id: 'closure',
      title: 'Road closure',
      category: 'Sample 01 · Road',
      impact: 'Access blocked',
      description: 'An example of a closed section of road. The pink plot represents the area we would flag for a traveler.',
      points: '270,205 370,170 432,218 410,303 305,320 258,270',
      label: { x: 345, y: 245 },
      symbol: '01',
    },
    {
      id: 'event',
      title: 'Event disruption',
      category: 'Sample 02 · Public event',
      impact: 'Local access affected',
      description: 'An example of a larger affected area around a public event. This is fictional, not a report of an actual event.',
      points: '485,290 565,255 635,300 620,382 530,405 473,355',
      label: { x: 554, y: 331 },
      symbol: '02',
    },
    {
      id: 'transit',
      title: 'Transit interruption',
      category: 'Sample 03 · Public transport',
      impact: 'Service interrupted',
      description: 'An example of a transport interchange affected by a breakdown or strike. No real service or station is being identified.',
      points: '327,415 415,395 470,447 447,510 353,523 310,475',
      label: { x: 391, y: 459 },
      symbol: '03',
    },
  ];

  const host = document.createElement('div');
  host.id = hostId;
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:block;';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { color-scheme: light; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    button, input { font: inherit; }
    button { cursor: pointer; }
    button:focus-visible, input:focus-visible, [role="button"]:focus-visible { outline: 3px solid #2563eb; outline-offset: 4px; }
    .plots { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    .plot { cursor: pointer; pointer-events: none; }
    .plot polygon { fill: #ff168b; fill-opacity: var(--plot-opacity, .36); stroke: #f00078; stroke-width: 3; vector-effect: non-scaling-stroke; pointer-events: auto; stroke-linejoin: round; }
    .plot:hover polygon, .plot:focus-visible polygon, .plot[data-selected="true"] polygon { stroke: #9b004c; stroke-width: 5; }
    .plot rect { fill: #fff; stroke: #f00078; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
    .plot text { fill: #a00050; font: 700 16px Inter, sans-serif; text-anchor: middle; dominant-baseline: central; }
    .plot rect, .plot text { pointer-events: none; }
    .panel { position: absolute; top: 90px; right: 24px; width: 310px; max-height: calc(100dvh - 114px); overflow: auto; background: #fff; color: #19212c; border: 1px solid #e4e6eb; border-radius: 20px; box-shadow: 0 12px 44px #10203426; pointer-events: auto; font-size: 13px; line-height: 1.5; }
    .header { padding: 20px 20px 16px; border-bottom: 1px solid #eef0f3; }
    .eyebrow { color: #a00050; font-size: 10px; font-weight: 800; letter-spacing: 1.8px; margin-bottom: 8px; }
    .heading-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    h1 { margin: 0; font-size: 21px; letter-spacing: -.6px; line-height: 1.25; }
    .minimize { border: 1px solid #e5e7eb; background: #f7f8fa; border-radius: 8px; width: 30px; height: 30px; color: #4b5563; font-size: 19px; }
    .subtitle { margin: 8px 0 0; color: #626b79; font-size: 12px; }
    .body { padding: 16px 20px 20px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; font-weight: 650; }
    .toggle { accent-color: #e60073; width: 18px; height: 18px; cursor: pointer; }
    .legend { display: flex; align-items: center; gap: 8px; color: #626b79; font-size: 11px; margin-bottom: 12px; }
    .swatch { width: 12px; height: 12px; border: 2px solid #f00078; border-radius: 3px; background: #ffb1d7; }
    .sample-list { display: grid; gap: 7px; margin-bottom: 16px; }
    .sample-button { display: flex; align-items: center; width: 100%; text-align: left; padding: 11px 12px; gap: 11px; background: #fff; border: 1px solid #e7e9ee; border-radius: 11px; color: #333d4a; }
    .sample-button:hover { background: #fff6fa; }
    .sample-button[aria-pressed="true"] { border-color: #f00078; background: #fff2f8; }
    .sample-number { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; background: #ffe1ef; color: #a00050; font-size: 11px; font-weight: 800; border-radius: 8px; }
    .sample-name { font-weight: 650; font-size: 12px; }
    .sample-hint { color: #747d89; font-size: 10px; margin-top: 1px; }
    .detail { border-top: 1px solid #eef0f3; padding-top: 14px; }
    .category { text-transform: uppercase; letter-spacing: 1px; font-size: 9px; color: #8b526b; font-weight: 800; }
    h2 { font-size: 16px; margin: 5px 0 6px; letter-spacing: -.3px; }
    .description { color: #626b79; margin: 0 0 13px; font-size: 12px; }
    .opacity-row { display: flex; justify-content: space-between; font-size: 11px; color: #626b79; }
    input[type="range"] { width: 100%; accent-color: #e60073; margin: 8px 0 14px; }
    .notice { background: #fff5e9; border: 1px solid #f3dfc1; color: #815421; padding: 10px 11px; border-radius: 10px; font-size: 10px; }
    .restore { position: absolute; right: 24px; top: 90px; display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fff; border: 1px solid #f00078; border-radius: 30px; box-shadow: 0 4px 20px #10203426; color: #9b004c; font-weight: 700; font-size: 12px; pointer-events: auto; }
    @media (max-width: 650px) { .panel { top: auto; bottom: 16px; right: 12px; width: 275px; max-height: 54dvh; } .restore { top: auto; bottom: 20px; right: 12px; } }
    @media (forced-colors: active) { .plot polygon { stroke: Highlight; fill: Highlight; } .plot text { fill: CanvasText; } .plot rect { fill: Canvas; } }
  `;
  root.append(style);

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const overlay = document.createElementNS(svgNamespace, 'svg');
  overlay.classList.add('plots');
  overlay.setAttribute('viewBox', '0 0 1000 700');
  overlay.setAttribute('preserveAspectRatio', 'none');
  overlay.setAttribute('aria-label', 'Three fictional transport disruption plots. Screen-positioned visual demo, not geographic data.');

  const plots = new Map();
  const sampleButtons = new Map();

  for (const sample of samples) {
    const group = document.createElementNS(svgNamespace, 'g');
    group.classList.add('plot');
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', `View fictional ${sample.title.toLowerCase()} sample ${sample.symbol}`);
    const polygon = document.createElementNS(svgNamespace, 'polygon');
    polygon.setAttribute('points', sample.points);
    const label = document.createElementNS(svgNamespace, 'rect');
    label.setAttribute('x', sample.label.x - 19);
    label.setAttribute('y', sample.label.y - 16);
    label.setAttribute('width', '38');
    label.setAttribute('height', '32');
    label.setAttribute('rx', '9');
    const text = document.createElementNS(svgNamespace, 'text');
    text.setAttribute('x', sample.label.x);
    text.setAttribute('y', sample.label.y);
    text.textContent = sample.symbol;
    group.append(polygon, label, text);
    group.addEventListener('pointerdown', (event) => event.stopPropagation());
    group.addEventListener('click', (event) => {
      event.stopPropagation();
      selectSample(sample);
    });
    group.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      selectSample(sample);
    });
    plots.set(sample.id, group);
    overlay.append(group);
  }

  const panel = document.createElement('section');
  panel.id = 'demo-panel';
  panel.className = 'panel';
  panel.setAttribute('aria-label', 'Transport Gaps sample controls');
  panel.innerHTML = `
    <header class="header">
      <div class="eyebrow">TRANSPORT GAPS / VISUAL DEMO</div>
      <div class="heading-row">
        <h1>A clearer way around.</h1>
        <button class="minimize" type="button" aria-label="Minimize demo controls" aria-expanded="true" aria-controls="demo-panel">−</button>
      </div>
      <p class="subtitle">Bright areas. Visible disruption.<br>Explore three fictional examples.</p>
    </header>
    <div class="body">
      <label class="toggle-row" for="show-samples">Show sample areas <input class="toggle" id="show-samples" type="checkbox" checked></label>
      <div class="legend"><span class="swatch" aria-hidden="true"></span>Pink plot = fictional affected area</div>
      <div class="sample-list" aria-label="Sample disruptions"></div>
      <div class="detail" aria-live="polite" aria-atomic="true">
        <div class="category"></div><h2></h2><p class="description"></p>
      </div>
      <div class="opacity-row"><label for="plot-opacity">Area opacity</label><output for="plot-opacity">36%</output></div>
      <input id="plot-opacity" type="range" min="15" max="70" value="36" step="1">
      <div class="notice"><strong>DEMO ONLY · NOT LIVE</strong><br>These plots stay fixed on screen when you pan or zoom. They do not identify real blocked locations. Do not use them for travel decisions.</div>
    </div>
  `;

  const restore = document.createElement('button');
  restore.className = 'restore';
  restore.type = 'button';
  restore.textContent = '● Transport Gaps · DEMO';
  restore.setAttribute('aria-expanded', 'false');
  restore.setAttribute('aria-controls', 'demo-panel');
  restore.hidden = true;

  const list = panel.querySelector('.sample-list');
  for (const sample of samples) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sample-button';
    button.setAttribute('aria-pressed', 'false');
    const number = document.createElement('span');
    number.className = 'sample-number';
    number.textContent = sample.symbol;
    const copy = document.createElement('span');
    const name = document.createElement('div');
    name.className = 'sample-name';
    name.textContent = sample.title;
    const hint = document.createElement('div');
    hint.className = 'sample-hint';
    hint.textContent = sample.impact;
    copy.append(name, hint);
    button.append(number, copy);
    button.addEventListener('click', () => selectSample(sample));
    list.append(button);
    sampleButtons.set(sample.id, button);
  }

  function selectSample(sample) {
    for (const candidate of samples) {
      const selected = candidate.id === sample.id;
      plots.get(candidate.id).dataset.selected = String(selected);
      plots.get(candidate.id).setAttribute('aria-pressed', String(selected));
      sampleButtons.get(candidate.id).setAttribute('aria-pressed', String(selected));
    }
    panel.querySelector('.category').textContent = sample.category;
    panel.querySelector('h2').textContent = sample.title;
    panel.querySelector('.description').textContent = sample.description;
    if (panel.hidden) {
      panel.hidden = false;
      restore.hidden = true;
      panel.querySelector('.minimize').setAttribute('aria-expanded', 'true');
      restore.setAttribute('aria-expanded', 'true');
    }
  }

  panel.querySelector('#show-samples').addEventListener('change', (event) => {
    overlay.toggleAttribute('hidden', !event.target.checked);
  });
  panel.querySelector('#plot-opacity').addEventListener('input', (event) => {
    overlay.style.setProperty('--plot-opacity', Number(event.target.value) / 100);
    panel.querySelector('output').textContent = `${event.target.value}%`;
  });
  panel.querySelector('.minimize').addEventListener('click', () => {
    panel.hidden = true;
    restore.hidden = false;
    restore.setAttribute('aria-expanded', 'false');
    panel.querySelector('.minimize').setAttribute('aria-expanded', 'false');
    restore.focus();
  });
  restore.addEventListener('click', () => {
    panel.hidden = false;
    restore.hidden = true;
    restore.setAttribute('aria-expanded', 'true');
    panel.querySelector('.minimize').setAttribute('aria-expanded', 'true');
    panel.querySelector('.minimize').focus();
  });

  root.append(overlay, panel, restore);
  document.documentElement.append(host);
  selectSample(samples[0]);
})();
