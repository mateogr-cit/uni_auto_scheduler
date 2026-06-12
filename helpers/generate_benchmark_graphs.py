#!/usr/bin/env python3
"""
Generates visualisation figures from results/benchmark_runs.csv.

Run after calling POST /schedule-benchmark/compare (single) and/or
POST /schedule-benchmark/compare-school (full school) at least once.

The CSV must include the v2 timing columns: db_read_ms, db_write_ms,
db_rollback_ms. Older single-bucket db_ms files are read for backward
compat and folded into db_write_ms (which is what they used to measure).

Output (saved to results/benchmark_figures/):
  fig1_total_time.png          — Total runtime bar chart across all 4 modes (single semester)
  fig2_timing_breakdown.png    — Stacked bar: algorithm / auth / DB read|write|rollback / other per mode
  fig3_overhead_delta.png      — Extra cost added by realistic overhead vs native
  fig4_schedules.png           — Schedules simulated vs skipped per mode
  fig5_history.png             — Total runtime over time per mode (multi-run history)
  fig6_overhead_pie.png        — Where time goes in each realistic mode (pie charts)
  fig7_school_vs_single.png    — Full-school vs single-semester timing side-by-side
"""

import csv
import sys
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

# ── Style (matches existing generate_graphs.py) ───────────────────────────────

plt.rcParams.update({
    "font.family":       "serif",
    "font.size":         11,
    "axes.titlesize":    12,
    "axes.labelsize":    11,
    "xtick.labelsize":   10,
    "ytick.labelsize":   10,
    "legend.fontsize":   10,
    "figure.dpi":        150,
    "axes.spines.top":   False,
    "axes.spines.right": False,
    "lines.linewidth":   1.8,
    "lines.markersize":  6,
})

COLORS = {
    "baseline":            "#EA580C",   # orange
    "full":                "#2563EB",   # blue
    "baseline_realistic":  "#F59E0B",   # amber
    "full_realistic":      "#0891B2",   # cyan
}
LABELS = {
    "baseline":            "Baseline",
    "full":                "Full",
    "baseline_realistic":  "Baseline + Overhead",
    "full_realistic":      "Full + Overhead",
}
ALL_MODES = ["baseline", "full", "baseline_realistic", "full_realistic"]

# Timing-bucket colors (shared across fig2 / fig3 / fig6 for visual consistency).
BUCKET = {
    "Algorithm":   "#2563EB",  # blue
    "Auth (JWT)":  "#F59E0B",  # amber
    "DB read":     "#DC2626",  # red
    "DB write":    "#7F1D1D",  # dark red
    "DB rollback": "#FCA5A5",  # light red
    "Other":       "#9CA3AF",  # gray
}

CSV_PATH = Path("results/benchmark_runs.csv")
OUT = Path("results/benchmark_figures")


# ── Load data ─────────────────────────────────────────────────────────────────

def load_csv() -> list[dict]:
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found.")
        print("Run POST /schedule-benchmark/compare first to generate results.")
        sys.exit(1)

    rows = []
    with open(CSV_PATH, newline="") as f:
        for r in csv.DictReader(f):
            # Legacy CSVs only had a single db_ms bucket that measured flush time.
            # Fold it into db_write_ms so old runs still plot sensibly.
            legacy_db = float(r.get("db_ms", 0) or 0)
            rows.append({
                "timestamp":           r["timestamp"],
                "scope":               r.get("scope", "single"),
                "mode":                r["mode"],
                "run_index":           int(r.get("run_index", 0) or 0),
                "year":                int(r["year"]),
                "semester_number":     int(r["semester_number"]),
                "schedules_simulated": int(r["schedules_simulated"]),
                "skipped_count":       int(r["skipped_count"]),
                "total_records":       int(r.get("total_records", 0) or 0),
                "total_ms":            float(r["total_ms"]),
                "algorithm_ms":        float(r["algorithm_ms"]),
                "auth_ms":             float(r["auth_ms"]),
                "db_read_ms":          float(r.get("db_read_ms", 0) or 0),
                "db_write_ms":         float(r.get("db_write_ms", legacy_db) or legacy_db),
                "db_rollback_ms":      float(r.get("db_rollback_ms", 0) or 0),
            })
    return rows


