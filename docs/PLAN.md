# MVP and team delivery plan

Created October 30, 2026. Status: proposed first plan for team review. Owners, pilot city, budget, stack, and dates are **not assigned or approved**. This is not an implementation claim.

## Objective and scope

Help a person planning travel in one pilot city answer: **What is disrupted, where or on which service, why, and how reliable is the report?**

The MVP is a user-opened desktop Chrome side panel alongside Google Maps. Start with incident cards, filters, source links, and location links. Direct map overlays are optional research. Rerouting is explicitly a future update; the MVP does not calculate alternatives or modify Google navigation.

### Core user stories

- As a commuter, I can select an area and travel mode and see relevant active/upcoming disruptions.
- As a traveler, I can distinguish a closed road from congestion or a transit service interruption.
- As a cautious user, I can inspect the original source, affected place/service, freshness, and verification status.
- As a user with incomplete coverage, I can see when data is unavailable rather than being told the area is clear.

## Delivery sequence

Milestones are ordered by dependencies, not promised calendar dates. Estimate after discovery; build mock-data UI and feed research in parallel once the contract is agreed.

| Milestone | Deliverables | Exit criteria |
| --- | --- | --- |
| M0: Product and data discovery | Short user interviews, pilot-city shortlist, sample-source audit, permissions/privacy proposal, decision record. | Team chooses one pilot area, documents useful licensed source samples and freshness expectations, or explicitly chooses a mock-only prototype. |
| M1: Integration and UX spike | Manifest V3 scaffold, user-opened side panel with fixtures, wireframes, loading/empty/error states, manual area selection, Maps location link. | Loads unpacked in Chrome; cards are keyboard accessible; fixtures labeled; no private-map dependency; exact setup/test steps added to README. |
| M2: One-source vertical slice | Versioned incident contract, adapter, validation, storage/cache appropriate to pilot, incident API, source-health tracking. | A licensed source reaches the panel end-to-end; stale/resolved/duplicate/unknown-location cases demonstrated; secrets absent from client. |
| M3: Usable awareness MVP | Filters, detail view, attribution, freshness indicators, active/upcoming distinction, refresh control. | Acceptance checklist passes against fixtures and sampled live data; no route-avoidance or completeness claim. |
| M4: Small pilot and release review | Pilot feedback, reliability measurements, privacy notice, permission audit, release checklist, maintenance handover. | Team approves a limited release after data/policy review; store submission and approval remain separate steps. |

## Parallel workstreams

| Workstream | Initial tasks | Dependencies | Owner |
| --- | --- | --- | --- |
| Product/design | Interview approximately five target users, choose primary scenarios, design cards/filters/accessibility and trust labels. | Pilot shortlist and realistic source samples. | Unassigned |
| Extension/frontend | Scaffold panel and launcher, implement fixture-based UI, Maps links, local preferences, state handling. | Incident contract and agreed permissions. | Unassigned |
| Data/backend | Audit feeds, normalize one source, define lifecycle/deduplication, expose bounded API and health metadata. | Feed rights/access and pilot decision. | Unassigned |
| QA/privacy/release | Define test cases, validate attribution and minimal permissions, review sensitive data and release procedure. | Early prototypes, all sources, and chosen architecture. | Unassigned |

Suggested issue labels: `discovery`, `design`, `extension`, `data`, `backend`, `qa`, `privacy`, `blocked`, and `good first issue`. These are proposals; no labels or GitHub issues have been created by this document.

## Starter backlog

Convert these into issues with an owner, dependencies, and acceptance criteria. IDs here are planning IDs, not GitHub issue numbers.

