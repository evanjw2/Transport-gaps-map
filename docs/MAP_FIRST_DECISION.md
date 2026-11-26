# Direction decision: map-first awareness, extension as companion

> **Historical (v0.6).** The current prototype is the v0.7 morning briefing on `prototype/munich-briefing-v0.7`. See [MORNING_BRIEFING.md](MORNING_BRIEFING.md). Files mentioned below such as `preview.html`, `content.js` and `munich-highlights.js` were removed in v0.7.

Implemented as an experimental direction for prototype v0.6 on November 16, 2026. **Not a team-approved product direction, release or presentation choice.** This work is shared on `prototype/munich-map-v0.6` for review; the v0.2 baseline and existing presentation remain on `main`. See [the team review guide](TEAM_REVIEW.md). No production-platform or budget approval is implied.

## Recommendation

Make **our own geographic disruption explorer** the main product experience. Keep the Chrome extension as its launcher and a compact information companion beside Google Maps. Do not make an undocumented consumer-Google-Maps overlay a critical dependency.

The user's goal is to understand where travel is disrupted, which services or facilities are affected, and what to check before travelling. It includes U-Bahn, S-Bahn, trams, buses, roads, accessibility, advance strike/event warnings and eventually weather. It is not merely a road-closure directory, and rerouting remains deferred. Owning the map makes geographic position, selection, filters, source precision and future layers ours to control and test. It also lets the prototype work without installing an extension.

## Provider choice, made explicit

For this iteration, reuse **Leaflet and the existing Bavarian Webkarte Grau basemap**. This is not a Google-powered map and not an overlay on Google's consumer website. The source/license and tile privacy details remain in [MUNICH_MAP.md](MUNICH_MAP.md). No new paid provider, credential, server, deployment or source collection is introduced.

A dedicated Maps JavaScript API map remains an option if the team later prioritizes Google's basemap. Google's documented shapes attach to a map object the application owns, not automatically to an existing consumer Maps tab. Normal Maps JavaScript API setup requires billing and credentials; Google also offers limited demo-key capabilities, whose eligibility and restrictions must be checked separately. Do not promise a production Google map without account setup, key restrictions, cost controls and terms review. Changing providers does not acquire live disruption data.

An in-page consumer-map overlay is a separate research spike, not the selected implementation. A reliable adapter would need to prove coordinate alignment during panning, zooming, resizing, map-style changes and rotation without private API dependence or scraping. Fixed screen patches are not an acceptable substitute.

Official references reviewed November 16, 2026:
- [Google shapes and lines](https://developers.google.com/maps/documentation/javascript/shapes)
- [Google API setup](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [Google usage and billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Leaflet geographic layers and markers](https://leafletjs.com/reference.html)

## Implemented v0.6 slice

- The toolbar popup opens `extension/munich-map.html` as the primary experience. The Google Maps companion has an always-visible explorer link. `#roads` opens the saved roadworks layer directly.
- One explorer contains separate **Public transport** and **Roadworks** views, preventing fictional transit notices from being mistaken for municipal reports. Construction is the default road category; parking remains available explicitly.
- Public transport reuses the eight existing fictional scenarios, with search, mode, timing and step-free-access filters. Four scenarios have approximate station locations; four deliberately remain list-only. Marienplatz shares two scenarios in one selectable marker rather than hiding one behind the other.
- Station coordinates in `extension/transit-map.js` are manually authored illustrative station centres. They are not operator-supplied coordinates, surveyed entrances or precise fault locations. Markers follow pan/zoom; no invented track trace, disruption radius or district-wide closure is drawn.
- All eight scenarios remain fictional; station names do not establish a real incident. Roadworks retain original source polygons and provenance. These are saved notices, not verified live road closures.
- Street tiles need connectivity; filters, details, markers and polygons are bundled. Tile-disabled and failed-load states remain explicit. No automatic location, Google routes/history, analytics, notifications or rerouting.

## Next team milestone

1. Obtain one authorized, licensed transit-alert source and matching agency-scoped static stop/route identifiers; record access and reuse terms first.
2. Normalize notices into incident type, affected entities, validity, source publication/retrieval times, verification and geometry precision. Model an unknown location explicitly.
3. Resolve real stop locations only against approved source data. Draw exact corridors only when actual source geometry supports that scope. Never treat a delayed service or lift fault as an area closure.
4. Add freshness/source-health states and correction/expiry handling before calling the map live. Validate the product with Munich commuters, including a step-free travel use case.
5. Add reviewed advance warnings, then opt-in saved journeys and weather as independently labelled layers. Provider migration and rerouting require separate decisions.

## Validation boundary

Verify the explorer locally at desktop and phone sizes, map/list selection, shared-station popups, filters, missing data and tile failure. Test station marker coordinate stability after pan/zoom, and retain the existing roadwork polygon/export checks. Local browser checks do not prove installation on the user's Maps tab, live alert accuracy, Google integration or My Maps import success.

Executed local checks for this iteration: headless Chrome at 1280×800, 390×740, 320×568 and 920×420; marker pixel anchors matched Leaflet's coordinate projection within one pixel before and after pan/zoom; eight cards/four located scenarios/seven shared station markers; search/mode/timing/access filters, marker popup selection, selection dimming, detail/Escape, empty results, unavailable road/transit data, offline tiles, basemap off, view switching and `#roads` deep links. No page errors in the successful run. Also checked compact-panel launch link, manifest/local assets, JavaScript syntax, whitespace, 27 local documentation links and full-snapshot KML export (5,790 features across six size-bounded parts). An additional connected desktop smoke check loaded Bavarian street tiles. These are local checks, not a deployed service or a verified installation on the user's Chrome profile.
