# Team review: Munich morning briefing (v0.7)

Status: **chosen by the team and merged into `main`** on 26 November 2026. It was built on `prototype/munich-briefing-v0.7` (on top of `prototype/munich-map-v0.6`); the previous v0.2 baseline is commit `2fb34e8` in the history.

## What changed since v0.6

| v0.6 | v0.7 |
| --- | --- |
| 8 fictional transit scenarios | **Real MVG notices every morning** (incidents + planned changes), placed on stations |
| No weather | **Live weather for 14 districts** + official DWD warnings |
| Saved roadworks from Nov 15 | **Fresh roadworks summary every morning**; full layer weekly |
| No strikes, protests or events | **Team-curated `data/events.json`** (Christmas market, Tollwood, Bayern home games) + 3 clearly labelled examples |
| Desktop-only explorer | **Phone-first website + QR code**, Chrome popup, small card on Google Maps |
| Lists only | **Heads-up rules** that stack causes into 🟢 / 🟠 / 🔴 and “Plan ahead” |
| No delay detail | **Live line board** (every line, every 2 min), **stops not served highlighted**, live departure boards, MVG advice in English, **ways around it** + `data/tips.json` |

## Try it

```sh
git fetch origin
git switch main
git pull --ff-only
npm run morning        # optional: refresh today's data
open extension/index.html
```

Commit or stash your own work before switching branches. If you use the unpacked Chrome extension, reload it after switching.

## How to contribute

- **Add a real strike, protest or event:** edit `data/events.json` on GitHub. The format is in [MORNING_BRIEFING.md](MORNING_BRIEFING.md#adding-a-strike-protest-or-event-no-coding-needed). Always add a source link.
- **Add a local workaround tip:** edit `data/tips.json`.
- **Improve the rules:** `scripts/briefing.mjs`, then run `npm test`.
- **Design:** `extension/app.css`, `extension/app.js`.
- Create a feature branch from `main` and open pull requests against `main`.

## Decisions for the team

1. ✅ Decided: v0.7 is the presentation version. Slides: problem → QR demo → how the morning script works → honest limits → next steps.
2. GitHub Pages publishes `main`: <https://evanjw2.github.io/Transport-gaps-map/> (QR code in `docs/qr-code.png`). Turn it off under Settings → Pages if needed.
3. Ask MVG about permission to reuse service notices before any public launch.
4. Who owns `data/events.json` each week (checking MVG press releases, city notices, match calendars)?

Older notes: [v0.6 map-first decision](MAP_FIRST_DECISION.md).
