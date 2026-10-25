# SCIPE Flow Monitor (UH Mānoa)

React dashboard for network flow classification anomalies. Data comes from `../data/*.json` (generate with `python scripts/export_dashboard_snapshot.py` from the repo root).

## Run locally

```bash
cd dashboard/web
npm install
npm run dev
```

Open http://localhost:5173

## Build for production

```bash
npm run build
npm run preview
```

Static output is in `dist/`. Serve behind Nginx or any static host; re-run the export script after retraining to refresh JSON.

## Theme

UH Mānoa–inspired palette: green `#024731`, gold `#C5B783`, sand background.

Typography follows [conifer.build](https://www.conifer.build/): **Inter Tight** (headings), **Plus Jakarta Sans** (UI), **JetBrains Mono** (IPs, ports, metrics) via Google Fonts.
