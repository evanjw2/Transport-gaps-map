# Munich morning briefing (v0.7)

One script runs every morning, gathers everything that might slow down travel in Munich, and writes one small file that the website, the phone view and the Chrome extension all read.

```
GitHub Actions, daily ~06:15 Munich time
  └─ node scripts/morning-update.mjs
       ├─ MVG service notices ............ live incidents + planned changes (placed on stations)
       ├─ Open-Meteo, 14 districts ....... temperature, snow, rain for the next 12 h and today
       ├─ DWD warnings (via Bright Sky) .. official frost / ice / storm warnings
       ├─ Munich roadworks open data .... works on the carriageway active today
       ├─ tz.de headlines ............... strike / demo / closure headlines, as unconfirmed leads
       └─ data/events.json .............. team-curated strikes, protests, matches, markets
  └─ heads-up rules (scripts/briefing.mjs)
  └─ extension/data/today.json + today.js  →  committed  →  GitHub Pages republishes
```

The page also refreshes two things **live in the browser**, so they stay current between morning runs:

- **Weather** for the 14 districts, every 10 minutes (Open-Meteo).
- **Line status** (“Lines right now”), every 2 minutes while the page is open. It reads MVG's departure boards at 17 big stations (Marienplatz, Hauptbahnhof, Ostbahnhof, Pasing, Münchner Freiheit…) and computes each line's average delay and cancellations. Rules are in [`extension/network.js`](../extension/network.js): *disrupted* means an MVG incident, 2+ cancellations or ≥ 8 min average delay; *delayed* means ≥ 3 min average, a cancellation or one train ≥ 10 min late. Tap any station or stop on the map for its live departure board.

## Public transport detail: stops, sections and ways around

For every MVG notice the script reads MVG's German text:

| What | Example | How |
| --- | --- | --- |
| **Stops not served** (red ✕ on the map) | “Die Haltestellen St. Emmeram, Fritz-Meyer-Weg … können nicht bedient werden” | Phrase patterns, then each name is matched to MVG's station list (preferring Munich stops served by the affected mode) |
| **Where a line turns back** (orange ⇥) | “Die Linie 16 fährt nur im Abschnitt Effnerplatz <> Romanplatz” → *Tram 16 only runs Effnerplatz ↔ Romanplatz* | Same |
| **What MVG says** (translated) | SEV buses, free taxis, limited capacity, kerbside stops, diversions, “expected until 10:00” | Keyword → English sentence |
| **Ways around it** (green ✓) | “From Arabellastraße, walk ~2 min to Arabellapark: U4, Bus 150” | For affected stops, look up the lines at the stop and at stations within 700 m (MVG `/lines/{station}`), drop the affected lines, prefer U-Bahn/S-Bahn/tram, and estimate walking time from distance |
| **Local tips** | “Short U1/U2 interruption? Hauptbahnhof ↔ Sendlinger Tor is a 12-minute walk” | Hand-written in [`data/tips.json`](../data/tips.json), matched by line, cause, mode, station or effect |

Each alternative has a **Walking route in Google Maps** button and a **Live departures** button. These are suggestions, not a route planner, and the page says so.

### Line routes on the map

