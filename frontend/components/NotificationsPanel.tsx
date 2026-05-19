"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, CalendarX, Loader2, RefreshCw, BookOpen, Clock, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

interface Complaint {
    comp_id: number;
    u_id: number;
    comp_text: string;
    createdAt: string;
    student_name: string | null;
    student_group: string | null;
    course_name: string | null;
    time_slot: string | null;
}

interface Unavailability {
    id: number;
    u_id: number;
    date: string;
    start_time: string;
    end_time: string;
    reason: string | null;
    createdAt: string;
}

export default function NotificationsPanel() {
    const { theme } = useTheme();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);

        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
            const [complaintsRes, unavailabilitiesRes] = await Promise.all([
                fetch(`${API_BASE}/complaints/`),
                fetch(`${API_BASE}/professor-unavailability/`),
            ]);

            if (!complaintsRes.ok || !unavailabilitiesRes.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const complaintsData = await complaintsRes.json();
            const unavailabilitiesData = await unavailabilitiesRes.json();

            setComplaints(complaintsData);
            setUnavailabilities(unavailabilitiesData);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchNotifications}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Complaints Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Complaints ({complaints.length})
                        </h3>
                        {complaints.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                No complaints submitted yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {complaints.map((complaint) => (
                                    <div
                                        key={complaint.comp_id}
                                        className={`p-4 rounded-lg border ${
                                            theme === 'dark'
                                                ? 'bg-zinc-800/50 border-zinc-700'
                                                : 'bg-zinc-50 border-zinc-200'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                {/* Student name + group */}
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                                                        {complaint.student_name ?? `User #${complaint.u_id}`}
                                                    </span>
                                                    {complaint.student_group && (
                                                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                            <Users className="w-3 h-3" />
                                                            {complaint.student_group}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Course + time slot metadata */}
                                                {(complaint.course_name || complaint.time_slot) && (
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {complaint.course_name && (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                                                <BookOpen className="w-3 h-3" />
                                                                {complaint.course_name}
                                                            </span>
                                                        )}
                                                        {complaint.time_slot && (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                                                <Clock className="w-3 h-3" />
                                                                {complaint.time_slot}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Complaint text */}
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                                                    {complaint.comp_text}
                                                </p>

                                                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDateTime(complaint.createdAt).date}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDateTime(complaint.createdAt).time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Unavailability Requests Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                            <CalendarX className="w-5 h-5 text-blue-500" />
                            Unavailability Requests ({unavailabilities.length})
                        </h3>
                        {unavailabilities.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                No unavailability requests submitted yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {unavailabilities.map((unavailability) => (
                                    <div
                                        key={unavailability.id}
                                        className={`p-4 rounded-lg border ${
                                            theme === 'dark'
                                                ? 'bg-zinc-800/50 border-zinc-700'
                                                : 'bg-zinc-50 border-zinc-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                                        {formatDate(unavailability.date)}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {formatTime(unavailability.start_time)} - {formatTime(unavailability.end_time)}
                                                    </span>
                                                </div>
                                                {unavailability.reason && (
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                                                        {unavailability.reason}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDateTime(unavailability.createdAt).date}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDateTime(unavailability.createdAt).time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {complaints.length === 0 && unavailabilities.length === 0 && !loading && (
                        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                            No notifications yet
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
