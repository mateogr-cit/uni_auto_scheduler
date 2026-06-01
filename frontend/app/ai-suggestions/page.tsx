"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertTriangle, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/lib/constants";

interface StudentGroup {
    group_id: number;
    group_name: string;
}

interface Suggestion {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
}

interface AiResult {
    group_name: string;
    analysis: string;
    suggestions: Suggestion[];
    generated_at: string;
}

const PRIORITY_CONFIG = {
    high: {
        label: "High Priority",
        icon: ChevronUp,
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        border: "border-red-200 dark:border-red-900/40",
        dot: "bg-red-500",
    },
    medium: {
        label: "Medium Priority",
        icon: Minus,
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-900/40",
        dot: "bg-amber-500",
    },
    low: {
        label: "Low Priority",
        icon: ChevronDown,
        badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        border: "border-green-200 dark:border-green-900/40",
        dot: "bg-green-500",
    },
} as const;

export default function AiSuggestionsPage() {
    const [groups, setGroups] = useState<StudentGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AiResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/student-groups/`)
            .then((r) => r.json())
            .then(setGroups)
            .catch(console.error)
            .finally(() => setGroupsLoading(false));
    }, []);

    const handleAnalyze = async () => {
        if (selectedGroupId === null) return;
        setAnalyzing(true);
        setResult(null);
        setError(null);
        try {
            const resp = await fetch(`${API_BASE}/ai/suggestions/group/${selectedGroupId}`);
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body.detail ?? `Request failed (${resp.status})`);
            }
            setResult(await resp.json());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-8">
            <div className="max-w-4xl mx-auto">

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
                        Select a student group to receive AI-powered suggestions for improving their weekly schedule.
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 mb-6">
                    <Label className="text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap">
                        Student Group
                    </Label>
                    {groupsLoading ? (
                        <Skeleton className="h-10 w-48" />
                    ) : (
                        <Select
                            value={selectedGroupId?.toString() ?? ""}
                            onValueChange={(v) => {
                                setSelectedGroupId(v ? Number(v) : null);
                                setResult(null);
                                setError(null);
                            }}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select a group...">
                                    {groups.find((g) => g.group_id === selectedGroupId)?.group_name ?? null}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.group_id} value={String(g.group_id)}>
                                        {g.group_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button
                        onClick={handleAnalyze}
                        disabled={selectedGroupId === null || analyzing}
                        className="bg-gradient-to-br from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white ml-auto"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Analyze Schedule
                            </>
                        )}
                    </Button>
                </div>

                {/* Loading skeleton */}
                {analyzing && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow border border-zinc-200 dark:border-zinc-800">
                            <Skeleton className="h-5 w-32 mb-4" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-5/6 mb-2" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow border border-zinc-200 dark:border-zinc-800">
                                <Skeleton className="h-4 w-48 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && !analyzing && (
                    <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-5 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Analysis failed</p>
                            <p className="text-red-600 dark:text-red-500 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && !analyzing && (
                    <div className="space-y-4">

                        {/* Analysis summary */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-red-500" />
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                    Schedule Analysis — {result.group_name}
                                </h2>
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                                {result.analysis}
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-4">
                                Generated {new Date(result.generated_at).toLocaleString()}
                            </p>
                        </div>

                        {/* Suggestions */}
                        {result.suggestions.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
                                    Suggestions ({result.suggestions.length})
                                </h3>
                                {result.suggestions.map((s, i) => {
                                    const priority = (s.priority in PRIORITY_CONFIG ? s.priority : "medium") as keyof typeof PRIORITY_CONFIG;
                                    const cfg = PRIORITY_CONFIG[priority];
                                    const Icon = cfg.icon;
                                    return (
                                        <div
                                            key={i}
                                            className={`bg-white dark:bg-zinc-900 rounded-xl p-5 shadow border ${cfg.border}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${cfg.dot}`} />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-zinc-900 dark:text-white text-sm">
                                                            {s.title}
                                                        </p>
                                                        <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1 leading-relaxed">
                                                            {s.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${cfg.badge}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Placeholder for future AI features */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow border border-dashed border-zinc-300 dark:border-zinc-700 mt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                                <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-600">
                                    More AI features coming soon
                                </h3>
                            </div>
                            <p className="text-xs text-zinc-400 dark:text-zinc-600">
                                Workload heatmap, automatic conflict resolution, and professor load balancing analysis will appear here.
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!result && !analyzing && !error && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-20 text-center">
                        <Sparkles className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                            Select a student group and click Analyze Schedule
                        </p>
                        <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-1">
                            The AI will review the weekly timetable and suggest improvements.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
