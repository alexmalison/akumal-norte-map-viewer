# Akumal Norte lot map

An interactive local viewer and GeoJSON extraction of the [2025 Mapa de Lotes de Akumal Norte](https://www.google.com/maps/d/viewer?mid=1NkpuEQjY6u3VBCBX3xiiNDblxbPNw2g).

Public viewer: <https://alexmalison.github.io/akumal-norte-map-viewer/>. Source repository: <https://github.com/alexmalison/akumal-norte-map-viewer>.

The extraction contains 157 lot features and 9 larger region features (165 polygons and one line). Each feature retains the map name, description, layer, feature ID, and style color. Coordinates are WGS84 longitude/latitude in GeoJSON order.

## Donation overlay

The viewer uses the [Akumal Norte Stakeholders workbook's Detail tab](https://docs.google.com/spreadsheets/d/1tbXRKF9f5TPvFh1nFQn1krqEmt3d2AQQxU6EMzerx7Q/edit). The Pages build reads **Stakeholder Name**, **Donated**, and **S-N Sequence**, totals all records for each mapped lot, and embeds only property names, amounts, and lot codes in the public page. Unit rows for condo properties are included. Where a sheet lot code covers different properties, such as The Reef and La Bahia under G46, records are separated by their Detail names. The checked-in page contains a September 24, 2026 starting snapshot for local viewing; the deployed artifact is refreshed from the sheet on each build.

A box below the zoom buttons has two checkboxes, both off by default: **Show Lot Numbers** adds lot numbers to the map labels, and **Show additional boundaries** draws the region features (M&M land, Etapa I, and approximate regions) in addition to the lot outlines. Click a lot to see its Detail name and exact donated total. As you zoom in, the name and total appear inside the polygon only when the full text fits. Lots with a matched Detail record totaling $0 are shaded red. Lots without a reliable Detail match keep their source color and have no Detail name or amount. Where the source records cover a combined property drawn as several mapped lots, such as Los Flamingos on G48/49, the total is split evenly across those lots, and the popup shows the full total. Where the map draws the same single lot more than once, such as H30 and H42, each shape shows the full total with an asterisk. The page shows when its Detail data was last refreshed.

## View the map

On Windows, run `./akumal-local-server.exe` from this directory, then open <http://127.0.0.1:8765/>. The server listens only on loopback by default. The viewer overlays the features on Esri satellite imagery and can switch to OpenStreetMap streets. Click any shape to see its source attributes; lot popups also show the recorded Detail name and donation total.

On a system with Nix flakes enabled, run `nix run` to serve the same static site on <http://127.0.0.1:8765/>. Run `nix build` to create a deployable `result/index.html`, or `nix develop` for a shell with Python. The flake pins Nixpkgs to a specific commit.

Pushing `main`, manually dispatching the workflow, and the hourly schedule trigger `.github/workflows/pages.yml`. The build reads the private Sheet, replaces the embedded donation data in the Pages artifact, and deploys it. GitHub's scheduled runs can be delayed; the timestamp on the page shows the actual refresh time. If authentication or matching fails, the build fails and leaves the prior deployment in place. In the GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

### Enable automatic Detail refreshes

1. In a Google Cloud project, enable the Google Sheets API and create a dedicated service account. Share the workbook with that service account as a **Viewer**.
2. Configure [Workload Identity Federation for GitHub Actions](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines). Limit the trust to this repository and its `main` branch, and allow that identity to impersonate the dedicated service account. No service-account key is needed.
3. In GitHub **Settings → Secrets and variables → Actions → Variables**, set `GOOGLE_WORKLOAD_IDENTITY_PROVIDER` to the provider resource name and `GOOGLE_SHEETS_SERVICE_ACCOUNT` to the service-account email. These are identifiers, not credentials.
4. Run the **Build and deploy map** workflow once and verify the displayed refresh time and several donation totals. Thereafter it runs hourly, as well as on pushes to `main`.

Only the build job receives Google credentials. The browser gets the generated names and totals, which are public to anyone who can view the Pages site. The checked-in `site/index.html` is not automatically rewritten; `scripts/refresh_donations.py` generates the current deployment artifact from it. If Detail names or codes change in a way the matching guide cannot resolve, the job stops rather than publishing a potentially wrong total.

The server source is in `server/akumal-local-server.cs`. It can be rebuilt with the .NET Framework C# compiler:

```powershell
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /out:akumal-local-server.exe server\akumal-local-server.cs
```


## Files

- `data/akumal_norte_lots_2025.geojson`: extracted machine-readable geometry and attributes.
- `site/index.html`: standalone viewer with the GeoJSON and a starting Detail matching guide embedded, so no browser request to the private workbook is needed.
- `scripts/refresh_donations.py`: build-time Detail reader and public overlay generator.
- `validation/basemap.png`: satellite image used for an independent alignment check.
- `validation/overlay.png`: rendered geometry over that image.
- `validation/render.ps1`: regenerates the overlay from the GeoJSON and basemap.

The validation image shows the lot outlines tracking the visible coastline and road. The source map marks some regions as approximate; this is a visualization of that map, not surveyed parcel data. Satellite imagery is from Esri, Maxar, Earthstar Geographics, and the GIS User Community.

## Map technology and sources

The viewer uses [Leaflet](https://leafletjs.com/), an open-source JavaScript map library. The street basemap uses [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/); the map data is open, while the community tile service has usage limits. The default satellite basemap comes from [Esri World Imagery](https://developers.arcgis.com/rest/basemap-styles/service-data/), which is not open-source imagery. The lot and region shapes come from the linked Google My Maps map. Leaflet, the tile providers, and the lot dataset have separate terms and provenance.
