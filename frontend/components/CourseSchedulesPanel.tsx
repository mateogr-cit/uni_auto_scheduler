"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CourseSchedule {
  schedule_id: number;
  course: string;
  course_abbr: string;
  room: string;
  day: string;
  time: string;
  professor: string;
  status: string;
}

interface StudentGroup {
  group_id: number;
  group_name: string;
  year_level: number;
  semester_number: number;
}

export default function CourseSchedulesPanel() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadSchedules();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/student-groups/`);
      if (!response.ok) throw new Error("Failed to load groups");
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
      setMessage({ type: "error", text: "Failed to load student groups" });
    }
  };

  const loadSchedules = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/course-schedules/group/${selectedGroup}`);
      if (!response.ok) throw new Error("Failed to load schedules");
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error("Error loading schedules:", error);
      setMessage({ type: "error", text: "Failed to load schedules" });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/course-schedules/auto-generate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate schedules");
      const data = await response.json();
      setMessage({
        type: "success",
        text: `Generated ${data.created_count} schedules successfully`,
      });
      if (selectedGroup) {
        loadSchedules();
      }
    } catch (error) {
      console.error("Error generating schedules:", error);
      setMessage({ type: "error", text: "Failed to generate schedules" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scheduleId: number) => {
    setScheduleToDelete(scheduleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/course-schedules/${scheduleToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete schedule");
      setMessage({ type: "success", text: "Schedule deleted successfully" });
      if (selectedGroup) {
        loadSchedules();
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setMessage({ type: "error", text: "Failed to delete schedule" });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    }
  };

  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      Monday: "bg-blue-100 text-blue-800",
      Tuesday: "bg-green-100 text-green-800",
      Wednesday: "bg-yellow-100 text-yellow-800",
      Thursday: "bg-orange-100 text-orange-800",
      Friday: "bg-purple-100 text-purple-800",
    };
    return colors[day] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Course Schedules</h2>
        <div className="flex gap-2">
          <Button onClick={loadSchedules} variant="outline" disabled={loading || !selectedGroup}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAutoGenerate} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Auto-Generate
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="font-medium">Select Student Group:</label>
        <Select value={selectedGroup?.toString() || ""} onValueChange={(value) => setSelectedGroup(parseInt(value))}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Choose a group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.group_id} value={group.group_id.toString()}>
                {group.group_name} (Year {group.year_level}, Semester {group.semester_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && !selectedGroup && (
        <div className="text-center py-8 text-gray-500">Loading student groups...</div>
      )}

      {selectedGroup && loading && (
        <div className="text-center py-8 text-gray-500">Loading schedules...</div>
      )}

      {selectedGroup && !loading && schedules.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No schedules found for this group. Click "Auto-Generate" to create schedules.
        </div>
      )}

      {selectedGroup && !loading && schedules.length > 0 && (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.schedule_id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getDayColor(schedule.day)}`}>
                      {schedule.day}
                    </span>
                    <span className="text-lg font-semibold">{schedule.course}</span>
                    <span className="text-sm text-gray-500">({schedule.course_abbr})</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{schedule.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{schedule.room}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{schedule.professor}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        schedule.status === "scheduled"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {schedule.status}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(schedule.schedule_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Schedule"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  );
}
