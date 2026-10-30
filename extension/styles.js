globalThis.TransportGapsDemoStyles = `
  :host { all: initial; color-scheme: light; font: 13px/1.5 ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  button, input, select { font: inherit; }
  button, summary, select { cursor: pointer; }
  button { color: inherit; }
  button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible, [role="button"]:focus-visible { outline: 3px solid #236a9b; outline-offset: 3px; }
  .icon { display: inline-flex; flex-shrink: 0; width: 18px; height: 18px; }
  .icon svg { width: 100%; height: 100%; }
  .plots { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
  .plot { cursor: pointer; pointer-events: none; }
  .plot polygon { fill: var(--category); fill-opacity: var(--area-opacity, .25); stroke: var(--category); stroke-width: 2.5; vector-effect: non-scaling-stroke; pointer-events: auto; stroke-linejoin: round; transition: fill-opacity .18s, stroke-width .18s; }
  .plot[data-type="weather"] polygon { stroke-dasharray: 7 5; }
  .plot:hover polygon, .plot:focus-visible polygon, .plot[data-selected="true"] polygon { fill-opacity: calc(var(--area-opacity, .25) + .15); stroke-width: 4.5; }
  .plot rect { fill: #fffdf7; stroke: var(--category); stroke-width: 2; vector-effect: non-scaling-stroke; }
  .plot text { fill: var(--category); font: 800 15px ui-rounded, sans-serif; text-anchor: middle; dominant-baseline: central; }
  .plot rect, .plot text { pointer-events: none; }
  .panel { --ink: #253731; --muted: #64716b; position: absolute; top: 80px; right: 22px; width: 368px; max-height: calc(100dvh - 102px); display: flex; flex-direction: column; background: #fffdf7; color: var(--ink); border: 1.5px solid var(--ink); border-radius: 24px; box-shadow: 5px 6px 0 #25373124, 0 12px 40px #25373115; pointer-events: auto; overflow: hidden; }
  .hero { flex-shrink: 0; padding: 18px 20px 15px; background: #f2f5d9; border-bottom: 1px solid #d9dfc7; }
  .brand-row, .hero-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .brand { font-size: 10px; font-weight: 850; letter-spacing: 1.8px; }
  .badge { border: 1px solid #a6ae82; padding: 3px 7px; border-radius: 6px; background: #fffdf7; font-size: 9px; font-weight: 800; letter-spacing: .6px; white-space: nowrap; }
  .hero-title { align-items: flex-end; margin-top: 13px; }
  h1 { font-size: 26px; font-weight: 850; line-height: 1.12; letter-spacing: -1.1px; margin: 0 0 6px; }
  .hero p { font-size: 11px; color: #506049; margin: 0; }
  .mascot { flex-shrink: 0; width: 77px; height: 70px; overflow: visible; }
  .mascot-body { transform-origin: 50% 85%; animation: hello-bus .5s ease-in-out 2; }
  .mascot-star { transform-origin: center; animation: twinkle .6s ease-in-out 2; }
  .header-controls { display: flex; align-items: center; gap: 8px; }
  .icon-button { display: inline-grid; place-items: center; border: 1px solid #c1c9b0; border-radius: 9px; width: 29px; height: 29px; background: #fffdf7; }
  .demo-banner { padding: 8px 18px; background: #ffeedc; color: #7d471f; font-size: 10px; border-bottom: 1px solid #eedbc6; flex-shrink: 0; }
  .scroller { overflow-y: auto; overscroll-behavior: contain; min-height: 0; scrollbar-width: thin; scrollbar-color: #c8cec0 transparent; }
  .browse { padding: 16px 18px 8px; }
  .search { display: flex; align-items: center; gap: 8px; padding: 9px 11px; border: 1px solid #d7dbd0; border-radius: 11px; background: #fff; color: var(--muted); }
  .search input { width: 100%; min-width: 0; border: 0; background: transparent; outline-offset: 6px; color: var(--ink); font-size: 12px; }
  .search input::placeholder { color: #738078; }
  .filter-row { display: flex; gap: 8px; margin: 10px 0; }
  select { min-width: 0; width: 100%; padding: 8px 6px; border: 1px solid #d7dbd0; border-radius: 9px; background: #fffdf7; color: #435249; font-size: 11px; }
  .scope { display: flex; background: #eaf0e4; border-radius: 10px; padding: 3px; gap: 3px; margin-bottom: 12px; }
  .scope button { flex: 1; border: 0; border-radius: 8px; padding: 7px 5px; background: transparent; color: #52634f; font-size: 11px; font-weight: 750; }
  .scope button[aria-pressed="true"] { background: #fffdf7; box-shadow: 0 1px 3px #25373120; color: var(--ink); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 15px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 5px 8px; border: 1px solid #d7dbd0; border-radius: 8px; background: #fffdf7; color: #526057; font-size: 10px; font-weight: 650; }
  .chip .icon { width: 13px; height: 13px; color: var(--category, #526057); }
  .chip[aria-pressed="true"] { border-color: var(--category, #253731); color: var(--category, #253731); background: var(--tint, #eaf0e4); }
  .results-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 4px 0 9px; }
  .results-heading h2 { font-size: 12px; font-weight: 800; margin: 0; letter-spacing: -.1px; }
  .results-note { font-size: 9px; color: var(--muted); }
  .incident-list { display: grid; gap: 9px; }
  .incident { display: flex; width: 100%; align-items: flex-start; gap: 10px; text-align: left; border: 1px solid #dce0d5; border-radius: 13px; background: #fff; padding: 12px; transition: transform .15s, box-shadow .15s; }
  .incident:hover { transform: translateY(-2px); box-shadow: 2px 4px 0 #25373114; border-color: var(--category); }
  .incident-icon { position: relative; display: grid; place-items: center; flex-shrink: 0; width: 35px; height: 39px; border-radius: 10px; background: var(--tint); color: var(--category); }
  .incident-icon small { position: absolute; bottom: -5px; right: -4px; background: #fffdf7; color: var(--category); border: 1px solid currentColor; border-radius: 5px; padding: 0 3px; font-size: 8px; font-weight: 800; }
  .incident-copy { flex: 1; min-width: 0; }
  .incident-name { font-size: 12px; font-weight: 800; letter-spacing: -.2px; }
  .incident-place { display: block; color: var(--muted); font-size: 10px; margin-top: 3px; }
  .incident-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin-top: 7px; font-size: 9px; }
  .impact { display: inline-block; color: var(--category); background: var(--tint); border-radius: 5px; padding: 2px 5px; font-size: 9px; font-weight: 750; }
  .status { color: #58645c; font-size: 9px; }
  .chevron { font-size: 18px; color: #788579; margin-top: 7px; }
  .empty { text-align: center; padding: 24px 12px; border: 1px dashed #c8d0c1; border-radius: 13px; background: #f3f6ee; }
  .empty .icon { width: 32px; height: 32px; color: #657f5d; }
  .empty h3 { font-size: 14px; margin: 9px 0 5px; }
  .empty p { color: var(--muted); font-size: 11px; margin: 0 0 12px; }
  .text-button { border: 1px solid #b7c3ae; border-radius: 8px; background: #fffdf7; padding: 6px 10px; font-size: 11px; font-weight: 750; }
  .details { padding: 16px 18px 10px; }
  .back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 15px; border: 0; padding: 0; background: none; color: #52634f; font-size: 11px; font-weight: 750; }
  .detail-top { display: flex; align-items: center; gap: 10px; margin-bottom: 11px; }
  .detail-top .incident-icon { width: 45px; height: 45px; }
  .detail-category { font-size: 10px; font-weight: 750; color: var(--category); }
  .details h2 { font-size: 22px; line-height: 1.2; letter-spacing: -.65px; margin: 5px 0 0; }
  .detail-place { font-size: 11px; color: var(--muted); margin: 0 0 10px; }
  .detail-description { font-size: 12px; color: #46554b; margin: 13px 0; }
  .facts { margin: 0; border: 1px solid #dce0d5; border-radius: 12px; padding: 3px 12px; background: #fff; }
  .fact { padding: 9px 0; border-bottom: 1px solid #eef0e8; }
  .fact:last-child { border-bottom: 0; }
  dt { font-size: 9px; text-transform: uppercase; letter-spacing: .7px; color: #667367; font-weight: 750; }
  dd { margin: 3px 0 0; font-size: 11px; color: #35443a; }
  .travel-note { margin-top: 12px; padding: 12px; border: 1px solid #ccd8be; background: #edf3e4; border-radius: 12px; }
  .travel-note strong { font-size: 11px; }
  .travel-note p { margin: 5px 0 0; font-size: 11px; color: #4f6146; }
  .provenance { font-size: 10px; color: #766253; margin: 12px 0 0; }
  .footer { flex-shrink: 0; border-top: 1px solid #dde2d4; padding: 10px 18px 12px; background: #f8f9ef; }
  .layer-toggles { display: flex; gap: 12px; align-items: center; font-size: 10px; font-weight: 750; flex-wrap: wrap; }
  .layer-toggles label { display: flex; gap: 5px; align-items: center; cursor: pointer; }
  input[type="checkbox"] { accent-color: #42734c; width: 15px; height: 15px; margin: 0; cursor: pointer; }
  .settings { margin-top: 8px; color: #63705d; font-size: 10px; }
  .settings summary { width: fit-content; }
  .settings-body { padding: 8px 0 0; display: grid; gap: 9px; }
  .range-row { display: flex; align-items: center; gap: 7px; }
  .range-row label { flex-shrink: 0; }
  input[type="range"] { accent-color: #42734c; min-width: 0; width: 100%; }
  output { min-width: 28px; }
  .motion-row { display: flex; align-items: center; gap: 6px; }
  .restore { position: absolute; right: 22px; top: 80px; display: flex; align-items: center; gap: 9px; padding: 11px 15px; background: #f2f5d9; border: 1.5px solid #253731; border-radius: 18px; box-shadow: 3px 4px 0 #25373125; color: #253731; font-weight: 800; font-size: 12px; pointer-events: auto; }
  .restore small { font-size: 9px; color: #7d471f; }
  @keyframes hello-bus { 0%,100% { transform: rotate(0); } 40% { transform: rotate(-5deg) translateY(-3px); } 70% { transform: rotate(3deg); } }
  @keyframes twinkle { 50% { opacity: .35; } }
  :host([data-motion="off"]) *, :host([data-motion="off"]) *::before, :host([data-motion="off"]) *::after { animation: none !important; transition: none !important; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
  @media (max-width: 700px) { .panel { top: auto; bottom: 12px; right: 12px; width: min(350px, calc(100vw - 24px)); max-height: 78dvh; } .hero { padding: 10px 16px; } h1 { font-size: 20px; } .hero p { display: none; } .mascot { width: 48px; height: 44px; } .hero-title { margin-top: 6px; } .chips { flex-wrap: nowrap; overflow-x: auto; padding: 3px 3px 7px; margin: -3px -3px 7px; scrollbar-width: thin; } .chip { flex-shrink: 0; } .restore { top: auto; bottom: 16px; right: 12px; } }
  @media (max-height: 540px) { .panel { top: 12px; bottom: auto; max-height: calc(100dvh - 24px); } .hero-title { display: none; } .hero { padding: 10px 16px; } .restore { top: 12px; bottom: auto; } }
  @media (forced-colors: active) { .plot polygon { stroke: Highlight; fill: Highlight; } .plot rect { fill: Canvas; stroke: CanvasText; } .plot text { fill: CanvasText; } .panel, .incident, .chip, .restore { border-color: CanvasText; } }
`;
