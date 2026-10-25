# SCIPE Flow Classifier — Web Application Plan

This document is the **plan for a web application** that lets operators run the `user_classification.ipynb` model on flow CSV data and see **user-class predictions** plus a **green / yellow / red** health summary based on anomaly confidence. FastAPI, Nginx, and Docker Compose are **how we build and deploy** the app—not the product itself.

---

## 1. Product overview

### 1.1 What we are building

A **browser-based dashboard** where a user can:

1. See which flow CSV files are available for analysis.
2. Run the trained classifier on **one file** or **an entire folder** of CSVs.
3. View overall status (**green**, **yellow**, or **red**) and counts of normal vs. uncertain vs. high-confidence anomaly rows.
4. Drill into per-file and (optionally) per-row results.
5. Download scored output CSVs for downstream use.

The same deployment also exposes a **REST API** (for scripts and integrations) behind the same Nginx host at `/api/`.

### 1.2 What problem it solves

SCIPE network flow rows need a **user class** (Faculty, Student, Infrastructure, etc.). Manual review does not scale. The web app turns batch CSV inference into a single click (or API call) and surfaces **trust** via confidence-based anomaly tiers—not only the predicted label.

### 1.3 Users

| User | Goal |
|------|------|
| **Network / SCIPE operator** | Run classification on daily flow exports; quickly see if anything looks wrong |
| **Analyst** | Inspect maybe-anomaly rows, export scored CSVs |
| **Developer / integrator** | Call REST endpoints from pipelines (optional; same backend) |

---

## 2. Core user flows

### Flow A — Analyze folder (primary)

1. Operator opens the app in a browser (`http://host/`).
2. **Data** page lists CSV files in the server input folder (`/data/in`, populated by your pipeline or volume mount).
3. Operator clicks **Run classification on all files**.
4. UI shows a progress state (spinner or job status for long runs).
5. **Results** page shows:
   - Large **status badge**: Green / Yellow / Red
   - **Counts**: normal, maybe anomaly, high-confidence anomaly, total rows
   - Table: one row per file with file name, row count, status, link to detail
6. Operator downloads enriched CSV from **Outputs** (if enabled).

### Flow B — Analyze single file

1. From **Data**, select one CSV → **Classify this file**.
2. Same summary widgets, scoped to that file.
3. Optional: table of flagged rows (yellow/red only).

### Flow C — API-only (no UI)

1. Client `POST /api/v1/classify/folder` (see Appendix B).
2. Use JSON for automation; UI and API share the same backend logic.

---

## 3. Web application — pages and features

### 3.1 Page map

| Page | Route (SPA) | Purpose |
|------|-------------|---------|
| **Home / Dashboard** | `/` | Last run summary, quick status, link to run new analysis |
| **Data** | `/data` | List input CSVs; actions: classify one / classify all |
| **Results** | `/results` or `/results/:jobId` | Traffic-light summary, counts, per-file breakdown |
| **Detail** | `/results/:jobId/files/:name` | Single-file stats; filter by anomaly tier |
| **Settings** (optional v2) | `/settings` | View thresholds (read-only from env in v1) |
| **API docs** | `/api/docs` | FastAPI Swagger (proxied through Nginx) |

### 3.2 UI components (what users see)

| Component | Behavior |
|-----------|----------|
| **Status badge** | Green: 0 maybe + 0 high-confidence anomalies. Yellow: only “maybe” rows. Red: any high-confidence anomaly (policy in §4.2). |
| **Count cards** | `# normal`, `# maybe`, `# high confidence`, `# total rows`, `# files` |
| **File table** | Sortable columns: filename, rows, normal/maybe/red counts, predicted class distribution (top classes) |
| **Run button** | Triggers backend job; disabled while running |
| **Empty state** | “No CSV files in input folder” with short instructions |
| **Error state** | Schema mismatch, model not loaded, timeout—with actionable message |

### 3.3 Frontend approach (recommended for the plan)

| Choice | Recommendation |
|--------|----------------|
| **Delivery** | Static site served by **Nginx** (`web/`) |
| **Stack** | Simple **HTML + CSS + JavaScript** or a small framework (React/Vue) if the team prefers |
| **Data** | `fetch('/api/v1/...')` — no model in the browser |
| **Auth (v1)** | None on localhost; API key or login in v2 if required |

The web app is a **client** of the REST API; all ML runs on the server.

---

## 4. Application behavior (shared by UI and API)

### 4.1 Model (from `user_classification.ipynb`)

- **Algorithm**: Random Forest (best of three sklearn models, ~99.7% test accuracy).
- **Output**: One of **17 user classes** (Admin, External, Faculty, …).
- **Input rows**: Flow CSV schema; **15 features** after preprocessing (IPs/MACs dropped, categoricals encoded, `StandardScaler` applied).
- **Your backend responsibility**: Read CSVs from a **folder**, preprocess with **saved** encoders/scaler (do not refit in production), run inference, return results.

See **Appendix A** for full model and artifact list.

### 4.2 Anomaly tiers (drives the traffic light)

The notebook is supervised classification; the **web app** defines “anomaly” from **prediction confidence**:

| Tier | Rule (example) | UI color |
|------|----------------|----------|
| **Normal** | `max(predict_proba) ≥ 0.85` | Contributes to **green** batch |
| **Maybe** | `0.55 ≤ max(proba) < 0.85` | **Yellow** |
| **High-confidence anomaly** | `max(proba) < 0.55` (optional: + outlier detector) | **Red** |

**Batch status**

- **Green**: `maybe = 0` and `high_confidence = 0`
- **Red**: `high_confidence > 0`
- **Yellow**: `maybe > 0` and `high_confidence = 0`

Thresholds are configurable via environment variables in Docker.

### 4.3 Multiple API capabilities (different “things” the app can do)

These map to UI actions and standalone endpoints:

| Capability | Endpoint | UI trigger |
|------------|----------|------------|
| Health check | `GET /api/v1/health` | Dashboard “system OK” |
| List input files | `GET /api/v1/files` | Data page |
| Classify folder | `POST /api/v1/classify/folder` | “Classify all” |
| Classify one file | `POST /api/v1/classify/file` | Per-file button |
| Classify JSON rows | `POST /api/v1/classify/row(s)` | Future / integrators |
| Model metadata | `GET /api/v1/model/info` | Footer or About |
| List classes | `GET /api/v1/classes` | Legend on Results |

---

## 5. System architecture (deployment)

How the web app is hosted:

```
Browser  →  Nginx (:80)  →  static files (web UI)
                         →  /api/*  →  FastAPI (:8000)
FastAPI  →  /data/in (CSVs), /app/models (joblib), /data/out (scored CSVs)
```

| Piece | Role in the **web app** |
|-------|-------------------------|
| **Nginx** | Public URL; serves the website; reverse proxy to API |
| **FastAPI** | Inference + JSON for the UI |
| **Docker Compose** | One command to run Nginx + API + volumes |

See **Appendix C** for Compose layout, folder structure, and Nginx sketch.

---

## 6. Implementation phases

### Phase 1 — MVP web app

- [ ] Export model artifacts from notebook (`joblib` + encoders + scaler).
- [ ] FastAPI: health, list files, **classify folder**, classify file.
- [ ] Folder batch: counts + green/yellow/red status.
- [ ] Nginx + static **Dashboard** and **Data** pages calling the API.
- [ ] `docker compose up` runs the full stack locally.

**MVP success**: User opens browser, clicks classify all, sees status badge and three counts.

### Phase 2 — Usability

- [ ] Results detail page; per-file breakdown.
- [ ] Download scored CSV from `/data/out`.
- [ ] Long-run jobs: `job_id` + polling endpoint.
- [ ] Row-level table filtered to yellow/red only.

### Phase 3 — Production hardening

- [ ] Authentication, HTTPS, rate limits.
- [ ] Settings UI for thresholds (if not env-only).
- [ ] Logging and audit of each run.

---

## 7. Roles and responsibilities

| Area | Owner focus |
|------|-------------|
| **ML / data** | Notebook parity: preprocessing, saved artifacts, reading CSV folder, inference |
| **API** | FastAPI endpoints, Pydantic schemas, batch aggregation |
| **Web UI** | Pages, status UX, calling API |
| **DevOps** | Docker Compose, Nginx config, volumes for `data/in` and `data/out` |

---

## 8. Success criteria (web app)

- [ ] User can use **only the browser** to classify a folder of CSVs and see green/yellow/red.
- [ ] UI shows **# normal**, **# maybe**, **# high-confidence anomaly**, and **total rows**.
- [ ] Predictions match the notebook pipeline (same 17 classes, same features).
- [ ] REST API is available under the same host for non-UI clients.
- [ ] Entire stack starts with **Docker Compose**.

---

## Appendix A — Model and artifacts (reference)

**Training data**: `userclasses_mapped_v2.csv`. **Target**: `userclass` (17 labels; Other/Externel → External).

**`preprocess_data`**: drop identifiers; label-encode objects; median impute; 15 feature columns.

**Ship in `models/`**: `best_model.joblib`, `scaler.joblib`, `label_encoders.joblib`, `target_encoder.joblib`, `feature_columns.json`, `metadata.json`.

---

## Appendix B — REST API summary

Base: `/api/v1` (proxied by Nginx).

**Classify folder** (primary):

```http
POST /api/v1/classify/folder
Content-Type: application/json

{
  "input_dir": "/data/in",
  "glob": "*.csv",
  "output_dir": "/data/out",
  "write_scored_csv": true
}
```

**Example response**:

```json
{
  "status": "yellow",
  "counts": {
    "rows_total": 120450,
    "normal": 119800,
    "maybe_anomaly": 600,
    "high_confidence_anomaly": 0
  },
  "files_processed": 12
}
```

Full endpoint table: health, ready, classify row/rows/file/folder, classes, model info, files.

---

## Appendix C — Docker Compose and repo layout

```
scipe-webapp/
├── docker-compose.yml
├── nginx/          # reverse proxy + static root
├── web/            # dashboard UI
├── api/            # FastAPI + inference services
└── data/
    ├── in/         # CSV input (your folder read)
    └── out/        # scored exports
```

Services: `api` (FastAPI, internal port 8000), `nginx` (port 8080 → browser). UI at `/`, API at `/api/`.

---

*Model source: `user_classification.ipynb` — Random Forest user-class classifier on SCIPE flow features.*
