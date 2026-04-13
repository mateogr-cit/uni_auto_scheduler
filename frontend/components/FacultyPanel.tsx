import { type Dispatch, type SetStateAction } from "react";
import { SectionCard } from "./ScheduleSection";
import { type Faculty, type Degree, type FormState } from "./schedule-types";

type FacultyPanelProps = {
  faculty: Faculty[];
  degrees: Degree[];
  facultyForm: FormState<Faculty>;
  setFacultyForm: Dispatch<SetStateAction<FormState<Faculty>>>;
  editFacultyId: number | null;
  setEditFacultyId: Dispatch<SetStateAction<number | null>>;
  loadFaculty: () => void;
  degreeForm: FormState<Degree>;
  setDegreeForm: Dispatch<SetStateAction<FormState<Degree>>>;
  editDegreeId: number | null;
  setEditDegreeId: Dispatch<SetStateAction<number | null>>;
  loadDegrees: () => void;
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

export default function FacultyPanel({
  faculty,
  degrees,
  facultyForm,
  setFacultyForm,
  editFacultyId,
  setEditFacultyId,
  loadFaculty,
  degreeForm,
  setDegreeForm,
  editDegreeId,
  setEditDegreeId,
  loadDegrees,
  setFormValue,
  handleSave,
  handleDelete,
}: FacultyPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title="Faculty" description="Create and manage academic faculties.">
        <div className="space-y-3">
          <div className="grid gap-3">
            <label className="text-sm text-slate-500 dark:text-slate-400">Name</label>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={facultyForm.f_name}
              onChange={(event) => setFormValue(setFacultyForm, "f_name", event.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <label className="text-sm text-slate-500 dark:text-slate-400">Abbreviation</label>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={facultyForm.f_abbr}
              onChange={(event) => setFormValue(setFacultyForm, "f_abbr", event.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                handleSave(
                  "Faculty",
                  facultyForm,
                  "/faculty/",
                  "/faculty",
                  editFacultyId,
                  setEditFacultyId,
                  loadFaculty,
                  () => setFacultyForm({ f_name: "", f_abbr: "" })
                )
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
            >
              <span className="inline-flex items-center gap-2">+</span> {editFacultyId ? "Update faculty" : "Create faculty"}
            </button>
            {editFacultyId ? (
              <button
                onClick={() => {
                  setEditFacultyId(null);
                  setFacultyForm({ f_name: "", f_abbr: "" });
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Degree programme" description="Create degree programmes and link them to faculty.">
        <div className="space-y-3">
          <div className="grid gap-3">
            <label className="text-sm text-slate-500 dark:text-slate-400">Name</label>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={degreeForm.d_name}
              onChange={(event) => setFormValue(setDegreeForm, "d_name", event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-500 dark:text-slate-400">Faculty</label>
            <select
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={degreeForm.f_id ?? 0}
              onChange={(event) => setFormValue(setDegreeForm, "f_id", Number(event.target.value))}
            >
              <option value={0}>Select a faculty</option>
              {faculty.map((item) => (
                <option key={item.f_id} value={item.f_id}>
                  {item.f_name} {item.f_abbr ? `(${item.f_abbr})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3">
            <label className="text-sm text-slate-500 dark:text-slate-400">Abbreviation</label>
            <input
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500/80 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              value={degreeForm.degree_abbr}
              onChange={(event) => setFormValue(setDegreeForm, "degree_abbr", event.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                handleSave(
                  "Degree",
                  degreeForm,
                  "/degrees/",
                  "/degrees",
                  editDegreeId,
                  setEditDegreeId,
                  loadDegrees,
                  () => setDegreeForm({ d_name: "", f_id: 0, degree_abbr: "" })
                )
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
            >
              <span className="inline-flex items-center gap-2">+</span> {editDegreeId ? "Update degree" : "Create degree"}
            </button>
            {editDegreeId ? (
              <button
                onClick={() => {
                  setEditDegreeId(null);
                  setDegreeForm({ d_name: "", f_id: 0, degree_abbr: "" });
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-[0.12em] text-[11px]">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Related ID</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((item) => (
              <tr key={`faculty-${item.f_id}`} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950">
                <td className="px-4 py-3">Faculty</td>
                <td className="px-4 py-3">{item.f_name}</td>
                <td className="px-4 py-3">{item.f_id}</td>
                <td className="px-4 py-3">{item.f_abbr}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => {
                      setEditFacultyId(item.f_id);
                      setFacultyForm({ f_name: item.f_name, f_abbr: item.f_abbr });
                    }}
                    className="rounded-2xl bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(`/faculty/${item.f_id}`, loadFaculty, item.f_name)}
                    className="rounded-2xl bg-red-50 px-3 py-1 text-xs text-red-600 hover:bg-red-100 transition dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {degrees.map((item) => {
              const facultyItem = faculty.find((f) => f.f_id === item.f_id);
              return (
                <tr key={`degree-${item.d_id}`} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950">
                  <td className="px-4 py-3">Degree</td>
                  <td className="px-4 py-3">{item.d_name}</td>
                  <td className="px-4 py-3">
                    {item.f_id}
                    {facultyItem ? ` — ${facultyItem.f_abbr || facultyItem.f_name}` : ""}
                  </td>
                  <td className="px-4 py-3">{item.degree_abbr}</td>
                  <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => {
                      setEditDegreeId(item.d_id);
                      setDegreeForm({ d_name: item.d_name, f_id: item.f_id, degree_abbr: item.degree_abbr });
                    }}
                    className="rounded-2xl bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(`/degrees/${item.d_id}`, loadDegrees, item.d_name)}
                    className="rounded-2xl bg-red-50 px-3 py-1 text-xs text-red-600 hover:bg-red-100 transition dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
