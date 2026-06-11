"use client";

import React, { useState, useEffect } from "react";
import {
    Sparkles,
    Loader2,
    AlertTriangle,
    ChevronUp,
    ChevronDown,
    Minus,
    CalendarClock,
    MessageSquareWarning,
    Users,
    Check,
    X,
    Mail,
    Copy,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { API_BASE } from "@/lib/constants";

interface ConflictItem {
    course_abbr: string;
    session_type: string;
    missed_date: string;
    missed_slot: string;
}

interface GroupOverview {
    group_id: number;
    group_name: string;
    conflict_count: number;
    conflicts: ConflictItem[];
}

interface MakeupItem {
    course: string;
    session_type: string;
    missed_date: string;
    missed_slot: string;
    suggested_slot: string;
    suggested_slot_id?: number;
    reason: string;
    priority: "high" | "medium" | "low";
}

interface MakeupResult {
    group_name: string;
    analysis: string;
    makeups: MakeupItem[];
    conflicts_found?: number;
    generated_at: string;
}

interface WeightOverviewCourse {
    c_id: number;
    c_name: string;
    c_abbr: string;
    current_weight: number;
    complaint_count: number;
    complaints: { comp_id: number; text: string; time_slot?: string | null }[];
}

interface WeightOverview {
    courses: WeightOverviewCourse[];
    unmatched_count: number;
    total_complaints: number;
}

interface WeightRecommendation {
    c_id: number;
    c_name: string;
    course_abbr: string;
    current_weight: number;
    suggested_weight: number;
    delta: number;
    reason: string;
    priority: "high" | "medium" | "low";
    complaint_count: number;
}

interface WeightAnalysisResult {
    analysis: string;
    recommendations: WeightRecommendation[];
    unmatched_count: number;
    generated_at: string;
}

interface MakeupEmail {
    subject: string;
    body: string;
    recipients: string[];
    recipient_count: number;
    group_name: string;
    professor_name: string;
    makeup_date: string | null;
    location: string;
}

type MakeupDecision = "accepted" | "rejected";

const PRIORITY_CONFIG = {
    high: {
        label: "High",
        icon: ChevronUp,
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        border: "border-red-200 dark:border-red-900/40",
        dot: "bg-red-500",
    },
    medium: {
        label: "Medium",
        icon: Minus,
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-900/40",
        dot: "bg-amber-500",
    },
    low: {
        label: "Low",
        icon: ChevronDown,
        badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        border: "border-green-200 dark:border-green-900/40",
        dot: "bg-green-500",
    },
} as const;

type PerGroupState = {
    loading: boolean;
    result: MakeupResult | null;
    error: string | null;
};

export default function AiSuggestionsPage() {
    const [overview, setOverview] = useState<GroupOverview[]>([]);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [overviewError, setOverviewError] = useState<string | null>(null);

    // Keyed by group_id: per-group analyzer state
    const [perGroup, setPerGroup] = useState<Record<number, PerGroupState>>({});

    // Section 2 — complaint-driven weight adjustments
    const [weightOverview, setWeightOverview] = useState<WeightOverview | null>(null);
    const [weightOverviewLoading, setWeightOverviewLoading] = useState(true);
    const [weightOverviewError, setWeightOverviewError] = useState<string | null>(null);
    const [weightResult, setWeightResult] = useState<WeightAnalysisResult | null>(null);
    const [weightAnalyzing, setWeightAnalyzing] = useState(false);
    const [weightError, setWeightError] = useState<string | null>(null);
    const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
    const [applyingId, setApplyingId] = useState<number | null>(null);
    const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

    // Per-makeup decision tracking. Key = `${groupId}|${idx}`.
    const [makeupDecisions, setMakeupDecisions] = useState<Record<string, MakeupDecision>>({});
    const [acceptingKey, setAcceptingKey] = useState<string | null>(null);
    const [emailDialog, setEmailDialog] = useState<MakeupEmail | null>(null);
    const [emailCopied, setEmailCopied] = useState(false);
    // Cache of generated emails so the user can reopen one if the modal is dismissed.
    const [emailCache, setEmailCache] = useState<Record<string, MakeupEmail>>({});

    const makeupKey = (groupId: number, idx: number) => `${groupId}|${idx}`;

    const handleRejectMakeup = (groupId: number, idx: number) => {
        setMakeupDecisions((prev) => ({ ...prev, [makeupKey(groupId, idx)]: "rejected" }));
    };

    const handleAcceptMakeup = async (groupId: number, idx: number, m: MakeupItem) => {
        const key = makeupKey(groupId, idx);
        setAcceptingKey(key);
        try {
            const resp = await fetch(`${API_BASE}/ai/makeup-suggestions/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    group_id: groupId,
                    course: m.course,
                    session_type: m.session_type,
                    missed_date: m.missed_date,
                    missed_slot: m.missed_slot,
                    suggested_slot: m.suggested_slot,
                    suggested_slot_id: m.suggested_slot_id ?? null,
                    reason: m.reason,
                }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.detail ?? `Accept failed (${resp.status})`);
            }
            const email: MakeupEmail = await resp.json();
            setMakeupDecisions((prev) => ({ ...prev, [key]: "accepted" }));
            setEmailCache((prev) => ({ ...prev, [key]: email }));
            setEmailDialog(email);
            setEmailCopied(false);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Failed to accept");
        } finally {
            setAcceptingKey(null);
        }
    };

    // Re-open the email for an already-accepted make-up. Uses the in-memory cache
    // when available so we don't write another resolution_log row on reopen.
    const handleViewEmail = async (groupId: number, idx: number, m: MakeupItem) => {
        const key = makeupKey(groupId, idx);
        const cached = emailCache[key];
        if (cached) {
            setEmailDialog(cached);
            setEmailCopied(false);
            return;
        }
        // Cache miss (e.g. after a page reload): fall back to a fresh accept call.
        await handleAcceptMakeup(groupId, idx, m);
    };

    const handleCopyEmail = async () => {
        if (!emailDialog) return;
        const full = `Subject: ${emailDialog.subject}\n\n${emailDialog.body}`;
        try {
            await navigator.clipboard.writeText(full);
            setEmailCopied(true);
            setTimeout(() => setEmailCopied(false), 2000);
        } catch {
            // Clipboard unavailable — leave the button state as-is so the user can select manually.
        }
    };

    useEffect(() => {
        fetch(`${API_BASE}/ai/makeup-conflicts/overview`)
            .then((r) => {
                if (!r.ok) throw new Error(`Failed (${r.status})`);
                return r.json();
            })
            .then((data) => setOverview(data.groups ?? []))
            .catch((e: unknown) =>
                setOverviewError(e instanceof Error ? e.message : "Unknown error")
            )
            .finally(() => setOverviewLoading(false));

        fetch(`${API_BASE}/ai/weight-adjustments/overview`)
            .then((r) => {
                if (!r.ok) throw new Error(`Failed (${r.status})`);
                return r.json();
            })
            .then((data: WeightOverview) => setWeightOverview(data))
            .catch((e: unknown) =>
                setWeightOverviewError(e instanceof Error ? e.message : "Unknown error")
            )
            .finally(() => setWeightOverviewLoading(false));
    }, []);

    const handleAnalyzeWeights = async () => {
        setWeightAnalyzing(true);
        setWeightError(null);
        setWeightResult(null);
        try {
            const resp = await fetch(`${API_BASE}/ai/weight-adjustments/analyze`);
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.detail ?? `Request failed (${resp.status})`);
            }
            const result: WeightAnalysisResult = await resp.json();
            setWeightResult(result);
        } catch (e: unknown) {
            setWeightError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setWeightAnalyzing(false);
        }
    };

    const handleApplyWeight = async (rec: WeightRecommendation) => {
        setApplyingId(rec.c_id);
        try {
            const resp = await fetch(`${API_BASE}/ai/weight-adjustments/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ c_id: rec.c_id, new_weight: rec.suggested_weight }),
            });
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.detail ?? `Apply failed (${resp.status})`);
            }
            setAppliedIds((prev) => {
                const next = new Set(prev);
                next.add(rec.c_id);
                return next;
            });
            // Refresh overview so the displayed current_weight is in sync with the DB
            const ov = await fetch(`${API_BASE}/ai/weight-adjustments/overview`).then((r) => r.json());
            setWeightOverview(ov);
        } catch (e: unknown) {
            setWeightError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setApplyingId(null);
        }
    };

    const handleAnalyze = async (groupId: number) => {
        setPerGroup((prev) => ({
            ...prev,
            [groupId]: { loading: true, result: null, error: null },
        }));
        try {
            const resp = await fetch(`${API_BASE}/ai/makeup-suggestions/group/${groupId}`);
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.detail ?? `Request failed (${resp.status})`);
            }
            const result: MakeupResult = await resp.json();
            setPerGroup((prev) => ({
                ...prev,
                [groupId]: { loading: false, result, error: null },
            }));
        } catch (e: unknown) {
            setPerGroup((prev) => ({
                ...prev,
                [groupId]: {
                    loading: false,
                    result: null,
                    error: e instanceof Error ? e.message : "Unknown error",
                },
            }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-8">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-rose-500 shadow">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
                            AI Schedule Analysis
                        </h1>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 ml-[3.25rem]">
                        Approved unavailability requests grouped by affected student group.
                    </p>
                </div>

                {/* ============================================================ */}
                {/* SECTION 1 — Make-up Sessions, grouped by student group         */}
                {/* ============================================================ */}
                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarClock className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                            1. Make-up Sessions
                        </h2>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        Each card below is a student group whose schedule collides with at least one
                        approved professor unavailability. Click the per-group button to let the AI
                        recommend a make-up slot for that group&apos;s missed sessions.
                    </p>

                    {overviewLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow border border-zinc-200 dark:border-zinc-800">
                                    <Skeleton className="h-5 w-40 mb-3" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ))}
                        </div>
                    )}

                    {overviewError && !overviewLoading && (
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-5 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Failed to load conflicts</p>
                                <p className="text-red-600 dark:text-red-500 text-sm mt-1">{overviewError}</p>
                            </div>
                        </div>
                    )}

                    {!overviewLoading && !overviewError && overview.length === 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-16 text-center">
                            <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                No approved unavailability requests collide with any group&apos;s schedule.
                            </p>
                            <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">
                                Approve a pending request to see it appear here.
                            </p>
                        </div>
                    )}

                    {!overviewLoading && overview.length > 0 && (
                        <div className="space-y-4">
                            {overview.map((g) => {
                                const state = perGroup[g.group_id] ?? {
                                    loading: false,
                                    result: null,
                                    error: null,
                                };
                                return (
                                    <div
                                        key={g.group_id}
                                        className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                                    >
                                        {/* Group header row */}
                                        <div className="flex items-start justify-between gap-4 p-5 border-b border-zinc-100 dark:border-zinc-800">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                                                        {g.group_name}
                                                    </h3>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        {g.conflict_count} conflict{g.conflict_count === 1 ? "" : "s"}
                                                    </span>
                                                </div>
                                                <ul className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 space-y-1">
                                                    {g.conflicts.map((c, i) => (
                                                        <li key={i} className="flex gap-2">
                                                            <span className="text-zinc-400">·</span>
                                                            <span>
                                                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                                    {c.course_abbr} {c.session_type}
                                                                </span>{" "}
                                                                missed {c.missed_date} ({c.missed_slot})
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <Button
                                                onClick={() => handleAnalyze(g.group_id)}
                                                disabled={state.loading}
                                                className="bg-gradient-to-br from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white shrink-0"
                                            >
                                                {state.loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Fix Schedule
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Per-group result region */}
                                        {(state.loading || state.result || state.error) && (
                                            <div className="p-5 bg-zinc-50 dark:bg-zinc-950/40">
                                                {state.loading && (
                                                    <div className="space-y-3">
                                                        <Skeleton className="h-4 w-2/3" />
                                                        <Skeleton className="h-4 w-full" />
                                                        <Skeleton className="h-4 w-5/6" />
                                                    </div>
                                                )}

                                                {state.error && !state.loading && (
                                                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <span>{state.error}</span>
                                                    </div>
                                                )}

                                                {state.result && !state.loading && (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                                            {state.result.analysis}
                                                        </p>
                                                        {state.result.makeups.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {state.result.makeups.map((m, i) => {
                                                                    const priority = (m.priority in PRIORITY_CONFIG ? m.priority : "medium") as keyof typeof PRIORITY_CONFIG;
                                                                    const cfg = PRIORITY_CONFIG[priority];
                                                                    const Icon = cfg.icon;
                                                                    const mkKey = makeupKey(g.group_id, i);
                                                                    const decision = makeupDecisions[mkKey];
                                                                    const isAccepting = acceptingKey === mkKey;
                                                                    return (
                                                                        <div
                                                                            key={i}
                                                                            className={`bg-white dark:bg-zinc-900 rounded-lg p-4 border ${cfg.border} ${decision === "rejected" ? "opacity-50" : ""}`}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${cfg.dot}`} />
                                                                                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                                                                                        {m.course} — {m.session_type}
                                                                                    </p>
                                                                                </div>
                                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${cfg.badge}`}>
                                                                                    <Icon className="w-3 h-3" />
                                                                                    {cfg.label}
                                                                                </span>
                                                                            </div>
                                                                            <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                                                <div>
                                                                                    <p className="uppercase text-zinc-400 dark:text-zinc-600">Missed</p>
                                                                                    <p className="text-zinc-700 dark:text-zinc-300">
                                                                                        {m.missed_date} · {m.missed_slot}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="uppercase text-zinc-400 dark:text-zinc-600">Suggested</p>
                                                                                    <p className="text-zinc-900 dark:text-white font-medium">
                                                                                        {m.suggested_slot}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            {m.reason && (
                                                                                <p className="ml-4 mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                                                    {m.reason}
                                                                                </p>
                                                                            )}
                                                                            <div className="ml-4 mt-3 flex items-center gap-2">
                                                                                {decision === "accepted" ? (
                                                                                    <>
                                                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                                                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                                                            Accepted, email composed
                                                                                        </span>
                                                                                        <button
                                                                                            onClick={() => handleViewEmail(g.group_id, i, m)}
                                                                                            disabled={isAccepting}
                                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60"
                                                                                        >
                                                                                            {isAccepting ? (
                                                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                                            ) : (
                                                                                                <Mail className="w-3 h-3" />
                                                                                            )}
                                                                                            View email
                                                                                        </button>
                                                                                    </>
                                                                                ) : decision === "rejected" ? (
                                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                                                                        <X className="w-3.5 h-3.5" />
                                                                                        Rejected
                                                                                    </span>
                                                                                ) : (
                                                                                    <>
                                                                                        <button
                                                                                            onClick={() => handleAcceptMakeup(g.group_id, i, m)}
                                                                                            disabled={isAccepting}
                                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-600 hover:bg-green-500 text-white disabled:opacity-60"
                                                                                        >
                                                                                            {isAccepting ? (
                                                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                                            ) : (
                                                                                                <Check className="w-3 h-3" />
                                                                                            )}
                                                                                            Accept
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleRejectMakeup(g.group_id, i)}
                                                                                            disabled={isAccepting}
                                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-60"
                                                                                        >
                                                                                            <X className="w-3 h-3" />
                                                                                            Reject
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                                No make-ups produced by the model.
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-zinc-400 dark:text-zinc-600">
                                                            Generated {new Date(state.result.generated_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ============================================================ */}
                {/* SECTION 2 — Complaint-driven Course Weight Adjustments         */}
                {/* ============================================================ */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MessageSquareWarning className="w-5 h-5 text-amber-500" />
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                2. Course Weight Adjustments
                            </h2>
                        </div>
                        <Button
                            onClick={handleAnalyzeWeights}
                            disabled={
                                weightAnalyzing ||
                                weightOverviewLoading ||
                                !weightOverview ||
                                weightOverview.courses.length === 0
                            }
                            className="bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                        >
                            {weightAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Analyze Complaints
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                        Reads student complaints, links them to courses, and proposes a new
                        {" "}<code>c_difficulty_weight</code> per course so the auto-scheduler can
                        spread heavy courses across the week.
                    </p>

                    {/* Overview: complaint count per course (no LLM) */}
                    {weightOverviewLoading && (
                        <div className="space-y-3 mb-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow border border-zinc-200 dark:border-zinc-800">
                                    <Skeleton className="h-5 w-40 mb-3" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ))}
                        </div>
                    )}

                    {weightOverviewError && !weightOverviewLoading && (
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-5 border border-red-200 dark:border-red-900/40 flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Failed to load complaints overview</p>
                                <p className="text-red-600 dark:text-red-500 text-sm mt-1">{weightOverviewError}</p>
                            </div>
                        </div>
                    )}

                    {!weightOverviewLoading && weightOverview && weightOverview.courses.length === 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-16 text-center">
                            <MessageSquareWarning className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                No complaints linked to courses yet.
                            </p>
                            {weightOverview.unmatched_count > 0 && (
                                <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">
                                    {weightOverview.unmatched_count} complaint{weightOverview.unmatched_count === 1 ? "" : "s"} without a course tag (ignored).
                                </p>
                            )}
                        </div>
                    )}

                    {!weightOverviewLoading && weightOverview && weightOverview.courses.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800 mb-4 overflow-hidden">
                            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    Complaints by course
                                </p>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {weightOverview.total_complaints} total
                                    {weightOverview.unmatched_count > 0 && (
                                        <> · {weightOverview.unmatched_count} unmatched</>
                                    )}
                                </span>
                            </div>
                            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {weightOverview.courses.map((c) => {
                                    const isOpen = expandedCourse === c.c_id;
                                    return (
                                        <li key={c.c_id}>
                                            <button
                                                onClick={() => setExpandedCourse(isOpen ? null : c.c_id)}
                                                className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                                        {c.c_name} <span className="text-zinc-500 dark:text-zinc-400 font-normal">({c.c_abbr})</span>
                                                    </p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        weight {c.current_weight.toFixed(2)} · {c.complaint_count} complaint{c.complaint_count === 1 ? "" : "s"}
                                                    </p>
                                                </div>
                                                {isOpen ? (
                                                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <ul className="px-5 pb-4 space-y-2 bg-zinc-50 dark:bg-zinc-950/40">
                                                    {c.complaints.map((cmp) => (
                                                        <li
                                                            key={cmp.comp_id}
                                                            className="text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded p-2 border border-zinc-100 dark:border-zinc-800"
                                                        >
                                                            {cmp.time_slot && (
                                                                <span className="text-zinc-400 dark:text-zinc-500 mr-2">[{cmp.time_slot}]</span>
                                                            )}
                                                            {cmp.text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Analysis result */}
                    {weightError && (
                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mb-4">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{weightError}</span>
                        </div>
                    )}

                    {weightAnalyzing && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow border border-zinc-200 dark:border-zinc-800 space-y-3">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    )}

                    {weightResult && !weightAnalyzing && (
                        <div className="space-y-3">
                            {weightResult.analysis && (
                                <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow border border-zinc-200 dark:border-zinc-800">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        {weightResult.analysis}
                                    </p>
                                </div>
                            )}

                            {weightResult.recommendations.length === 0 ? (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    No actionable recommendations produced.
                                </p>
                            ) : (
                                weightResult.recommendations.map((rec) => {
                                    const priority = (rec.priority in PRIORITY_CONFIG ? rec.priority : "medium") as keyof typeof PRIORITY_CONFIG;
                                    const cfg = PRIORITY_CONFIG[priority];
                                    const Icon = cfg.icon;
                                    const applied = appliedIds.has(rec.c_id);
                                    const arrow = rec.delta > 0 ? "↑" : rec.delta < 0 ? "↓" : "→";
                                    const arrowColor =
                                        rec.delta > 0
                                            ? "text-red-600 dark:text-red-400"
                                            : rec.delta < 0
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-zinc-500";
                                    return (
                                        <div
                                            key={rec.c_id}
                                            className={`bg-white dark:bg-zinc-900 rounded-lg p-4 border ${cfg.border}`}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${cfg.dot}`} />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                                                            {rec.c_name} <span className="text-zinc-500 dark:text-zinc-400 font-normal">({rec.course_abbr})</span>
                                                        </p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                            based on {rec.complaint_count} complaint{rec.complaint_count === 1 ? "" : "s"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${cfg.badge}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div className="ml-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-2">
                                                <div>
                                                    <p className="uppercase text-zinc-400 dark:text-zinc-600">Current</p>
                                                    <p className="text-zinc-700 dark:text-zinc-300 font-mono">{rec.current_weight.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="uppercase text-zinc-400 dark:text-zinc-600">Suggested</p>
                                                    <p className="text-zinc-900 dark:text-white font-medium font-mono">{rec.suggested_weight.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="uppercase text-zinc-400 dark:text-zinc-600">Delta</p>
                                                    <p className={`font-medium font-mono ${arrowColor}`}>
                                                        {arrow} {Math.abs(rec.delta).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            {rec.reason && (
                                                <p className="ml-4 mb-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                    {rec.reason}
                                                </p>
                                            )}
                                            <div className="ml-4">
                                                <Button
                                                    size="sm"
                                                    disabled={applied || applyingId === rec.c_id}
                                                    onClick={() => handleApplyWeight(rec)}
                                                    className={
                                                        applied
                                                            ? "bg-green-600 hover:bg-green-600 text-white cursor-default"
                                                            : "bg-amber-500 hover:bg-amber-400 text-white"
                                                    }
                                                >
                                                    {applyingId === rec.c_id ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                            Applying...
                                                        </>
                                                    ) : applied ? (
                                                        "Applied"
                                                    ) : (
                                                        "Apply new weight"
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            <p className="text-xs text-zinc-400 dark:text-zinc-600">
                                Generated {new Date(weightResult.generated_at).toLocaleString()}
                                {weightResult.unmatched_count > 0 && (
                                    <> · {weightResult.unmatched_count} unmatched complaint{weightResult.unmatched_count === 1 ? "" : "s"} ignored</>
                                )}
                            </p>
                        </div>
                    )}
                </section>

            </div>

            {/* Email announcement modal */}
            <Dialog
                open={emailDialog !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEmailDialog(null);
                        setEmailCopied(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-red-500" />
                            Announcement Email
                        </DialogTitle>
                        <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                            Ready to send to {emailDialog?.recipient_count ?? 0} student
                            {emailDialog?.recipient_count === 1 ? "" : "s"} of {emailDialog?.group_name}.
                        </DialogDescription>
                    </DialogHeader>

                    {emailDialog && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                    Subject
                                </p>
                                <p className="text-sm font-medium text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 rounded-md px-3 py-2 border border-zinc-200 dark:border-zinc-700">
                                    {emailDialog.subject}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                    Recipients ({emailDialog.recipient_count})
                                </p>
                                <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-md px-3 py-2 border border-zinc-200 dark:border-zinc-700 max-h-20 overflow-y-auto">
                                    {emailDialog.recipients.length > 0
                                        ? emailDialog.recipients.join(", ")
                                        : "No student emails found for this group."}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                    Body
                                </p>
                                <pre className="text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 rounded-md px-3 py-3 border border-zinc-200 dark:border-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
                                    {emailDialog.body}
                                </pre>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                                <Button
                                    onClick={handleCopyEmail}
                                    className="bg-red-600 hover:bg-red-500 text-white"
                                >
                                    {emailCopied ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-1.5" />
                                            Copy email
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