Tapping a line (in **Lines right now**, a heads-up's “See … live”, or a line badge under **Ways around it**) draws that line's route in its own colour with a white outline, so it stands out where lines cross. Stations are dots, end stations are labelled (“U3 → Moosach”), and tapping a station opens its live departures. Stops that aren't served and places where the line turns back are marked on top, and the rest of the map fades.

The routes come from **MVV's official GTFS timetable** (CC BY, credit “Münchner Verkehrs- und Tarifverbund GmbH (MVV)”). The feed has no track geometry, so `scripts/build-lines.mjs` draws each line **through its real stations in order**:
- It counts every stopping pattern per line in `stop_times.txt` and keeps the common ones, so branches like S2 to Petershausen / Altomünster / Erding are included.
- It drops express “shortcuts” that skip stations (longest first, only when the line also connects the same two stations by a route of similar length, so loops stay).
- It writes the result to `extension/data/lines.js` (~25 KB, 29 lines, ~390 stations).

Station IDs are the same as MVG's, which is why departure boards work on every station. Run `npm run lines` after MVV publishes a new timetable; the GitHub Action does it every Monday. Between stations the line is a straight segment, so it's accurate at city scale but not a track-level drawing. Buses are not drawn.

### Adding a local tip

Add an entry to `data/tips.json`. Every filter you give must match: `lines`, `causes`, `modes`, `stations` (part of a stop name) and `effects` (part of the English title, e.g. `"replacement buses"`, `"not served"`). Keep tips factual and checkable.

## Commands

| Command | What it does |
| --- | --- |
| `npm run morning` | Fetch all sources and rebuild `extension/data/today.*` (about 2 s) |
| `npm run morning:offline` | No network: curated events and the saved roadworks only (good for testing) |
| `npm run morning:full` | Also rewrite the full 5 MB roadworks map layer (`extension/munich-snapshot.js`) |
| `npm test` | Unit tests for the parsing, stop matching, line paths and heads-up rules |
| `npm run lines` | Rebuild U-Bahn / S-Bahn / tram routes from MVV's timetable (`extension/data/lines.js`) |
| `npm run serve` | Serve the repo at <http://localhost:8080/extension/> |

Options: `--no-mvg`, `--no-news`, `--now 2026-11-27T07:30:00+01:00` (pretend it is another time).

The script prints one line per source with ✓ / ✗, then the heads-ups it found. If one source fails, the briefing is still built and the About dialog shows that source as failed. If **both** MVG and weather fail, the previous briefing is kept and the run exits with an error, so the site never goes blank because of a network hiccup.

## Adding a strike, protest or event (no coding needed)

Edit [`data/events.json`](../data/events.json) on GitHub (pencil icon → commit). The Action rebuilds the briefing automatically on every change to that file.

```json
{
  "id": "mvg-warning-strike-2026-12-03",
  "cause": "strike",
  "status": "announced",
  "title": "Warning strike: U-Bahn, tram and MVG buses",
  "summary": "Ver.di called an all-day warning strike. S-Bahn is not affected.",
  "place": "MVG network (city-wide)",
  "lines": [],
  "modes": ["ubahn", "tram", "bus"],
  "timing": { "start": "2026-12-03T03:00:00+01:00", "end": "2026-12-04T02:00:00+01:00" },
  "severity": 3,
  "advice": "Use the S-Bahn, bike or walk.",
  "source": { "name": "MVG press release", "url": "https://www.mvg.de/..." }
}
```

| Field | Values |
| --- | --- |
| `cause` | `strike`, `protest`, `event`, `access` (lifts), `accident`, `technical`, `works`, `weather` |
| `status` | `announced` (dated, public source), `expected` (likely but unconfirmed), `demo` (made-up example, always labelled) |
| `timing` | One of: `{ "start", "end" }` for a one-off · `{ "dateFrom", "dateTo", "dailyFrom", "dailyTo" }` for something every day (markets) · `{ "demoDayOffset": 0, "dailyFrom", "dailyTo" }` for examples that always show *today* (+1 = tomorrow) |
| `lat`, `lng` | Optional. Leave them out for city-wide things like strikes; they then stay in the list only. |
| `lines` | e.g. `["U3", "U6", "S8", "19", "100"]`. The mode is guessed: U… / S… / tram numbers 10–29 / everything else bus. |
| `severity` | 1 good to know · 2 allow extra time · 3 big impact |
| `crowd`, `accessibility` | Optional flags |

Events appear from 7 days before they start and disappear when they end. For protests, record only transport-relevant facts (route, time, affected lines), never organisers or participants.

## How heads-ups are decided

`buildHeadsUps` in [`scripts/briefing.mjs`](../scripts/briefing.mjs):

1. **Weather, city-wide.** Snow (more than 0.2 cm in the next 12 h), wet and freezing conditions, storms, or any DWD warning. Snow under 5 cm means *allow extra time*; 5 cm or more, or freezing rain, means *expect disruption*.
2. **Hotspots.** A today-specific item (event, demo, incident, lift fault) with other things within 700 m. Its level is the item's severity, +1 if different causes stack up, +1 if snow or ice makes a level-2 situation worse. Roadworks can add to a hotspot but never start one, because there are hundreds every day.
3. **Serious line-wide incidents.** Live MVG incidents with replacement buses, interruptions or closures that have no station location.
4. **Plan ahead.** Strikes, protests and big events in the next 7 days.

The overall status (🟢 / 🟠 / 🔴) is the highest level among *today's* heads-ups. Plan-ahead items don't change it. When *Show example scenarios* is switched off on the page, heads-ups that depend on examples are removed and the status is recalculated.

German MVG text is classified into causes (accident, emergency services, heavy traffic, technical fault, works…) and effects (replacement buses, interrupted, diverted, delays…) with keyword rules. Each card shows a short English title plus the original German headline.

## Sources and permissions (read before going public)

| Source | Use | Status |
| --- | --- | --- |
| MVG `bgw-pt/v3/messages`, `/lines`, `/departures` + station list | Notice headline/lines/times/stops, lines per station, live departures at hubs; link back to mvg.de | Public endpoint used by mvg.de, robots.txt allows it, but **no written reuse permission yet**. Fine for a student demo; ask MVG before a real launch. Switch off with `--no-mvg`. |
| MVV GTFS timetable | Line routes through stations | CC BY, credit “Münchner Verkehrs- und Tarifverbund GmbH (MVV)” + feed version |
| Open-Meteo | Weather | Free, CC BY 4.0, attribution shown |
| DWD via Bright Sky | Official warnings | DWD open data |
| Landeshauptstadt München roadworks | Polygons + summary | dl-de/by-2-0, attribution shown |
| tz.de RSS | Headline + link only, keyword-filtered | Never stores article text; label “News lead” |
| `data/events.json` | Team-curated | Each entry needs a source link; examples are `status: "demo"` |

## Scheduling caveat

GitHub only runs `schedule:` workflows from the **default branch** (`main`). On the prototype branch, the workflow still runs on every push that touches `data/events.json` or `scripts/`, and via *Actions → Morning briefing → Run workflow* once the workflow file exists on `main`. Before a presentation day, run `npm run morning` and push, or merge to `main` so the 06:15 schedule takes over.
