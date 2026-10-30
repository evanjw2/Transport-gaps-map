# Pink area visual demo

A no-build, Manifest V3 Chrome extension. It draws three translucent pink polygons over Google Maps, with clickable plots, mock incident details, an opacity slider, visibility control, and collapsible controls.

**This is a screen-positioned visual prototype, not a geographic overlay.** The shapes remain fixed when you pan, zoom, rotate, or navigate. They are not tied to roads, geographic coordinates, real incidents, or the visible city. This deliberately tests the appearance and interaction without depending on private map internals. It does not implement the planned live-data MVP or rerouting.

## Install in desktop Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode** in the upper-right corner.
3. Click **Load unpacked**.
4. Select this `extension` directory, the folder containing `manifest.json`:
   `/Users/evanong/Downloads/Transport-gaps-map/extension` on the original development computer. On another computer, use the `extension` folder wherever you cloned or extracted the repository.
5. Open Google Maps on `www.google.com/maps`, or refresh an already-open Maps tab.
6. Look for three pink plots and the **Transport Gaps / Visual Demo** panel on the right.

The toolbar popup also has an **Open Google Maps demo** button. Installation is manual; no extension has been installed into your browser automatically. Chrome's official [unpacked-extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) describe the same process.

## Try it

- Click a pink plot or one of the three incident cards to select its example.
- Change **Area opacity** to make the map more or less visible underneath.
- Turn **Show sample areas** off/on to compare with the normal map.
- Use **−** to minimize the controls; click the **Transport Gaps · DEMO** pill to restore them. Clicking a plot also restores the panel.
- Pan/zoom the map to see the intentional screen-anchored limitation. Map interactions outside the plot shapes and controls pass through.

All examples are fictional: road closure, public-event disruption, and transit interruption. There is no automatic rerouting, source ingestion, tracking, API key, backend, network request, storage, or analytics. UI preferences reset on refresh.

## Supported URLs and limitations

The content script matches HTTPS Google Maps pages on `www.google.com`, `maps.google.com`, `www.google.de`, and `www.google.co.uk`. Other country domains, embedded Maps iframes, the native mobile app, and non-Maps pages are not supported. The extension is not a verified Chrome Web Store release.

Maps must be loaded as a document matching one of those patterns. If you arrived from another Google page via in-page navigation and nothing appears, refresh the Maps tab. Google's cookie/consent screen may need to be dismissed first. Overlapping Google sidebars can obscure or sit behind sample shapes; minimize our controls or hide the areas as needed.

To update the code, click **Reload** on this extension in `chrome://extensions`, then refresh the Maps tab. To remove it, click **Remove** on its extension card.

## Development checks

No package installation or compilation is needed. With Node installed:

```sh
node --check extension/content.js
node -e "const manifest = require('./extension/manifest.json'); if (manifest.manifest_version !== 3) throw new Error('Expected Manifest V3'); console.log('Manifest JSON valid')"
git diff --check
```

Manual acceptance: refresh a supported Maps page; verify three plots and no duplicates, card/plot selection, keyboard activation, hide/show, opacity, minimize/restore, narrow viewport layout, and ordinary map interaction outside the UI. Test the actual unpacked extension in Chrome before making compatibility claims; an isolated DOM smoke check is not proof of Google Maps integration or store approval.

The static content script is supported by Chrome's [content-script API](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts). It inserts its own SVG/Shadow DOM UI and does not read Google Maps content or map objects. Only the packaged static template uses `innerHTML`; sample text uses `textContent`. Any future external data needs validation and safe rendering.
