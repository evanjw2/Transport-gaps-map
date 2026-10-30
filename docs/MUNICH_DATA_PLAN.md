# Munich disruption data: feasibility and implementation proposal

Reviewed October 30, 2026. Research and proposed architecture, not an implemented backend or a coverage guarantee. Munich is the recommended pilot candidate, subject to team approval. This extends [the delivery plan](PLAN.md) and [integration feasibility review](FEASIBILITY.md).

## Recommendation

**Yes: a useful Munich transport-awareness database is feasible.** Start with licensed municipal roadworks, add transit network reference data, then obtain authorized operational alerts. Use official notices and permitted news sources for advance-event discovery with review, not as automatic proof of a closure.

The hard part is not database storage: it is permission, incomplete coverage, identifying affected services, expiry, corrections, and geographic precision. Do not promise every breakdown, jam, protest, or strike, or an exact polygon for every event. Publicly viewable information is not necessarily licensed open data; an open-source scraper does not grant rights to its upstream data.

The first live slice should be **Munich planned roadworks and restrictions**, not a citywide AI news scraper. It gives the team actual geometry and upcoming dates without blocking on a transit partnership. Keep the extension's current fictional demo separate. A real-data API does not solve anchoring polygons to Google's consumer map: retain the side-panel recommendation, with a separately hosted geographic map if justified.

## Sources and readiness

Readiness below describes evidence, not production approval. Published update cadences are provider descriptions, not measured delivery guarantees.

| Source | Useful contribution | Access, reuse, and freshness evidence | Remaining gate |
| --- | --- | --- | --- |
| Munich Mobilitätsreferat roadworks [S1–S3] | Current/upcoming construction and temporary parking restrictions; geographic features | Public WFS/GeoJSON; catalog says daily updates, four-week lookahead, and dl-de/by-2-0. Two features fetched successfully in this review. | Inspect full schema, stable identity, dates and coverage; implement attribution and change notice. Not a realtime breakdown/jam feed. |
| MVV developer downloads [S4] | Network-wide scheduled transit, stops/routes for matching alerts | GTFS and CSV; published CC BY and credit instructions. GTFS usually updated every four to eight weeks. | Confirm exact license version before redistribution, inspect feed identifiers/shapes, and version imports. Static schedules are not live disruptions. |
| MVG timetable downloads [S5] | Alternative scheduled network reference with stop locations and route paths | Official page describes GTFS downloads and Thursday updates. | Review download terms; use one reference dataset initially, not both indiscriminately. No live-alert permission established here. |
| BayernInfo via Mobilithek [S6–S7] | Road traffic and construction reports, potential congestion coverage | Official catalog describes DATEX II XML, HTTPS/SOAP and three-minute updates; links to Mobilithek offers. | Offer page required JavaScript in research fetch; exact license, onboarding/authentication, quota and Munich coverage not verified. “Free” is not sufficient rights evidence. |
| BEG / DEFAS Bayern [S8] | Potential authorized transit realtime access | VDV 453 DFI requires a data-transfer contract; TRIAS journey/departure access requires a portal agreement. | Ask specifically for disruption/service alerts and redistribution rights. Realtime departures do not establish a comprehensive alert feed. MVV's own timetable-system connection is described as closed beta [S4]. |
| Official MVG/MVV notices [S9] | Advance strike notices and actual service implications | Public operator notice verified; historical example below. | No automated extraction/redistribution permission verified. Start with permitted editorial summaries and evidence links; request a feed or agreement. |
| City/police event notices [S10] | Selected event-related restrictions and planned impacts | Official city event notice reviewed. | No comprehensive reusable Munich demonstration feed verified. Event existence is not evidence of a closure; schedules and routes can change. |
| DWD [S11] | Separate future weather-warning layer | Public CAP warning directory verified. | Product-specific terms, attribution, payload lifecycle and geographic coverage need audit. Main Open Data information page returned HTTP 403 in this research. CAP warnings are not a rainfall raster; radar needs a separate product audit. |
| Licensed news/RSS and community projects | Discovery leads and possible gaps | No specific news ingestion license or community incident dataset validated. | Audit provider terms, upstream rights, retention and corrections. RSS availability or a GitHub license alone does not authorize article republication. |

Municipal coverage caveat: the roadworks catalog prioritizes inner-city districts and main roads; construction elsewhere is only partially represented. Temporary parking restrictions generally have broader city coverage. Show this limitation in the UI. Do not label all returned features “blocked roads.” [S1]

### What was actually tested