def _std(vals: list[float]) -> float:
    if len(vals) < 2:
        return 0.0
    arr = np.array(vals)
    return float(arr.std(ddof=1))


def aggregate_per_mode(rows: list[dict], scope: str = "single") -> dict[str, dict]:
    """
    Group rows by mode (filtered to one scope) and return per-mode mean+std
    over the most recent batch of runs. "Most recent batch" = the maximal set
    of rows whose timestamps are within 1 hour of the latest timestamp for
    that (scope, mode). This keeps old experimental data out of the std dev
    while still letting you run multiple sessions over time.
    """
    by_mode: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        if r.get("scope", "single") == scope:
            by_mode[r["mode"]].append(r)

    stats: dict[str, dict] = {}
    for mode, runs in by_mode.items():
        runs_sorted = sorted(runs, key=lambda x: x["timestamp"])
        latest_ts = runs_sorted[-1]["timestamp"]
        # Take all rows sharing run_index sequence 0..N-1 ending at the latest run.
        # Simpler: just take all runs that share the same timestamp-date+hour prefix
        # as the latest, falling back to the whole set if that's too aggressive.
        latest_prefix = latest_ts[:13]  # YYYY-MM-DDTHH
        batch = [r for r in runs_sorted if r["timestamp"][:13] == latest_prefix]
        if len(batch) < 2:
            batch = runs_sorted  # not enough samples in the latest hour, use all

        def col(k):
            return [r[k] for r in batch]

        stats[mode] = {
            "n": len(batch),
            "total_ms_mean":       float(np.mean(col("total_ms"))),
            "total_ms_std":        _std(col("total_ms")),
            "algorithm_ms_mean":   float(np.mean(col("algorithm_ms"))),
            "algorithm_ms_std":    _std(col("algorithm_ms")),
            "auth_ms_mean":        float(np.mean(col("auth_ms"))),
            "auth_ms_std":         _std(col("auth_ms")),
            "db_read_ms_mean":     float(np.mean(col("db_read_ms"))),
            "db_read_ms_std":      _std(col("db_read_ms")),
            "db_write_ms_mean":    float(np.mean(col("db_write_ms"))),
            "db_write_ms_std":     _std(col("db_write_ms")),
            "db_rollback_ms_mean": float(np.mean(col("db_rollback_ms"))),
            "db_rollback_ms_std":  _std(col("db_rollback_ms")),
            "schedules_simulated": int(np.median(col("schedules_simulated"))),
            "skipped_count":       int(np.median(col("skipped_count"))),
            # Keep a representative single row for fields that aren't averaged.
            "_row":                batch[-1],
        }
    return stats


def _bucket_values(r: dict) -> dict[str, float]:
    """Return the 6-bucket breakdown of a row's total_ms."""
    measured = (
        r["algorithm_ms"] + r["auth_ms"]
        + r["db_read_ms"] + r["db_write_ms"] + r["db_rollback_ms"]
    )
    return {
        "Algorithm":   r["algorithm_ms"],
        "Auth (JWT)":  r["auth_ms"],
        "DB read":     r["db_read_ms"],
        "DB write":    r["db_write_ms"],
        "DB rollback": r["db_rollback_ms"],
        "Other":       max(0, r["total_ms"] - measured),
    }


def latest_per_mode(rows: list[dict], scope: str = "single") -> dict[str, dict]:
    """Return the most recent row for each mode, filtered by scope."""
    latest: dict[str, dict] = {}
    for r in rows:
        if r.get("scope", "single") != scope:
            continue
        if r["mode"] not in latest or r["timestamp"] > latest[r["mode"]]["timestamp"]:
            latest[r["mode"]] = r
    return latest


