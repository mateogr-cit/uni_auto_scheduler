'use client';

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import FacultyPanel from "@/components/FacultyPanel";
import { type Faculty, type Degree, type FormState } from "@/components/schedule-types";
import { RefreshCcw, School } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const emptyFaculty = { f_name: "", f_abbr: "" };
const emptyDegree = { d_name: "", f_id: 0, degree_abbr: "" };

export default function FacultiesPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editFacultyId, setEditFacultyId] = useState<number | null>(null);
  const [editDegreeId, setEditDegreeId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePath, setDeletePath] = useState<string | null>(null);
  const [deleteItemLabel, setDeleteItemLabel] = useState<string | null>(null);
  const [deleteRefresh, setDeleteRefresh] = useState<(() => void) | null>(null);

  const [facultyForm, setFacultyForm] = useState<FormState<typeof emptyFaculty>>(emptyFaculty);
  const [degreeForm, setDegreeForm] = useState<FormState<typeof emptyDegree>>(emptyDegree);

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

  const loadAll = async () => {
    setLoading(true);
    await loadFaculty();
    await loadDegrees();
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const setFormValue = useCallback(<T extends object>(setter: Dispatch<SetStateAction<T>>, key: string, value: string | number | boolean) => {
    setter((current: T) => ({ ...current, [key]: value }));
  }, []);

  const handleSave = async (
    section: string,
    form: Record<string, string | number | boolean>,
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
    setDeletePath(path);
    setDeleteRefresh(() => refresh);
    setDeleteItemLabel(itemLabel);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePath || !deleteRefresh) return;
    try {
      await apiFetch(deletePath, { method: "DELETE" });
      setStatusMessage(`${deleteItemLabel} deleted successfully.`);
      deleteRefresh();
    } catch (error) {
      console.error(error);
      setStatusMessage(`Unable to delete ${deleteItemLabel?.toLowerCase()}.`);
    } finally {
      setDeleteDialogOpen(false);
      setDeletePath(null);
      setDeleteItemLabel(null);
      setDeleteRefresh(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-red-600/10 text-red-600 rounded-lg">
                <School size={24} />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Faculty & Degrees</h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">Manage your university's faculties and their associated degree programmes.</p>
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
        <div className="flex flex-col gap-12">
          {/* Forms Section Skeleton */}
          <div className="grid gap-8 xl:grid-cols-2">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Faculty Cards Skeleton */}
          <div className="flex flex-col gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-14 h-14 rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <Skeleton className="w-10 h-10 rounded-xl" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <div className="flex gap-1.5">
                            <Skeleton className="w-8 h-8 rounded-lg" />
                            <Skeleton className="w-8 h-8 rounded-lg" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
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
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${deleteItemLabel}`}
        description={`Are you sure you want to delete this ${deleteItemLabel?.toLowerCase()}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