On October 30, 2026, one unauthenticated bounded request to the catalog-linked WFS endpoint returned a GeoJSON FeatureCollection with two polygon features in requested WGS84 coordinates. No full dataset, GTFS archive, transit-alert payload, or Mobilithek subscription was tested. The endpoint is discovered through [the catalog's GeoJSON resource](https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata/resource/46f0ab67-d7f9-420f-b001-d9c34be8d197).

Reproduce the bounded read without downloading the full dataset:

```sh
curl --fail --location --max-time 30 \
  'https://geoportal.muenchen.de/geoserver/mor_wfs/ows?outputFormat=application%2Fjson&request=GetFeature&service=WFS&typeName=mor_wfs%3Abaustellen_opendata&version=1.1.0&maxFeatures=2&srsName=EPSG%3A4326'
```

Observed field names: `strasse_hausnr`, `betroffene_bereiche`, `beschreibung`, `beeintraechtigung`, `art`, `weitere_info`, `kontakt_oeffentlich`, `beginn_datum_kombiniert`, `ende_datum_kombiniert`, and `fachliche_id`.

Important adapter findings from this small sample:

- One polygon describes a parking bay (`Parkbucht`) with `Vollsperre`, not necessarily the full street. Map impact to the affected facility/mode, not just the severity word.
- Another feature combines carriageway and footway restrictions in concatenated text. Keep original meaning and flag ambiguous parsing; no invented universal classification.
- Dates are `DD.MM.YYYY` without times. Preserve date-only precision and Europe/Berlin context; do not fabricate exact closure times or confirmed actual opening.
- `fachliche_id` was null in both features. GeoJSON IDs existed, but their stability across refreshes is unknown. Confirm with the provider before assuming they are permanent identifiers.
- `weitere_info` can contain HTML. Render descriptions as text, extract only safe HTTP(S) evidence links, and never execute source markup. Do not ingest contact details unless genuinely necessary.
- A sample proves access and some geometry, not completeness, sustained uptime, geographic accuracy, or all supported geometry types. No raw source records are committed here.

### Advance warnings are possible, but service-specific

For example, MVG published a notice on **January 30, 2026** about the **February 2, 2026** strike. It distinguished affected U-Bahn/tram/city-bus services from unaffected S-Bahn, regional trains and MVV regional buses. This is a historical example, not a current warning. It demonstrates useful advance information, not guaranteed lead time for every event. [S9]

Represent an announced strike as affected operators/services and time windows, not a pink polygon claiming every street is blocked. A demonstration should initially be “event reported; transport impact unconfirmed” unless an authority/operator confirms restrictions. Show estimated event areas with explicit uncertainty, never as exact exclusion zones.

## Proposed architecture

This is a design recommendation, not an infrastructure selection already approved by the team.

```text
Approved sources -> scheduled source adapters -> validation / provenance
                                             -> review queue when ambiguous
                                             -> normalized incident revisions
                                             -> bounded incident + health API
                                             -> extension cards / optional hosted map
```

**A small TypeScript service, scheduled jobs and PostgreSQL with PostGIS** are a sensible target once access is proven: spatial filtering fits the polygon use case and versioned relational records fit corrections. A managed deployment is optional; compare operating cost, region, backups and team experience before choosing a vendor. For the first access/schema spike, fixtures and a local file are enough. Do not start with Kafka, a vector database, autonomous agents, or a bespoke routing engine.

Fetch centrally, not once per installed extension. Keep provider credentials on the server. Use the API shape already proposed in the feasibility review: bounded incidents by area/mode/type/status, optional bbox, and source health. An empty successful result must differ from missing coverage or a failed source.

### Minimal data model

| Entity | Purpose / important fields |
| --- | --- |
| `sources` | Owner, source URL, rights/terms evidence and review date, attribution, permitted retention/display, geographic/mode scope, auth reference, quotas and freshness policy. No credentials in published metadata. |
| `ingestion_runs` | Fetch result, source timestamp when provided, retrieved time, payload hash, schema version, validation failures and last successful complete snapshot. |
| `source_records` | Provider-scoped external key, content hash, first/last seen, evidence URL; licensed raw payload or minimal permitted evidence reference. Raw retention is source-specific, not automatically indefinite. |
| `incidents` and `incident_revisions` | Stable internal identity; cause separate from effect; title; affected modes; valid time/date precision; lifecycle; verification state; expiry; revision reason. |
| `incident_evidence` | Many-to-many links to source records, supporting/contradicting claims, permitted evidence, review outcome. Do not destroy provenance when merging. |
| `affected_entities` / `geometries` | Agency/dataset-version-scoped stops/routes/trips/roads, optional WGS84 geometry, precision, geometry meaning and derivation. A construction footprint is not automatically its entire travel-impact area. |
| `review_items` | Ambiguous dates/places, contradictory claims, proposed duplicates and unpublished AI extractions; reviewer and correction history. |

Use the existing incident contract rather than creating an incompatible second API. Extend it with evidence links, revision metadata, time precision and geometry meaning as needed. Keep verification independent of `scheduled`, `active`, `resolved`, `cancelled`, or `unknown` lifecycle. Expired evidence is stale/unknown, not automatically resolved.

### Ingestion and trust rules

1. **Approve a source first.** Record allowed fetching, storage, transformations, public display/API redistribution, commercial use if relevant, attribution and deletion obligations. If unclear, ask the owner; do not bypass access controls. This is a rights-review gate, not legal clearance.
2. **Fetch defensively.** Use source-specific cadences, bounded requests, timeouts, conditional requests when supported, backoff and quota limits. Start municipal refresh proposals at the published daily cadence; negotiate other cadences rather than assuming unlimited access. WFS full imports need verified pagination/completeness, not repeated first-page reads.
3. **Validate before promotion.** Check coordinates/CRS, geometry types/validity, text length, source IDs, dates and schema. Quarantine malformed updates. A partial/failed snapshot must not remove existing incidents. Retain last-known-good data with an honest stale label and finite expiry policy.
4. **Deduplicate cautiously.** Same-source IDs first, then reviewed matches using place/service, cause and overlapping time. Different publishers may repeat the same original claim; two copies are not two independent confirmations. Do not collapse a strike, its separate route cancellations and a nearby protest into one incident.
5. **Track changes and cancellation.** Preserve source publication versus retrieval times. Reconcile disappearance only under a documented complete-snapshot/deletion rule. Check upcoming events for corrections before notifying. Retry jobs idempotently so repeated imports create revisions only when meaning changes.
6. **Publish only supported claims.** Exact geometry where supplied and understood; approximate place/line/stop where derived; text-only when unknown. A catchment buffer may help discovery but must never be displayed as a confirmed closure boundary. Store original German text where permitted and review translated operational meaning.
7. **Measure coverage and health.** Monitor failures, observed source lag, stale share, mapping failures and reviewed duplicate errors. No incidents reported means no known incidents in available sources, not “safe” or “all clear.”

## News and AI: useful assistants, not the source of truth

Prefer structured operator/authority feeds, then permitted official announcements, then licensed news discovery. Avoid broad web scraping as the initial architecture. Add a small editorial form early: it lets the team record a permitted factual summary, evidence link, event dates, affected services and reviewer without pretending automated coverage exists.

If AI extraction is added later, give it permitted source text as untrusted data and require a schema containing event time, publication time, place, operator, impact claim, evidence location and uncertainty. Resolve relative dates against publication time; distinguish strike calls, negotiations, confirmed disruption and cancellation. A model must not invent coordinates, impacted routes or confirmation. Place names need a local gazetteer/reference match and ambiguity handling. Human review precedes publication for unstructured sources in the pilot. Model confidence is not verification. Do not give fetched text tools or execution authority.

For protests, store only transport-relevant public event information. Do not identify participants, infer political beliefs, collect private social posts, or maintain organizer/attendee profiles. Keep sensitive personal information and article text out of general logs. Preserve neutral wording.

## Phased team backlog

Owners and estimates remain unassigned; these are proposed issues, not created GitHub issues or calendar promises.

| Phase / proposed task | Owner role | Exit evidence |
| --- | --- | --- |
| D01: Approve Munich and source register | Product + data/privacy | Named pilot boundary/modes; approved rights record and visible coverage wording for first source. |
| D02: Roadworks schema/identity spike | Data/backend | Bounded and complete retrieval checked, date/geometry/field mapping documented, provider consulted about stable IDs and changed/deleted records. |
| D03: One-source vertical slice | Backend + frontend | Versioned records -> API -> labeled cards; attribution, upcoming/active precision, stale/outage/empty states, safe links and corrections demonstrated. No real polygon shown at fictional screen coordinates. |
| D04: Transit reference + access request | Data/backend | Inspect MVV static feed; identify supported modes/IDs; written answer from MVV/MVG/BEG on disruption alerts and rights. Do not make roadworks launch depend on a positive answer. |
| D05: Traffic reports | Data/backend + QA | Mobilithek offer/license/auth tested; Munich samples, entity matching and duplicate behavior reviewed; no congestion coverage claim before this. |
| D06: Advance-event editorial pilot | Product/editor + QA/privacy | Permitted notices produce reviewed scheduled/cancelled incident revisions; historical strike example and changing event tested; correction workflow assigned. |
| D07: Weather + saved-route alerts | Product + privacy + frontend | Separate weather product audit; opt-in saved routes before travel history, time/mode/service matching, local-first storage, deletion and deduplicated notifications. Rerouting remains separate. |

Suggested first provider questions:

- **Munich MOR:** Are WFS feature IDs stable? How are cancellations/deletions and inclusive end dates represented? What coverage, refresh limits, attribution wording and geometry semantics should consumers use? Catalog contact: `baustellen.mor@muenchen.de` [S1].
- **MVV/MVG/BEG:** Is an authorized disruption feed available, in GTFS-RT Alerts, SIRI-SX, TRIAS or another format? Which modes/operators, planned changes, strikes and accessibility faults are included? Are public caching/display/API redistribution permitted, and what are cost, credentials, quotas, retention and identifier mappings?
- **BayernInfo/Mobilithek:** Which offers cover Munich local roads versus the wider road network? Obtain exact DATEX II version/profile, license, onboarding, location encoding, cancellation rules and quotas.
- **Any news publisher:** Is ingestion and factual extraction allowed? What may be stored/shown, for how long, with what attribution and correction/removal procedure? No assumption that full articles can be archived.

### Release gates and fallback

Proceed with the narrow roadworks pilot only after rights/attribution review, full retrieval validation, safe field mapping and outage behavior pass. Observe refreshes over a team-agreed evaluation window before calling it reliable. Record actual hosting/API cost and source maintenance effort before expanding; no price or uptime commitment is made here.

If live transit permission is unavailable, release accurately labeled construction coverage plus reviewed permitted notices, not a simulated realtime feed. If news rights are unclear, keep links/manual research rather than storing article bodies. If geometry is uncertain, use cards/stop markers; do not paint a false precise blocked area. Personal saved-route data stays separate from public incident storage, with explicit consent and deletion; no Google travel-history access is assumed. See F03/F04 in [the delivery plan](PLAN.md).

## Primary evidence and limitations

Checked October 30, 2026. Documentation reviewed except where a limitation is stated; only the bounded Munich WFS read was payload-tested. Licenses must be rechecked before implementation. This is not a legal opinion.

- S1: [Munich roadworks catalog: scope, license, daily cadence and resources](https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata)
- S2: [GeoJSON resource metadata](https://opendata.muenchen.de/dataset/baustellen_4_weeks_opendata/resource/46f0ab67-d7f9-420f-b001-d9c34be8d197); bounded request above records the payload check.
- S3: [Data licence Germany – attribution – version 2.0](https://www.govdata.de/dl-de/by-2-0): permits reuse subject to source/license/dataset reference and marking changes.
- S4: [MVV developer area](https://www.mvv-muenchen.de/en/service-support/mvv-content-for-developers/): scheduled data and credit instructions; closed-beta timetable connection.
- S5: [MVG timetable downloads](https://www.mvg.de/verbindungen/Fahrplandaten.html)
- S6: [BayernInfo data offering](https://www.bayerninfo.de/datenangebot)
- S7: [BayernInfo individual-traffic data](https://www.bayerninfo.de/datenangebot/daten-iv); [linked traffic offer](https://mobilithek.info/offers/110000000002506000) required JavaScript and its terms were not inspected.
- S8: [BayernInfo public-transport data and BEG access routes](https://www.bayerninfo.de/datenangebot/daten-oev)
- S9: [MVG January 30, 2026 announcement for the February 2 strike](https://www.mvg.de/presse/pressemeldungen/2026-01-30-mvg-wird-bestreikt.html)
- S10: [City notice for the February 2026 Munich Security Conference](https://ru.muenchen.de/2026/28/Muenchner-Sicherheitskonferenz-Das-gilt-es-zu-beachten-122845): evidence of event-specific announcements, not a comprehensive event feed.
- S11: [DWD CAP warning directory](https://opendata.dwd.de/weather/alerts/cap/); [Open Data information page](https://www.dwd.de/DE/leistungen/opendata/opendata.html) returned HTTP 403; product reuse terms remain a gate.
- S12: [GTFS Realtime reference](https://gtfs.org/documentation/realtime/reference/): a candidate alert schema, not proof that a Munich feed exists or is licensed to us.