def all_mode_handles():
    """
    Return matplotlib legend handles + labels for every mode in ALL_MODES,
    using the canonical COLORS/LABELS dicts. Used so charts always show the
    full color key, even if a particular figure only plots a subset of modes.
    """
    from matplotlib.patches import Patch
    handles = [Patch(facecolor=COLORS[m], label=LABELS[m]) for m in ALL_MODES]
    labels  = [LABELS[m] for m in ALL_MODES]
    return handles, labels


def save(fig, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT / f"{name}.png", dpi=200, bbox_inches="tight")
    fig.savefig(OUT / f"{name}.pdf", bbox_inches="tight")
    plt.close(fig)
    print(f"Saved {name}")


# ── Fig 1 — Total runtime bar chart ──────────────────────────────────────────

def fig1_total_time(stats: dict[str, dict]) -> None:
    modes = [m for m in ALL_MODES if m in stats]
    values = [stats[m]["total_ms_mean"] for m in modes]
    errors = [stats[m]["total_ms_std"]  for m in modes]
    colors = [COLORS[m] for m in modes]
    xlabels = [LABELS[m] for m in modes]
    n = max((stats[m]["n"] for m in modes), default=1)

    fig, ax = plt.subplots(figsize=(7, 4.5))
    bars = ax.bar(
        xlabels, values, color=colors, width=0.55, yerr=errors,
        capsize=4, error_kw={"elinewidth": 1.2, "ecolor": "#333"}, zorder=3,
    )

    headroom = max(v + e for v, e in zip(values, errors)) if values else 1
    for bar, val, err in zip(bars, values, errors):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + err + headroom * 0.015,
            f"{val:.1f} ± {err:.1f} ms" if err > 0 else f"{val:.1f} ms",
            ha="center", va="bottom", fontsize=9, fontweight="bold",
        )

    ax.set_xlabel("Scheduling mode")
    ax.set_ylabel("Total runtime (ms)")
    ax.set_title(f"End-to-end runtime per scheduling mode (n={n}, error bars = 1 SD)")
    ax.set_ylim(0, headroom * 1.22)
    ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6, zorder=0)
    ax.tick_params(axis="x", length=0)

    handles, labels = all_mode_handles()
    ax.legend(handles, labels, loc="upper left", fontsize=8.5, title="Modes")

    fig.tight_layout()
    save(fig, "fig1_total_time")


# ── Fig 2 — Stacked timing breakdown ─────────────────────────────────────────

def fig2_timing_breakdown(stats: dict[str, dict]) -> None:
    """
    Stacked bar chart of mean bucket times per mode, with a single error bar
    at the top of each stack showing 1 SD of the total runtime. Per-bucket
    std devs are not stacked because they are correlated; showing only the
    total's SD is the honest representation.
    """
    modes = [m for m in ALL_MODES if m in stats]
    xlabels = [LABELS[m] for m in modes]
    n = max((stats[m]["n"] for m in modes), default=1)

    bucket_order = ["Algorithm", "Auth (JWT)", "DB read", "DB write", "DB rollback", "Other"]

    def mean_buckets(mode: str) -> dict[str, float]:
        s = stats[mode]
        measured = (s["algorithm_ms_mean"] + s["auth_ms_mean"]
                    + s["db_read_ms_mean"] + s["db_write_ms_mean"]
                    + s["db_rollback_ms_mean"])
        return {
            "Algorithm":   s["algorithm_ms_mean"],
            "Auth (JWT)":  s["auth_ms_mean"],
            "DB read":     s["db_read_ms_mean"],
            "DB write":    s["db_write_ms_mean"],
            "DB rollback": s["db_rollback_ms_mean"],
            "Other":       max(0.0, s["total_ms_mean"] - measured),
        }

    bucket_arrays = {
        name: np.array([mean_buckets(m)[name] for m in modes])
        for name in bucket_order
    }
    total_means = np.array([stats[m]["total_ms_mean"] for m in modes])
    total_stds  = np.array([stats[m]["total_ms_std"]  for m in modes])

    fig, ax = plt.subplots(figsize=(7.5, 4.8))
    x = np.arange(len(modes))
    w = 0.55

    bottom = np.zeros(len(modes))
    for name in bucket_order:
        vals = bucket_arrays[name]
        ax.bar(x, vals, width=w, bottom=bottom, label=name,
               color=BUCKET[name], zorder=3)
        bottom = bottom + vals

    ax.errorbar(
        x, total_means, yerr=total_stds, fmt="none",
        ecolor="#111", elinewidth=1.2, capsize=4, zorder=5,
    )

    ax.set_xticks(x)
    ax.set_xticklabels(xlabels)
    ax.set_xlabel("Scheduling mode")
    ax.set_ylabel("Time (ms)")
    ax.set_title(f"Timing breakdown by component (n={n}, error bars on total = 1 SD)")
    ax.legend(loc="upper left", fontsize=8.5)
    ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6, zorder=0)
    ax.tick_params(axis="x", length=0)

    fig.tight_layout()
    save(fig, "fig2_timing_breakdown")


