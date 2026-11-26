# Geographic Munich map and Google My Maps export

> **Historical (v0.6).** The current prototype is the v0.7 morning briefing on `prototype/munich-briefing-v0.7`. See [MORNING_BRIEFING.md](MORNING_BRIEFING.md). Files mentioned below such as `preview.html`, `content.js` and `munich-highlights.js` were removed in v0.7.

Added November 15, 2026, in prototype v0.4; updated for v0.6 on November 16. The explorer is now the primary prototype, combining separate transit-example and saved-roadworks views. Read [the map-first decision](MAP_FIRST_DECISION.md). Geographic coordinates follow pan/zoom in our map, not the consumer Google Maps viewport.

## Try it now

Open `extension/munich-map.html` in Chrome, or choose **Open the disruption explorer** in the updated extension popup. No installation, server, API key or build step is needed for the standalone page. Transit opens first: eight fictional scenarios, four with approximate hand-placed station centres and four list-only. Click Marienplatz to choose between overlapping scenarios. Markers do not claim exact entrances, affected track paths or actual disruptions. Search/mode/timing/access filters apply to both cards and markers; no viewport filtering hides transit notices.

Choose **Roadworks** or open `extension/munich-map.html#roads` for source polygons and KML export. Construction is the default; temporary no-parking is an explicit filter choice. The following source/export details refer to this roadworks view, not the fictional transit notices. The explorer uses the existing Bavarian basemap, not a Google basemap or automatic overlay on Google's website.

The map opens in central Munich. Search for `Ohlmüllerstraße 1 - 19`, click its card, and the map fits the actual source polygon. Pan or zoom: the footprint stays at its geographic location. Try `Karlsfelder`, `Radweg`, or `Gehweg` for other records. Descriptions are original source text, not invented live reports or validated translations. Missing addresses/impact fields are explicitly labeled unknown.

Pink means a source-classified construction record; brown means a temporary no-parking record. These are source categories, not severity ratings. Small dots locate footprint bounding-box centres at city zoom; they disappear at zoom 16 so the source polygons are easier to inspect. Dots are not impact-radius circles, and source polygons are not necessarily full-road closure boundaries.

## Put the footprints on a Google map

The supported path for this prototype is **Google My Maps import**, not an automatic layer inside a normal Google Maps navigation session:

