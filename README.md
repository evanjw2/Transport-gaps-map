# Transport Gaps Map

An early-stage project to help people understand **where transport is disrupted, why, and how current the information is**, alongside Google Maps.

Potential disruptions include protests, strikes, vehicle or infrastructure breakdowns, road closures, and congestion. The first release focuses on awareness, not rerouting.

## Project status

**Planning only — no extension, backend, live feeds, or installation package exists yet.** The initial feasibility review was completed on October 30, 2026. Its recommendation is a desktop Chrome extension with a side panel; a geographically anchored overlay on Google's consumer map remains experimental, not a promised feature.

## Why build this?

The hypothesis is that people need clearer, locally relevant explanations of disruptions than they can consistently find in their existing travel workflow. Google already provides traffic information in supported regions, so the opportunity is **context, provenance, freshness, and coverage gaps**, not claiming Google has no traffic data. See the official sources in the [feasibility review](docs/FEASIBILITY.md#official-sources).

We need to validate this hypothesis with users and a specific city's available data before investing in a large build.

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

## Development

There are no dependencies, build commands, or tests yet. Do not assume `npm install` or an extension installation flow is available. The first engineering milestone will add the scaffold and document exact setup, test, and unpacked-extension steps here.

## Trust and safety

This is a travel-information aid, not a safety guarantee. Missing reports do not mean an area is clear. Keep verified and unverified information distinct, show source freshness, and use neutral language for public events. Do not collect participant identities or individual protester locations.

## License and affiliation

The team has not selected a software license. Do not assume this repository or external data may be reused without permission. Transport Gaps Map is an independent project, not an official Google product.
