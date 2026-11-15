# Transit-first pitch walkthrough

Updated November 16, 2026 for prototype v0.6. Product goal: a map-first awareness explorer with a compact Google Maps companion. See [the direction decision](MAP_FIRST_DECISION.md). This uses a Bavarian basemap, not Google's map. Awareness first; rerouting is a future phase.

## Rehearse a 60–90 second story

1. Open `extension/munich-map.html` in Chrome. **Public transport** opens first. Street tiles need internet; packaged examples do not. Begin by stating that all transit notices are fictional.
2. Search `U3`. Explain: “Imagine this is my usual line. I want to know what might affect the service or station access before leaving.” This is manual filtering, not a read of a Google route.
3. Select the interruption card. Show the two approximate station positions, affected segment, next check and DEMO provenance. Pan/zoom: markers remain geographically anchored. No rail track path, station entrance or district closure is claimed.
4. Reset, click Marienplatz and choose either of its two scenarios. Then select **Step-free access examples only**: show Odeonsplatz and explain a lift fault is not a whole-station closure.
5. Reset and choose **Upcoming · demo**. Both advance notices remain in the list but no location is invented. Explain: “A strike or event lead needs confirmed scope before we paint an area as blocked.” The sample MVG strike excludes S-Bahn.
6. Choose **Roadworks**, search `Ohlmüllerstraße`, select a card and show the actual source footprint. Explain that the affected facility is a parking bay, not the entire road. These are saved municipal records from November 15, 2026, not independently verified current conditions. Parking notices are opt-in. See [the map guide](MUNICH_MAP.md).

To demonstrate the compact companion on Google's website, reload the extension at `chrome://extensions`, refresh the Maps tab and use its panel. It links to our explorer but does not overlay Google's geography. Rehearse at the projector resolution. The panel minimizes with **−** and restores from a small button. Make a backup recording; do not rely on network links, street tiles or a first-time My Maps import during the pitch.

## Suggested pitch

“Transport disruption information is scattered across operators, city notices and news. Transport Gaps brings the relevant context alongside the journey you're planning: which line or stop is affected, what that means, and where the information came from. This prototype demonstrates public-transport interruptions, delays, accessibility and advance warnings, with clearly labeled scenarios. We have also connected a saved Munich roadworks dataset to prove source-backed geographic display. Next comes authorized operator data, with freshness and correction handling. Rerouting comes later.”

## Questions to answer honestly

- **Is it live?** No. Transit scenarios and delay minutes are fictional. Roadworks are saved official source records with retrieval times, not verified current conditions.
- **Does it read my route or travel history?** No. Line selection is manual; no Google route/history is read or stored. Saved-journey alerts are a separate future opt-in feature.
- **Why not put everything on Google Maps?** Owning the geographic view gives us reliable anchoring, layer selection and source-precision controls. The extension stays as a compact companion. A dedicated Google API map is a future provider choice, not an automatic overlay in Google's consumer map.
- **Does it cover all disruptions?** No. The municipal source does not comprehensively cover transit failures, strikes, protests, congestion or lift faults. A feature count is not a count of independent road closures. No matches never means “all clear.”
- **What is the next engineering milestone?** Authorized transit alert access, one end-to-end source adapter, source-specific freshness/expiry/corrections and affected-line/stop mappings—not more simulated real-time styling.

The About tab links a historical MVG notice showing that advance strike announcements exist. Do not describe that January/February 2026 example as a current warning. Source permissions and ingestion plans remain in [the Munich data plan](MUNICH_DATA_PLAN.md).
