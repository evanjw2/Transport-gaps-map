# Transport Gaps Map

An early-stage project to help people understand **where transport is disrupted, what to avoid, which services or facilities are affected, and how current the information is**, alongside Google Maps.

Potential disruptions include protests, strikes, vehicle or infrastructure breakdowns, road closures, and congestion. The first release focuses on awareness, not rerouting.

## Project status

**The v0.2 transport-awareness demo is available; the live-data product is still in planning.** The [extension](extension/README.md) has a playful bus mascot, colour-coded plots, search and travel-mode filters, incident details, and an optional fictional rain layer. Five transport examples and one optional weather example stay fixed on screen, not on geographic locations. There is no backend, live feed, rerouting, or store release. The initial feasibility review was completed on October 30, 2026. Its recommendation for the eventual MVP remains a desktop Chrome extension with a side panel; a geographically anchored overlay on Google's consumer map remains experimental, not a promised feature.

## Try the transport demo

In desktop Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the repository's `extension` folder. Open or refresh Google Maps to see the sample plots. If already installed, reload the extension and refresh Maps. You can also open `extension/preview.html` directly for an offline sandbox with an original illustrative map. See the [demo guide](extension/README.md) for controls, checks, and limitations. All plotted disruptions are fictional and must not be used for travel decisions.

## Why build this?

The hypothesis is that people need clearer, locally relevant explanations of disruptions than they can consistently find in their existing travel workflow. Google already provides traffic information in supported regions, so the opportunity is **context, provenance, freshness, and coverage gaps**, not claiming Google has no traffic data. See the official sources in the [feasibility review](docs/FEASIBILITY.md#official-sources).

We need to validate this hypothesis with users and a specific city's available data before investing in a large build.

The longer-term vision is a transport information layer, not just a blockage map: closures and areas to avoid, strikes and event-related changes, service reliability, accessibility/facility faults, and relevant weather context. A delay, a broken lift, or rainfall must not automatically be described as an area-wide closure.

## First release: disruption awareness

- Desktop Chrome side panel opened by the user while planning a journey in Google Maps.
- One pilot city, selected after a data and licensing audit; no city is assumed yet.
- Incident cards showing the affected place or service, disruption type, impact, source, verification status, and update time.
- Filters for disruption type, travel mode, and active or upcoming incidents.
- Clear loading, empty, stale, partial-coverage, and source-unavailable states.
- An **Open in Google Maps** action for incidents with reliable coordinates, plus route/stop descriptions when geometry is unavailable.
- A map view in a separately hosted companion app only if the pilot demonstrates that spatial context is essential; provider and budget require team approval.

**Not in the first release:** alternative-route calculation, automatic navigation changes, guaranteed real-time or worldwide coverage, public crowdsourcing, continuous location tracking, or native Google Maps mobile integration.

## Is a Google Maps extension feasible?

**Yes, as a browser companion; a supported plug-in inside the consumer map has not been established.** Chrome supports side panels and content scripts. Google's documented custom-overlay API applies to a map our application creates using Maps JavaScript API, not automatically to the map at `maps.google.com`. We should not depend on undocumented map internals or scrape Google traffic data. Evidence, trade-offs, policy constraints, and open questions are in the [feasibility review](docs/FEASIBILITY.md).

## Read and contribute

1. Read [the MVP and delivery plan](docs/PLAN.md) for milestones, workstreams, acceptance criteria, and starter tasks.
2. Read [the feasibility review](docs/FEASIBILITY.md) before choosing an integration or data source.
3. Use [the contribution guide](CONTRIBUTING.md) to propose work and submit a pull request.

Suggested workstreams: product/design, extension/frontend, data/backend, and QA/privacy. People can own more than one; all ownership is currently unassigned.

## Future ideas

The [future backlog](docs/PLAN.md#future-updates--not-mvp-commitments) records live weather/rainfall integration and production category styling, including legends and accessibility requirements. The v0.2 demo now illustrates category colours and an optional rain patch using fictional fixtures only; licensed sources, true geographic alignment, and operational reliability remain future work. Rerouting is deferred to a separate feasibility phase.

Additional planned ideas include source-backed advance warnings from news and official online notices, plus opt-in saved-route/history matching to notify users when their usual journeys may be affected. These require source verification, honest location uncertainty, explicit consent and route-data controls; the current extension does not collect travel history or send alerts. See F03 and F04 in the future backlog.

## Development

The visual demo uses plain JavaScript, CSS, and SVG with no build step or dependencies. Its installation and development checks are in the [demo guide](extension/README.md#files-and-development-checks). The planned side-panel/live-data MVP is not implemented and does not yet have a toolchain or automated test suite.

## Trust and safety

This is a travel-information aid, not a safety guarantee. Missing reports do not mean an area is clear. Keep verified and unverified information distinct, show source freshness, and use neutral language for public events. Do not collect participant identities or individual protester locations.

## License and affiliation

The team has not selected a software license. Do not assume this repository or external data may be reused without permission. Transport Gaps Map is an independent project, not an official Google product.
