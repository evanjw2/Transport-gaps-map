# Transport Gaps · map-first explorer and compact companion

Version **0.6.0**, no build step. The primary experience is now our own Munich geographic explorer; the Google Maps panel remains a compact companion. Read [the direction decision](../docs/MAP_FIRST_DECISION.md). The explorer uses a Bavarian basemap, not Google tiles or consumer-Maps overlays. Awareness comes before rerouting.

**Transit notices are illustrative scenarios, not live operator alerts.** The separate Roadworks tab contains selected saved municipal source records. Do not describe either as independently verified current travel information. No random-area plots are drawn over Google Maps in this version.

## Try it without installing

Open **`munich-map.html`** in Chrome. Search `U3`, select a card or station marker, or switch to Roadworks. All eight transit notices are fictional: four have approximate station centres, four intentionally have no map position. Shared stations expose each matching example. Markers are not track traces or exact entrances. Mode/timing/access filters affect markers and cards; the transit list is not restricted by the viewport. **Show example places** brings matching markers back into view.

Street tiles and external links need internet. Data, markers and UI are local, with no server, API key or package installation required. `preview.html` retains the offline compact-panel presentation. Roadworks defaults to construction; choose temporary no-parking explicitly. Its search/type/schedule, map-view list filter and KML export remain available.

See [the pitch walkthrough](../docs/PITCH_DEMO.md) and [product/coverage guide](../docs/PROTOTYPE_GUIDE.md).

## Install or update in Chrome

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose `/Users/evanong/Downloads/Transport-gaps-map/extension` (this directory).
3. If already installed, click **Reload** on its extension card.
4. Click the extension toolbar icon, then **Open the disruption explorer** for the map-first prototype.
5. Optionally refresh a supported Google Maps tab for the compact panel. It does not draw geographic overlays there; its header link opens our explorer. Dismiss Google's consent screen if present. **−** minimizes the panel; the small Transport Gaps button restores it.

Chrome's [unpacked-extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) describe the installation mechanism. This prototype is not a Chrome Web Store release or a native mobile Maps integration.

## Compact companion: public transport comes first

- Eight clearly labeled scenarios: U3 segment interruption, S8 partial interruption, U6 delay, Tram 19 stop/service change, Bus 58 departure cancellation, U3/U6 lift fault, an upcoming strike scenario and an event with unconfirmed transport impact.
- Filter by **U-Bahn, S-Bahn, tram or bus**, choose an example line, filter scenario timing, search stations/impacts, or show only step-free access examples.
- Cards show the affected line/mode, selected place/segment, impact, timing category and a useful next check **without leaving the panel**.
- Details retain source/uncertainty labels and display selected stations as a schematic only when supplied. A delay is not a closure; a lift fault is not a station closure; an announced event is not a confirmed block.
- Official MVG and S-Bahn links are places to check independently, **not sources confirming the fictional scenarios**. Delay minutes, disruptions and relative dates are illustrative. Station/line names are real references, not evidence of a current problem.
- Manual line filtering is not route matching. No Google route, browsing history, saved journey or departure feed is read. The example line list is not a full Munich line directory.

## Real municipal highlights, separately

The **Roadworks** tab includes 12 selected original source features from the November 15, 2026 full municipal snapshot: nine construction records and three temporary no-parking notices. Parking notices are **off by default**. Selection emphasizes a small readable set, not representative or complete coverage. Multiple features may describe the same works.

Cards retain the original German impact, affected facility and source dates. Details show provider, retrieval/response timestamps, the dataset and license, and optional map links. Unknown impact fields stay unknown. A source schedule does not establish that the restriction is currently in place; a parking-bay restriction is not an entire-street closure.

Source: Landeshauptstadt München, Mobilitätsreferat; [dataset](https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata), [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0). Retrieved `2026-11-15T22:12:31.304Z`; source response `2026-11-15T22:12:11.319Z`. Changes: selection of records/fields, formatting and display styling. Source contacts/HTML-link fields are excluded.

