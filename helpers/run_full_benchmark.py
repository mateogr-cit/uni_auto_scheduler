#!/usr/bin/env python3
"""
One-shot benchmark orchestrator.

Pipeline:
  1. (optional) Re-seed the DB by running batch_requests/run_all.ps1
     (requires pwsh and the backend already running on :8000)
  2. POST /schedule-benchmark/compare?year=Y&semester_number=S&runs=N
  3. POST /schedule-benchmark/compare-school?runs=N
  4. Regenerate figures via generate_benchmark_graphs.py

Each `runs` iteration produces its own row in results/benchmark_runs.csv with a
run_index, so the graph script can aggregate to mean ± SD.

Usage:
    python run_full_benchmark.py                # 10 runs, no reseed, year=1 sem=1
    python run_full_benchmark.py --runs 10 --seed
    python run_full_benchmark.py --runs 10 --year 3 --semester 2 --skip-school

Assumes the backend is already running (uvicorn main:app --reload on :8000).
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).parent
BASE_URL = "http://localhost:8000"
HEALTH_PATH = "/docs"  # FastAPI always serves /docs when up


def _post(url: str, timeout: int = 600) -> dict:
    req = Request(url, method="POST")
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def wait_for_backend(timeout: int = 30) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urlopen(BASE_URL + HEALTH_PATH, timeout=2) as resp:
                if resp.status == 200:
                    return
        except (HTTPError, URLError, TimeoutError, ConnectionResetError):
            pass
        time.sleep(1)
    sys.exit(f"Backend did not respond at {BASE_URL} within {timeout}s. "
             f"Start it with: cd backend && uvicorn main:app --reload")


def wipe_db() -> None:
    """
    Drop and recreate every table defined in the backend models. This avoids
    needing to restart uvicorn with WIPE_ON_START=1 just to clear data.
    """
    print("Wiping DB (drop_all + create_all on backend models) ...")
    backend = ROOT / "backend"
    sys.path.insert(0, str(backend))
    try:
        from database import engine  # type: ignore
        from models import Base      # type: ignore
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    finally:
        sys.path.pop(0)
    print("Wipe complete.")


def create_admin() -> None:
    """Recreate the admin user after a wipe."""
    script = ROOT / "backend" / "create_admin.py"
    if not script.exists():
        print(f"  (skipping admin create: {script} not found)")
        return
    py = ROOT / "backend" / "venv" / "bin" / "python"
    py_exe = str(py) if py.exists() else sys.executable
    res = subprocess.run([py_exe, str(script)], cwd=script.parent)
    if res.returncode != 0:
        print(f"  (warning: create_admin.py exited with code {res.returncode})")


def reseed(wipe: bool = True) -> None:
    pwsh = shutil.which("pwsh") or shutil.which("powershell")
    if not pwsh:
        sys.exit("pwsh not found on PATH. Install PowerShell or skip --seed.")
    script = ROOT / "batch_requests" / "run_all.ps1"
    if not script.exists():
        sys.exit(f"{script} not found")
    if wipe:
        wipe_db()
    print(f"Reseeding DB via {script.name} ...")
    res = subprocess.run([pwsh, "-File", str(script)], cwd=script.parent)
    if res.returncode != 0:
        print(f"  (warning: run_all.ps1 exited with code {res.returncode}; "
              f"some scripts may have failed, continuing)")
    if wipe:
        create_admin()
    print("Reseed complete.\n")


def regenerate_graphs() -> None:
    script = ROOT / "generate_benchmark_graphs.py"
    print(f"\nRegenerating figures via {script.name} ...")
    res = subprocess.run([sys.executable, str(script)], cwd=ROOT)
    if res.returncode != 0:
        sys.exit(f"generate_benchmark_graphs.py exited with code {res.returncode}")


def _print_summary(label: str, summary: dict) -> None:
    print(f"\n{label}")
    print(f"  {'mode':<22} {'n':>3} {'total_ms (mean ± SD)':>26} {'alg_ms (mean ± SD)':>22}")
    for mode, s in summary.items():
        if not isinstance(s, dict):
            continue
        n = s.get("n_runs", 0)
        t_mean = s.get("total_ms_mean", 0)
        t_std  = s.get("total_ms_std",  0)
        a_mean = s.get("algorithm_ms_mean", 0)
        a_std  = s.get("algorithm_ms_std",  0)
        print(f"  {mode:<22} {n:>3} "
              f"{t_mean:>12.2f} ± {t_std:<10.2f} "
              f"{a_mean:>10.2f} ± {a_std:<8.2f}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--runs", type=int, default=10,
                   help="Iterations per mode (default 10).")
    p.add_argument("--year", type=int, default=1,
                   help="Year for single-semester benchmark (default 1).")
    p.add_argument("--semester", type=int, default=1,
                   help="Semester number for single-semester benchmark (default 1).")
    p.add_argument("--seed", action="store_true",
                   help="Wipe the DB (drop_all + create_all) then run "
                        "batch_requests/run_all.ps1 to reseed.")
    p.add_argument("--no-wipe", action="store_true",
                   help="With --seed, skip the drop_all step (seed into existing tables).")
    p.add_argument("--skip-single", action="store_true",
                   help="Skip /compare (single-semester) benchmark.")
    p.add_argument("--skip-school", action="store_true",
                   help="Skip /compare-school (full-school) benchmark.")
    p.add_argument("--skip-graphs", action="store_true",
                   help="Skip regenerating figures.")
    args = p.parse_args()

    if args.runs < 1:
        sys.exit("--runs must be >= 1")

    wait_for_backend()
    print(f"Backend reachable at {BASE_URL}\n")

    if args.seed:
        reseed(wipe=not args.no_wipe)
        wait_for_backend()

    if not args.skip_single:
        url = (f"{BASE_URL}/schedule-benchmark/compare"
               f"?year={args.year}&semester_number={args.semester}&runs={args.runs}")
        print(f"POST {url}")
        t0 = time.perf_counter()
        result = _post(url)
        elapsed = time.perf_counter() - t0
        print(f"  done in {elapsed:.1f}s, {args.runs} runs/mode × 4 modes "
              f"= {args.runs * 4} samples written to CSV")
        _print_summary("Single-semester summary:", result.get("summary", {}))

    if not args.skip_school:
        url = f"{BASE_URL}/schedule-benchmark/compare-school?runs={args.runs}"
        print(f"\nPOST {url}")
        t0 = time.perf_counter()
        result = _post(url)
        elapsed = time.perf_counter() - t0
        print(f"  done in {elapsed:.1f}s, {args.runs} runs/mode × 4 modes "
              f"= {args.runs * 4} samples written to CSV")
        _print_summary("Full-school summary:", result.get("summary", {}))

    if not args.skip_graphs:
        regenerate_graphs()

    print("\nDone.")


if __name__ == "__main__":
    main()
