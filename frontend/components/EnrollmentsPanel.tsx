import { type Dispatch, type SetStateAction } from "react";
import { SectionCard } from "./ScheduleSection";
import { type Enrollment, type FormState, type Student, type StudentGroup, type CourseOffering } from "./schedule-types";

type EnrollmentsPanelProps = {
  enrollments: Enrollment[];
  enrollmentForm: FormState<Enrollment>;
  setEnrollmentForm: Dispatch<SetStateAction<FormState<Enrollment>>>;
  students: Student[];
  studentGroups: StudentGroup[];
  offerings: CourseOffering[];
  editEnrollmentId: number | null;
  setEditEnrollmentId: Dispatch<SetStateAction<number | null>>;
  loadEnrollments: () => void;
  autoEnrollmentEnabled: boolean;
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
  handleAutoEnroll: () => Promise<void>;
};

export default function EnrollmentsPanel({
  enrollments,
  enrollmentForm,
  setEnrollmentForm,
  editEnrollmentId,
  setEditEnrollmentId,
  loadEnrollments,
  students,
  studentGroups,
  offerings,
  autoEnrollmentEnabled,
  handleSave,
  handleDelete,
  handleAutoEnroll,
}: EnrollmentsPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title="Enrollments" description="Create manual enrollments or run automatic enrollment for all students.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-500 dark:text-slate-400">Offering</label>
              <select
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={enrollmentForm.offering_id ?? 0}
                onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, offering_id: Number(event.target.value) }))}
              >
                <option value={0}>Select an offering</option>
                {offerings.map((offering) => (
                  <option key={offering.offering_id} value={offering.offering_id}>
                    {offering.offering_id} — course {offering.c_id} / sem {offering.sem_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-500 dark:text-slate-400">Student</label>
              <select
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                value={enrollmentForm.u_id ?? 0}
                onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, u_id: Number(event.target.value) }))}
              >
                <option value={0}>Select a student</option>
                {students.map((student) => {
                  const groupName = studentGroups.find((group) => group.group_id === student.group_id)?.group_name;
                  return (
                    <option key={student.u_id} value={student.u_id}>
                      {student.u_id}{groupName ? ` — ${groupName}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleSave(
                    "Enrollment",
                    enrollmentForm,
                    "/enrollments/",
                    "/enrollments",
                    editEnrollmentId,
                    setEditEnrollmentId,
                    loadEnrollments,
                    () => setEnrollmentForm({ offering_id: 0, u_id: 0 })
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
              >
                <span className="inline-flex items-center gap-2">+</span> {editEnrollmentId ? "Update enrollment" : "Create enrollment"}
              </button>
              {editEnrollmentId ? (
                <button
                  onClick={() => {
                    setEditEnrollmentId(null);
                    setEnrollmentForm({ offering_id: 0, u_id: 0 });
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              ) : null}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <span>Automatic enrollment</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${autoEnrollmentEnabled ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {autoEnrollmentEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Toggle auto enrollment to build schedules with every student enrolled into available course offerings automatically.
              </p>
              <button
                onClick={handleAutoEnroll}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
              >
                Run auto enrollment
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-[0.12em] text-[11px]">
                <tr>
                  <th className="px-4 py-3">Enrollment</th>
                  <th className="px-4 py-3">Offering</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950">
                    <td className="px-4 py-3">{item.id}</td>
                    <td className="px-4 py-3">{item.offering_id}</td>
                    <td className="px-4 py-3">{item.u_id}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => {
                          setEditEnrollmentId(item.id);
                          setEnrollmentForm({ offering_id: item.offering_id, u_id: item.u_id });
                        }}
                        className="rounded-2xl bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(`/enrollments/${item.id}`, loadEnrollments, `enrollment ${item.id}`)}
                        className="rounded-2xl bg-red-50 px-3 py-1 text-xs text-red-600 hover:bg-red-100 transition dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
