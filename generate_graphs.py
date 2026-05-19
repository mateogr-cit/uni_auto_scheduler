#!/usr/bin/env python3
"""
Generates publication-quality figures for Sections 5 & 6.

Output (saved to results/paper_run/figures/):
  fig1_feasibility.pdf   — Feasibility rate vs N (baseline vs full)
  fig2_s1_active_days.pdf — Avg active days per group vs N (S1)
  fig3_s2_compact_days.pdf — Compact-day fraction vs N (S2)
  fig4_runtime.pdf        — Mean runtime vs N with 95% CI
"""

import csv
import math
import statistics
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

# ── Style ─────────────────────────────────────────────────────────────────────

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
    "errorbar.capsize":  4,
})

BLUE   = "#2563EB"
ORANGE = "#EA580C"
OUT    = Path("results/paper_run/figures")
OUT.mkdir(parents=True, exist_ok=True)

# ── Load data ─────────────────────────────────────────────────────────────────

rows = []
with open("results/paper_run/results.csv") as f:
    for r in csv.DictReader(f):
        rows.append({k: float(v) if k != "instance" else int(v) for k, v in r.items()})

SIZES = sorted(set(int(r["n_groups"]) for r in rows))

def agg(key):
    means, cis = [], []
    for n in SIZES:
        vals = [r[key] for r in rows if int(r["n_groups"]) == n]
        m  = statistics.mean(vals)
        ci = 1.96 * statistics.stdev(vals) / math.sqrt(len(vals)) if len(vals) > 1 else 0
        means.append(m)
        cis.append(ci)
    return np.array(means), np.array(cis)

Ns = np.array(SIZES)

fb, fb_ci = agg("feasible_baseline")
ff, ff_ci = agg("feasible_full")
s1b, s1b_ci = agg("s1_baseline")
s1f, s1f_ci = agg("s1_full")
s2b, s2b_ci = agg("s2_baseline")
s2f, s2f_ci = agg("s2_full")
rtb, rtb_ci = agg("rt_baseline_ms")
rtf, rtf_ci = agg("rt_full_ms")

# ── Fig 1 — Feasibility ───────────────────────────────────────────────────────

fig, ax = plt.subplots(figsize=(5.5, 3.8))

ax.errorbar(Ns, fb * 100, yerr=fb_ci * 100,
            color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, ff * 100, yerr=ff_ci * 100,
            color=BLUE,   marker="o", linestyle="-",  label="Full")

ax.fill_between(Ns, (fb - fb_ci) * 100, (fb + fb_ci) * 100,
                color=ORANGE, alpha=0.12)
ax.fill_between(Ns, (ff - ff_ci) * 100, (ff + ff_ci) * 100,
                color=BLUE,   alpha=0.12)

# Room-slot saturation reference line: 180 pairs / (N*10 sessions)
sat_line = np.minimum(180 / (Ns * 10) * 100, 100)
ax.plot(Ns, sat_line, color="grey", linestyle=":", linewidth=1.2,
        label="Room capacity limit")

ax.set_xlabel("Number of student groups (N)")
ax.set_ylabel("Feasibility rate (%)")
ax.set_title("Fig. 1 — Feasibility rate vs. N")
ax.set_xticks(SIZES)
ax.set_ylim(0, 110)
ax.yaxis.set_major_formatter(mticker.PercentFormatter())
ax.legend(loc="upper right")
ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6)

fig.tight_layout()
fig.savefig(OUT / "fig1_feasibility.pdf")
fig.savefig(OUT / "fig1_feasibility.png", dpi=200)
plt.close(fig)
print("Saved fig1_feasibility")

# ── Fig 2 — S1 active days ────────────────────────────────────────────────────

fig, ax = plt.subplots(figsize=(5.5, 3.8))

ax.errorbar(Ns, s1b, yerr=s1b_ci,
            color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, s1f, yerr=s1f_ci,
            color=BLUE,   marker="o", linestyle="-",  label="Full")

ax.fill_between(Ns, s1b - s1b_ci, s1b + s1b_ci, color=ORANGE, alpha=0.12)
ax.fill_between(Ns, s1f - s1f_ci, s1f + s1f_ci, color=BLUE,   alpha=0.12)

ax.axhline(5, color="grey", linestyle=":", linewidth=1.2, label="Maximum (5 days)")

ax.set_xlabel("Number of student groups (N)")
ax.set_ylabel("Avg active days per group per week")
ax.set_title("Fig. 2 — Average active days per group (S1) vs. N")
ax.set_xticks(SIZES)
ax.set_ylim(2.5, 5.5)
ax.legend(loc="lower left")
ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6)

fig.tight_layout()
fig.savefig(OUT / "fig2_s1_active_days.pdf")
fig.savefig(OUT / "fig2_s1_active_days.png", dpi=200)
plt.close(fig)
print("Saved fig2_s1_active_days")

# ── Fig 3 — S2 compact days ───────────────────────────────────────────────────

fig, ax = plt.subplots(figsize=(5.5, 3.8))

ax.errorbar(Ns, s2b * 100, yerr=s2b_ci * 100,
            color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, s2f * 100, yerr=s2f_ci * 100,
            color=BLUE,   marker="o", linestyle="-",  label="Full")

ax.fill_between(Ns, (s2b - s2b_ci) * 100, (s2b + s2b_ci) * 100,
                color=ORANGE, alpha=0.12)
ax.fill_between(Ns, (s2f - s2f_ci) * 100, (s2f + s2f_ci) * 100,
                color=BLUE,   alpha=0.12)

