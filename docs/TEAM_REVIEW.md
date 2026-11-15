# Team review: experimental Munich prototype

Status: **work in progress, not approved for the presentation**. Shared November 16, 2026 on `prototype/munich-map-v0.6`. This branch preserves the current implementation for teammates to inspect and contribute to; it is not a request to replace the existing slides or merge into `main`.

## What stays unchanged

- `main` remains the v0.2.0 extension baseline. At branch creation it points to commit `2fb34e8`.
- Existing teammate slides and the choice of presentation version are unchanged. No new slide deck is included.
- The team can keep presenting v0.2 while evaluating this alternative separately.

## What this branch explores

- A standalone map-first explorer, with the Chrome extension retained as launcher/compact companion.
- Actual saved Munich municipal roadwork polygons, rather than v0.2's screen-positioned illustrative patches. The 5,790 source features are not 5,790 verified closures or comprehensive disruption coverage.
- Eight fictional transit scenarios. Four have approximate station locations; four stay list-only. No actual train-track paths, exact entrances or live transit incidents are claimed.
- Search, mode/timing/accessibility filters, shared-station selection, source details, responsive layouts and manual roadworks KML export.
- The existing Bavarian basemap with Leaflet—not Google's basemap or an automatic overlay inside Google's website. No paid Google integration is set up.

The prototype has no live transit feed, source-backed current strike warnings, saved-journey matching, notifications, weather feed or rerouting. Those remain future work, not presentation claims.

## Try it locally

In an existing clone, first commit or stash your own work; do not discard local changes to switch branches. Then:

```sh
git fetch origin
git switch prototype/munich-map-v0.6
```

If you already have this local branch, update it with `git pull --ff-only`. Open `extension/munich-map.html` in Chrome. No build step, server or API key is needed; street tiles need internet. Search `U3`, click a card/marker, then choose Roadworks and search `Ohlmüllerstraße`. All transit scenarios are fictional, and road records are a November 15, 2026 snapshot—not verified live conditions.

To test the Chrome companion, load this checkout's `extension` folder at `chrome://extensions`, or reload an existing unpacked installation and refresh the Maps tab. The toolbar popup opens the explorer; the normal Google Maps page shows a compact panel, not geographic overlays. Switching Git branches changes the files used by an unpacked extension, so reload it after switching. For side-by-side comparison, use separate checkout folders and clearly distinguish which extension folder is loaded.

To return to the existing baseline, first save any edits, run `git switch main`, and reload the unpacked extension if applicable. That does not remove this prototype branch from GitHub.

## Review before choosing a presentation version

1. Does the standalone explorer communicate the transport-awareness idea better than the v0.2 Google Maps demonstration?
2. Is the transition between Google's compact companion and our own map acceptable?
3. Are demo transit notices, approximate locations and saved official source footprints unmistakably different?
4. Which one or two scenarios best tell the story without implying live coverage?
5. Should any selected improvements be adopted into the presentation baseline, or should this remain exploratory?

Keep contributions isolated: create a feature branch from this prototype branch and target any proposed pull request at `prototype/munich-map-v0.6`, not `main`. A team decision is needed before merging the prototype into `main` or replacing the slide narrative.

## Optional later slides

If the team chooses to make a separate prototype deck, label it **experimental / under evaluation**. Suggested story: user problem → transport-awareness goal → geographic transit/roadworks demo → what is real versus simulated → data/integration limits → next validation milestone. Keep the existing v0.2 deck intact until the team explicitly chooses otherwise.

Implementation rationale and local checks: [map-first direction](MAP_FIRST_DECISION.md). Presentation walkthrough: [pitch guide](PITCH_DEMO.md). Source limits and attribution: [map guide](MUNICH_MAP.md).
