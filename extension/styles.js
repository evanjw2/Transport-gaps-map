globalThis.TransportGapsDemoStyles = `
  :host { all: initial; color-scheme: light; font: 13px/1.5 ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  button, input, select { font: inherit; color: inherit; }
  button, select, summary { cursor: pointer; }
  button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible, summary:focus-visible { outline: 3px solid #246483; outline-offset: 3px; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .panel { --ink: #253731; --muted: #58685f; position: absolute; top: 20px; right: 20px; width: 408px; max-height: calc(100dvh - 40px); display: flex; flex-direction: column; color: var(--ink); background: #fffdf7; border: 1px solid #b9c5b2; border-radius: 23px; box-shadow: 0 12px 45px #25373124, 3px 4px 0 #25373112; pointer-events: auto; overflow: hidden; }
  .hero { padding: 15px 18px 13px; background: #eef3df; flex-shrink: 0; border-bottom: 1px solid #dce4cd; }
  .explorer-launch { display: block; margin-top: 10px; padding: 8px 12px; border-radius: 9px; background: #253731; color: #fffdf7; text-align: center; text-decoration: none; font-weight: 750; font-size: 11px; }
  .brand-row { display: flex; align-items: center; gap: 8px; }
  .brand { font-size: 10px; font-weight: 850; letter-spacing: 1.5px; margin-right: auto; }
  .prototype { font-size: 8px; font-weight: 800; letter-spacing: .4px; padding: 4px 6px; border-radius: 6px; border: 1px solid #bcc9a4; background: #fffdf7; white-space: nowrap; }
  .minimize { display: grid; place-items: center; width: 27px; height: 27px; border: 1px solid #bcc9a4; border-radius: 8px; background: #fffdf7; font-size: 18px; line-height: 1; }
  .hero-main { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 11px; }
  h1 { margin: 0; font-size: 25px; letter-spacing: -.9px; line-height: 1.14; font-weight: 850; }
  .hero p { margin: 5px 0 0; font-size: 11px; color: #52634f; }
  .mascot { flex-shrink: 0; width: 62px; height: 56px; }
  .bus-body { transform-origin: 50% 85%; animation: welcome .65s ease-in-out 2; }
  .navigation { display: flex; gap: 4px; padding: 9px 14px; background: #fffdf7; border-bottom: 1px solid #e3e8db; flex-shrink: 0; }
  .navigation button { flex: 1; padding: 8px 5px; border: 0; border-radius: 9px; background: transparent; color: #58685f; font-size: 11px; font-weight: 750; }
  .navigation button[aria-pressed="true"] { background: #253731; color: #fffdf7; }
  .trust-banner { display: grid; gap: 3px; padding: 9px 18px; background: #f5f0fa; border-bottom: 1px solid #e6ddec; color: #5b486f; flex-shrink: 0; }
  .trust-banner strong { font-size: 9px; letter-spacing: .7px; }
  .trust-banner span { font-size: 10px; line-height: 1.5; overflow-wrap: anywhere; }
  .scroller { overflow-y: auto; min-height: 0; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #c6cfbd transparent; }
  .transit-browse, .road-browse, .about, .detail { padding: 16px; }
  .mode-chips { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
  .mode-chip { border: 1px solid #d7dfce; border-radius: 20px; padding: 6px 12px; background: #fffdf7; color: #52634f; font-size: 11px; font-weight: 700; }
  .mode-chip[aria-pressed="true"] { background: #eaf0e1; border-color: #687e5c; color: #304b35; }
  .filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .filter-grid label { font-size: 10px; font-weight: 700; color: #58685f; }
  select { display: block; width: 100%; min-width: 0; margin-top: 4px; border: 1px solid #d2dccb; border-radius: 9px; padding: 8px 5px; background: #fff; color: #354c3d; font-size: 11px; }
  .search-label { display: block; }
  input[type="search"] { width: 100%; border: 1px solid #d2dccb; border-radius: 10px; padding: 10px 11px; background: #fff; color: #253731; font-size: 11px; }
  input[type="search"]::placeholder { color: #65746a; }
  .access-filter, .motion-setting { display: flex; align-items: center; gap: 7px; margin: 11px 0; color: #52634f; font-size: 11px; }
  input[type="checkbox"] { accent-color: #42734c; width: 15px; height: 15px; margin: 0; }
  .filter-explanation { color: #65746a; font-size: 10px; margin: 8px 0 13px; }
  .result-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 10px; }
  .result-heading h2 { font-size: 12px; margin: 0; font-weight: 800; }
  .reset-transit { border: 0; background: none; color: #52634f; text-decoration: underline; font-size: 10px; padding: 3px; }
  .transit-list, .road-list { display: grid; gap: 13px; }
  .notice-card { --tone: #8a3e5d; --tone-tint: #f9eaf0; border: 1px solid #dde4d5; border-radius: 15px; background: #fff; padding: 14px; box-shadow: 0 2px 0 #25373105; }
  .tone-amber { --tone: #805716; --tone-tint: #fff3da; }
  .tone-blue { --tone: #246483; --tone-tint: #e6f1f5; }
  .tone-purple { --tone: #68548a; --tone-tint: #efeaf6; }
  .badge-row { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .line-badge { padding: 3px 7px; background: var(--line-tint); color: var(--line-color); border: 1px solid currentColor; border-radius: 6px; font-size: 10px; font-weight: 800; line-height: 1.3; }
  .demo-badge { background: #f1edf6; color: #68548a; padding: 3px 5px; border-radius: 5px; font-size: 8px; font-weight: 800; letter-spacing: .4px; }
  .timing { margin-left: auto; color: #65746a; font-size: 9px; }
  .impact { display: inline-block; padding: 3px 6px; border-radius: 6px; background: var(--tone-tint); color: var(--tone); font-size: 10px; font-weight: 750; margin-bottom: 8px; }
  .notice-card h3 { font-size: 15px; font-weight: 800; letter-spacing: -.3px; margin: 0 0 5px; line-height: 1.3; }
  .place { margin: 0 0 9px; color: #58685f; font-size: 11px; }
  .summary { margin: 0 0 10px; color: #3d5144; font-size: 12px; line-height: 1.6; }
  .next-step { margin: 10px 0; border-left: 3px solid #9eb58c; background: #f0f5eb; color: #3a553c; padding: 8px 10px; font-size: 11px; line-height: 1.6; border-radius: 0 8px 8px 0; }
  .provenance { font-size: 9px; color: #68548a; margin: 10px 0 7px; }
  .details-button, .back { border: 0; background: none; padding: 2px 0; color: #365c3d; font-size: 11px; font-weight: 750; text-decoration: underline; text-underline-offset: 3px; }
  .details-button:hover, .inline-link:hover { color: #1d4230; }
  .section-intro h2 { font-size: 21px; line-height: 1.2; letter-spacing: -.5px; margin: 0 0 8px; }
  .section-intro p { margin: 0 0 15px; color: #58685f; font-size: 12px; line-height: 1.6; }
  .source-badge { display: inline-block; background: #eaf0e1; color: #3a603e; border-radius: 5px; padding: 3px 6px; font-size: 9px; font-weight: 800; margin-bottom: 9px; }
  .fine-print { color: #617065; font-size: 10px; line-height: 1.6; margin: 9px 0; }
  .map-option { border: 1px dashed #b9c9ad; border-radius: 12px; padding: 12px; margin-top: 16px; background: #f3f6ed; }
  .inline-link { color: #365c3d; font-size: 11px; font-weight: 750; text-underline-offset: 3px; overflow-wrap: anywhere; }
  .detail h2 { font-size: 25px; line-height: 1.2; letter-spacing: -.6px; margin: 15px 0; }
  .detail-place { font-size: 12px; color: #58685f; margin: 10px 0; }
  .detail-copy { font-size: 12px; line-height: 1.7; color: #3d5144; }
  .data-warning { padding: 11px; border-radius: 10px; background: #fff1df; color: #7a4c24; font-size: 11px; line-height: 1.6; }
  .stop-sketch { list-style: none; padding: 3px 0 3px 9px; margin: 16px 0; }
  .stop-sketch li { position: relative; padding: 0 0 21px 22px; border-left: 3px solid #c28aa2; color: #3d5144; font-size: 12px; }
  .stop-sketch li:last-child { padding-bottom: 0; border-color: transparent; }
  .stop-sketch li::before { content: ''; position: absolute; top: 2px; left: -7px; width: 11px; height: 11px; border: 2px solid #9f4b70; border-radius: 50%; background: #fffdf7; }
  .facts { border: 1px solid #dde4d5; border-radius: 12px; padding: 3px 12px; margin: 14px 0; background: #fff; }
  .facts div { padding: 10px 0; border-bottom: 1px solid #edf0e8; }
  .facts div:last-child { border-bottom: 0; }
  dt { font-size: 9px; color: #65746a; font-weight: 750; text-transform: uppercase; letter-spacing: .6px; }
  dd { margin: 4px 0 0; font-size: 11px; line-height: 1.6; overflow-wrap: anywhere; }
  .detail-actions { display: grid; gap: 10px; margin: 15px 0; }
  .detail-actions .fine-print { margin: 0; }
  .empty { padding: 18px; border: 1px dashed #bdcbb2; border-radius: 12px; background: #f2f6ec; }
  .empty h3 { font-size: 15px; margin: 0 0 8px; }
  .empty p { color: #58685f; font-size: 11px; }
  .secondary-button { background: #fffdf7; color: #365c3d; border: 1px solid #bdcbb2; border-radius: 8px; padding: 7px 10px; font-size: 11px; font-weight: 750; }
  .about-card { padding: 14px; border: 1px solid #dde4d5; background: #fff; border-radius: 13px; margin: 12px 0; }
  .about-card h3 { font-size: 14px; margin: 0 0 6px; }
  .about-card p { color: #58685f; font-size: 12px; line-height: 1.7; margin: 0; }
  .historical .inline-link { display: inline-block; margin-top: 10px; }
  .footer { display: grid; gap: 3px; border-top: 1px solid #dde4d5; padding: 10px 18px; background: #f5f7ed; flex-shrink: 0; }
  .footer-hint { font-size: 10px; color: #52634f; font-weight: 700; }
  .footer-note { font-size: 9px; color: #65746a; }
  .restore { pointer-events: auto; position: absolute; top: 20px; right: 20px; padding: 12px 16px; border: 1px solid #b9c5b2; background: #eef3df; color: #253731; border-radius: 15px; font-size: 12px; font-weight: 750; box-shadow: 0 5px 20px #2537311a; }
  @keyframes welcome { 0%,100% { transform: rotate(0); } 45% { transform: rotate(-4deg) translateY(-2px); } 75% { transform: rotate(2deg); } }
  :host([data-motion="off"]) *, :host([data-motion="off"]) *::before { animation: none !important; transition: none !important; }
  @media (prefers-reduced-motion: reduce) { *, *::before { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
  @media (max-width: 700px) { .panel { top: auto; bottom: 12px; right: 12px; width: min(408px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); border-radius: 19px; } .hero { padding: 11px 14px; } .hero-main { margin-top: 7px; } h1 { font-size: 23px; } .mascot { width: 48px; height: 44px; } .prototype { font-size: 7px; } .brand { font-size: 9px; letter-spacing: 1.1px; } .navigation { padding: 7px 10px; } .transit-browse, .road-browse, .about, .detail { padding: 14px; } .restore { top: auto; bottom: 16px; right: 12px; } }
  @media (max-height: 580px) { .panel { top: 10px; bottom: auto; max-height: calc(100dvh - 20px); } .hero-main { display: none; } .hero { padding: 10px 14px; } .footer { padding: 7px 14px; } .restore { top: 10px; bottom: auto; } }
  @media (forced-colors: active) { .panel, .notice-card, .line-badge, .mode-chip, .restore { border-color: CanvasText; } .navigation button[aria-pressed="true"], .mode-chip[aria-pressed="true"] { outline: 2px solid Highlight; } }
`;
