"use client";

import { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { Zap, RefreshCcw } from "lucide-react";
import ScheduleTabs from "./ScheduleTabs";
import OverviewPanel from "./OverviewPanel";
import SetupPanel from "./SetupPanel";
import CurriculumPanel from "./CurriculumPanel";
import EnrollmentsPanel from "./EnrollmentsPanel";
import AutoSchedulePanel from "./AutoSchedulePanel";
import {
  type TabId,
  type StudentGroup,
  type Semester,
  type Faculty,
  type Degree,
  type Student,
  type Course,
  type StudentDegree,
  type CourseCurriculum,
  type CourseOffering,
  type Enrollment,
  type FormState,
} from "./schedule-types";

const API_BASE = "http://localhost:8000";

const emptyStudentGroup = { group_name: "", deg_id: 0, year_level: 1, semester_number: 1, capacity: 0 };
const emptySemester = { sem_name: "", start_date: "", end_date: "", is_special_semester: false, week_count: 15 };
const emptyFaculty = { f_name: "", f_abbr: "" };
const emptyDegree = { d_name: "", f_id: 0, degree_abbr: "" };
const emptyStudentDegree = { group_id: 0, deg_id: 0, yr_lvl: 1 };
const emptyCourseCurriculum = { c_id: 0, degree_id: 0, year_level: 1, is_active: true, semester_number: 1 };
const emptyEnrollment = { offering_id: 0, u_id: 0 };

const ScheduleDashboard = () => {
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [studentDegrees, setStudentDegrees] = useState<StudentDegree[]>([]);
  const [courseCurriculum, setCourseCurriculum] = useState<CourseCurriculum[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [autoEnrollmentEnabled, setAutoEnrollmentEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [editStudentGroupId, setEditStudentGroupId] = useState<number | null>(null);
  const [editSemesterId, setEditSemesterId] = useState<number | null>(null);
  const [editStudentDegreeId, setEditStudentDegreeId] = useState<number | null>(null);
  const [editCourseCurriculumId, setEditCourseCurriculumId] = useState<number | null>(null);
  const [editEnrollmentId, setEditEnrollmentId] = useState<number | null>(null);

  const [studentGroupForm, setStudentGroupForm] = useState<FormState<typeof emptyStudentGroup>>(emptyStudentGroup);
  const [semesterForm, setSemesterForm] = useState<FormState<typeof emptySemester>>(emptySemester);
  const [studentDegreeForm, setStudentDegreeForm] = useState<FormState<typeof emptyStudentDegree>>(emptyStudentDegree);
  const [courseCurriculumForm, setCourseCurriculumForm] = useState<FormState<typeof emptyCourseCurriculum>>(emptyCourseCurriculum);
  const [enrollmentForm, setEnrollmentForm] = useState<FormState<typeof emptyEnrollment>>(emptyEnrollment);

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

  const loadAll = () => {
    loadStudentGroups();
    loadSemesters();
    loadFaculty();
    loadDegrees();
    loadStudents();
    loadCourses();
    loadOfferings();
    loadStudentDegrees();
    loadCourseCurriculum();
    loadEnrollments();
  };

  const loadStudentGroups = async () => {
    try {
      setStudentGroups((await apiFetch("/student-groups/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSemesters = async () => {
    try {
      setSemesters((await apiFetch("/semesters/")) || []);
    } catch (error) {
      console.error(error);
    }
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

  const loadStudents = async () => {
    try {
      setStudents((await apiFetch("/students/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCourses = async () => {
    try {
      setCourses((await apiFetch("/courses/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadOfferings = async () => {
    try {
      setOfferings((await apiFetch("/course-offerings/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadStudentDegrees = async () => {
    try {
      setStudentDegrees((await apiFetch("/student-degrees/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCourseCurriculum = async () => {
    try {
      setCourseCurriculum((await apiFetch("/course-curriculum/")) || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadEnrollments = async () => {
    try {
      setEnrollments((await apiFetch("/enrollments/")) || []);
    } catch (error) {
      console.error(error);
    }
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
      if (typeof payload.is_special_semester === "string") {
        payload.is_special_semester = payload.is_special_semester === "true";
      }
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

  const handleAutoEnroll = async () => {
    try {
      const result = await apiFetch("/enrollments/auto/", { method: "POST" });
      setStatusMessage(result?.message || "Auto enrollment completed.");
      setAutoEnrollmentEnabled(true);
      loadEnrollments();
    } catch (error) {
      console.error(error);
      setStatusMessage("Auto enrollment failed.");
    }
  };

  return (
    <div className="space-y-8">
      <ScheduleTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Schedule Builder</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Configure your academic groups, semesters, curriculum, enrollments, and launch schedule generation.</p>
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

      {activeTab === "overview" && (
        <OverviewPanel
          studentGroupsCount={studentGroups.length}
          semestersCount={semesters.length}
          degreesCount={degrees.length}
          onGoto={setActiveTab}
        />
      )}

      {activeTab === "setup" && (
        <SetupPanel
          studentGroups={studentGroups}
          studentGroupForm={studentGroupForm}
          setStudentGroupForm={setStudentGroupForm}
          editStudentGroupId={editStudentGroupId}
          setEditStudentGroupId={setEditStudentGroupId}
          loadStudentGroups={loadStudentGroups}
          semesters={semesters}
          semesterForm={semesterForm}
          setSemesterForm={setSemesterForm}
          editSemesterId={editSemesterId}
          setEditSemesterId={setEditSemesterId}
          loadSemesters={loadSemesters}
          setFormValue={setFormValue}
          handleSave={handleSave}
          handleDelete={handleDelete}
          degrees={degrees}
        />
      )}


      {activeTab === "curriculum" && (
        <CurriculumPanel
          studentDegrees={studentDegrees}
          courseCurriculum={courseCurriculum}
          studentDegreeForm={studentDegreeForm}
          setStudentDegreeForm={setStudentDegreeForm}
          editStudentDegreeId={editStudentDegreeId}
          setEditStudentDegreeId={setEditStudentDegreeId}
          loadStudentDegrees={loadStudentDegrees}
          courseCurriculumForm={courseCurriculumForm}
          setCourseCurriculumForm={setCourseCurriculumForm}
          editCourseCurriculumId={editCourseCurriculumId}
          setEditCourseCurriculumId={setEditCourseCurriculumId}
          loadCourseCurriculum={loadCourseCurriculum}
          students={students}
          courses={courses}
          studentGroups={studentGroups}
          degrees={degrees}
          faculty={faculty}
          setFormValue={setFormValue}
          handleSave={handleSave}
          handleDelete={handleDelete}
        />
      )}

      {activeTab === "enrollments" && (
        <EnrollmentsPanel
          enrollments={enrollments}
          enrollmentForm={enrollmentForm}
          setEnrollmentForm={setEnrollmentForm}
          editEnrollmentId={editEnrollmentId}
          setEditEnrollmentId={setEditEnrollmentId}
          loadEnrollments={loadEnrollments}
          students={students}
          studentGroups={studentGroups}
          offerings={offerings}
          autoEnrollmentEnabled={autoEnrollmentEnabled}
          handleSave={handleSave}
          handleDelete={handleDelete}
          handleAutoEnroll={handleAutoEnroll}
        />
      )}

      {activeTab === "schedule" && (
        <AutoSchedulePanel
          semesters={semesters}
          onRefresh={loadAll}
        />
      )}
    </div>
  );
};

export default ScheduleDashboard;
