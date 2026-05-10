import { type Dispatch, type SetStateAction } from "react";
import { SectionCard } from "./ScheduleSection";
import { type Faculty, type Degree, type FormState } from "./schedule-types";
import { Building2, GraduationCap, Edit, Trash2, Hash, Tag, Plus, X, Search, BookOpen } from "lucide-react";

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
    <div className="flex flex-col gap-12">
      {/* Forms Section */}
      <div className="grid gap-8 xl:grid-cols-2">
        <SectionCard title="Faculty" description="Create and manage academic faculties." icon={Building2}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Faculty Name</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all text-sm font-medium"
                  placeholder="e.g. Faculty of Computer Science"
                  value={facultyForm.f_name}
                  onChange={(event) => setFormValue(setFacultyForm, "f_name", event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Abbreviation</label>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all text-sm font-medium"
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
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-3.5 text-sm font-bold text-white hover:from-red-500 hover:to-rose-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-500/25 cursor-pointer"
              >
                <Plus size={18} /> {editFacultyId ? "Update Faculty" : "Add Faculty"}
              </button>
              {editFacultyId && (
                <button
                  onClick={() => {
                    setEditFacultyId(null);
                    setFacultyForm({ f_name: "", f_abbr: "" });
                  }}
                  className="cursor-pointer p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Degree Programme" description="Create degree programmes and link them to faculty." icon={GraduationCap}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Degree Name</label>
              <div className="relative group">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all text-sm font-medium"
                  placeholder="e.g. Bachelor of Science"
                  value={degreeForm.d_name}
                  onChange={(event) => setFormValue(setDegreeForm, "d_name", event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Faculty</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors pointer-events-none" size={18} />
                  <select
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all text-sm font-medium appearance-none"
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
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Abbreviation</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-red-500 transition-colors" size={18} />
                  <input
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 rounded-xl outline-none! transition-all text-sm font-medium"
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
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-3.5 text-sm font-bold text-white hover:from-red-500 hover:to-rose-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-500/25 cursor-pointer"
              >
                <Plus size={18} /> {editDegreeId ? "Update Degree" : "Add Degree"}
              </button>
              {editDegreeId && (
                <button
                  onClick={() => {
                    setEditDegreeId(null);
                    setDegreeForm({ d_name: "", f_id: 0, degree_abbr: "" });
                  }}
                  className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Nested/Grouped View - Faculties with Degrees */}
      {faculty.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-700">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Building2 size={40} className="text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">No faculties yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">Create your first faculty to start organizing degree programmes</p>
          <button
            onClick={() => {
              setEditFacultyId(null);
              setFacultyForm({ f_name: "", f_abbr: "" });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg shadow-red-500/25 cursor-pointer"
          >
            Create Faculty
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {faculty.map((fac) => {
            const facultyDegrees = degrees.filter((d) => d.f_id === fac.f_id);
            return (
              <div key={fac.f_id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Faculty Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/25">
                        {fac.f_abbr}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{fac.f_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            <BookOpen size={14} className="inline mr-1" />
                            {facultyDegrees.length} degree programme{facultyDegrees.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditFacultyId(fac.f_id);
                          setFacultyForm({ f_name: fac.f_name, f_abbr: fac.f_abbr });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100/50 cursor-pointer"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(`/faculty/${fac.f_id}`, loadFaculty, fac.f_name)}
                        className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100/50 cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Degrees Grid */}
                {facultyDegrees.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <GraduationCap size={24} className="text-zinc-400" />
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">No degree programmes yet</p>
                    <button
                      onClick={() => {
                        setEditDegreeId(null);
                        setDegreeForm({ d_name: "", f_id: fac.f_id, degree_abbr: "" });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="mt-3 text-red-600 dark:text-red-400 text-sm font-medium hover:underline cursor-pointer"
                    >
                      Add first degree
                    </button>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {facultyDegrees.map((deg) => (
                        <div
                          key={deg.d_id}
                          className="group p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-red-500/30 hover:bg-white dark:hover:bg-zinc-900 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm">
                                {deg.degree_abbr}
                              </div>
                              <div>
                                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{deg.d_name}</h4>
                              </div>
                            </div>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditDegreeId(deg.d_id);
                                  setDegreeForm({ d_name: deg.d_name, f_id: deg.f_id, degree_abbr: deg.degree_abbr });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(`/degrees/${deg.d_id}`, loadDegrees, deg.d_name)}
                                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
