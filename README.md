# Transport Gaps Map · Munich this morning

> **Prototype branch `prototype/munich-briefing-v0.7`** for team review. `main` still holds the v0.2 baseline the current slides use.

Google Maps tells you *how* to get somewhere. It rarely tells you that the tram is replaced by buses after an accident, that a march is crossing Odeonsplatz this afternoon, that the Christmas market makes Marienplatz a crush, or that 4 cm of snow is coming. **Transport Gaps gathers that every morning into one friendly briefing**: what's happening, where, why it matters, and one tap to open the spot in Google Maps.

**Scan a QR code → see today's Munich → tap a pin → it opens in your Google Maps app.** It works in any phone browser with no install, plus a Chrome extension for laptops.

## What it shows

| | Cause | From | Label |
| --- | --- | --- | --- |
| 🚦 | Every U-Bahn, S-Bahn and tram line: on time / +4′ / ✕2 cancelled, refreshed every 2 min | MVG departure boards at 17 big stations | **Live** |
| 🚨💥🚑🔧 | Breakdowns, accidents, emergency stops, heavy traffic, with **stops not served highlighted**, sections, MVG's advice in English and **ways around it** | MVG service notices + station/line lists | **Live** |
| 🚧 | Planned works, replacement buses, moved stops | MVG service notices | **Official** |
| 🦺 | Roadworks on the carriageway today | City of Munich open data | **Official** |
| ❄️🌧️ | Snow, rain, ice for 14 districts + DWD warnings | Open-Meteo (live in browser), Deutscher Wetterdienst | **Live / Official** |
| ✊📣🎟️ | Strikes, protests, matches, markets, festivals | Team-curated [`data/events.json`](data/events.json) | **Announced** |
| 📰 | Headlines about strikes, demos, closures | Local news RSS, headline + link only | **News lead** |
| 🧪 | Example protest, strike and lift fault to show the idea | `data/events.json` | **Example** (can be hidden) |

Tap a line to **highlight its route** through its stations (from MVV's timetable), with its ends labelled and disrupted stops marked. Tap any highlighted stop or big station for its **live departure board** (delays, cancellations). Each disruption suggests **ways around it**: nearby stations with other lines, walking time, a one-tap walking route in Google Maps, and local tips from [`data/tips.json`](data/tips.json).

On top of the list, **heads-up rules** stack causes together: *“Odeonsplatz: expect disruption, because demonstration march + Christmas market crowds + roadworks + snow.”* The overall status for the city is 🟢 smooth / 🟠 allow extra time / 🔴 expect disruption.

## Try it (1 minute)

- **Just open it:** double-click [`extension/index.html`](extension/index.html). No server or install needed.
- **Phone on the same Wi-Fi:** `npm run serve`, then open `http://<your-laptop-ip>:8080/extension/` on the phone.
- **Anyone, anywhere:** once GitHub Pages is on, use <https://evanjw2.github.io/Transport-gaps-map/>. The **Share** button in the page shows its QR code.
- **Chrome extension:** `chrome://extensions` → Developer mode → *Load unpacked* → choose the `extension` folder. The toolbar popup shows today's status, and Google Maps gets a small “Munich: Allow extra time” card.

## Update the data

```sh
npm run morning      # fetch everything, rebuild extension/data/today.* (~2 s)
npm test             # 19 tests for parsing, stops, alternatives, line paths and heads-up rules
npm run lines        # rebuild line routes from MVV's timetable (weekly in the Action)
```

A GitHub Action ([`.github/workflows/morning-briefing.yml`](.github/workflows/morning-briefing.yml)) runs this every morning and whenever `data/events.json` changes. Full details, including how to add a strike or protest in 2 minutes, are in **[docs/MORNING_BRIEFING.md](docs/MORNING_BRIEFING.md)**.

## Project layout

```
data/events.json              team-curated strikes, protests, events (edit me)
data/tips.json                local workaround tips (edit me)
scripts/morning-update.mjs    fetches sources, writes the briefing
scripts/briefing.mjs          pure parsing + heads-up rules (tested in briefing.test.mjs)
scripts/import-munich.mjs     validated import of the city roadworks dataset
extension/index.html|app.js   the briefing website / phone view / extension page
extension/network.js          live line status + departure boards (browser and script)
scripts/build-lines.mjs       MVV GTFS → extension/data/lines.js (line routes through stations)
extension/data/today.*        generated briefing (do not edit by hand)
extension/companion.js        small card on google.com/maps
extension/munich-map.html     advanced roadworks explorer + Google My Maps KML export
```

## Honest limits

- Morning snapshot plus live weather, not second-by-second. MVG's own app is the source of truth for departures.
- MVG notices are used from MVG's public website endpoint without a written reuse agreement. That's fine for a student demo, but needs permission before a public launch ([details](docs/MORNING_BRIEFING.md#sources-and-permissions-read-before-going-public)).
- Example scenarios are clearly marked and can be hidden with one toggle.
- Awareness, not rerouting. Missing reports never mean “all clear”.
- No tracking, accounts or analytics. Not affiliated with Google or MVG.

## More

[Pitch walkthrough](docs/PITCH_DEMO.md) · [Team review notes](docs/TEAM_REVIEW.md) · [Feasibility review](docs/FEASIBILITY.md) · [Munich data plan](docs/MUNICH_DATA_PLAN.md) · [Delivery plan](docs/PLAN.md) · [Contributing](CONTRIBUTING.md)

The team has not selected a software license yet. Third-party data keeps its own license (see the About dialog in the app).
