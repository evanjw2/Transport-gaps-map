# Contributing

This repository is currently a planning workspace. Start with the [README](README.md), [team plan](docs/PLAN.md), and [feasibility review](docs/FEASIBILITY.md).

## Pick or propose work

1. Choose a starter task from the plan or propose a focused improvement in a GitHub issue.
2. State the user problem, intended outcome, scope, dependencies, and acceptance criteria.
3. Agree an owner and note blocked dependencies before implementation. Do not assume document planning IDs are GitHub issue numbers.
4. Keep awareness work separate from future rerouting. Discuss new providers, permissions, dependencies, data collection, and paid services before adding them.

## Submit a pull request

- Create a short-lived branch from an up-to-date `main`, such as `docs/pilot-source-audit` or `feat/incident-panel`.
- Keep the change focused and explain its motivation and test/review evidence.
- Link the relevant issue or planning task, and include screenshots for UI changes when available.
- Include failure states, accessibility, attribution, and privacy implications where relevant.
- Update documentation when setup, contracts, decisions, or user-visible behavior changes.
- Request review from another team member before merging; this is a team convention, not a claim that branch protection is configured.

The [visual demo extension](extension/README.md) runs without a build step; its guide includes syntax checks and a manual acceptance checklist. There is no automated test suite yet. For documentation changes, check relative links, Markdown, and factual sources. The live-data scaffold milestone must establish build, lint, and test commands before contributors are expected to run them.

## Data and security

- Use synthetic or appropriately licensed samples, label fixtures, and record source permissions and attribution.
- Do not scrape Google Maps content or depend on undocumented map internals without revisiting the feasibility decision and applicable terms.
- Never commit tokens, private credentials, personal travel histories, or identities/individual locations of event participants.
- Treat incoming text, coordinates, identifiers, and links as untrusted input.
- Describe uncertainty: an official source is provenance, not proof that every detail remains correct.
- Do not put secrets or personal data into public issues. Report sensitive findings privately to the repository owner; a formal security channel is not configured yet.

## Decisions and licensing

For an architectural or product decision, propose a dated entry in the relevant planning document with an owner, evidence, alternatives, and consequences. Mark unresolved questions explicitly.

No software license is selected yet. Ask the repository owner before adding third-party code or assuming public redistribution is permitted; provider data licenses are separate from the repository's eventual license.