# ── Fig 3 — Overhead delta (realistic vs native) ──────────────────────────────

def fig3_overhead_delta(stats: dict[str, dict]) -> None:
    pairs = [("baseline", "baseline_realistic"), ("full", "full_realistic")]
    if not all(m in stats for pair in pairs for m in pair):
        print("Skipping fig3: need all 4 modes in results")
        return

    categories = ["Algorithm", "Auth (JWT)", "DB read", "DB write", "DB rollback", "Other"]
    bucket_keys = {
        "Algorithm":   "algorithm_ms",
        "Auth (JWT)":  "auth_ms",
        "DB read":     "db_read_ms",
        "DB write":    "db_write_ms",
        "DB rollback": "db_rollback_ms",
    }

    def mean_for(mode: str, cat: str) -> float:
        s = stats[mode]
        if cat == "Other":
            measured = sum(s[f"{bucket_keys[c]}_mean"] for c in categories if c != "Other")
            return max(0.0, s["total_ms_mean"] - measured)
        return s[f"{bucket_keys[cat]}_mean"]

    def std_for(mode: str, cat: str) -> float:
        if cat == "Other":
            return 0.0
        return stats[mode][f"{bucket_keys[cat]}_std"]

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8), sharey=False)

    for ax, (native_mode, real_mode) in zip(axes, pairs):
        native_vals = [mean_for(native_mode, c) for c in categories]
        real_vals   = [mean_for(real_mode,   c) for c in categories]
        native_err  = [std_for(native_mode, c) for c in categories]
        real_err    = [std_for(real_mode,   c) for c in categories]

        x = np.arange(len(categories))
        w = 0.38
        color_native = COLORS[native_mode]
        color_real   = COLORS[real_mode]

        ax.bar(x - w/2, native_vals, width=w, label=LABELS[native_mode], color=color_native, zorder=3,
               yerr=native_err, capsize=3, error_kw={"elinewidth": 1, "ecolor": "#333"})
        ax.bar(x + w/2, real_vals,   width=w, label=LABELS[real_mode],   color=color_real,   zorder=3, alpha=0.85,
               yerr=real_err, capsize=3, error_kw={"elinewidth": 1, "ecolor": "#333"})

        ax.set_xticks(x)
        ax.set_xticklabels(categories, fontsize=8.5, rotation=20, ha="right")
        ax.set_xlabel("Timing component")
        ax.set_ylabel("Time (ms)")
        title_base = "Baseline" if "baseline" in native_mode else "Full"
        ax.set_title(f"{title_base}: native vs overhead")
        ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6, zorder=0)
        ax.tick_params(axis="x", length=0)

    fig.suptitle("Per-component overhead: native vs realistic modes", fontsize=12)
    handles, labels = all_mode_handles()
    fig.legend(handles, labels, loc="lower center", ncol=4, fontsize=9,
               frameon=False, bbox_to_anchor=(0.5, -0.02))
    fig.tight_layout(rect=(0, 0.05, 1, 1))
    save(fig, "fig3_overhead_delta")


