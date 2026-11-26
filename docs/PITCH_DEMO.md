# Pitch walkthrough · v0.7 “Munich this morning”

A 90-second live demo, plus a backup plan.

## Before you present (10 minutes, same morning)

1. `git pull`, then `npm run morning`. Check every source shows ✓, then commit and push `extension/data/today.*` (or let the Action do it). The badge in the page should say **Updated HH:MM** in green.
2. Open the published page on your **own phone over mobile data** and check that it loads.
3. On the laptop, open the page and click **Share** so the QR code is ready to show.
4. Make a 60-second screen recording as a backup (venue Wi-Fi fails more often than code).

## The story

> “Google Maps tells you how to get somewhere. It doesn't tell you *why* today might be different.”

1. **Scan.** Show the QR code (Share button). “No app, no extension. Scan it now.” Let people open it on their phones.
2. **The verdict.** Point at the status card: *🟠 Allow extra time* or *🔴 Expect disruption*. “Every morning at 6 our script checks MVG, the German weather service, live weather in 14 districts, city roadworks, local news and our own event list, and boils it down to this.”
3. **Weather.** “Right now it's −2 °C with light snow, and the DWD has an ice warning.” Tap a district weather chip on the map to show snow per district. This part refreshes live.
4. **Lines right now.** Scroll to the 🚦 board: “Every U-Bahn, S-Bahn and tram line, live. S3 is 4 minutes late, U6 has cancellations.” Tap a delayed line: its route lights up on the map in its own colour, with its end stations, and everything else fades. Tap a station on it for live departures.
5. **A real disruption, in detail.** Open a **Live** card (e.g. *Tram 16/17: 9 stops not served · traffic accident*). Point at the red ✕ stops on the map, the translated *What MVG says* (“replacement buses, free taxis, until about 10:00”) and **Ways around it**: “walk 2 minutes to Arabellapark for the U4”. Tap **Live departures** to show the real board, then **Walking route in Google Maps**.
6. **Why it matters: stacking.** Open the hotspot heads-up (*Odeonsplatz: expect disruption*). “A demo march (an example), the Christmas market crowds, roadworks nearby, and snow. Any one of these is fine. Together, they cost you 20 minutes.” Show the dashed ring on the map.
7. **Into Google Maps.** Tap **Open in Google Maps ↗** on a phone. It jumps into the Google Maps app at that spot. “We don't replace Google Maps; we give it the context it's missing.”
8. **Plan ahead.** Scroll to *Plan ahead: Warning strike* and *FC Bayern – Hertha, U6 Fröttmaning*. “Strikes and matches are announced days ahead, so you see them before they hit.”
9. **Honesty.** Untick *Show example scenarios*. “Everything left is real data from this morning.”
10. **Laptop bonus (optional).** Open Google Maps in Chrome to show the extension's small card, then the toolbar popup.

## One-line pitch

“Transport Gaps is a morning briefing for your commute: one place that tells Munich what might slow them down today (strikes, protests, breakdowns, events, roadworks, snow) and opens straight into Google Maps.”

## Questions you'll get

- **Is it live?** Line delays and departure boards are live (every 2 minutes), and so is the weather (every 10 minutes). The written MVG notices, events and roadworks are refreshed each morning and on demand; next step is every 15 minutes.
- **Is “ways around it” a route planner?** No. It finds nearby stops with other lines and estimates the walk. That's quick and transparent, and Google Maps does the actual routing.
- **Where does strike and protest information come from?** Announced strikes and events are curated in a simple file with a source link for each. News headlines appear as unconfirmed leads. Next: semi-automatic extraction from MVG and police press releases, with a human check.
- **Is MVG data allowed?** We use MVG's public notices (headline, lines, times) with a link back. For a real launch we'd ask MVG for permission or use an official feed.
- **Why not draw inside Google Maps?** Google doesn't allow third-party layers in its app or website. A web page plus Google Maps deep links works on every phone today.
- **Rerouting?** Out of scope for the MVP. The next step after awareness is personal saved routes and alerts.

## Backup if the internet fails

Open `extension/index.html` directly from the laptop. All of the morning's data is bundled; only map tiles, live weather and live delays need a connection (the line board then shows the morning's numbers).

> Live data changes by the minute: the tram accident above may be gone by the time you present. Open the board first and pick whichever **Live** card has red stops or ways around it.
