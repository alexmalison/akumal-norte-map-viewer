# Agent guide

## What this repo does

This is a static Leaflet viewer for the 2025 Akumal Norte lot map. `site/index.html` contains the UI and embedded GeoJSON; `data/akumal_norte_lots_2025.geojson` is the source data. Lot names live only in each browser's local storage. Satellite and street tiles, plus Leaflet, load from external services. See `README.md` for provenance and usage details.

`server/akumal-local-server.cs` builds the checked-in Windows server executable. `flake.nix` builds the deployable page; `.github/workflows/pages.yml` publishes it to GitHub Pages. `validation/render.ps1` compares the geometry with the basemap.

## Open the local map

When working in this repo, start the local viewer and open it in a browser automatically. First run `tailscale status` and get this machine's current tailnet IPv4 address with `tailscale ip -4`. If Tailscale is unavailable, report that instead of substituting a localhost sharing link.

- Windows PowerShell: `$tailIp = (tailscale ip -4).Trim(); .\akumal-local-server.exe $tailIp`.
- Nix: run `nix build`, then `python3 -m http.server 8765 --bind "$(tailscale ip -4)" --directory result`.

Keep the server running while sharing the map. Verify `http://<tailnet-ip>:8765/` responds, then automatically open that URL with available browser control (or `Start-Process "http://${tailIp}:8765/"` on Windows, `xdg-open` on Linux, `open` on macOS). Give the user the actual current Tailscale URL, never a localhost URL. If another tailnet device cannot connect, check inbound TCP port 8765 on the host's Tailscale interface.
