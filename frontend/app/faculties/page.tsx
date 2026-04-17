'use client';

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import FacultyPanel from "@/components/FacultyPanel";
import { type Faculty, type Degree, type FormState } from "@/components/schedule-types";
import { RefreshCcw, School } from "lucide-react";

const API_BASE = "http://localhost:8000";

const emptyFaculty = { f_name: "", f_abbr: "" };
const emptyDegree = { d_name: "", f_id: 0, degree_abbr: "" };

export default function FacultiesPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [editFacultyId, setEditFacultyId] = useState<number | null>(null);
  const [editDegreeId, setEditDegreeId] = useState<number | null>(null);

  const [facultyForm, setFacultyForm] = useState<FormState<typeof emptyFaculty>>(emptyFaculty);
  const [degreeForm, setDegreeForm] = useState<FormState<typeof emptyDegree>>(emptyDegree);

  const apiFetch = async (path: string, opts: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...opts,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Request failed: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };

  const loadFaculty = async () => {
    try {
      setFaculty((await apiFetch("/faculty/")) || []);
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

  const loadAll = () => {
    loadFaculty();
    loadDegrees();
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
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-lg">
                <School size={24} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Faculty & Degrees</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">Manage your university's faculties and their associated degree programmes.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={loadAll}
              className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <RefreshCcw size={16} /> Refresh Data
            </button>
          </div>
        </div>

        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-900/30 dark:text-emerald-200">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <FacultyPanel
        faculty={faculty}
        degrees={degrees}
        facultyForm={facultyForm}
        setFacultyForm={setFacultyForm}
        editFacultyId={editFacultyId}
        setEditFacultyId={setEditFacultyId}
        loadFaculty={loadFaculty}
        degreeForm={degreeForm}
        setDegreeForm={setDegreeForm}
        editDegreeId={editDegreeId}
        setEditDegreeId={setEditDegreeId}
        loadDegrees={loadDegrees}
        setFormValue={setFormValue}
        handleSave={handleSave}
        handleDelete={handleDelete}
      />
    </div>
  );
}
