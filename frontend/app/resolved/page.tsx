"use client";

import React, { useEffect, useState } from "react";
import {
    Archive,
    CheckCircle2,
    XCircle,
    MessageSquareWarning,
    CalendarX,
    Sliders,
    Loader2,
    AlertTriangle,
    Mail,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE } from "@/lib/constants";

type ResolutionKind =
    | "complaint_resolved"
    | "unavailability_approved"
    | "unavailability_rejected"
    | "weight_adjusted";

interface Resolution {
    id: number;
    kind: ResolutionKind | string;
    ref_id: number | null;
    summary: Record<string, unknown>;
    resolved_at: string;
}

interface ResolutionsResponse {
    window_days: number;
    count: number;
    resolutions: Resolution[];
}

const KIND_CONFIG: Record<
    string,
    { label: string; icon: React.ElementType; accent: string; badge: string }
> = {
    complaint_resolved: {
        label: "Complaint resolved",
        icon: MessageSquareWarning,
        accent: "border-amber-200 dark:border-amber-900/40",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    unavailability_approved: {
        label: "Unavailability approved",
        icon: CheckCircle2,
        accent: "border-green-200 dark:border-green-900/40",
        badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    unavailability_rejected: {
        label: "Unavailability rejected",
        icon: XCircle,
        accent: "border-zinc-200 dark:border-zinc-800",
        badge: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
    weight_adjusted: {
        label: "Course weight adjusted",
        icon: Sliders,
        accent: "border-blue-200 dark:border-blue-900/40",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    makeup_accepted: {
        label: "Make-up accepted, email sent",
        icon: Mail,
        accent: "border-red-200 dark:border-red-900/40",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
};

const FILTERS: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "complaint_resolved", label: "Complaints" },
    { value: "unavailability_approved", label: "Approvals" },
    { value: "unavailability_rejected", label: "Rejections" },
    { value: "weight_adjusted", label: "Weights" },
    { value: "makeup_accepted", label: "Make-ups" },
];

function renderSummary(kind: string, s: Record<string, unknown>): React.ReactNode {
    if (kind === "complaint_resolved") {
        const text = (s.text as string) ?? "";
        const student = (s.student_name as string) ?? "Unknown student";
        const course = (s.course_name as string) ?? null;
        return (
            <div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">&ldquo;{text}&rdquo;</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {student}
                    {course && <> · {course}</>}
                </p>
            </div>
        );
    }
    if (kind === "unavailability_approved" || kind === "unavailability_rejected") {
        const prof = (s.professor_name as string) ?? "Unknown professor";
        const date = (s.date as string) ?? "";
        const start = (s.start_time as string) ?? "";
        const end = (s.end_time as string) ?? "";
        const reason = (s.reason as string) ?? null;
        return (
            <div>
                <p className="text-sm text-zinc-900 dark:text-white font-medium">{prof}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {date} · {start}-{end}
                </p>
                {reason && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 italic">
                        &ldquo;{reason}&rdquo;
                    </p>
                )}
            </div>
        );
    }
    if (kind === "makeup_accepted") {
        const course = (s.course as string) ?? "";
        const abbr = (s.course_abbr as string) ?? "";
        const stype = (s.session_type as string) ?? "";
        const groupName = (s.group_name as string) ?? "";
        const missedDate = (s.missed_date as string) ?? "";
        const makeupDate = (s.makeup_date as string) ?? "";
        const location = (s.location as string) ?? "TBA";
        const recipients = Number(s.recipient_count ?? 0);
        return (
            <div>
                <p className="text-sm text-zinc-900 dark:text-white font-medium">
                    {course} <span className="text-zinc-500 dark:text-zinc-400 font-normal">({abbr}, {stype})</span>
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    {groupName} · missed {missedDate} · rescheduled to {makeupDate || "TBA"} @ {location}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Email sent to {recipients} student{recipients === 1 ? "" : "s"}.
                </p>
            </div>
        );
    }
    if (kind === "weight_adjusted") {
        const name = (s.c_name as string) ?? "Course";
        const abbr = (s.c_abbr as string) ?? "";
        const oldW = Number(s.old_weight ?? 0);
        const newW = Number(s.new_weight ?? 0);
        const delta = newW - oldW;
        const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
        const arrowColor =
            delta > 0
                ? "text-red-600 dark:text-red-400"
                : delta < 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-zinc-500";
        return (
            <div>
                <p className="text-sm text-zinc-900 dark:text-white font-medium">
                    {name} <span className="text-zinc-500 dark:text-zinc-400 font-normal">({abbr})</span>
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-mono">
                    {oldW.toFixed(2)} → {newW.toFixed(2)}{" "}
                    <span className={arrowColor}>
                        {arrow} {Math.abs(delta).toFixed(2)}
                    </span>
                </p>
            </div>
        );
    }
    return <pre className="text-xs text-zinc-500 dark:text-zinc-400">{JSON.stringify(s, null, 2)}</pre>;
}

export default function ResolvedHistoryPage() {
    const [resolutions, setResolutions] = useState<Resolution[]>([]);
    const [windowDays, setWindowDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        setLoading(true);
        fetch(`${API_BASE}/resolutions/recent?days=30`)
            .then((r) => {
                if (!r.ok) throw new Error(`Failed (${r.status})`);
                return r.json() as Promise<ResolutionsResponse>;
            })
            .then((data) => {
                setResolutions(data.resolutions);
                setWindowDays(data.window_days);
            })
            .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : "Unknown error")
            )
            .finally(() => setLoading(false));
    }, []);

    const visible = filter === "all" ? resolutions : resolutions.filter((r) => r.kind === filter);

    // Group by date (YYYY-MM-DD) for a readable timeline
    const groups = visible.reduce<Record<string, Resolution[]>>((acc, r) => {
        const day = r.resolved_at.slice(0, 10);
        (acc[day] ??= []).push(r);
        return acc;
    }, {});
    const sortedDays = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-500 shadow">
                            <Archive className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
                            Resolved History
                        </h1>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 ml-[3.25rem]">
                        Everything corrected, approved, rejected, or applied in the last {windowDays} days.
                    </p>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                filter === f.value
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent"
                                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow border border-zinc-200 dark:border-zinc-800"
                            >
                                <Skeleton className="h-5 w-40 mb-3" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-5 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
                                Failed to load history
                            </p>
                            <p className="text-red-600 dark:text-red-500 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && !error && visible.length === 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-16 text-center">
                        <Archive className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            Nothing resolved in the last {windowDays} days for this filter.
                        </p>
                    </div>
                )}

                {!loading && !error && visible.length > 0 && (
                    <div className="space-y-6">
                        {sortedDays.map((day) => (
                            <div key={day}>
                                <h2 className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 font-semibold">
                                    {new Date(day).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </h2>
                                <div className="space-y-3">
                                    {groups[day].map((r) => {
                                        const cfg = KIND_CONFIG[r.kind] ?? {
                                            label: r.kind,
                                            icon: Loader2,
                                            accent: "border-zinc-200 dark:border-zinc-800",
                                            badge:
                                                "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                                        };
                                        const Icon = cfg.icon;
                                        return (
                                            <div
                                                key={r.id}
                                                className={`bg-white dark:bg-zinc-900 rounded-xl p-4 shadow border ${cfg.accent}`}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}
                                                    >
                                                        <Icon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </span>
                                                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                                                        {new Date(r.resolved_at).toLocaleTimeString("en-US", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="ml-1">{renderSummary(r.kind, r.summary)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
