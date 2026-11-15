# Prototype direction: transport awareness, not a road-closure directory

Updated November 16, 2026. **Current direction: v0.6 map-first explorer**, with the extension retained as a compact companion. The [direction decision](MAP_FIRST_DECISION.md) supersedes v0.5's optional-map decision below. Open `extension/munich-map.html` for transit station markers, map/list selection and saved roadworks in one explorer. Uses the existing Bavarian basemap, not a Google basemap or in-place Google overlay. Four fictional transit scenarios have approximate station locations; four stay list-only. No invented rail paths, exact entrance locations or area closures.

## North star

Help a person understand **what could disrupt their travel, which services or facilities are affected, what to check or avoid, and how reliable/fresh that information is**. Include public transport, roads, access/facility faults and advance disruptions. Information should be useful alongside Google Maps without requiring a second map for every answer. Rerouting is not the current product.

The municipal feed was an accessible proof of geographic data, not a decision that parking notices should dominate the app. Prioritize public transport and actionable explanations over large feature counts, decorative polygons or apparent real-time certainty.

## Historical: what changed in v0.5

- **Public transport is the default**, with eight clearly fictional U-Bahn, S-Bahn, tram, bus, access, advance-strike and unconfirmed-event scenarios. Affected services, places and next checks are visible inline. A stop schematic is optional detail, not a claimed geographic trace.
- **Line/mode/timing/access filters** let users choose relevant examples manually. They do not inspect Google routes, calculate alternatives, store preferences or implement personal-route matching. The five example lines are not the full Munich network.
- **Roadworks is separate**, with 12 selected unmodified source features/fields from the existing full snapshot. Nine construction records appear by default; three no-parking notices are opt-in. Source precision, dates, retrieval times and attribution remain visible. Counts are records, not distinct incidents or confirmed road closures.
- **Maps are optional.** The companion panel draws no random shapes over Google Maps. A secondary geographic page retains the broader municipal source and KML export. It is not a transit map or an automatic Google Maps layer.
- **The visual design is quiet and friendly:** sage/cream surfaces, white rounded cards, small text-labeled line/impact badges, clear hierarchy, a tiny bus mascot, finite animation and reduced-motion support. Effects and provenance must remain understandable without colour.
- **About explains the limits**, privacy, source-backed advance-warning evidence and next milestones. A historical operator notice is not mixed into current scenarios.

## Trust boundaries

Transit scenario text lives in `extension/transit-data.js`. Real line/station names do not make those notices real; no live operator alert, departure, repair estimate or delay observation is connected. Official operator links are resources for checking independently, not citations confirming fictional notices. The hypothetical strike excludes S-Bahn; the event scenario explicitly leaves transport impact unconfirmed.

`extension/munich-highlights.js` retains selected municipal geometries, source fields and original snapshot metadata. It is small enough to load with the extension panel instead of injecting the roughly 5 MB full geographic dataset into every matching Maps page. Selection is a demonstrative subset, not a representative citywide ranking. Missing/reversed/old information is not silently promoted to current truth. The full source/rights/geographic caveats are in [the map guide](MUNICH_MAP.md).

The panel has no data requests, tracking, storage, alerts or analytics. External links and the optional map have their own network behavior. No Google Maps DOM/route scraping or private viewport projection is introduced.

## Next source-backed vertical slice

1. Obtain an authorized alert source covering a useful Munich transit subset. Ask for service notices, cancellations and delay/trip updates separately; one does not prove the others exist or are licensed for our use.
2. Map source-scoped lines/stops/trips to an audited static reference. Retain source publication versus fetch times, affected directions/segments and uncertainty. Do not infer a station closure from a lift fault.
3. Replace a clearly isolated scenario cohort with real records **only after** permissions, schemas, provenance, freshness, expiry and correction behavior are implemented. Keep separate empty, stale, partial-coverage and unavailable states. Do not make demo cards look live using a fake refresh clock.
4. Add reviewed advance-event notices after permitted ingestion and cancellation handling work. Then evaluate opt-in saved-line/journey alerts, local-first consent/deletion and notification quality. No silent history collection.
5. Validate that people can answer “Does this affect my travel, and why?” from the panel. A map is a secondary exploration tool, not a mandatory detour. Design routing only as a later, separately evaluated feature.

## Maintenance and acceptance

After an approved municipal import, run `node scripts/build-munich-highlights.mjs` to rebuild the selected subset. It copies original records/metadata and fetches nothing. Review the selected addresses and scope instead of assuming record IDs stay stable across imports. Reload the extension/pages afterward.

Check: mode/line intersection, upcoming filtering, S-Bahn exclusion from the hypothetical MVG strike, accessibility-only empty recovery, safe text rendering, detail/back focus, source labels on every card, source metadata and license links, no fake plots/network calls, parking opt-in, missing-source state, same-session filter retention, minimize/restore, short/narrow viewports and reduced motion. Actual installed Maps integration, authorized feeds and signed-in Google My Maps imports require separate verification. No automated test framework is added solely for this prototype.

Development validation on November 16 passed those panel checks in headless Chrome, including all eight details, source-subset field/geometry identity, unsafe-text/URL handling, repeated injection and four viewport sizes (1280×720, 390×740, 320×568, 920×420). The offline panel produced no external requests or page errors. Syntax, packaged resource/manifest references and local documentation links also passed. Browser tooling was temporary and remains outside the repo.
