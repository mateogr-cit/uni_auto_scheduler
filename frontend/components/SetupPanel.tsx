import { type Dispatch, type SetStateAction } from "react";
import {
  Users,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Users2,
  GraduationCap,
  Layers,
  Hash,
  Save,
  Info,
  CalendarDays,
  Zap,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SectionCard } from "./ScheduleSection";
import { type StudentGroup, type Semester, type FormState, type Degree } from "./schedule-types";

type SetupPanelProps = {
  studentGroups: StudentGroup[];
  studentGroupForm: FormState<StudentGroup>;
  setStudentGroupForm: React.Dispatch<React.SetStateAction<FormState<StudentGroup>>>;
  editStudentGroupId: number | null;
  setEditStudentGroupId: React.Dispatch<React.SetStateAction<number | null>>;
  loadStudentGroups: () => void;
  semesters: Semester[];
  semesterForm: FormState<Semester>;
  setSemesterForm: React.Dispatch<React.SetStateAction<FormState<Semester>>>;
  editSemesterId: number | null;
  setEditSemesterId: React.Dispatch<React.SetStateAction<number | null>>;
  loadSemesters: () => void;
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
  degrees: Degree[];
};

export default function SetupPanel({
  studentGroups,
  studentGroupForm,
  setStudentGroupForm,
  editStudentGroupId,
  setEditStudentGroupId,
  loadStudentGroups,
  semesters,
  semesterForm,
  setSemesterForm,
  editSemesterId,
  setEditSemesterId,
  loadSemesters,
  setFormValue,
  handleSave,
  handleDelete,
  degrees,
}: SetupPanelProps) {
  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker {
          font-family: inherit;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          overflow: hidden;
        }
        .dark .react-datepicker {
          background-color: #0f172a;
          border-color: #1e293b;
        }
        .react-datepicker__header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding-top: 0.75rem;
        }
        .dark .react-datepicker__header {
          background-color: #1e293b;
          border-color: #334155;
        }
        .react-datepicker__current-month, .react-datepicker__day-name {
          color: #1e293b;
        }
        .dark .react-datepicker__current-month, .dark .react-datepicker__day-name {
          color: #f1f5f9;
        }
        .react-datepicker__day {
          color: #475569;
        }
        .dark .react-datepicker__day {
          color: #94a3b8;
        }
        .react-datepicker__day:hover {
          background-color: #f1f5f9;
          border-radius: 0.5rem;
        }
        .dark .react-datepicker__day:hover {
          background-color: #334155;
          color: #f1f5f9;
        }
        .react-datepicker__day--selected {
          background-color: #4f46e5 !important;
          color: white !important;
          border-radius: 0.5rem;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #818cf850;
          border-radius: 0.5rem;
        }
      `}</style>
      {/* Student Groups Section */}
      <SectionCard
        title="Student Groups"
        description="Create and update groups used for curriculum and scheduling."
        icon={Users2}
      >
        <div className="flex flex-col gap-6">
          {/* Form */}
          <div className="space-y-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 p-5 ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Users2 size={12} /> Group Name
                </label>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  value={studentGroupForm.group_name}
                  placeholder="e.g. CS-2023-A"
                  onChange={(event) => setFormValue(setStudentGroupForm, "group_name", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <GraduationCap size={12} /> Degree
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                  value={studentGroupForm.deg_id}
                  onChange={(event) => setFormValue(setStudentGroupForm, "deg_id", Number(event.target.value))}
                >
                  <option value={0}>Select a Degree</option>
                  {degrees.map((d) => (
                    <option key={d.d_id} value={d.d_id}>
                      {d.d_name} {d.degree_abbr ? `(${d.degree_abbr})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Layers size={12} /> Year Level
                </label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  placeholder="1"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  value={studentGroupForm.year_level}
                  onChange={(event) => setFormValue(setStudentGroupForm, "year_level", Math.max(1, Number(event.target.value)))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Hash size={12} /> Semester Number
                </label>
                <input
                  type="number"
                  min={1}
                  max={2}
                  placeholder="1"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  value={studentGroupForm.semester_number}
                  onChange={(event) => setFormValue(setStudentGroupForm, "semester_number", Math.max(1, Number(event.target.value)))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Users size={12} /> Capacity
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="30"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  value={studentGroupForm.capacity}
                  onChange={(event) => setFormValue(setStudentGroupForm, "capacity", Math.max(0, Number(event.target.value)))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={!studentGroupForm.group_name || studentGroupForm.deg_id === 0}
                onClick={() =>
                  handleSave(
                    "Student group",
                    studentGroupForm,
                    "/student-groups/",
                    "/student-groups",
                    editStudentGroupId,
                    setEditStudentGroupId,
                    loadStudentGroups,
                    () => setStudentGroupForm({ group_name: "", deg_id: 0, year_level: 1, semester_number: 1, capacity: 0 })
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editStudentGroupId ? <Save size={16} /> : <Plus size={16} />} {editStudentGroupId ? "Update Group" : "Create Group"}
              </button>
              {editStudentGroupId && (
                <button
                  onClick={() => {
                    setEditStudentGroupId(null);
                    setStudentGroupForm({ group_name: "", deg_id: 0, year_level: 1, semester_number: 1, capacity: 0 });
                  }}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition active:scale-95"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-5 py-4">Group</th>
                    <th className="px-5 py-4">Degree</th>
                    <th className="px-5 py-4">Year/Sem</th>
                    <th className="px-5 py-4">Cap</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {studentGroups.map((group, idx) => (
                      <motion.tr
                        key={group.group_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="group border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 dark:text-white capitalize">{group.group_name}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                            {degrees.find(d => d.d_id === group.deg_id)?.degree_abbr ||
                              degrees.find(d => d.d_id === group.deg_id)?.d_name ||
                              `ID: ${group.deg_id}`}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <span>Lvl {group.year_level}</span>
                            <span className="text-slate-300 dark:text-slate-700 mx-1">/</span>
                            <span>Sem {group.semester_number}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">
                          {group.capacity}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditStudentGroupId(group.group_id);
                                setStudentGroupForm({
                                  group_name: group.group_name,
                                  deg_id: group.deg_id,
                                  year_level: group.year_level,
                                  semester_number: group.semester_number,
                                  capacity: group.capacity,
                                });
                              }}
                              className="rounded-xl p-2 text-indigo-600 hover:bg-indigo-50 transition dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(`/student-groups/${group.group_id}`, loadStudentGroups, group.group_name)}
                              className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-500/10"
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
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400 dark:text-slate-600 italic">
                        No student groups found. Create one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Semesters Section */}
      <SectionCard
        title="Semesters"
        description="Define academic periods for scheduling."
        icon={CalendarDays}
      >
        <div className="flex flex-col gap-6">
          {/* Form */}
          <div className="space-y-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 p-5 ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                <Info size={12} /> Semester Name
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                value={semesterForm.sem_name}
                placeholder="e.g. Winter 2024"
                onChange={(event) => setFormValue(setSemesterForm, "sem_name", event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Calendar size={12} /> Start Date
                </label>
                <DatePicker
                  selected={semesterForm.start_date ? new Date(semesterForm.start_date) : null}
                  onChange={(date:any) => setFormValue(setSemesterForm, "start_date", date ? date.toISOString().split('T')[0] : "")}
                  dateFormat="yyyy-MM-dd"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  placeholderText="Select start date"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Calendar size={12} /> End Date
                </label>
                <DatePicker
                  selected={semesterForm.end_date ? new Date(semesterForm.end_date) : null}
                  onChange={(date:any) => setFormValue(setSemesterForm, "end_date", date ? date.toISOString().split('T')[0] : "")}
                  dateFormat="yyyy-MM-dd"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  placeholderText="Select end date"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Zap size={12} /> Special Semester?
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                  value={semesterForm.is_special_semester ? "true" : "false"}
                  onChange={(event) => setFormValue(setSemesterForm, "is_special_semester", event.target.value === "true")}
                >
                  <option value="false">Standard Academic Period</option>
                  <option value="true">Special Session / Summer</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  <Hash size={12} /> Week Count
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="15"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  value={semesterForm.week_count}
                  onChange={(event) => setFormValue(setSemesterForm, "week_count", Math.max(1, Number(event.target.value)))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={!semesterForm.sem_name || !semesterForm.start_date || !semesterForm.end_date}
                onClick={() =>
                  handleSave(
                    "Semester",
                    semesterForm,
                    "/semesters/",
                    "/semesters",
                    editSemesterId,
                    setEditSemesterId,
                    loadSemesters,
                    () => setSemesterForm({ sem_name: "", start_date: "", end_date: "", is_special_semester: false, week_count: 15 })
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editSemesterId ? <Save size={16} /> : <Plus size={16} />} {editSemesterId ? "Update Semester" : "Create Semester"}
              </button>
              {editSemesterId && (
                <button
                  onClick={() => {
                    setEditSemesterId(null);
                    setSemesterForm({ sem_name: "", start_date: "", end_date: "", is_special_semester: false, week_count: 15 });
                  }}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition active:scale-95"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 border-b border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-5 py-4">Semester</th>
                    <th className="px-5 py-4">Period</th>
                    <th className="px-5 py-4 text-center">Weeks</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {semesters.map((item, idx) => (
                      <motion.tr
                        key={item.sem_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="group border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-white">{item.sem_name}</div>
                            {item.is_special_semester && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                                <Zap size={10} /> SPECIAL
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-900 dark:text-white">{item.start_date ? new Date(item.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}</span>
                            <ArrowRight size={10} className="text-slate-400" />
                            <span className="text-slate-900 dark:text-white">{item.end_date ? new Date(item.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-xs">
                          {item.week_count}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditSemesterId(item.sem_id);
                                setSemesterForm({
                                  sem_name: item.sem_name,
                                  start_date: item.start_date,
                                  end_date: item.end_date,
                                  is_special_semester: item.is_special_semester,
                                  week_count: item.week_count,
                                });
                              }}
                              className="rounded-xl p-2 text-indigo-600 hover:bg-indigo-50 transition dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(`/semesters/${item.sem_id}`, loadSemesters, item.sem_name)}
                              className="rounded-xl p-2 text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {semesters.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-400 dark:text-slate-600 italic">
                        No semesters defined. Create one above.
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