For all source footprints open **Roadworks** in `munich-map.html`, or use `munich-map.html#roads`. The explorer retains all 5,790 source features, actual source polygons, street basemap, filters and split KML export for **manual Google My Maps import**. Its transit view adds fictional station-level examples, not a live feed. See [the map guide](../docs/MUNICH_MAP.md). No signed-in Google import or installed-extension integration is claimed as verified by the offline preview.

## About, accessibility and privacy

**About** explains what works, what is fictional/unconnected, advance-warning evidence, next steps and privacy. A factual January/February 2026 strike example links to the historical operator notice; it is not displayed as current.

The panel uses soft sage/cream backgrounds, compact line badges, clear text alongside colour, one small bus welcome animation, keyboard-accessible controls, focus restoration, scrolling layouts and reduced-motion support. Escape returns from details, otherwise minimizes the panel. The animation can be disabled in About; system reduced motion always overrides it.

Preferences reset on refresh; filters are retained between tabs in the same page session. There is no location tracking, storage, analytics, route/history reading, notifications, scraping or runtime feed request. The panel itself makes no network requests. It is a content-script companion, **not** Chrome's native Side Panel API or a supported Google Maps map-layer integration. Page keyboard/wheel events inside the panel are isolated from underlying map controls.

Supported content-script targets remain HTTPS Maps documents on `www.google.com`, `maps.google.com`, `www.google.de`, and `www.google.co.uk`. Other country domains, embedded frames and native apps are unsupported. Refresh after loading/reloading the extension or after navigating from another Google page.

No extension API or broad host permissions are requested. The map HTML is web-accessible to supported Google hostnames so its launcher can work; executable code is bundled. The geographic explorer uses local Leaflet/fflate and online Bavarian street tiles, with a provider/privacy notice and off switch. No Google tiles or map internals are scraped. New external feeds would require a separate rights/security audit.

## Files and refresh

- `transit-data.js`: clearly fictional line/mode/service scenarios and official reference links.
- `munich-highlights.js`: selected official features and full source provenance; not a live feed.
- `content.js` / `styles.js`: isolated Shadow DOM companion and styling.
- `preview.html` / `preview.css`: offline pitch frame using the same panel scripts.
- `popup.html` / `popup.css`: transit-first extension entry point.
- `munich-map.*`, `transit-map.js`, `munich-snapshot.js`, `munich-export.js`, `vendor/`: geographic explorer, fictional station locations, full snapshot and licensed local dependencies.
- `data.js` and `munich-evidence.js`: older fixture/evidence files retained for history; **not loaded by the active panel**.

With Node 18+, refresh the full municipal snapshot and rebuild the small panel subset from the repo root:

```sh
node scripts/import-munich.mjs
node scripts/build-munich-highlights.mjs
```

Review source terms, payload changes, dates, selection and attribution before committing. The subset builder does not fetch or independently verify anything; it preserves original snapshot metadata. Reload the extension/pages afterward. This does not refresh fictional transit scenarios or create a live backend.

Development checks:

```sh
node --check extension/transit-data.js
node --check extension/munich-highlights.js
node --check extension/content.js
node --check extension/styles.js
node --check extension/munich-map.js
node --check extension/transit-map.js
node --check extension/munich-export.js
node --check scripts/import-munich.mjs
node --check scripts/build-munich-highlights.mjs
git diff --check
```

Manual acceptance: check every mode/line/timing/access filter, search and empty recovery, details/back/Escape/focus, tab/filter retention, real-versus-demo labels, source fields/links, parking opt-in, missing-source state, collapse/restore, repeated injection, narrow/short layouts and reduced motion. Rehearse the actual unpacked extension on Google Maps separately from offline checks.

Only fixed templates and packaged SVG use `innerHTML`; incident/source/search text uses `textContent`. Dynamic links reject non-HTTPS URLs except explicitly constructed local companion-page links. No fetched source content is interpreted as executable markup. This is a travel-information prototype, not navigation or a safety guarantee; missing reports never mean an area or service is clear.
