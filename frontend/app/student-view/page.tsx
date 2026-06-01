"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, Send, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { API_BASE, DAYS as days } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

interface StudentGroup {
    group_id: number;
    group_name: string;
}

interface ScheduleEntry {
    key: string;
    course: string;
    professor: string;
    day: string;
    time: string;
    room: string | number;
    type: string;
}

export default function StudentViewPage() {
    const { user } = useAuth();
    const isStudent = user?.u_role === 'student';

    const [groups, setGroups] = useState<StudentGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [timeslots, setTimeslots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [complaintText, setComplaintText] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<{ key: string; course: string; time: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (isStudent && user?.u_id) {
            fetch(`${API_BASE}/students/${user.u_id}`)
                .then(r => r.json())
                .then(data => {
                    if (data.group_id) setSelectedGroupId(data.group_id);
                })
                .catch(console.error)
                .finally(() => setGroupsLoading(false));
        } else {
            fetch(`${API_BASE}/student-groups/`)
                .then(r => r.json())
                .then(data => setGroups(data))
                .catch(console.error)
                .finally(() => setGroupsLoading(false));
        }
    }, [isStudent, user?.u_id]);

    useEffect(() => {
        if (selectedGroupId === null) return;
        setLoading(true);
        fetch(`${API_BASE}/course-schedules/group/${selectedGroupId}`)
            .then(r => r.json())
            .then(data => {
                const entries: ScheduleEntry[] = [];
                for (const s of data.schedules ?? []) {
                    for (const session of s.sessions ?? []) {
                        const key = `${s.course}|${session.type}|${session.day}|${session.time}`;
                        entries.push({
                            key,
                            course: s.course,
                            professor: s.professor,
                            day: session.day,
                            time: session.time,
                            room: session.room,
                            type: session.type,
                        });
                    }
                }
                const uniqueTimes = [...new Set(entries.map(e => e.time))].sort();
                setSchedule(entries);
                setTimeslots(uniqueTimes);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedGroupId]);

    const scheduleCellMap = useMemo(() => {
        const map = new Map<string, ScheduleEntry[]>();
        for (const entry of schedule) {
            const key = `${entry.day}|${entry.time}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(entry);
        }
        return map;
    }, [schedule]);

    const handleSubmitComplaint = async () => {
        if (!complaintText.trim()) {
            setSubmitError('Please enter a complaint');
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);
        try {
            const response = await fetch(`${API_BASE}/complaints/${user?.u_id ?? 1}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comp_text: complaintText,
                    course_name: selectedCourse?.course ?? null,
                    time_slot: selectedCourse?.time ?? null,
                }),
            });
            if (!response.ok) throw new Error('Failed to submit complaint');
            setSubmitSuccess(true);
            setComplaintText('');
            setSelectedCourse(null);
            setTimeout(() => { setComplaintOpen(false); setSubmitSuccess(false); }, 1500);
        } catch {
            setSubmitError('Failed to submit complaint. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
                        Student Schedule View
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        View your weekly schedule and submit complaints if needed
                    </p>
                </div>

                {!isStudent && (
                    <div className="mb-6 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                        <Label className="text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap">Student Group</Label>
                        {groupsLoading ? (
                            <Skeleton className="h-10 w-48" />
                        ) : (
                            <Select
                                value={selectedGroupId?.toString() ?? ""}
                                onValueChange={(v) => setSelectedGroupId(v ? Number(v) : null)}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select a group...">
                                        {groups.find(g => g.group_id === selectedGroupId)?.group_name ?? null}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map(g => (
                                        <SelectItem key={g.group_id} value={String(g.group_id)}>
                                            {g.group_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <Skeleton className="h-8 w-48" />
                        </div>
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="w-24 h-12 rounded-lg" />
                                    {[1, 2, 3, 4, 5].map((j) => (
                                        <Skeleton key={j} className="flex-1 h-32 rounded-xl" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : selectedGroupId === null ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-20">
                        <p className="text-zinc-500 dark:text-zinc-400">Select a student group to view the schedule.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-red-500" />
                                    Weekly Schedule
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300">Time</th>
                                            {days.map((day) => (
                                                <th key={day} className="px-6 py-4 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeslots.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                                                    No sessions scheduled for this group yet.
                                                </td>
                                            </tr>
                                        ) : timeslots.map((time) => (
                                            <tr key={time} className="border-t border-zinc-200 dark:border-zinc-800">
                                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">{time}</td>
                                                {days.map((day) => {
                                                    const entries = scheduleCellMap.get(`${day}|${time}`) ?? [];
                                                    return (
                                                        <td key={day} className="px-4 py-4 align-top">
                                                            {entries.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {entries.map((entry) => (
                                                                        <div key={entry.key} className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                                                                            <div className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">{entry.course}</div>
                                                                            <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">{entry.type}</div>
                                                                            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Clock className="w-3 h-3" />{entry.time}
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <MapPin className="w-3 h-3" />{entry.room}
                                                                                </div>
                                                                            </div>
                                                                            {isStudent && <Dialog
                                                                                open={complaintOpen && selectedCourse?.key === entry.key}
                                                                                onOpenChange={(open) => {
                                                                                    setComplaintOpen(open);
                                                                                    if (!open) setSelectedCourse(null);
                                                                                }}
                                                                            >
                                                                                <DialogTrigger
                                                                                    render={
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="mt-3 w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
                                                                                            onClick={() => setSelectedCourse({ key: entry.key, course: entry.course, time: entry.time })}
                                                                                        />
                                                                                    }
                                                                                >
                                                                                    <AlertCircle className="w-3 h-3 mr-1" />File Complaint
                                                                                </DialogTrigger>
                                                                                <DialogContent className="sm:max-w-[500px]">
                                                                                    <DialogHeader>
                                                                                        <DialogTitle className="text-zinc-900 dark:text-white">File Complaint</DialogTitle>
                                                                                        <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                                                                                            Submit a complaint for {entry.course} ({entry.type})
                                                                                        </DialogDescription>
                                                                                    </DialogHeader>
                                                                                    <div className="space-y-4 py-4">
                                                                                        {submitSuccess ? (
                                                                                            <div className="flex flex-col items-center justify-center py-8">
                                                                                                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                                                                                                <p className="text-zinc-900 dark:text-white font-medium">Complaint submitted successfully!</p>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <>
                                                                                                <div className="space-y-2">
                                                                                                    <Label htmlFor="complaint" className="text-zinc-700 dark:text-zinc-300">Complaint Details</Label>
                                                                                                    <Textarea
                                                                                                        id="complaint"
                                                                                                        placeholder="Describe your complaint..."
                                                                                                        value={complaintText}
                                                                                                        onChange={(e) => setComplaintText(e.target.value)}
                                                                                                        className="min-h-[120px] resize-none"
                                                                                                        disabled={isSubmitting}
                                                                                                    />
                                                                                                </div>
                                                                                                {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}
                                                                                                <div className="flex justify-end gap-3">
                                                                                                    <Button
                                                                                                        variant="outline"
                                                                                                        onClick={() => { setComplaintOpen(false); setSelectedCourse(null); setComplaintText(''); setSubmitError(null); }}
                                                                                                        disabled={isSubmitting}
                                                                                                    >
                                                                                                        Cancel
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        onClick={handleSubmitComplaint}
                                                                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                                                                        disabled={isSubmitting}
                                                                                                    >
                                                                                                        {isSubmitting
                                                                                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                                                                                                            : <><Send className="w-4 h-4 mr-2" />Submit Complaint</>
                                                                                                        }
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </DialogContent>
                                                                            </Dialog>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="h-full min-h-[140px] flex items-center justify-center">
                                                                    <span className="text-zinc-400 dark:text-zinc-600 text-sm">-</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-lg border border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Legend</h3>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-100 dark:border-red-900/30"></div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Scheduled Class</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-zinc-600 dark:text-zinc-400">File Complaint</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
