# Bundled dependencies

These upstream distributions are bundled locally; there is no runtime CDN code loading or package installation requirement.

| Package | Version | Files | License |
| --- | --- | --- | --- |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | `leaflet.js`, `leaflet.css` | BSD-2-Clause, retained in `LEAFLET-LICENSE` |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.2 | `fflate.js` (upstream `umd/index.js`) | MIT, retained in `FFLATE-LICENSE` |
| [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) | 1.4.4 | `qrcode.js` | MIT, notice retained in the file header |

Installed into a temporary development directory from npm using the exact versions above. Distributed source files are unchanged, except any final newline added by patching. Leaflet uses canvas/SVG paths and built-in text controls here; default raster marker/layer-control images are not used or bundled.

SHA-256 of the bundled distributions:

```text
4f1ac3296897403e0a84881c974dbdf36d9a8488f0ef4b5626a952b1b6190d80  leaflet.js
337bfca5cabd03b39815b2700febe2b3b7edf55921c59cd49f88ecb328212303  leaflet.css
e05ff56381f2e5cb2b1054d45e5bf06f6e119313dc71e193df2fdd15eebe0a57  fflate.js
18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780  qrcode.js
```

Dependency licenses do not grant rights to municipal source data or basemap services. Their separate attribution and use requirements are recorded in [the geographic map guide](../../docs/MUNICH_MAP.md).
