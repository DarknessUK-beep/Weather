# BA14 Weather & Radar (PWA)

A standalone iPhone-friendly web app for BA14 (Trowbridge) with:
- Current, hourly, and 7-day forecast (Open-Meteo)
- Live rain radar (RainViewer + Leaflet)
- Met Office severe weather warnings (optional; NSWWS Public API key required)

## Quick deploy to GitHub Pages
1. Create a new GitHub repository (e.g., `ba14-weather`).
2. Upload all files from this folder to the repo root.
3. Commit & push.
4. In the repo: **Settings → Pages → Build and deployment**: Source = **Deploy from a branch**; Branch = **main**; Folder = **/** (root). Save.
5. Wait ~1–2 minutes, then open the URL shown under **Pages** (usually `https://<your-user>.github.io/ba14-weather/`).

## Add to iPhone Home Screen
Open the Pages URL in Safari on iPhone → Share → **Add to Home Screen**.

## Enable Met Office alerts (optional)
- Request NSWWS Public API access and get your Atom feed URL: https://metoffice.github.io/nswws-public-api/
- Edit `alerts-config.js` and paste your `API_KEY` and `ATOM_FEED_URL`.
- Redeploy (commit the change). The Alerts tab will show BA14-specific warnings.

## Notes
- Radar tiles © RainViewer. Base map © OpenStreetMap contributors.
- Service worker caches the app shell for offline use. Data updates when online.