1. In our map, choose the records you want using the text, source-type and schedule filters. For the whole saved dataset, clear search and select **All reported types** and **All source dates**.
2. Click **Export filtered records for Google My Maps**. The downloaded ZIP contains KML files plus attribution/instructions. The list's **map-view** checkbox is not applied to export; the download includes all matches for the other filters, as its status message states.
3. Unzip the download. Sign in to [Google My Maps](https://www.google.com/mymaps), create a map, choose **Add layer → Import**, and upload the first `.kml` file.
4. Add a separate layer for each remaining KML file. Keep the source, snapshot date and license attribution when sharing. The current full snapshot exports to six files; exact polygon coordinates and holes are retained.
5. For tomorrow's presentation, open the imported My Maps map directly and check its display beforehand. Google also documents viewing My Maps through Google Maps; account/UI/platform behavior should be rehearsed. This does not alter routing, synchronize future updates, or automatically install our layer into an existing Maps session.

Exports use at most 1,000 source features per file and a conservative uncompressed size limit below 4.5 MB. Google's documentation currently specifies a 5 MB unzipped KML/KMZ limit and says not to import over 2,000 rows. Complex geometry and overall map/layer limits may still cause rejection; narrow the filters or use the companion map if this occurs. The export is structurally checked, but **no signed-in Google My Maps upload/import has been tested by this implementation**. Nothing is uploaded on your behalf.

Official instructions: [Import map features](https://support.google.com/mymaps/answer/3024836?hl=en), [Create a map](https://support.google.com/mymaps/answer/3024454?hl=en), and [View My Maps through Google Maps](https://support.google.com/maps/answer/3045850?hl=en).

## What the snapshot covers

The full bounded WFS request returned **5,790 of 5,790 matched source features** on November 15, 2026. Response timestamp: `2026-11-15T22:12:11.319Z`; retrieval: `2026-11-15T22:12:31.304Z`. All source Polygon/MultiPolygon geometries were retained. This is completeness of that one response, **not completeness of Munich disruptions**. A feature is not necessarily a distinct construction project; multiple polygons/records may describe the same work.

The source is Munich Mobilitätsreferat's [roadworks and temporary restrictions dataset](https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata), licensed [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0). Its published scope includes current/planned construction and temporary no-parking restrictions in the coming four weeks; construction coverage emphasizes inner-city districts and main roads, with patchier construction coverage elsewhere. Some long-running records extend beyond that horizon.

**Not established:** comprehensive service cancellations, strikes, demonstrations, traffic jams, breakdowns, station/lift failures, or actual current on-site conditions. Those need additional authorized sources under [the data plan](MUNICH_DATA_PLAN.md). Do not add invented events to increase apparent coverage. Do not equate every no-parking record with a blockage.

Source date strings are retained, including any time text. Filters interpret the date component in Europe/Berlin against the **saved snapshot day**, not a live clock or a confirmed active state. Missing/malformed/reversed dates remain unknown. The default hides records whose reported end precedes the snapshot day; **All source dates** includes them. The header shows snapshot age. There is no per-record source-update timestamp in the imported fields; response time is not a claim that every record was freshly verified.

## Refresh the packaged snapshot

Use Node 18 or newer. From the repo root:

```sh
node scripts/import-munich.mjs
```

Review the result before committing it. The script requests WGS84, verifies matched/returned counts, IDs, supported geometries, ring closure and coordinates within a broad Munich safety envelope; then writes a replacement atomically. A truncated/empty response or schema/geometry error fails without replacing the previous snapshot. If the provider begins returning more than the 20,000-feature request limit, the import fails rather than silently publishing partial coverage; implement a documented pagination strategy before increasing scope. Raw contact and HTML-link fields are excluded. Dates/impacts are interpreted conservatively in the viewer.

To validate a previously saved full response without claiming it was fetched anew:

```sh
node scripts/import-munich.mjs --input /path/to/response.json \
  --fetched-at ORIGINAL_RETRIEVAL_TIMESTAMP --output /path/to/review-snapshot.js
```

This is a manually refreshed packaged snapshot, not a backend or runtime source subscription. Reload/reopen the map after replacing it, and reload the extension if installed. In v0.5, run `node scripts/build-munich-highlights.mjs` after an approved full import to rebuild the small selected-record subset used by the panel; it copies original records and timestamps without a new fetch. Older single-record fixture files remain in the repo but are no longer loaded by the active companion.

## Map provider, licensing and privacy

The basemap is **Webkarte Grau Bayern**, not Google tiles. It uses the official Bavarian WMTS in Web Mercator; GeoJSON is supplied in WGS84 longitude/latitude and Leaflet projects it into the same map coordinate system. This avoids dependence on private Google pan/zoom internals.

- [WMTS service capabilities](https://geoservices.bayern.de/od/wmts/geobasis/v1/1.0.0/WMTSCapabilities.xml), layer `by_webkarte_grau`, matrix set `smerc`.
- [Service description](https://geodatenonline.bayern.de/geodatenonline/seiten/wmts_ba).
- [Provider's use/attribution requirements](https://geodaten.bayern.de/odd/m/3/pdf/WMTS_Nutzungshinweise.pdf) allow commercial/non-commercial app/web use, require visible source credit and disclaim availability. The credit shown follows current capability wording: Bayerische Vermessungsverwaltung, GeoBasis-DE / BKG 2021/2023 – Daten verändert. Recheck terms before a public deployment.

Street tiles require internet and reveal the requested tile area and client IP to the provider. The toggle removes this layer; no geolocation, journey tracking, analytics, tile prefetch/archive, or Google scraping is used. If tiles fail, the UI warns that the background is incomplete while geographic source data remains usable. No new extension API or broad host permissions were added. Only the companion HTML page is web-accessible to supported Google hostnames for the launch link; executable code remains bundled.

Leaflet 1.9.4 and fflate 0.8.2 are vendored locally with upstream licenses; see [third-party notices](../extension/vendor/README.md). No remote executable code is loaded. The KML download is generated locally and does not sign in or publish to Google.

## Validation and remaining checks

The snapshot was compared field-by-field and coordinate-by-coordinate with the retrieved response; the importer rejects partial responses, wrong CRS and swapped coordinates. Full export checks preserve all records and stay within the chosen per-file count/size caps. Headless Chrome checks passed for real basemap tiles, search/type/schedule filtering, source details, pagination, exact source coordinates and pan anchoring, unknown/invalid/reversed dates, empty states, ZIP download with six parseable KML files, Escape/back handling, tile failure, source-text safety and desktop/mobile layouts. There is no committed test framework; development checks use syntax checks and temporary headless-browser tooling outside the repo.

Rehearse the installed extension on actual Maps and any My Maps import separately. A working companion map is not proof of a supported automatic consumer-Maps overlay or Google import acceptance.
