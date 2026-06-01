"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, MapPin, User, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE, DAYS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Session {
  session_id: number;
  slot_id: number;
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
  capacity: number;
}

interface TimeSlot {
  slot_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Room {
  room_id: string;
  capacity: number;
}

interface GridEntry {
  schedule_id: number;
  course: string;
  course_abbr: string;
  professor: string;
  session: Session;
}

interface EditTarget {
  session: Session;
  schedule_id: number;
  group_capacity: number;
}

const SESSION_BADGE: Record<string, string> = {
  Lecture: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Seminar: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

function formatTime(t: string) {
  // "09:00:00" → "09:00"
  return t.slice(0, 5);
}

export default function CourseSchedulesPanel() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  // Edit state
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editSlotId, setEditSlotId] = useState<number | null>(null);
  const [editRoomId, setEditRoomId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
    loadSlotsAndRooms();
  }, []);

  useEffect(() => {
    if (selectedGroup) loadSchedules();
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/student-groups/`);
      if (!res.ok) throw new Error();
      setGroups(await res.json());
    } catch {
      setMessage({ type: "error", text: "Failed to load student groups" });
    }
  };

  const loadSlotsAndRooms = async () => {
    try {
      const [slotsRes, roomsRes] = await Promise.all([
        fetch(`${API_BASE}/time-slots/`),
        fetch(`${API_BASE}/rooms/`),
      ]);
      if (slotsRes.ok) setAllSlots(await slotsRes.json());
      if (roomsRes.ok) setAllRooms(await roomsRes.json());
    } catch {
      // non-fatal — edit modal will just be empty
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

  const openEdit = (entry: GridEntry) => {
    const group = groups.find((g) => g.group_id === selectedGroup);
    setEditTarget({
      session: entry.session,
      schedule_id: entry.schedule_id,
      group_capacity: group?.capacity ?? 0,
    });
    setEditSlotId(entry.session.slot_id);
    setEditRoomId(entry.session.room);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editTarget || !editSlotId || !editRoomId) return;
    setIsSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`${API_BASE}/course-sessions/${editTarget.session.session_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: editSlotId, room_id: editRoomId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save");
      }
      setEditTarget(null);
      setMessage({ type: "success", text: "Session updated" });
      loadSchedules();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const gridEntries = useMemo<GridEntry[]>(() =>
    schedules.flatMap((s) =>
      s.sessions.map((session) => ({
        schedule_id: s.schedule_id,
        course: s.course,
        course_abbr: s.course_abbr,
        professor: s.professor,
        session,
      }))
    ),
  [schedules]);

  const timeRows = useMemo(() =>
    Array.from(new Set(gridEntries.map((e) => e.session.time))).sort(),
  [gridEntries]);

  const cellMap = useMemo(() => {
    const map = new Map<string, GridEntry[]>();
    for (const entry of gridEntries) {
      const key = `${entry.session.day}|${entry.session.time}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [gridEntries]);

  const slotsByDay = useMemo(() =>
    allSlots.reduce((acc, s) => {
      if (!acc[s.day_of_week]) acc[s.day_of_week] = [];
      acc[s.day_of_week].push(s);
      return acc;
    }, {} as Record<string, TimeSlot[]>),
  [allSlots]);

  const group_capacity = editTarget?.group_capacity ?? 0;
  const suitableRooms = useMemo(() =>
    allRooms.filter((r) => r.capacity >= group_capacity),
  [allRooms, group_capacity]);

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
            <SelectValue placeholder="Choose a group…">
              {(() => {
                const g = groups.find((g) => g.group_id === selectedGroup);
                return g ? `${g.group_name} — Year ${g.year_level}, Sem ${g.semester_number}` : null;
              })()}
            </SelectValue>
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

      {!selectedGroup && (
        <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
          Select a student group above to view its timetable.
        </div>
      )}

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

                                    {/* Action buttons — appear on hover */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openEdit(entry)}
                                        className="p-1 rounded text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        title="Edit session"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => { setScheduleToDelete(entry.schedule_id); setDeleteDialogOpen(true); }}
                                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Delete schedule"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
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
              <Pencil className="w-3 h-3" /> / <Trash2 className="w-3 h-3" /> Hover a card to edit or delete
            </div>
          </div>
        </>
      )}

      {/* Edit session dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              Edit {editTarget?.session.type} — {
                schedules.find((s) => s.schedule_id === editTarget?.schedule_id)?.course
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Time slot picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Time Slot
              </label>
              <Select
                value={editSlotId?.toString() ?? ""}
                onValueChange={(v) => { if (v) setEditSlotId(parseInt(v)); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a slot…" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.filter((d) => slotsByDay[d]?.length).map((day) => (
                    <div key={day}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {day}
                      </div>
                      {slotsByDay[day].map((slot) => (
                        <SelectItem key={slot.slot_id} value={slot.slot_id.toString()}>
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Room
                {group_capacity > 0 && (
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    (capacity ≥ {group_capacity})
                  </span>
                )}
              </label>
              <Select
                value={editRoomId}
                onValueChange={(v) => { if (v) setEditRoomId(v); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a room…" />
                </SelectTrigger>
                <SelectContent>
                  {suitableRooms.map((room) => (
                    <SelectItem key={room.room_id} value={room.room_id}>
                      Room {room.room_id} (capacity {room.capacity})
                    </SelectItem>
                  ))}
                  {suitableRooms.length === 0 && (
                    <div className="px-2 py-3 text-sm text-zinc-400 text-center">
                      No rooms with capacity ≥ {group_capacity}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Conflict error */}
            {editError && (
              <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {editError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isSaving || !editSlotId || !editRoomId}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
