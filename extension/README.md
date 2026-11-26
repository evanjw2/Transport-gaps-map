# Transport Gaps · extension folder (v0.7)

This folder is both the **website** (published with GitHub Pages) and the **unpacked Chrome extension**. There's no build step.

| File | Role |
| --- | --- |
| `index.html`, `app.js`, `app.css` | “Munich this morning” briefing: status, heads-ups, map, filters, QR share |
| `data/today.js` / `today.json` | Generated each morning by `scripts/morning-update.mjs`. Do not edit by hand. |
| `weather-codes.js` | Weather → travel-impact rules, shared with the Node script |
| `popup.html`, `popup.js` | Toolbar popup: today's status and top heads-ups |
| `companion.js` | Small collapsible card on google.com/maps (shadow DOM; it doesn't touch Google's map) |
| `munich-map.html` + `munich-*.js` | Advanced roadworks explorer, including Google My Maps KML export |
| `munich-snapshot.js` | Full city roadworks layer (~5 MB), loaded only when “All roadworks” is switched on |
| `vendor/` | Leaflet, fflate, qrcode-generator (see `vendor/README.md`) |

## Use it

- **Browser:** open `index.html` directly, or run `npm run serve` from the repo root and visit `http://localhost:8080/extension/`.
- **Chrome extension:** `chrome://extensions` → Developer mode → **Load unpacked** → select this folder. After `npm run morning`, click **Reload** on the extension card so the popup and the Google Maps card pick up the new data.
- **Phone:** use the published GitHub Pages link or the QR code from the **Share** button. Chrome extensions don't run on phones, so the website is the mobile version.

The page works offline with the morning's data. Map tiles (Bavarian mapping service) and the live weather refresh (Open-Meteo) need a connection. No tracking or analytics.
