import { type Dispatch, type SetStateAction } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Hash,
  Save,
  Info,
  GraduationCap,
  Building2,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionCard } from "./ScheduleSection";
import { type StudentGroup, type Degree, type FormState } from "./schedule-types";

type SetupPanelProps = {
  studentGroups: StudentGroup[];
  degrees: Degree[];
  studentGroupForm: FormState<StudentGroup>;
  setStudentGroupForm: React.Dispatch<React.SetStateAction<FormState<StudentGroup>>>;
  editStudentGroupId: number | null;
  setEditStudentGroupId: React.Dispatch<React.SetStateAction<number | null>>;
  loadStudentGroups: () => void;
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

export default function SetupPanel({
  studentGroups,
  degrees,
  studentGroupForm,
  setStudentGroupForm,
  editStudentGroupId,
  setEditStudentGroupId,
  loadStudentGroups,
  setFormValue,
  handleSave,
  handleDelete,
}: SetupPanelProps) {

  return (
    <div className="grid gap-8">
      {/* Student Groups Section */}
      <SectionCard
        title="Student Groups"
        description="Define academic groups for scheduling."
        icon={Users}
      >
        <div className="flex flex-col gap-6">
          {/* Form */}
          <div className="space-y-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-5 ring-1 ring-zinc-200 dark:ring-zinc-800">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                <Info size={12} /> Group Name
              </label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                value={studentGroupForm.group_name}
                placeholder="e.g. CS-2024-A"
                onChange={(event) => setFormValue(setStudentGroupForm, "group_name", event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  <GraduationCap size={12} /> Degree
                </label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                  value={studentGroupForm.deg_id}
                  onChange={(event) => setFormValue(setStudentGroupForm, "deg_id", Number(event.target.value))}
                >
                  <option value={0}>Select Degree</option>
                  {degrees.map((degree) => (
                    <option key={degree.d_id} value={degree.d_id}>
                      {degree.d_name} ({degree.degree_abbr})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  <Hash size={12} /> Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="30"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  value={studentGroupForm.capacity}
                  onChange={(event) => setFormValue(setStudentGroupForm, "capacity", Math.max(1, Number(event.target.value)))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  <Layers size={12} /> Year Level
                </label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                  value={studentGroupForm.year_level}
                  onChange={(event) => setFormValue(setStudentGroupForm, "year_level", Number(event.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                  <Calendar size={12} /> Semester Number
                </label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                  value={studentGroupForm.semester_number}
                  onChange={(event) => setFormValue(setStudentGroupForm, "semester_number", Number(event.target.value))}
                >
                  {[1, 2].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={!studentGroupForm.group_name || !studentGroupForm.deg_id}
                onClick={() =>
                  handleSave(
                    "Student Group",
                    studentGroupForm,
                    "/student-groups/",
                    "/student-groups",
                    editStudentGroupId,
                    setEditStudentGroupId,
                    loadStudentGroups,
                    () => setStudentGroupForm({ group_name: "", deg_id: 0, year_level: 1, semester_number: 1, capacity: 0 })
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-red-500 hover:to-rose-400 transition shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {editStudentGroupId ? <Save size={16} /> : <Plus size={16} />} {editStudentGroupId ? "Update Group" : "Create Group"}
              </button>
              {editStudentGroupId && (
                <button
                  onClick={() => {
                    setEditStudentGroupId(null);
                    setStudentGroupForm({ group_name: "", deg_id: 0, year_level: 1, semester_number: 1, capacity: 0 });
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
                    <th className="px-5 py-4">Group</th>
                    <th className="px-5 py-4">Degree</th>
                    <th className="px-5 py-4 text-center">Year</th>
                    <th className="px-5 py-4 text-center">Sem</th>
                    <th className="px-5 py-4 text-center">Capacity</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <AnimatePresence mode="popLayout">
                    {studentGroups.map((item, idx) => (
                      <motion.tr
                        key={item.group_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="group border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-900 dark:text-white">{item.group_name}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-zinc-900 dark:text-white">
                            {degrees.find((d) => d.d_id === item.deg_id)?.d_name || "-"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-xs">
                          {item.year_level}
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-xs">
                          {item.semester_number}
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-xs">
                          {item.capacity}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditStudentGroupId(item.group_id);
                                setStudentGroupForm({
                                  group_name: item.group_name,
                                  deg_id: item.deg_id,
                                  year_level: item.year_level,
                                  semester_number: item.semester_number,
                                  capacity: item.capacity,
                                });
                              }}
                              className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(`/student-groups/${item.group_id}`, loadStudentGroups, item.group_name)}
                              className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {studentGroups.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-zinc-400 dark:text-zinc-600 italic">
                        No student groups defined. Create one above.
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
