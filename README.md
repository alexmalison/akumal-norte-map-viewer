# Akumal Norte lot map

An interactive local viewer and GeoJSON extraction of the [2025 Mapa de Lotes de Akumal Norte](https://www.google.com/maps/d/viewer?mid=1NkpuEQjY6u3VBCBX3xiiNDblxbPNw2g).

The extraction contains 157 lot features and 9 larger region features (165 polygons and one line). Each feature retains the map name, description, layer, feature ID, and style color. Coordinates are WGS84 longitude/latitude in GeoJSON order.

## View the map

On Windows, run `./akumal-local-server.exe` from this directory, then open <http://127.0.0.1:8765/>. The server listens only on loopback. The viewer overlays the features on Esri satellite imagery and can switch to OpenStreetMap streets. Click a shape to see its source attributes.

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
