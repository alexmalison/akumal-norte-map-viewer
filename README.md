# Akumal Norte lot map

An interactive local viewer and GeoJSON extraction of the [2025 Mapa de Lotes de Akumal Norte](https://www.google.com/maps/d/viewer?mid=1NkpuEQjY6u3VBCBX3xiiNDblxbPNw2g).

Public viewer: <https://alexmalison.github.io/akumal-norte-map-viewer/>. Source repository: <https://github.com/alexmalison/akumal-norte-map-viewer>.

The extraction contains 157 lot features and 9 larger region features (165 polygons and one line). Each feature retains the map name, description, layer, feature ID, and style color. Coordinates are WGS84 longitude/latitude in GeoJSON order.

## Donation overlay

The viewer includes a September 24, 2026 snapshot of the [Akumal Norte Stakeholders workbook's Detail tab](https://docs.google.com/spreadsheets/d/1tbXRKF9f5TPvFh1nFQn1krqEmt3d2AQQxU6EMzerx7Q/edit). It uses **Stakeholder Name** for each mapped lot and sums **Donated** across its records, including unit rows for condo properties. Where a sheet lot code covers different properties, such as The Reef and La Bahia under G46, records are separated by their Detail names. The embedded data contains property names, amounts, and lot codes, without contact details.

Click a lot to see its Detail name and exact donated total. As you zoom in, the name and total appear inside the polygon only when the full text fits. Lots with a matched Detail record totaling $0 are shaded red. Lots without a reliable Detail match keep their source color and have no Detail name or amount. An asterisk marks a total shown on multiple mapped shapes because the source records cover a combined property or the map has duplicate shapes; those labels must not be added together. This is a static snapshot; future workbook edits require refreshing the embedded data in `site/index.html`.

## View the map

On Windows, run `./akumal-local-server.exe` from this directory, then open <http://127.0.0.1:8765/>. The server listens only on loopback by default. The viewer overlays the features on Esri satellite imagery and can switch to OpenStreetMap streets. Click any shape to see its source attributes; lot popups also show the recorded Detail name and donation total.

On a system with Nix flakes enabled, run `nix run` to serve the same static site on <http://127.0.0.1:8765/>. Run `nix build` to create a deployable `result/index.html`, or `nix develop` for a shell with Python. The flake pins Nixpkgs to a specific commit.

Pushing `main` triggers `.github/workflows/pages.yml`, which builds the flake and deploys its output to GitHub Pages. In the GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

The server source is in `server/akumal-local-server.cs`. It can be rebuilt with the .NET Framework C# compiler:

```powershell
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /out:akumal-local-server.exe server\akumal-local-server.cs
```


## Files

- `data/akumal_norte_lots_2025.geojson`: extracted machine-readable geometry and attributes.
- `site/index.html`: standalone viewer with the GeoJSON embedded, so no separate data request is needed.
- `validation/basemap.png`: satellite image used for an independent alignment check.
- `validation/overlay.png`: rendered geometry over that image.
- `validation/render.ps1`: regenerates the overlay from the GeoJSON and basemap.

The validation image shows the lot outlines tracking the visible coastline and road. The source map marks some regions as approximate; this is a visualization of that map, not surveyed parcel data. Satellite imagery is from Esri, Maxar, Earthstar Geographics, and the GIS User Community.

## Map technology and sources

The viewer uses [Leaflet](https://leafletjs.com/), an open-source JavaScript map library. The street basemap uses [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/); the map data is open, while the community tile service has usage limits. The default satellite basemap comes from [Esri World Imagery](https://developers.arcgis.com/rest/basemap-styles/service-data/), which is not open-source imagery. The lot and region shapes come from the linked Google My Maps map. Leaflet, the tile providers, and the lot dataset have separate terms and provenance.
