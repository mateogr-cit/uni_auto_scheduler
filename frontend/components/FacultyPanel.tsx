import { type Dispatch, type SetStateAction } from "react";
import { SectionCard } from "./ScheduleSection";
import { type Faculty, type Degree, type FormState } from "./schedule-types";
import { Building2, GraduationCap, Edit, Trash2, Hash, Tag, Plus, X } from "lucide-react";

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
    <div className="space-y-12">
      <div className="grid gap-8 xl:grid-cols-2">
        <SectionCard title="Faculty" description="Create and manage academic faculties." icon={Building2}>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Faculty Name</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Faculty of Computer Science"
                  value={facultyForm.f_name}
                  onChange={(event) => setFormValue(setFacultyForm, "f_name", event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Abbreviation</label>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-sm font-medium"
                  placeholder="e.g. FCS"
                  value={facultyForm.f_abbr}
                  onChange={(event) => setFormValue(setFacultyForm, "f_abbr", event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
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
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25"
              >
                <Plus size={18} /> {editFacultyId ? "Update Faculty" : "Add Faculty"}
              </button>
              {editFacultyId && (
                <button
                  onClick={() => {
                    setEditFacultyId(null);
                    setFacultyForm({ f_name: "", f_abbr: "" });
                  }}
                  className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Degree Programme" description="Create degree programmes and link them to faculty." icon={GraduationCap}>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Degree Name</label>
              <div className="relative group">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Bachelor of Science"
                  value={degreeForm.d_name}
                  onChange={(event) => setFormValue(setDegreeForm, "d_name", event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Faculty</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                  <select
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-sm font-medium appearance-none"
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
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Abbreviation</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-sm font-medium"
                    placeholder="e.g. BSc"
                    value={degreeForm.degree_abbr}
                    onChange={(event) => setFormValue(setDegreeForm, "degree_abbr", event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
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
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25"
              >
                <Plus size={18} /> {editDegreeId ? "Update Degree" : "Add Degree"}
              </button>
              {editDegreeId && (
                <button
                  onClick={() => {
                    setEditDegreeId(null);
                    setDegreeForm({ d_name: "", f_id: 0, degree_abbr: "" });
                  }}
                  className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Faculties Table */}
        <div className="bg-white dark:bg-slate-950 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Building2 size={18} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Active Faculties</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{faculty.length} Units</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID / Abbr</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {faculty.map((item) => (
                  <tr key={`faculty-${item.f_id}`} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.f_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Academic Department</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Hash size={10} className="opacity-40" />
                          <code className="text-[10px] font-mono tracking-tight">{item.f_id}</code>
                        </div>
                        <span className="inline-flex w-fit px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase">{item.f_abbr}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setEditFacultyId(item.f_id);
                            setFacultyForm({ f_name: item.f_name, f_abbr: item.f_abbr });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-100/50"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(`/faculty/${item.f_id}`, loadFaculty, item.f_name)}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100/50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Degrees Table */}
        <div className="bg-white dark:bg-slate-950 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <GraduationCap size={18} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Degree Programmes</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{degrees.length} Programs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Programme Info</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {degrees.map((item) => {
                  const facultyItem = faculty.find((f) => f.f_id === item.f_id);
                  return (
                    <tr key={`degree-${item.d_id}`} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.d_name}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase">{item.degree_abbr}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Building2 size={12} className="opacity-40" />
                          <span className="text-[11px] font-medium truncate max-w-[120px]">{facultyItem?.f_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => {
                              setEditDegreeId(item.d_id);
                              setDegreeForm({ d_name: item.d_name, f_id: item.f_id, degree_abbr: item.degree_abbr });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all border border-transparent hover:border-purple-100/50"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(`/degrees/${item.d_id}`, loadDegrees, item.d_name)}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100/50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
