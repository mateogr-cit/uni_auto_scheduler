import { type Dispatch, type SetStateAction } from "react";
import { SectionCard } from "./ScheduleSection";
import { type StudentDegree, type CourseCurriculum, type FormState } from "./schedule-types";

type CurriculumPanelProps = {
  studentDegrees: StudentDegree[];
  courseCurriculum: CourseCurriculum[];
  studentDegreeForm: FormState<StudentDegree>;
  setStudentDegreeForm: Dispatch<SetStateAction<FormState<StudentDegree>>>;
  editStudentDegreeId: number | null;
  setEditStudentDegreeId: Dispatch<SetStateAction<number | null>>;
  loadStudentDegrees: () => void;
  courseCurriculumForm: FormState<CourseCurriculum>;
  setCourseCurriculumForm: Dispatch<SetStateAction<FormState<CourseCurriculum>>>;
  editCourseCurriculumId: number | null;
  setEditCourseCurriculumId: Dispatch<SetStateAction<number | null>>;
  loadCourseCurriculum: () => void;
  setFormValue: <T extends object>(setter: Dispatch<SetStateAction<T>>, key: string, value: string | number | boolean) => void;
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

export default function CurriculumPanel({
  studentDegrees,
  courseCurriculum,
  studentDegreeForm,
  setStudentDegreeForm,
  editStudentDegreeId,
  setEditStudentDegreeId,
  loadStudentDegrees,
  courseCurriculumForm,
  setCourseCurriculumForm,
  editCourseCurriculumId,
  setEditCourseCurriculumId,
  loadCourseCurriculum,
  setFormValue,
  handleSave,
  handleDelete,
}: CurriculumPanelProps) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Student Degrees" description="Assign students to degree programmes for automated scheduling.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Student ID</label>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  value={studentDegreeForm.u_id}
                  onChange={(event) => setFormValue(setStudentDegreeForm, "u_id", Number(event.target.value))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Degree ID</label>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  value={studentDegreeForm.deg_id}
                  onChange={(event) => setFormValue(setStudentDegreeForm, "deg_id", Number(event.target.value))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Year Level</label>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  value={studentDegreeForm.yr_lvl}
                  onChange={(event) => setFormValue(setStudentDegreeForm, "yr_lvl", Number(event.target.value))}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    handleSave(
                      "Student degree",
                      studentDegreeForm,
                      "/student-degrees/",
                      "/student-degrees",
                      editStudentDegreeId,
                      setEditStudentDegreeId,
                      loadStudentDegrees,
                      () => setStudentDegreeForm({ u_id: 0, deg_id: 0, yr_lvl: 1 })
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
                >
                  <span className="inline-flex items-center gap-2">+</span> {editStudentDegreeId ? "Update assignment" : "Create assignment"}
                </button>
                {editStudentDegreeId ? (
                  <button
                    onClick={() => {
                      setEditStudentDegreeId(null);
                      setStudentDegreeForm({ u_id: 0, deg_id: 0, yr_lvl: 1 });
                    }}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-[0.12em] text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Degree</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentDegrees.map((item) => (
                    <tr key={item.student_degree_id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950">
                      <td className="px-4 py-3">{item.u_id}</td>
                      <td className="px-4 py-3">{item.deg_id}</td>
                      <td className="px-4 py-3">{item.yr_lvl}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => {
                            setEditStudentDegreeId(item.student_degree_id);
                            setStudentDegreeForm({ u_id: item.u_id, deg_id: item.deg_id, yr_lvl: item.yr_lvl });
                          }}
                          className="rounded-2xl bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(`/student-degrees/${item.student_degree_id}`, loadStudentDegrees, `student degree ${item.student_degree_id}`)}
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

        <SectionCard title="Course Curriculum" description="Map degree programmes to course offerings for student scheduling.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Course ID</label>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  value={courseCurriculumForm.c_id}
                  onChange={(event) => setFormValue(setCourseCurriculumForm, "c_id", Number(event.target.value))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Degree ID</label>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  value={courseCurriculumForm.degree_id}
                  onChange={(event) => setFormValue(setCourseCurriculumForm, "degree_id", Number(event.target.value))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Year Level</label>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  value={courseCurriculumForm.year_level}
                  onChange={(event) => setFormValue(setCourseCurriculumForm, "year_level", Number(event.target.value))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Semester #</label>
                <input
                  type="number"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  value={courseCurriculumForm.semester_number}
                  onChange={(event) => setFormValue(setCourseCurriculumForm, "semester_number", Number(event.target.value))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 items-end">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Active</label>
                  <select
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    value={courseCurriculumForm.is_active ? "true" : "false"}
                    onChange={(event) => setFormValue(setCourseCurriculumForm, "is_active", event.target.value === "true")}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    handleSave(
                      "Course curriculum",
                      courseCurriculumForm,
                      "/course-curriculum/",
                      "/course-curriculum",
                      editCourseCurriculumId,
                      setEditCourseCurriculumId,
                      loadCourseCurriculum,
                      () => setCourseCurriculumForm({ c_id: 0, degree_id: 0, year_level: 1, is_active: true, semester_number: 1 })
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
                >
                  <span className="inline-flex items-center gap-2">+</span> {editCourseCurriculumId ? "Update curriculum" : "Create curriculum"}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-[0.12em] text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Degree</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courseCurriculum.map((item) => (
                    <tr key={item.course_year_id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950">
                      <td className="px-4 py-3">{item.c_id}</td>
                      <td className="px-4 py-3">{item.degree_id}</td>
                      <td className="px-4 py-3">{item.year_level}</td>
                      <td className="px-4 py-3">{item.is_active ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => {
                            setEditCourseCurriculumId(item.course_year_id);
                            setCourseCurriculumForm({
                              c_id: item.c_id,
                              degree_id: item.degree_id,
                              year_level: item.year_level,
                              is_active: item.is_active,
                              semester_number: item.semester_number,
                            });
                          }}
                          className="rounded-2xl bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(`/course-curriculum/${item.course_year_id}`, loadCourseCurriculum, `curriculum ${item.course_year_id}`)}
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
    </>
  );
}
