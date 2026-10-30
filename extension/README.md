# Transport Gaps · friendly transport layer

A no-build Manifest V3 extension, version 0.2.0. A small cartoon bus welcomes users to a transport-awareness layer: what to avoid, what might delay a journey, and which services or facilities need attention.

**Everything is fictional and screen-positioned.** Plots stay fixed when the map moves. They do not identify real roads, stations, events, services, weather, or the user's location. This is not navigation or travel advice, and does not implement the planned live-data MVP.

## Install or update in desktop Chrome

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Choose **Load unpacked**, then select this `extension` directory containing `manifest.json`. On the original computer: `/Users/evanong/Downloads/Transport-gaps-map/extension`.
3. If already installed, click **Reload** on its extension card instead.
4. Open or refresh a supported Google Maps tab. Find the **Transport Gaps / Sample City** panel on the right.

The toolbar popup links to Google Maps and the offline sandbox. Nothing is installed into your browser automatically. See Chrome's official [unpacked-extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## Preview without installing

Open `extension/preview.html` in a browser, or choose **Explore the offline sandbox** in the toolbar popup. It uses the same packaged code and an original illustrative map, not Google Maps content. No server, internet connection, API key, package installation, or build step is needed. The sandbox is useful for UI evaluation, not proof of live Google Maps compatibility.

## What's in v0.2

- Warm paper-like cards, rounded controls, a cartoon bus mascot, a short welcome wiggle, and gentle hover feedback. No continuous flashing or pulsing.
- Five transport examples: a bridge closure, a planned demonstration, a tram strike, a station lift fault, and road congestion.
- An opt-in sixth example: a dashed blue rain area, clearly labeled neither an observation nor a forecast. Rain is information, not evidence of a transport block.
- Category colours paired with icons, text labels and numbered plots; the category chips also form a legend.
- Search by fictional place, service, type or description; filter by travel mode, category, and active/upcoming sample status.
- **All updates** versus **Avoid & plan ahead** focus. The latter excludes information-only weather. Updates are sorted by impact, with current examples before upcoming ones within the same priority.
- Details explain the affected facility/service, relevant travel modes, timing uncertainty, illustrative travel notes, and lack of a live source or freshness time.
- Independent transport/rain layer toggles. Only matching updates appear in both the list and the plots; disabling a layer also removes its cards.
- Adjustable plot opacity, collapse/restore, narrow and short viewport layouts, keyboard controls, and explicit empty states that never say an area is clear.

## Try the interactions

1. Click an update or matching numbered plot to open its details. Use **Back to updates** or **Escape** to return.
2. Search for `Acorn` to find the accessibility example, or choose a travel mode to narrow the list and plots together.
3. Select **Upcoming** to see the fictional event. The timing is a scenario state, not an actual event schedule.
4. Enable **Rain sample** in the footer. Use **All updates** and **Everything** to include it with transport examples.
5. Open **Display settings** to change opacity or disable animations. The system reduced-motion preference always overrides the animation toggle.
6. Minimize the panel with **−** or **Escape** from the list. The **Transport Gaps · DEMO** pill or a visible plot restores it.

Preferences reset on refresh. Missing data is not evidence of a clear or safe area. Sample travel notes describe what a future product might communicate; no alternative route is computed.

## Permissions, data and limitations

Static content scripts match HTTPS Maps pages on `www.google.com`, `maps.google.com`, `www.google.de`, and `www.google.co.uk`. No added extension API permissions, broad all-sites access, third-party libraries, remote fonts, analytics, storage, geolocation, scraping, or data-source requests are used. All executable code, SVG artwork, and fixtures are packaged locally.

Other country domains, embedded Maps frames and the native mobile app are unsupported. Maps must load as a matching document: refresh if an in-page navigation from another Google page does not show the extension. Dismiss any Google cookie/consent screen first. Overlay shapes deliberately intercept clicks inside their areas; interactions outside the controls and plots pass through to the map. To see underlying controls, switch off the plots or minimize the panel as needed.

This remains a prototype, not a Chrome Web Store-approved release. We have not implemented geographic alignment, a supported Maps side-panel integration, real feed health, incident verification/expiry, actual weather, or rerouting. A static content-script UI is not a supported Google Maps map-layer API.

## Files and development checks

- `data.js`: fictional incidents, category palette, and travel modes.
- `styles.js`: isolated Shadow DOM styling and reduced-motion rules.
- `content.js`: UI rendering, filtering, plot interaction and detail state.
- `popup.html` / `popup.css`: extension entry point.
- `preview.html` / `preview.css`: offline illustrative-map sandbox using the same scripts.

From the repository root:

```sh
node --check extension/data.js
node --check extension/styles.js
node --check extension/content.js
node -e "const manifest = require('./extension/manifest.json'); if (manifest.manifest_version !== 3) throw new Error('Expected Manifest V3'); console.log('Manifest JSON valid')"
git diff --check
```

Manual acceptance: confirm synchronized filtering/list/plots, all detail views, empty-state recovery, independent layers, category labels, keyboard activation and Escape/back focus, opacity, collapse/restore, repeated-script protection, reduced motion, and narrow/short viewport access. Recheck the actual unpacked extension on Maps before claiming compatibility. The offline sandbox and isolated headless Chrome checks do not establish real Maps integration or store approval.

Only packaged static templates and predefined SVG icon paths use `innerHTML`. Search and incident content are rendered with `textContent`; no fetched input is interpreted as markup. Any future external data will need schema validation and safe rendering. Chrome documents this architecture in its [content-script guide](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).