ax.set_xlabel("Number of student groups (N)")
ax.set_ylabel("Group-days with exactly 2 sessions (%)")
ax.set_title("Fig. 3 — Compact-day fraction (S2) vs. N")
ax.set_xticks(SIZES)
ax.set_ylim(-5, 110)
ax.yaxis.set_major_formatter(mticker.PercentFormatter())
ax.legend(loc="upper right")
ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6)

fig.tight_layout()
fig.savefig(OUT / "fig3_s2_compact_days.pdf")
fig.savefig(OUT / "fig3_s2_compact_days.png", dpi=200)
plt.close(fig)
print("Saved fig3_s2_compact_days")

# ── Fig 4 — Runtime ───────────────────────────────────────────────────────────

fig, ax = plt.subplots(figsize=(5.5, 3.8))

ax.errorbar(Ns, rtb, yerr=rtb_ci,
            color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, rtf, yerr=rtf_ci,
            color=BLUE,   marker="o", linestyle="-",  label="Full")

ax.fill_between(Ns, rtb - rtb_ci, rtb + rtb_ci, color=ORANGE, alpha=0.12)
ax.fill_between(Ns, rtf - rtf_ci, rtf + rtf_ci, color=BLUE,   alpha=0.12)

# Linear fit overlay for full mode
coeffs = np.polyfit(Ns, rtf, 1)
fit_line = np.polyval(coeffs, Ns)
ax.plot(Ns, fit_line, color=BLUE, linestyle=":", linewidth=1.2, alpha=0.7,
        label=f"Linear fit  (slope ≈ {coeffs[0]:.1f} ms/group)")

ax.set_xlabel("Number of student groups (N)")
ax.set_ylabel("Mean end-to-end runtime (ms)")
ax.set_title("Fig. 4 — Scheduling runtime vs. N  (includes DB I/O)")
ax.set_xticks(SIZES)
ax.set_ylim(0, None)
ax.legend(loc="upper left")
ax.grid(axis="y", linestyle=":", linewidth=0.6, alpha=0.6)

fig.tight_layout()
fig.savefig(OUT / "fig4_runtime.pdf")
fig.savefig(OUT / "fig4_runtime.png", dpi=200)
plt.close(fig)
print("Saved fig4_runtime")

# ── Fig 5 — Combined 2×2 overview (for paper appendix / slide) ────────────────

fig, axes = plt.subplots(2, 2, figsize=(10, 7))
fig.suptitle("Benchmark Summary — Baseline vs Full Configuration", fontsize=13)

# Feasibility
ax = axes[0, 0]
ax.errorbar(Ns, fb*100, yerr=fb_ci*100, color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, ff*100, yerr=ff_ci*100, color=BLUE,   marker="o", linestyle="-",  label="Full")
ax.plot(Ns, np.minimum(180/(Ns*10)*100, 100), color="grey", linestyle=":", linewidth=1.2)
ax.set_title("(a) Feasibility rate")
ax.set_ylabel("%"); ax.set_xticks(SIZES); ax.set_ylim(0,110)
ax.yaxis.set_major_formatter(mticker.PercentFormatter())
ax.legend(fontsize=9); ax.grid(axis="y", linestyle=":", alpha=0.5)
ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)

# S1
ax = axes[0, 1]
ax.errorbar(Ns, s1b, yerr=s1b_ci, color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, s1f, yerr=s1f_ci, color=BLUE,   marker="o", linestyle="-",  label="Full")
ax.axhline(5, color="grey", linestyle=":", linewidth=1.2)
ax.set_title("(b) Avg active days / group (S1)")
ax.set_ylabel("Days"); ax.set_xticks(SIZES); ax.set_ylim(2.5, 5.5)
ax.legend(fontsize=9); ax.grid(axis="y", linestyle=":", alpha=0.5)
ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)

# S2
ax = axes[1, 0]
ax.errorbar(Ns, s2b*100, yerr=s2b_ci*100, color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, s2f*100, yerr=s2f_ci*100, color=BLUE,   marker="o", linestyle="-",  label="Full")
ax.set_title("(c) Compact-day fraction (S2)")
ax.set_ylabel("%"); ax.set_xlabel("N (groups)"); ax.set_xticks(SIZES); ax.set_ylim(-5,110)
ax.yaxis.set_major_formatter(mticker.PercentFormatter())
ax.legend(fontsize=9); ax.grid(axis="y", linestyle=":", alpha=0.5)
ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)

# Runtime
ax = axes[1, 1]
ax.errorbar(Ns, rtb, yerr=rtb_ci, color=ORANGE, marker="s", linestyle="--", label="Baseline")
ax.errorbar(Ns, rtf, yerr=rtf_ci, color=BLUE,   marker="o", linestyle="-",  label="Full")
ax.set_title("(d) End-to-end runtime")
ax.set_ylabel("ms"); ax.set_xlabel("N (groups)"); ax.set_xticks(SIZES); ax.set_ylim(0, None)
ax.legend(fontsize=9); ax.grid(axis="y", linestyle=":", alpha=0.5)
ax.spines["top"].set_visible(False); ax.spines["right"].set_visible(False)

fig.tight_layout()
fig.savefig(OUT / "fig5_overview.pdf")
fig.savefig(OUT / "fig5_overview.png", dpi=200)
plt.close(fig)
print("Saved fig5_overview (2×2 summary)")

print(f"\nAll figures saved to: {OUT.resolve()}")
