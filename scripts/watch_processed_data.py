"""
Watch downloaded_data/processed_data and, after new or changed CSVs settle,
run the notebooks in order:

  1. flow_preprocessing.ipynb   -> userclasses_mapped_v2.csv
  2. user_classification.ipynb  -> train and evaluate on that file
  3. scripts/export_dashboard_snapshot.py -> dashboard/data/*.json

Start from the repo root:

  python scripts/watch_processed_data.py
"""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "downloaded_data" / "processed_data"
PREPROCESS_NB = REPO_ROOT / "flow_preprocessing.ipynb"
CLASSIFY_NB = REPO_ROOT / "user_classification.ipynb"
EXPORT_SCRIPT = REPO_ROOT / "scripts" / "export_dashboard_snapshot.py"
RUN_DIR = REPO_ROOT / "notebook_runs"

POLL_SECONDS = 5
SETTLE_SECONDS = 15


def snapshot() -> tuple[tuple[str, int, int], ...] | None:
    if not DATA_DIR.is_dir():
        return None
    files = sorted(DATA_DIR.glob("*.csv"))
    return tuple((p.name, p.stat().st_size, p.stat().st_mtime_ns) for p in files)


def run(cmd: list[str]) -> None:
    print(">", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def execute_notebook(notebook: Path) -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    run(
        [
            sys.executable,
            "-m",
            "jupyter",
            "nbconvert",
            "--to",
            "notebook",
            "--execute",
            "--output-dir",
            str(RUN_DIR),
            "--output",
            notebook.name,
            str(notebook),
        ]
    )


def pipeline() -> None:
    print("Running flow_preprocessing.ipynb", flush=True)
    execute_notebook(PREPROCESS_NB)
    print("Running user_classification.ipynb", flush=True)
    execute_notebook(CLASSIFY_NB)
    print("Refreshing dashboard JSON", flush=True)
    run([sys.executable, str(EXPORT_SCRIPT)])
    print("Pipeline finished", flush=True)


def main() -> None:
    print(f"Watching {DATA_DIR}", flush=True)
    print("Ctrl+C to stop", flush=True)
    previous = snapshot()
    pending_since: float | None = None
    pending: tuple[tuple[str, int, int], ...] | None = None

    while True:
        time.sleep(POLL_SECONDS)
        current = snapshot()
        if current is None:
            print(f"Waiting for {DATA_DIR} to exist", flush=True)
            continue
        if current == previous:
            pending_since = None
            pending = None
            continue
        if current != pending:
            pending = current
            pending_since = time.monotonic()
            print("Change detected; waiting for files to finish writing", flush=True)
            continue
        if pending_since is not None and time.monotonic() - pending_since >= SETTLE_SECONDS:
            try:
                pipeline()
            except subprocess.CalledProcessError as exc:
                print(f"Pipeline failed with exit code {exc.returncode}", flush=True)
            previous = snapshot()
            pending_since = None
            pending = None


if __name__ == "__main__":
    main()
