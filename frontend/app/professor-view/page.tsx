"use client";

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CalendarX, Send, User, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';

// Mock schedule data
const mockSchedule = [
    {
        id: 1,
        day: 'Monday',
        time: '09:00 - 10:30',
        course: 'Introduction to Computer Science',
        room: 'Room 101',
        building: 'Main Building',
        studentGroup: 'CS-101',
    },
    {
        id: 2,
        day: 'Monday',
        time: '14:00 - 15:30',
        course: 'Advanced Algorithms',
        room: 'Room 205',
        building: 'Science Building',
        studentGroup: 'CS-301',
    },
    {
        id: 3,
        day: 'Wednesday',
        time: '10:00 - 11:30',
        course: 'Database Systems',
        room: 'Room 301',
        building: 'Engineering Building',
        studentGroup: 'CS-201',
    },
    {
        id: 4,
        day: 'Thursday',
        time: '09:00 - 10:30',
        course: 'Software Engineering',
        room: 'Room 102',
        building: 'Main Building',
        studentGroup: 'CS-401',
    },
    {
        id: 5,
        day: 'Friday',
        time: '11:00 - 12:30',
        course: 'Computer Networks',
        room: 'Room 401',
        building: 'Tech Building',
        studentGroup: 'CS-202',
    },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ProfessorViewPage() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unavailabilityOpen, setUnavailabilityOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Simulate loading
    React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmitUnavailability = async () => {
        if (!selectedDate || !startTime || !endTime) {
            setSubmitError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const response = await fetch('http://localhost:8000/professor-unavailability/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: selectedDate,
                    start_time: startTime,
                    end_time: endTime,
                    reason: reason || null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit unavailability request');
            }

            const data = await response.json();
            console.log('Unavailability request submitted:', data);
            setSubmitSuccess(true);
            setSelectedDate('');
            setStartTime('');
            setEndTime('');
            setReason('');
            setSelectedCourse(null);

            setTimeout(() => {
                setUnavailabilityOpen(false);
                setSubmitSuccess(false);
            }, 1500);
        } catch (error) {
            console.error('Error submitting unavailability request:', error);
            setSubmitError('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
                        Professor Schedule View
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        View your teaching schedule and submit unavailability requests
                    </p>
                </div>

                {loading ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <Skeleton className="h-8 w-48" />
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
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
                    </div>
                ) : (
                    <>
                        {/* Schedule Grid */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-red-500" />
                            Teaching Schedule
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        Time
                                    </th>
                                    {days.map((day) => (
                                        <th
                                            key={day}
                                            className="px-6 py-4 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {['09:00 - 10:30', '11:00 - 12:30', '14:00 - 15:30', '16:00 - 17:30'].map((time) => (
                                    <tr key={time} className="border-t border-zinc-200 dark:border-zinc-800">
                                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                                            {time}
                                        </td>
                                        {days.map((day) => {
                                            const course = mockSchedule.find(
                                                (c) => c.day === day && c.time === time
                                            );
                                            return (
                                                <td key={day} className="px-4 py-4">
                                                    {course ? (
                                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                                                            <div className="font-semibold text-zinc-900 dark:text-white text-sm mb-2">
                                                                {course.course}
                                                            </div>
                                                            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {course.time}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {course.room}, {course.building}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    {course.studentGroup}
                                                                </div>
                                                            </div>
                                                            <Dialog open={unavailabilityOpen && selectedCourse === course.course.toString()} onOpenChange={(open) => {
                                                                setUnavailabilityOpen(open);
                                                                if (!open) setSelectedCourse(null);
                                                            }}>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="mt-3 w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                                                        onClick={() => setSelectedCourse(course.course.toString())}
                                                                    >
                                                                        <CalendarX className="w-3 h-3 mr-1" />
                                                                        Request Unavailability
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[500px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="text-zinc-900 dark:text-white">
                                                                            Request Unavailability
                                                                        </DialogTitle>
                                                                        <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                                                                            Submit an unavailability request for {course.course}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4 py-4">
                                                                        {submitSuccess ? (
                                                                            <div className="flex flex-col items-center justify-center py-8">
                                                                                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                                                                                <p className="text-zinc-900 dark:text-white font-medium">Unavailability request submitted successfully!</p>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <div className="space-y-2">
                                                                                    <Label htmlFor="date" className="text-zinc-700 dark:text-zinc-300">
                                                                                        Date <span className="text-red-500">*</span>
                                                                                    </Label>
                                                                                    <Input
                                                                                        id="date"
                                                                                        type="date"
                                                                                        min={today}
                                                                                        value={selectedDate}
                                                                                        onChange={(e) => setSelectedDate(e.target.value)}
                                                                                        className="w-full"
                                                                                        disabled={isSubmitting}
                                                                                    />
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor="startTime" className="text-zinc-700 dark:text-zinc-300">
                                                                                            Start Time <span className="text-red-500">*</span>
                                                                                        </Label>
                                                                                        <Input
                                                                                            id="startTime"
                                                                                            type="time"
                                                                                            value={startTime}
                                                                                            onChange={(e) => setStartTime(e.target.value)}
                                                                                            className="w-full"
                                                                                            disabled={isSubmitting}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor="endTime" className="text-zinc-700 dark:text-zinc-300">
                                                                                            End Time <span className="text-red-500">*</span>
                                                                                        </Label>
                                                                                        <Input
                                                                                            id="endTime"
                                                                                            type="time"
                                                                                            value={endTime}
                                                                                            onChange={(e) => setEndTime(e.target.value)}
                                                                                            className="w-full"
                                                                                            disabled={isSubmitting}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    <Label htmlFor="reason" className="text-zinc-700 dark:text-zinc-300">
                                                                                        Reason
                                                                                    </Label>
                                                                                    <Textarea
                                                                                        id="reason"
                                                                                        placeholder="Provide a reason for your unavailability..."
                                                                                        value={reason}
                                                                                        onChange={(e) => setReason(e.target.value)}
                                                                                        className="min-h-[100px] resize-none"
                                                                                        disabled={isSubmitting}
                                                                                    />
                                                                                </div>
                                                                                {submitError && (
                                                                                    <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                                                                                )}
                                                                                <div className="flex justify-end gap-3">
                                                                                    <Button
                                                                                        variant="outline"
                                                                                        onClick={() => {
                                                                                            setUnavailabilityOpen(false);
                                                                                            setSelectedCourse(null);
                                                                                            setSelectedDate('');
                                                                                            setStartTime('');
                                                                                            setEndTime('');
                                                                                            setReason('');
                                                                                            setSubmitError(null);
                                                                                        }}
                                                                                        disabled={isSubmitting}
                                                                                    >
                                                                                        Cancel
                                                                                    </Button>
                                                                                    <Button
                                                                                        onClick={handleSubmitUnavailability}
                                                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                                        disabled={isSubmitting}
                                                                                    >
                                                                                        {isSubmitting ? (
                                                                                            <>
                                                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                                                Submitting...
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <Send className="w-4 h-4 mr-2" />
                                                                                                Submit Request
                                                                                            </>
                                                                                        )}
                                                                                    </Button>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full min-h-[140px] flex items-center justify-center">
                                                            <span className="text-zinc-400 dark:text-zinc-600 text-sm">
                                                                -
                                                            </span>
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

                {/* Legend */}
                <div className="mt-6 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-lg border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Legend</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30"></div>
                            <span className="text-zinc-600 dark:text-zinc-400">Teaching Assignment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarX className="w-4 h-4 text-blue-500" />
                            <span className="text-zinc-600 dark:text-zinc-400">Request Unavailability</span>
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    </div>
);
}