# ── Fig 4 — Schedules simulated vs skipped ───────────────────────────────────

def fig4_schedules(stats_single: dict[str, dict],
                   stats_school: dict[str, dict]) -> None:
    """
    Two-panel chart: single semester (left) and full school (right).
    Lets the reader see that the strategies are indistinguishable on small
    workloads (left) and only diverge when room/professor pressure rises
    at school scale (right).
    """
    scopes = [
        ("Single-semester (year 1, sem 1)", stats_single, 55),
        ("6-semester",                      stats_school, 330),
    ]
    # Skip the school panel if no school data is loaded.
    scopes = [(t, s, e) for (t, s, e) in scopes if s]
    if not scopes:
        print("Skipping fig4: no data for either scope")
        return

    fig, axes = plt.subplots(1, len(scopes), figsize=(5.5 * len(scopes), 4.8),
                             sharey=False)
    if len(scopes) == 1:
        axes = [axes]

    for ax, (title, stats, expected) in zip(axes, scopes):
        modes = [m for m in ALL_MODES if m in stats]
        xlabels = [LABELS[m] for m in modes]
        simulated = [stats[m]["schedules_simulated"] for m in modes]
        skipped   = [stats[m]["skipped_count"]       for m in modes]

        x = np.arange(len(modes))
        w = 0.38

        bars_s = ax.bar(x - w/2, simulated, width=w, label="Simulated",
                        color="#16A34A", zorder=3)
        bars_k = ax.bar(x + w/2, skipped,   width=w, label="Skipped",
                        color="#DC2626", zorder=3, alpha=0.85)

        top = max(simulated + skipped + [expected]) if simulated else expected
        for bar, val in list(zip(bars_s, simulated)) + list(zip(bars_k, skipped)):
            if val > 0:
                ax.text(
                    bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + top * 0.012,
                    f"{val}",
                    ha="center", va="bottom", fontsize=8.5,
                )

        ax.axhline(expected, linestyle="--", color="#555", linewidth=1,
                   zorder=2, label=f"Expected ({expected})")

        ax.set_xticks(x)
        ax.set_xticklabels(xlabels, rotation=15, ha="right", fontsize=9)
        ax.set_xlabel("Scheduling mode")
        ax.set_ylabel("Course-group pairs")
        ax.set_title(title)
        ax.set_ylim(0, top * 1.15)
        ax.legend(fontsize=8.5, loc="upper right")
        ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6, zorder=0)
        ax.tick_params(axis="x", length=0)

    fig.suptitle("Schedules simulated vs skipped per mode", fontsize=12)
    fig.tight_layout()
    save(fig, "fig4_schedules")


# ── Fig 5 — History: total_ms over time per mode ─────────────────────────────

def fig5_history(rows: list[dict]) -> None:
    by_mode: dict[str, list] = defaultdict(list)
    for r in rows:
        by_mode[r["mode"]].append((r["timestamp"], r["total_ms"]))

    has_history = any(len(v) > 1 for v in by_mode.values())
    if not has_history:
        print("Skipping fig5_history: only 1 run recorded (need multiple runs)")
        return

    fig, ax = plt.subplots(figsize=(8, 5.6))

    for mode in ALL_MODES:
        if mode not in by_mode:
            continue
        points = sorted(by_mode[mode], key=lambda x: x[0])
        timestamps = [p[0] for p in points]
        values     = [p[1] for p in points]
        run_nums   = list(range(1, len(points) + 1))

        ax.plot(run_nums, values, marker="o", color=COLORS[mode],
                label=LABELS[mode], linewidth=1.8)

    ax.set_xlabel("Run number")
    ax.set_ylabel("Total runtime (ms)")
    ax.set_title("Runtime history per mode across benchmark runs")
    ax.xaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    handles, labels = all_mode_handles()
    ax.legend(
        handles, labels, title="Modes",
        loc="upper center", bbox_to_anchor=(0.5, -0.16),
        ncol=2, fontsize=9, frameon=False,
    )
    ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6)

    fig.tight_layout(rect=(0, 0.18, 1, 1))
    save(fig, "fig5_history")


