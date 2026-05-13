import { type Dispatch, type SetStateAction } from "react";
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Save,
  Info,
  Calendar,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionCard } from "./ScheduleSection";
import { type TimeSlot, type DayOfWeek, type FormState } from "./schedule-types";

type SetupPanelProps = {
  timeSlots: TimeSlot[];
  timeSlotForm: FormState<TimeSlot>;
  setTimeSlotForm: React.Dispatch<React.SetStateAction<FormState<TimeSlot>>>;
  editTimeSlotId: number | null;
  setEditTimeSlotId: React.Dispatch<React.SetStateAction<number | null>>;
  loadTimeSlots: () => void;
  setFormValue: <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, key: string, value: string | number | boolean) => void;
  handleSave: (
    section: string,
    form: Record<string, any>,
    createPath: string,
    updatePath: string,
    editId: number | null,
    setEditId: (id: number | null) => void,
    refresh: () => void,
    resetForm: () => void
  ) => Promise<void>;
  handleDelete: (path: string, refresh: () => void, itemLabel: string) => Promise<void>;
};

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function SetupPanel({
  timeSlots,
  timeSlotForm,
  setTimeSlotForm,
  editTimeSlotId,
  setEditTimeSlotId,
  loadTimeSlots,
  setFormValue,
  handleSave,
  handleDelete,
}: SetupPanelProps) {

  return (
    <div className="grid gap-8">
      {/* Time Slots Section */}
      <SectionCard
        title="Time Slots"
        description="Define available time slots for scheduling."
        icon={Clock}
      >
        <div className="flex flex-col gap-6">
          {/* Form */}
          <div className="space-y-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-5 ring-1 ring-zinc-200 dark:ring-zinc-800">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                <Calendar size={12} /> Day of Week
              </label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                value={timeSlotForm.day_of_week}
                onChange={(event) => setFormValue(setTimeSlotForm, "day_of_week", event.target.value)}
              >
                <option value="">Select Day</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  <Clock size={12} /> Start Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  value={timeSlotForm.start_time}
                  onChange={(event) => setFormValue(setTimeSlotForm, "start_time", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  <Clock size={12} /> End Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  value={timeSlotForm.end_time}
                  onChange={(event) => setFormValue(setTimeSlotForm, "end_time", event.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={!timeSlotForm.day_of_week || !timeSlotForm.start_time || !timeSlotForm.end_time}
                onClick={() =>
                  handleSave(
                    "Time Slot",
                    timeSlotForm,
                    "/time-slots/",
                    "/time-slots",
                    editTimeSlotId,
                    setEditTimeSlotId,
                    loadTimeSlots,
                    () => setTimeSlotForm({ day_of_week: "" as DayOfWeek, start_time: "", end_time: "" })
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-red-500 hover:to-rose-400 transition shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {editTimeSlotId ? <Save size={16} /> : <Plus size={16} />} {editTimeSlotId ? "Update Time Slot" : "Create Time Slot"}
              </button>
              {editTimeSlotId && (
                <button
                  onClick={() => {
                    setEditTimeSlotId(null);
                    setTimeSlotForm({ day_of_week: "" as DayOfWeek, start_time: "", end_time: "" });
                  }}
                  className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-zinc-700 dark:text-zinc-300">
                <thead className="bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-5 py-4">Day</th>
                    <th className="px-5 py-4">Time Range</th>
                    <th className="px-5 py-4 text-center">Slot ID</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <AnimatePresence mode="popLayout">
                    {timeSlots.map((item, idx) => (
                      <motion.tr
                        key={item.slot_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="group border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-900 dark:text-white">{item.day_of_week}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                            <span>{item.start_time}</span>
                            <X size={10} className="text-zinc-400" />
                            <span>{item.end_time}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-xs">
                          {item.slot_id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditTimeSlotId(item.slot_id);
                                setTimeSlotForm({
                                  day_of_week: item.day_of_week,
                                  start_time: item.start_time,
                                  end_time: item.end_time,
                                });
                              }}
                              className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(`/time-slots/${item.slot_id}`, loadTimeSlots, `${item.day_of_week} ${item.start_time}-${item.end_time}`)}
                              className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {timeSlots.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-zinc-400 dark:text-zinc-600 italic">
                        No time slots defined. Create one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
