# MVP and team delivery plan

Created October 30, 2026. Status: proposed first plan for team review. Owners, pilot city, budget, stack, and dates are **not assigned or approved**. This is not an implementation claim.

Prototype update: the [v0.2 awareness demo](../extension/README.md) provides a no-build extension with category colours, travel-mode/category/timing filters, search, details, accessibility information, and an optional fictional rain patch. A cartoon bus mascot, brief animations with reduced-motion support, and an offline illustrative-map sandbox make the concept easier to explore. This is screen-positioned, not geographically anchored, and does not complete M1's planned side-panel scaffold or any live-data milestone.

## Objective and scope

Help a person planning travel in one pilot city answer: **What is disrupted, where or on which service, why, and how reliable is the report?**

The broader use case is a transport information layer: help people identify places to avoid while also understanding delays, service changes, accessibility and facility functionality, and relevant weather context. Clearly distinguish a blocked area from a service-specific issue or information-only update. The current demo illustrates this distinction, but does not offer real travel advice.

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

### F01: Weather and rainfall overlay

Idea recorded October 30, 2026. Status: fictional rain-layer interaction illustrated in v0.2; live weather integration not implemented. Owner and delivery date for live integration: unassigned.

- Add an optional weather layer showing where rain is observed or forecast, with an intensity legend and a separate weather visibility toggle.
- Clearly distinguish observations from forecasts and display the provider, observation/forecast valid time, last successful refresh, and stale/unavailable states.
- Keep weather separate from disruption reports: rain by itself must not be labeled as a confirmed transport blockage.
- Before implementation, evaluate pilot-area coverage, spatial resolution, update frequency, licensing/attribution, costs, and how to geographically anchor the layer. The current screen-positioned demo cannot represent real rainfall locations.
- Acceptance target: weather and disruption layers can be toggled independently; timestamps and units are understandable; overlapping layers remain readable; provider failure never implies no rain or no disruption.

### F02: Disruption-specific colours and legend

Idea recorded October 30, 2026. Status: category colours, icons, numbered markers and filters illustrated in v0.2; production validation and overlap handling remain open. Owner and delivery date for production work: unassigned.

- Replace the all-pink visual language with a consistent colour per disruption category: strikes, protests/public events, transport blocks/closures, breakdowns, and congestion.
- Starting palette for design review only: hot pink for blocks/closures, amber for strikes, purple for protests/public events, red for breakdowns, and orange for congestion; reserve a separate blue scale for rainfall. Final colours require contrast and colour-vision checks, not just visual preference.
- Add a visible legend, category filters, and text labels/icons or patterns so colour is never the only way to understand an area.
- Keep category separate from severity and verification. Changing a category colour must not imply that an incident became more severe or more trustworthy.
- Define how overlapping categories appear and how unknown categories fall back to an explicitly labeled neutral style.
- Acceptance target: every plotted area matches its card and legend; category changes update both together; keyboard users can inspect the same information; weather and transport colours remain distinguishable.

The current extension illustrates these ideas with five fictional transport updates and one opt-in fictional rain update. It has no actual weather observations, forecasts, live incidents, or geographic anchoring. Team members can turn the remaining F01 and F02 work into issues after agreeing scope and dependencies; these IDs are not GitHub issue numbers.

### F03: Advance disruption intelligence from news and online notices

Idea recorded October 30, 2026. Status: proposed, not implemented. Owner and delivery date: unassigned.

**User benefit:** learn about a possible strike or other planned disruption before it begins, including when it may happen and which places, services or routes could be affected.