# ── Fig 6 — Pie: where time goes in each realistic mode ──────────────────────

def fig6_overhead_pie(stats: dict[str, dict]) -> None:
    realistic_modes = ["baseline_realistic", "full_realistic"]
    available = [m for m in realistic_modes if m in stats]
    if not available:
        print("Skipping fig6: no realistic mode results found")
        return

    fig, axes = plt.subplots(1, len(available), figsize=(7.2 * len(available), 5))
    if len(available) == 1:
        axes = [axes]

    bucket_order = ["Algorithm", "Auth (JWT)", "DB read", "DB write", "DB rollback", "Other"]

    for ax, mode in zip(axes, available):
        s = stats[mode]
        measured = (s["algorithm_ms_mean"] + s["auth_ms_mean"]
                    + s["db_read_ms_mean"] + s["db_write_ms_mean"]
                    + s["db_rollback_ms_mean"])
        buckets = {
            "Algorithm":   s["algorithm_ms_mean"],
            "Auth (JWT)":  s["auth_ms_mean"],
            "DB read":     s["db_read_ms_mean"],
            "DB write":    s["db_write_ms_mean"],
            "DB rollback": s["db_rollback_ms_mean"],
            "Other":       max(0.0, s["total_ms_mean"] - measured),
        }
        sizes  = [buckets[name] for name in bucket_order]
        labels = list(bucket_order)
        colors = [BUCKET[name] for name in bucket_order]

        # Drop zero slices so the legend isn't cluttered with 0.0% entries.
        filtered = [(sz, l, c) for sz, l, c in zip(sizes, labels, colors) if sz > 0]
        if not filtered:
            continue
        sizes_f, labels_f, colors_f = zip(*filtered)
        total_f = sum(sizes_f)

        wedges, _texts = ax.pie(
            sizes_f,
            labels=None,
            colors=colors_f,
            startangle=90,
            wedgeprops={"edgecolor": "white", "linewidth": 1},
        )

        # Build a side legend so labels and percentages don't fight the slices.
        legend_labels = [
            f"{lbl}  {(sz / total_f) * 100:.1f}%  ({sz:.1f} ms)"
            for lbl, sz in zip(labels_f, sizes_f)
        ]
        ax.legend(
            wedges,
            legend_labels,
            loc="center left",
            bbox_to_anchor=(1.02, 0.5),
            fontsize=9,
            frameon=False,
            title="Component",
        )

        ax.set_title(
            f"{LABELS[mode]}\n(total: {s['total_ms_mean']:.1f} ± {s['total_ms_std']:.1f} ms, n={s['n']})",
            fontsize=11,
        )

    fig.suptitle("Time distribution in realistic modes", fontsize=12)
    fig.tight_layout(rect=(0, 0, 1, 0.95))
    save(fig, "fig6_overhead_pie")


# ── Fig 7 — Full-school vs single-semester timing ────────────────────────────

