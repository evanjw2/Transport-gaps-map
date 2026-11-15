# Transport Gaps Map

> **Work in progress — team review branch:** `prototype/munich-map-v0.6`. This is an experimental alternative, not an approved release or presentation choice. The team's v0.2 baseline remains on `main`; existing slides do not need to change yet. Start with [the team review guide](docs/TEAM_REVIEW.md) to compare and try this prototype.

An early-stage project to help people understand **where transport is disrupted, what to avoid, which services or facilities are affected, and how current the information is**, alongside Google Maps.

Potential disruptions include protests, strikes, vehicle or infrastructure breakdowns, road closures, and congestion. The first release focuses on awareness, not rerouting.

## Project status

**The v0.6 prototype is map-first, with the extension as a launcher and compact companion.** Open the Munich explorer for approximate station markers representing fictional transit examples, or switch to Roadworks for saved official source polygons. The map uses Leaflet and a Bavarian basemap—not Google tiles or an overlay inside Google's website. The [direction decision](docs/MAP_FIRST_DECISION.md) explains why this better supports transport awareness and future layers without fragile consumer-map integration.

Eight transit scenarios remain fictional; four have approximate station locations and four remain list-only rather than inventing geography. The road snapshot retains 5,790 municipal source features and manual Google My Maps KML export; these are not comprehensive coverage or that many confirmed closures. No live transit backend, route reading, notifications, rerouting or store release is implemented.

## Try the transport demo

Open **`extension/munich-map.html` in Chrome**, or install/reload the unpacked `extension` folder at `chrome://extensions` and click **Open the disruption explorer** in the toolbar popup. Click a station marker or card, search `U3`, and switch to **Roadworks** for saved source footprints. Street tiles require internet; packaged data and UI do not. Transit coordinates are approximate station centres, not exact entrances or affected track paths.

On the normal Google Maps website, the extension still shows the compact companion, with a link to the explorer; it does not inject geographic overlays there. `extension/preview.html` retains the offline compact-panel presentation. See the [pitch walkthrough](docs/PITCH_DEMO.md), [product/coverage guide](docs/PROTOTYPE_GUIDE.md), [demo guide](extension/README.md) and [map/export guide](docs/MUNICH_MAP.md).

## Why build this?

The hypothesis is that people need clearer, locally relevant explanations of disruptions than they can consistently find in their existing travel workflow. Google already provides traffic information in supported regions, so the opportunity is **context, provenance, freshness, and coverage gaps**, not claiming Google has no traffic data. See the official sources in the [feasibility review](docs/FEASIBILITY.md#official-sources).

We need to validate this hypothesis with users and a specific city's available data before investing in a large build.

The longer-term vision is a transport information layer, not just a blockage map: closures and areas to avoid, strikes and event-related changes, service reliability, accessibility/facility faults, and relevant weather context. A delay, a broken lift, or rainfall must not automatically be described as an area-wide closure.

## First release: disruption awareness

- Map-first transport-awareness explorer, with a lightweight Chrome companion beside Google Maps.
- One pilot city, selected after a data and licensing audit; Munich is now the researched candidate, not yet a team-approved commitment.
- Incident cards showing the affected place or service, disruption type, impact, source, verification status, and update time.
- Filters for disruption type, travel mode, and active or upcoming incidents.
- Clear loading, empty, stale, partial-coverage, and source-unavailable states.
- An **Open in Google Maps** action for incidents with reliable coordinates, plus route/stop descriptions when geometry is unavailable.
- A geographic view with explicit source precision and real/demo separation. Hosting, production provider and budget still require team approval.

**Not in the first release:** alternative-route calculation, automatic navigation changes, guaranteed real-time or worldwide coverage, public crowdsourcing, continuous location tracking, or native Google Maps mobile integration.

## Is a Google Maps extension feasible?

**Yes, as a browser companion; a supported plug-in inside the consumer map has not been established.** Chrome supports side panels and content scripts. Google's documented custom-overlay API applies to a map our application creates using Maps JavaScript API, not automatically to the map at `maps.google.com`. We should not depend on undocumented map internals or scrape Google traffic data. Evidence, trade-offs, policy constraints, and open questions are in the [feasibility review](docs/FEASIBILITY.md).

## Read and contribute

1. Read [the MVP and delivery plan](docs/PLAN.md) for milestones, workstreams, acceptance criteria, and starter tasks.
2. Read [the feasibility review](docs/FEASIBILITY.md) before choosing an integration or data source.
3. Use [the contribution guide](CONTRIBUTING.md) to propose work and submit a pull request.

Read [the map-first direction decision](docs/MAP_FIRST_DECISION.md) before adding features: public-transport relevance, useful geographic context and source honesty come before bigger parking datasets or decorative blocked areas.

For the proposed Munich pilot, read [the source audit and database plan](docs/MUNICH_DATA_PLAN.md). It recommends municipal roadworks first, documents a successful bounded GeoJSON polygon fetch, separates static transit data from permission-gated realtime access, and plans reviewed advance-event intelligence. No live-data backend has been implemented.

Suggested workstreams: product/design, extension/frontend, data/backend, and QA/privacy. People can own more than one; all ownership is currently unassigned.

## Future ideas

The [future backlog](docs/PLAN.md#future-updates--not-mvp-commitments) records live weather/rainfall integration and category styling, including legends and accessibility requirements. The active v0.6 explorer prioritizes transit impacts and source-backed roadworks; it does not paint fictional rain or area-closure patches. Weather feeds, authorized live transit data and operational reliability remain future work. Rerouting is deferred to a separate feasibility phase.

Additional planned ideas include source-backed advance warnings from news and official online notices, plus opt-in saved-route/history matching to notify users when their usual journeys may be affected. These require source verification, honest location uncertainty, explicit consent and route-data controls; the current extension does not collect travel history or send alerts. See F03 and F04 in the future backlog.

## Development

The demo uses JavaScript, CSS, SVG/canvas and bundled Leaflet/fflate with no build step or runtime package installation. The snapshot importer uses Node 18+. Installation and development checks are in the [demo guide](extension/README.md#files-and-development-checks). The planned side-panel/live-data backend is not implemented; there is no committed automated test suite.

## Trust and safety

This is a travel-information aid, not a safety guarantee. Missing reports do not mean an area is clear. Keep verified and unverified information distinct, show source freshness, and use neutral language for public events. Do not collect participant identities or individual protester locations.

## License and affiliation

The team has not selected a software license. Do not assume this repository or external data may be reused without permission. Transport Gaps Map is an independent project, not an official Google product.