| ID | Task | Done when | Depends on |
| --- | --- | --- | --- |
| T01 | Validate user problem and select city | Interview notes and city choice explain needs and coverage trade-offs. | None |
| T02 | Audit pilot data and permissions | Source inventory includes rights, sample, geography, freshness, limits, and outage behavior. | T01 shortlist |
| T03 | Agree incident contract | Shared schema and fixtures cover closure, delay, strike, approximate location, and missing geometry. | T02 samples |
| T04 | Sketch awareness UI | Reviewable normal, empty, stale, offline, and source-failure designs include accessibility notes. | T01, T03 |
| T05 | Scaffold extension | Unpacked panel loads with fixtures, minimal permissions, documented build/test steps. | T03, T04 |
| T06 | Implement first feed adapter | Validated source updates preserve identifiers, timestamps, attribution, and corrections. | T02, T03 |
| T07 | Implement incident API and health | Bounded queries and failures follow contract; zero incidents differs from unavailable coverage. | T03, T06 |
| T08 | Connect panel to API | Refresh, filtering, source links, staleness, and Maps links work without page scraping. | T05, T07 |
| T09 | Exercise reliability and privacy | Acceptance cases and permissions reviewed; sensitive data excluded from logs and fixtures. | T08 |
| T10 | Pilot and decide release | Feedback and reliability findings produce explicit release/defer decision and support owner. | T09 |

## MVP acceptance checklist

- [ ] Opening the extension does not interfere with ordinary Maps search, pan, zoom, or directions.
- [ ] The selected pilot area is explicit; changing Google Maps alone does not silently pretend to synchronize the panel.
- [ ] Every card shows cause/type, impact, travel mode, affected place/service, provenance, verification, and update time or explicit unknown values.
- [ ] Precise points/areas are shown only when supported by evidence; unknown geometry stays textual.
- [ ] Type/mode/status filters behave consistently and can be used with a keyboard.
- [ ] Links use documented Maps URLs for reliable incident locations; no claim is made that Google avoids these locations.
- [ ] Scheduled, active, resolved, expired, conflicting, duplicate, and unknown-end-time cases have agreed behavior and tests.
- [ ] Stale evidence is visibly distinguished from fresh evidence; source outages do not manufacture a new verification time.
- [ ] Empty responses include source coverage/health; “no reported incidents” never means “safe” or “unblocked.”
- [ ] Network failure, partial source failure, invalid payloads, refresh, and cached-data recovery have test cases.
- [ ] Untrusted source text and URLs cannot execute code or trigger arbitrary privileged requests.
- [ ] No server credentials, continuous location collection, journey history, or identities of event participants enter the client or logs.
- [ ] Attribution, feed rights, permissions, privacy disclosures, build instructions, and the release owner are documented.
- [ ] Fixture data is clearly marked; a live-data claim requires a verified live integration.

## Pilot measurements

Agree thresholds after measuring source behavior in M0; these are measurements to collect, not achieved results or service-level guarantees.

- End-to-end incident freshness, including source age separately from ingestion delay.
- Adapter success/failure rate and time since each source last succeeded.
- Sampled accuracy of affected locations/services, lifecycle, and duplicate handling.
- How quickly pilot users understand an incident and find its evidence.
- False/misleading report count and how quickly corrections reach the UI.
- Coverage gaps by incident type and travel mode, plus user-reported missing cases.

## Decisions needed from the team

1. Which city and travel modes have useful data and actual user demand?
2. Is one source enough to validate value, and which disruption categories must be explicitly marked unsupported?
3. Who owns each workstream, feed maintenance, incident correction, and release review?
4. What budget, hosting region, retention policy, and software license are acceptable?
5. Is a side panel with location links enough, or should a separately hosted companion map be approved?

Record decisions with date, owner, evidence, alternatives, and implications. Do not turn assumptions into requirements without review.

## Future updates — not MVP commitments

After a successful awareness pilot: additional sources/cities, a supported hosted spatial view, and moderated reporting if justified.

**Rerouting needs its own feasibility phase:** select a routing engine with appropriate avoidance support, obtain usable road-network/closure geometry and transit effects, test restriction semantics and timing, review licensing and safety, and measure route quality. Do not assume drawing an incident or opening a Maps link makes Google's route avoid it. No rerouting schedule is committed.
