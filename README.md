# Akumal Norte lot map

An interactive local viewer and GeoJSON extraction of the [2025 Mapa de Lotes de Akumal Norte](https://www.google.com/maps/d/viewer?mid=1NkpuEQjY6u3VBCBX3xiiNDblxbPNw2g).

Public viewer: <https://alexmalison.github.io/akumal-norte-map-viewer/>. Source repository: <https://github.com/alexmalison/akumal-norte-map-viewer>.

The extraction contains 157 lot features and 9 larger region features (165 polygons and one line). Each feature retains the map name, description, layer, feature ID, and style color. Coordinates are WGS84 longitude/latitude in GeoJSON order.

## Donation overlay

The viewer uses the [Akumal Norte Stakeholders workbook's Detail tab](https://docs.google.com/spreadsheets/d/1tbXRKF9f5TPvFh1nFQn1krqEmt3d2AQQxU6EMzerx7Q/edit). It uses **Stakeholder Name**, **Donated**, and **S-N Sequence**, totals all records for each mapped lot, and embeds only names, amounts, and lot codes in the public page. Unit rows for condo properties are included. Where a sheet lot code covers different properties, such as The Reef and La Bahia under G46, records are separated by their Detail names.

The page is not currently linked to the workbook. `site/index.html` contains a fixed snapshot of the Detail data (lot totals from September 24, 2026; contributor lists and summaries from September 25, 2026). Workbook edits appear on the map only after that snapshot is updated in `site/index.html` and pushed. See [Live Detail data](#live-detail-data) for how to link the page to the workbook.

The zoom buttons, base-map picker, and options are in the upper right. The options box has three checkboxes, all off by default: **Show Lot Numbers** adds lot numbers to the map labels, **Show additional boundaries** draws the region features (M&M land, Etapa I, and approximate regions) in addition to the lot outlines, and **Show Legend** shows the color legend in the lower-right corner. Below it, a radio box chooses between Barrier Purchase and the yearly contributions (2023–2025 under Barrier Operations, 2026 under Barrier and Beach Operations); for now it only sets the large title at the top of the page, and the map always shows the Barrier Purchase data. Boxes on the left: **Property (Lot) Owner Contributors** shows how many Detail records with a lot code have a donation above $0, how many map lots they represent (a lot drawn twice counts once), and their total; **Businesses and Other Contributors** lists every Detail donor with no lot code (**S-N Sequence** empty) and a donation above $0, largest first, with their total; and **All Contributors** adds the two groups together. The contributor names and amounts are public on the Pages site. Click a lot to see its Detail name and exact donated total. As you zoom in, the name and total appear inside the polygon only when the full text fits. Lots with a matched Detail record totaling $0 are shaded red. Lots without a reliable Detail match keep their source color and have no Detail name or amount. Where the source records cover a combined property drawn as several mapped lots, such as Los Flamingos on G48/49, the total is split evenly across those lots, and the popup shows the full total. Where the map draws the same single lot more than once, such as H30 and H42, each shape shows the full total with an asterisk. The header shows the date of the Detail data.

## View the map

On Windows, run `./akumal-local-server.exe` from this directory, then open <http://127.0.0.1:8765/>. The server listens only on loopback by default. The viewer overlays the features on Esri satellite imagery and can switch to OpenStreetMap streets. Click any shape to see its source attributes; lot popups also show the recorded Detail name and donation total.

On a system with Nix flakes enabled, run `nix run` to serve the same static site on <http://127.0.0.1:8765/>. Run `nix build` to create a deployable `result/index.html`, or `nix develop` for a shell with Python. The flake pins Nixpkgs to a specific commit.

Pushing `main` or manually dispatching the workflow runs `.github/workflows/pages.yml`, which builds the flake and deploys `site/index.html` unchanged to GitHub Pages. The build does not read the workbook. In the GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

### Live Detail data

`apps_script/Code.gs` is a Google Apps Script web app that reads the Detail columns and returns the lot totals, the Businesses and Other Contributors list, and the lot-owner summary. An [empty project in the HMB Sargassum account](https://script.google.com/u/1/home/projects/1MCeMeucrpKOIWemP8iD5e5u9Pi3mhz-3pSLZeosnc1wWkahP_kwLxBam/edit) has been created, but the code is not installed or deployed yet. The page therefore still uses its embedded snapshot. To link the page to the workbook:

1. While signed in as `hmbsargassumproject@gmail.com`, replace the default `Code.gs` in that project with `apps_script/Code.gs`. Enable **Show "appsscript.json" manifest file in editor** in project settings, then replace the manifest with `apps_script/appsscript.json` and save both files.
2. Deploy a new web app version with **Execute as: Me** and **Who has access: Anyone**. Authorize its read-only Google Sheets scope when prompted. Copy the `/exec` URL from the deployment dialog.
3. Put that `/exec` URL in the `donation-feed-url` meta tag in `site/index.html`, then push. When changing `Code.gs` later, deploy a new version; editing the project alone does not update the deployed web app.

The page then loads the current Detail data on every visit and shows a **Refresh donations** button. The browser receives mapped lot names, amounts, lot codes, business/other contributor names and amounts, and owner summary totals. These are public to anyone who can reach the web app URL, including people who do not use the map. No workbook credential is embedded in the page or stored in GitHub Secrets: Apps Script runs under the HMB account's authorization, and the manifest limits its Google Sheets scope to read-only. If Detail names or codes change in a way the matching guide in `Code.gs` cannot resolve, the feed returns an error and the page shows that the Detail data is unavailable rather than a possibly wrong total.

The server source is in `server/akumal-local-server.cs`. It can be rebuilt with the .NET Framework C# compiler:

```powershell
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /out:akumal-local-server.exe server\akumal-local-server.cs
```


## Files

- `data/akumal_norte_lots_2025.geojson`: extracted machine-readable geometry and attributes.
- `site/index.html`: standalone viewer with the GeoJSON and a Detail data snapshot embedded, so no browser request to the private workbook is needed.
- `apps_script/`: optional Apps Script web app that serves live Detail data to the page.
- `validation/basemap.png`: satellite image used for an independent alignment check.
- `validation/overlay.png`: rendered geometry over that image.
- `validation/render.ps1`: regenerates the overlay from the GeoJSON and basemap.

The validation image shows the lot outlines tracking the visible coastline and road. The source map marks some regions as approximate; this is a visualization of that map, not surveyed parcel data. Satellite imagery is from Esri, Maxar, Earthstar Geographics, and the GIS User Community.

## Map technology and sources

The viewer uses [Leaflet](https://leafletjs.com/), an open-source JavaScript map library. The street basemap uses [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/); the map data is open, while the community tile service has usage limits. The default satellite basemap comes from [Esri World Imagery](https://developers.arcgis.com/rest/basemap-styles/service-data/), which is not open-source imagery. The lot and region shapes come from the linked Google My Maps map. Leaflet, the tile providers, and the lot dataset have separate terms and provenance.
