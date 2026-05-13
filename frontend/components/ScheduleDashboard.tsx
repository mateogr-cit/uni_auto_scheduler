"use client";

import { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { RefreshCcw } from "lucide-react";
import ScheduleTabs from "./ScheduleTabs";
import OverviewPanel from "./OverviewPanel";
import SetupPanel from "./SetupPanel";
import CourseSchedulesPanel from "./CourseSchedulesPanel";
import AutoSchedulePanel from "./AutoSchedulePanel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type TabId,
  type TimeSlot,
  type StudentGroup,
  type Degree,
  type FormState,
} from "./schedule-types";

const API_BASE = "http://localhost:8000";

const emptyTimeSlot = { day_of_week: "" as any, start_time: "", end_time: "" };

const ScheduleDashboard = () => {
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);

  const [editTimeSlotId, setEditTimeSlotId] = useState<number | null>(null);

  const [timeSlotForm, setTimeSlotForm] = useState<FormState<typeof emptyTimeSlot>>(emptyTimeSlot);

  const apiFetch = async (path: string, opts: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Request failed: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStudentGroups(),
        loadDegrees(),
        loadTimeSlots(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentGroups = async () => {
    try {
      setStudentGroups((await apiFetch("/student-groups/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDegrees = async () => {
    try {
      setDegrees((await apiFetch("/degrees/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadTimeSlots = async () => {
    try {
      setTimeSlots((await apiFetch("/time-slots/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const setFormValue = useCallback(<T extends object>(setter: Dispatch<SetStateAction<T>>, key: string, value: string | number | boolean) => {
    setter((current: any) => ({ ...current, [key]: value }));
  }, []);

  const handleSave = async (
    section: string,
    form: Record<string, any>,
    createPath: string,
    updatePath: string,
    editId: number | null,
    setEditId: (id: number | null) => void,
    refresh: () => void,
    resetForm: () => void
  ) => {
    try {
      const payload = { ...form };
      const method = editId ? "PUT" : "POST";
      const path = editId ? `${updatePath}/${editId}` : createPath;
      await apiFetch(path, { method, body: JSON.stringify(payload) });
      setStatusMessage(`${section} ${editId ? "updated" : "created"} successfully.`);
      refresh();
      setEditId(null);
      resetForm();
    } catch (error) {
      console.error(error);
      setStatusMessage(`Unable to save ${section.toLowerCase()}.`);
    }
  };

  const handleDelete = async (path: string, refresh: () => void, itemLabel: string) => {
    try {
      await apiFetch(path, { method: "DELETE" });
      setStatusMessage(`${itemLabel} deleted successfully.`);
      refresh();
    } catch (error) {
      console.error(error);
      setStatusMessage(`Unable to delete ${itemLabel.toLowerCase()}.`);
    }
  };

  return (
    <div className="space-y-8">
      <ScheduleTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Schedule Builder</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Configure your academic groups, curriculum, schedules, and launch schedule generation.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={loadAll}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            >
              <RefreshCcw size={16} /> Refresh Data
            </button>
          </div>
        </div>

        {statusMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-900/30 dark:text-emerald-200">
            {statusMessage}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <OverviewPanel
              studentGroupsCount={studentGroups.length}
              degreesCount={degrees.length}
              onGoto={setActiveTab}
            />
          )}

          {activeTab === "setup" && (
            <SetupPanel
              timeSlots={timeSlots}
              timeSlotForm={timeSlotForm}
              setTimeSlotForm={setTimeSlotForm}
              editTimeSlotId={editTimeSlotId}
              setEditTimeSlotId={setEditTimeSlotId}
              loadTimeSlots={loadTimeSlots}
              setFormValue={setFormValue}
              handleSave={handleSave}
              handleDelete={handleDelete}
            />
          )}

          {activeTab === "schedules" && (
            <CourseSchedulesPanel />
          )}

          {activeTab === "schedule" && (
            <AutoSchedulePanel
              onRefresh={loadAll}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ScheduleDashboard;