def fig7_school_vs_single(
    single: dict[str, dict],
    school: dict[str, dict],
) -> None:
    if not single and not school:
        print("Skipping fig7: need at least one scope with results")
        return
    if not school:
        print("Skipping fig7: no full_school results found (run POST /schedule-benchmark/compare-school first)")
        return
    if not single:
        print("Skipping fig7: no single-semester results found (run POST /schedule-benchmark/compare first)")
        return

    modes = [m for m in ALL_MODES if m in single or m in school]
    x     = np.arange(len(modes))
    w     = 0.35

    single_vals = [single.get(m, {}).get("total_ms_mean", 0) for m in modes]
    school_vals = [school.get(m, {}).get("total_ms_mean", 0) for m in modes]
    single_err  = [single.get(m, {}).get("total_ms_std",  0) for m in modes]
    school_err  = [school.get(m, {}).get("total_ms_std",  0) for m in modes]
    xlabels     = [LABELS[m] for m in modes]
    colors      = [COLORS[m] for m in modes]

    fig, ax = plt.subplots(figsize=(9, 6.2))

    bars_s = ax.bar(x - w / 2, single_vals, width=w, label="Single-semester",
                    color=colors, zorder=3, yerr=single_err, capsize=3,
                    error_kw={"elinewidth": 1, "ecolor": "#333"})
    bars_f = ax.bar(x + w / 2, school_vals, width=w, label="6-semester",
                    color=colors, alpha=0.5, hatch="//", zorder=3, yerr=school_err, capsize=3,
                    error_kw={"elinewidth": 1, "ecolor": "#333"})

    max_val = max([v + e for v, e in zip(single_vals + school_vals, single_err + school_err)] or [1])
    for bar, val, err in (list(zip(bars_s, single_vals, single_err))
                          + list(zip(bars_f, school_vals, school_err))):
        if val > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + err + max_val * 0.012,
                f"{val:.0f}±{err:.0f}ms" if err > 0 else f"{val:.0f}ms",
                ha="center", va="bottom", fontsize=8,
            )

    ax.set_xticks(x)
    ax.set_xticklabels(xlabels)
    ax.set_xlabel("Scheduling mode")
    ax.set_ylabel("Total runtime (ms)")
    ax.set_title("Single-semester vs 6-semester: runtime per mode")
    ax.set_ylim(0, max_val * 1.22)

    from matplotlib.patches import Patch
    # One legend entry per actual bar in the chart: 4 modes x 2 scopes = 8.
    single_handles = [
        Patch(facecolor=COLORS[m], label=f"Single-semester / {LABELS[m]}")
        for m in ALL_MODES
    ]
    school_handles = [
        Patch(facecolor=COLORS[m], alpha=0.5, hatch="//",
              label=f"6-semester / {LABELS[m]}")
        for m in ALL_MODES
    ]
    # Interleave so each row of the legend pairs the same mode across scopes:
    # row 1 = Single Baseline | 6-sem Baseline, row 2 = Single Full | 6-sem Full, etc.
    interleaved = []
    for s, f in zip(single_handles, school_handles):
        interleaved.extend([s, f])
    all_labels = [h.get_label() for h in interleaved]
    ax.legend(
        interleaved, all_labels,
        loc="upper center", bbox_to_anchor=(0.5, -0.18),
        fontsize=8, ncol=2, title="Scope / Mode",
        frameon=False,
    )
    ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6, zorder=0)
    ax.tick_params(axis="x", length=0)

    fig.tight_layout(rect=(0, 0.22, 1, 1))
    save(fig, "fig7_school_vs_single")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    rows = load_csv()

    single_rows = [r for r in rows if r.get("scope", "single") == "single"]
    school_rows = [r for r in rows if r.get("scope", "") == "full_school"]

    stats        = aggregate_per_mode(rows, scope="single")
    stats_school = aggregate_per_mode(rows, scope="full_school")

    print(f"Loaded {len(rows)} benchmark run(s): "
          f"{len(single_rows)} single, {len(school_rows)} full_school.")
    for mode, s in stats.items():
        print(f"  single/{mode}: n={s['n']}, "
              f"total_ms = {s['total_ms_mean']:.2f} ± {s['total_ms_std']:.2f}")
    for mode, s in stats_school.items():
        print(f"  full_school/{mode}: n={s['n']}, "
              f"total_ms = {s['total_ms_mean']:.2f} ± {s['total_ms_std']:.2f}")
    print(f"Generating figures → {OUT.resolve()}\n")

    fig1_total_time(stats)
    fig2_timing_breakdown(stats)
    fig3_overhead_delta(stats)
    fig4_schedules(stats, stats_school)
    fig5_history(single_rows)
    fig6_overhead_pie(stats)
    fig7_school_vs_single(stats, stats_school)

    print(f"\nAll figures saved to: {OUT.resolve()}")
