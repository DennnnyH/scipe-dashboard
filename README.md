# SCIPE flow classification

Campus network flow CSVs are labeled with a user class, a random forest is trained on that labeled file, and a small dashboard shows how often the model is wrong on a held-out half of the data.

## Data is not in this repository

`.gitignore` excludes every `*.csv` and the `notebook_runs/` folder. A clone from GitHub has the notebooks, scripts, and dashboard code, and none of the flow data or lookup tables. You have to place those files on disk yourself before preprocessing or classification will run.

| You supply | Where it goes |
|------------|----------------|
| Campus flow exports | `downloaded_data/processed_data/*.csv` |
| IP-to-user-class map | `ip_user_map-v1.csv` in the repo root |
| Extra IP map for flows the first file misses | `HiloFlowIPMissingMap.csv` in the repo root |

Preprocessing writes `userclasses_mapped_v2.csv` in the repo root. That file is also ignored, so it exists only on the machine that ran the notebook. The JSON under `dashboard/data/` is ignored too. Run the export script locally to create `summary.json`, `anomalies.json`, and `metrics.json` before starting the dashboard.

## How it fits together

```
downloaded_data/processed_data/*.csv
        │
        ▼
flow_preprocessing.ipynb
        │  joins ip_user_map-v1.csv and HiloFlowIPMissingMap.csv
        │  keeps rows whose srcIP has a user class
        ▼
userclasses_mapped_v2.csv
        │
        ▼
user_classification.ipynb
        │  RandomForestClassifier, 50% train / 50% test
        ▼
scripts/export_dashboard_snapshot.py
        │  overwrites the three JSON files
        ▼
dashboard/data/{summary,anomalies,metrics}.json
        │
        ▼
dashboard/web  (Vite + React, http://localhost:5173)
```

`scripts/watch_processed_data.py` polls `downloaded_data/processed_data` every 5 seconds. After CSV names, sizes, or timestamps stay still for 15 seconds, it runs preprocessing, then classification, then the export script. It does not run on files that were already there when the watcher started. A failed notebook stops the rest of that run.

Each run replaces the previous snapshot. The dashboard does not keep earlier days. Counts grow only because preprocessing concatenates every CSV still in `processed_data`. Flows with no IP match are dropped. The anomaly table is the current test split, so the same flow can appear or disappear on the next run.

An anomaly is a test row whose predicted class does not match the mapped `userclass`.

| Tier | Rule |
|------|------|
| Normal | Prediction matches the label |
| Maybe | Wrong, and the model’s top probability is under 0.85 |
| High confidence | Wrong, and the top probability is at least 0.85 |

Overall status is green when both anomaly counts are zero, yellow when only “maybe” rows exist, and red when any high-confidence anomaly exists.

## What you need

- Python 3.10+ with `pandas`, `numpy`, `scikit-learn`, `matplotlib`, `seaborn`, and Jupyter (`jupyter` / `nbconvert`)
- Node.js 18+ for the dashboard
- The two root CSVs listed above. They are inputs, not outputs of the watcher, and they are not in the GitHub tree.

Preprocessing installs [ipcrypt](https://github.com/jedisct1/draft-denis-ipcrypt) from Git the first time that notebook runs (`%pip` in the first code cell).

```bash
python -m pip install pandas numpy scikit-learn matplotlib seaborn jupyter
```

## Run it locally

From the repo root, two terminals.

Dashboard:

```bash
cd dashboard/web
npm install
npm run dev
```

Open http://localhost:5173. The pages are Overview, Anomalies, and Class patterns. They read `dashboard/data/*.json` through Vite. After a pipeline run, refresh the browser if the numbers do not update.

Watcher:

```bash
python scripts/watch_processed_data.py
```

Leave it running. Copy or replace a flow CSV in `downloaded_data/processed_data`. When the file finishes writing, the watcher runs the two notebooks and refreshes the JSON. Executed notebook copies are written to `notebook_runs/` so the source notebooks stay unchanged.

## Run one pass by hand

From the repo root, with CSVs already in `downloaded_data/processed_data`:

```bash
python -m jupyter nbconvert --to notebook --execute --output-dir notebook_runs --output flow_preprocessing.ipynb flow_preprocessing.ipynb
python -m jupyter nbconvert --to notebook --execute --output-dir notebook_runs --output user_classification.ipynb user_classification.ipynb
python scripts/export_dashboard_snapshot.py
```

The export script trains on `userclasses_mapped_v2.csv` again and is what actually updates the dashboard files. `user_classification.ipynb` prints metrics; it does not write `dashboard/data`.

To refresh the UI from the labeled file you already have, without re-running preprocessing:

```bash
python scripts/export_dashboard_snapshot.py
```

## Layout

| Path | Role |
|------|------|
| `downloaded_data/processed_data/` | Incoming flow CSVs |
| `flow_preprocessing.ipynb` | Clean, obfuscate IPs, map `userclass`, write `userclasses_mapped_v2.csv` |
| `user_classification.ipynb` | Train and evaluate the random forest |
| `scripts/export_dashboard_snapshot.py` | Write `dashboard/data/*.json` |
| `scripts/watch_processed_data.py` | Run the three steps when `processed_data` changes |
| `dashboard/web/` | React UI |
| `archive/hilo_flow_data_11_days.ipynb` | Original notebook, including clustering that preprocessing leaves out |
