"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Session {
  session_id: number;
  type: "Lecture" | "Seminar";
  day: string;
  time: string;
  room: string;
  status: string;
}

interface CourseSchedule {
  schedule_id: number;
  course: string;
  course_abbr: string;
  professor: string;
  status: string;
  sessions: Session[];
}

interface StudentGroup {
  group_id: number;
  group_name: string;
  year_level: number;
  semester_number: number;
}

// Each flat entry maps to one grid cell
interface GridEntry {
  schedule_id: number;
  course: string;
  course_abbr: string;
  professor: string;
  session: Session;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SESSION_BADGE: Record<string, string> = {
  Lecture: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Seminar: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CourseSchedulesPanel() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { if (selectedGroup) loadSchedules(); }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/student-groups/`);
      if (!res.ok) throw new Error();
      setGroups(await res.json());
    } catch {
      setMessage({ type: "error", text: "Failed to load student groups" });
    }
  };

  const loadSchedules = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/course-schedules/group/${selectedGroup}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load schedules" });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/course-schedules/${scheduleToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMessage({ type: "success", text: "Schedule deleted" });
      loadSchedules();
    } catch {
      setMessage({ type: "error", text: "Failed to delete schedule" });
    } finally {
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    }
  };

  // Flatten all sessions into grid entries
  const gridEntries: GridEntry[] = schedules.flatMap((s) =>
    s.sessions.map((session) => ({
      schedule_id: s.schedule_id,
      course: s.course,
      course_abbr: s.course_abbr,
      professor: s.professor,
      session,
    }))
  );

  // Collect unique time labels, sorted
  const timeRows = Array.from(new Set(gridEntries.map((e) => e.session.time))).sort();

  // Lookup: (day, time) → GridEntry[]
  const cellMap = new Map<string, GridEntry[]>();
  for (const entry of gridEntries) {
    const key = `${entry.session.day}|${entry.session.time}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key)!.push(entry);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Course Schedules</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Weekly timetable — each course has 1 lecture + 1 seminar per week
          </p>
        </div>
        <Button onClick={loadSchedules} variant="outline" disabled={loading || !selectedGroup} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800"
            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Group selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
          Student Group:
        </label>
        <Select
          value={selectedGroup?.toString() || ""}
          onValueChange={(v) => { setSchedules([]); setSelectedGroup(v ? parseInt(v) : null); }}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Choose a group…" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.group_id} value={g.group_id.toString()}>
                {g.group_name} — Year {g.year_level}, Sem {g.semester_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* No group selected */}
      {!selectedGroup && (
        <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
          Select a student group above to view its timetable.
        </div>
      )}

      {/* Loading skeleton */}
      {selectedGroup && loading && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <Skeleton className="h-7 w-44" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-28 h-12 rounded-lg" />
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="flex-1 h-32 rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {selectedGroup && !loading && schedules.length === 0 && (
        <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">
            No schedules for this group yet. Use the <strong>Auto-Schedule</strong> tab to generate them.
          </p>
        </div>
      )}

      {/* Timetable grid */}
      {selectedGroup && !loading && schedules.length > 0 && (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Weekly Timetable
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300 w-32">
                      Time
                    </th>
                    {DAYS.map((day) => (
                      <th key={day} className="px-4 py-4 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeRows.map((time) => (
                    <tr key={time} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {time}
                        </div>
                      </td>
                      {DAYS.map((day) => {
                        const entries = cellMap.get(`${day}|${time}`) ?? [];
                        return (
                          <td key={day} className="px-3 py-3 align-top">
                            {entries.length > 0 ? (
                              <div className="space-y-2">
                                {entries.map((entry) => (
                                  <div
                                    key={entry.session.session_id}
                                    className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-xl p-3 border border-red-100 dark:border-red-900/30 group relative"
                                  >
                                    {/* Session type badge */}
                                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1.5 ${SESSION_BADGE[entry.session.type] ?? ""}`}>
                                      {entry.session.type}
                                    </span>

                                    <div className="font-semibold text-zinc-900 dark:text-white text-xs leading-snug mb-1.5">
                                      {entry.course}
                                    </div>

                                    <div className="space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{entry.professor}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        Room {entry.session.room}
                                      </div>
                                    </div>

                                    {/* Delete — appears on hover */}
                                    <button
                                      onClick={() => { setScheduleToDelete(entry.schedule_id); setDeleteDialogOpen(true); }}
                                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      title="Delete schedule"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="min-h-[80px] flex items-center justify-center">
                                <span className="text-zinc-300 dark:text-zinc-700 text-sm">—</span>
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
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-6">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Legend</span>
            {(["Lecture", "Seminar"] as const).map((type) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${SESSION_BADGE[type]}`}>{type}</span>
                <span className="text-zinc-600 dark:text-zinc-400">2 hr session</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Trash2 className="w-3 h-3" /> Hover a card to delete
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Schedule"
        description="This removes the course offering and all its sessions. Cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