- Evaluate licensed news feeds and permitted online information sources alongside official operator, authority and union notices. Record access rights, attribution, coverage, update cadence and maintenance ownership before integration; do not assume public articles can be scraped or republished.
- Extract candidate event type, announced start/end times and time zone, named locations, operators, lines, stops and affected travel modes. Preserve the original source link, publication time, source update time and last successful check.
- Distinguish a possible or proposed strike from an announced/confirmed action, an active disruption, a postponement, a cancellation and a resolved event. An article discussing a strike must not automatically create a confirmed closure.
- Aim for precise affected locations only when supported by evidence. A network-wide strike may affect services across a region rather than one blocked street. Show route/stop/agency scope or an approximate area when exact geometry is unavailable, and label uncertainty instead of inventing a precise polygon.
- Deduplicate repeated reporting while retaining provenance; flag conflicting reports for review. Any automated extraction or summarization must remain source-grounded and must not invent dates, locations or service impacts.
- Provide an upcoming-disruptions view and optional advance reminders. Let users choose lead time, categories and areas; issue corrections or cancellation updates when the evidence changes, and make stale information visible.
- Keep the wording neutral and focused on transport effects. Do not collect participant identities or track individuals attending public events.

**Dependencies:** validated source permissions, event/lifecycle contract, geographic/entity resolution, freshness monitoring, and a review/correction workflow. Notification delivery needs its own permission and reliability assessment; no delivery guarantee is assumed.

**Acceptance target:** a source-backed scheduled strike can be shown before it starts with affected services, timing and location precision; duplicate, ambiguous, conflicting, postponed and cancelled reports have tested behavior; reminders expose their evidence and uncertainty; stale or unconfirmed news never appears as a verified current blockage.

### F04: Opt-in route history and personal impact notifications

Idea recorded October 30, 2026. Status: proposed, not implemented. Owner and delivery date: unassigned.

**User benefit:** receive a relevant heads-up when a disruption may affect a usual commute, a previously travelled route, or a saved future journey, rather than having to inspect every incident manually.

- Start with routes users explicitly save, including travel mode and optional usual travel windows. Later evaluate voluntarily imported previous journeys or explicitly enabled in-app route history. A past journey alone must not be treated as evidence that the user will repeat it.
- Do not assume access to Google Maps Timeline, past journeys or route geometry. Investigate a supported, permissioned import or user-provided route workflow first; no silent browsing-history collection, Maps scraping or background tracking.
- Match a disruption's affected geometry or agency-scoped route/stop/service identifiers against an opted-in route, travel mode and expected journey time. Distinguish a direct service match from an approximate nearby-area match; geographical proximity alone is not proof of impact.
- Explain every notification: which saved route may be affected, the relevant segment or service, the disruption window, why it matched, source freshness and uncertainty. Use “may affect your usual route” for inferred future travel, not a claim that the user is travelling now.
- Make collection, history-based suggestions and notifications separately opt-in. Offer local-only route storage and matching as the first design to evaluate; any server processing needs explicit disclosure, minimization and a security/privacy review.
- Allow users to inspect, edit and delete saved routes/history, choose retention, stop collection and revoke alert permissions. Do not infer or label sensitive destinations or infer home/work addresses from history without explicit user action.
- Add lead-time controls, quiet hours, per-route/category preferences, deduplication, snooze and cancellation/correction handling. Use generic lock-screen notification text by default so exact journey details are not unnecessarily exposed.
- Keep notification permission separate from transport awareness: users who decline history or notifications must still be able to browse the information layer. This feature alerts about potential impact; it does not calculate a replacement route.

**Dependencies:** reliable incident timing and geographic/service scope from the live-data work and F03, a consented route representation, retention/deletion design, matching-quality evaluation, and a tested notification channel. Feasibility and operating costs remain open.

**Acceptance target:** an opted-in saved route receives an explained alert for a matching disruption and travel window; unrelated modes, services and times do not trigger it; approximate matches are labeled; cancellations update existing alerts; quiet hours, duplicate suppression, consent withdrawal and deletion work; no history is collected by default.

F03 and F04 extend the future backlog only. The current extension does not read news, collect previous routes, infer a commute or send notifications. These planning IDs are not GitHub issue numbers, and no delivery dates are committed.

### Rerouting

**Rerouting needs its own feasibility phase:** select a routing engine with appropriate avoidance support, obtain usable road-network/closure geometry and transit effects, test restriction semantics and timing, review licensing and safety, and measure route quality. Do not assume drawing an incident or opening a Maps link makes Google's route avoid it. No rerouting schedule is committed.
