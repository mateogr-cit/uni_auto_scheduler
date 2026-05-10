import { type Dispatch, type SetStateAction, useState } from "react";
import { SectionCard } from "./ScheduleSection";
import { type Enrollment, type FormState, type Student, type StudentGroup, type CourseOffering, type Course } from "./schedule-types";
import { UserCheck, BookOpen, Users, Zap, Plus, Edit, Trash2, RefreshCcw, Info, Search, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";

type EnrollmentsPanelProps = {
  enrollments: Enrollment[];
  enrollmentForm: FormState<Enrollment>;
  setEnrollmentForm: Dispatch<SetStateAction<FormState<Enrollment>>>;
  students: Student[];
  studentGroups: StudentGroup[];
  offerings: CourseOffering[];
  courses: Course[];
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
  courses,
  autoEnrollmentEnabled,
  handleSave,
  handleDelete,
  handleAutoEnroll,
}: EnrollmentsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());

  const getCourseName = (cId: number) => {
    const course = courses.find((c) => c.c_id === cId);
    return course ? `${course.c_abbr} - ${course.c_name}` : `Course ${cId}`;
  };

  const getStudentName = (uId: number) => {
    const student = students.find((s) => s.u_id === uId);
    return student ? `${student.fname} ${student.lname}` : `Student ${uId}`;
  };

  const getGroupName = (groupId: number | null) => {
    if (!groupId) return "No Group";
    const group = studentGroups.find((g) => g.group_id === groupId);
    return group ? group.group_name : `Group ${groupId}`;
  };

  const getOfferingDetails = (offeringId: number) => {
    const offering = offerings.find((o) => o.offering_id === offeringId);
    if (!offering) return { course: "Unknown", group: "Unknown" };
    return {
      course: getCourseName(offering.c_id),
      group: getGroupName(offering.group_id),
    };
  };

  // Filter enrollments based on search term
  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (!searchTerm.trim()) return true;

    const student = students.find((s) => s.u_id === enrollment.u_id);
    const offeringDetails = getOfferingDetails(enrollment.offering_id);
    const groupName = student ? getGroupName(student.group_id) : "";

    const searchLower = searchTerm.toLowerCase();
    return (
      (student && `${student.fname} ${student.lname}`.toLowerCase().includes(searchLower)) ||
      offeringDetails.course.toLowerCase().includes(searchLower) ||
      groupName.toLowerCase().includes(searchLower) ||
      enrollment.u_id.toString().includes(searchLower)
    );
  });

  // Group enrollments by student
  const enrollmentsByStudent = filteredEnrollments.reduce((acc, enrollment) => {
    if (!acc[enrollment.u_id]) {
      acc[enrollment.u_id] = [];
    }
    acc[enrollment.u_id].push(enrollment);
    return acc;
  }, {} as Record<number, Enrollment[]>);

  const toggleStudentExpand = (studentId: number) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-100 dark:border-red-800/50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-500/30">
            <UserCheck size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Student Enrollments</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Enroll students into course offerings. Each enrollment links a student to a specific course offering for the current semester.
              Use manual enrollment for individual students or run auto-enrollment to enroll all students in their group's courses.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Enrollments</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{enrollments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
              <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Offerings</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{offerings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-500/10 rounded-xl">
              <Zap size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Auto-Enroll</p>
              <p className={`text-2xl font-bold ${autoEnrollmentEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"}`}>
                {autoEnrollmentEnabled ? "Ready" : "Pending"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manual Enrollment Form */}
        <SectionCard
          title="Manual Enrollment"
          description="Enroll a specific student into a course offering."
          icon={Plus}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  <BookOpen size={16} />
                  Course Offering
                </label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white appearance-none"
                  value={enrollmentForm.offering_id ?? 0}
                  onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, offering_id: Number(event.target.value) }))}
                >
                  <option value={0}>Select a course offering</option>
                  {offerings.map((offering) => (
                    <option key={offering.offering_id} value={offering.offering_id}>
                      {getCourseName(offering.c_id)} — {getGroupName(offering.group_id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  <Users size={16} />
                  Student
                </label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white appearance-none"
                  value={enrollmentForm.u_id ?? 0}
                  onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, u_id: Number(event.target.value) }))}
                >
                  <option value={0}>Select a student</option>
                  {students.map((student) => (
                    <option key={student.u_id} value={student.u_id}>
                      {student.fname} {student.lname} — {getGroupName(student.group_id)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
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
                disabled={!enrollmentForm.offering_id || !enrollmentForm.u_id}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white hover:from-red-500 hover:to-rose-400 transition shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editEnrollmentId ? <Edit size={18} /> : <Plus size={18} />}
                {editEnrollmentId ? "Update Enrollment" : "Create Enrollment"}
              </button>
              {editEnrollmentId && (
                <button
                  onClick={() => {
                    setEditEnrollmentId(null);
                    setEnrollmentForm({ offering_id: 0, u_id: 0 });
                  }}
                  className="cursor-pointer rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition active:scale-95"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Auto Enrollment */}
        <SectionCard
          title="Auto Enrollment"
          description="Automatically enroll all students into their group's course offerings."
          icon={Zap}
        >
          <div className="flex flex-col gap-6">
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-5 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-xl">
                  <Info size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">How it works</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Auto-enrollment matches each student to course offerings based on their group's curriculum.
                    All students in a group will be enrolled in the same courses.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${autoEnrollmentEnabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {autoEnrollmentEnabled ? "Auto-enrollment completed" : "Auto-enrollment not run yet"}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  autoEnrollmentEnabled
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}>
                  {autoEnrollmentEnabled ? "Complete" : "Pending"}
                </span>
              </div>
            </div>

            <button
              onClick={handleAutoEnroll}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-5 py-3 text-sm font-semibold text-white hover:from-red-500 hover:to-rose-400 transition shadow-lg shadow-red-500/20 active:scale-95"
            >
              <Zap size={18} />
              Run Auto Enrollment
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Enrollments Table */}
      <SectionCard
        title="Current Enrollments"
        description={`Showing ${filteredEnrollments.length} of ${enrollments.length} enrollment${enrollments.length !== 1 ? 's' : ''}`}
        icon={RefreshCcw}
      >
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
            <input
              type="text"
              placeholder="Search by student name, course, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-500 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-11 pr-4 py-3 text-sm text-zinc-900 outline-none! transition focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 dark:text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck size={32} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {searchTerm ? "No Matching Enrollments" : "No Enrollments Yet"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Create manual enrollments or run auto-enrollment to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-10"></th>
                  <th className="px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Student</th>
                  <th className="px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Group</th>
                  <th className="px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Enrollments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {Object.entries(enrollmentsByStudent).map(([studentId, studentEnrollments]) => {
                  const student = students.find((s) => s.u_id === Number(studentId));
                  const isExpanded = expandedStudents.has(Number(studentId));
                  const groupName = student ? getGroupName(student.group_id) : "Unknown";

                  return (
                    <React.Fragment key={studentId}>
                      {/* Student Row */}
                      <tr
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer"
                        onClick={() => toggleStudentExpand(Number(studentId))}
                      >
                        <td className="px-5 py-4">
                          <button className="cursor-pointer p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                            {isExpanded ? (
                              <ChevronDown size={18} className="text-zinc-500" />
                            ) : (
                              <ChevronRight size={18} className="text-zinc-500" />
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {student ? `${student.fname} ${student.lname}` : `Student ${studentId}`}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">ID: {studentId}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                            {groupName}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            {studentEnrollments.length} enrollment{studentEnrollments.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Offerings */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="px-0 py-0">
                            <div className="bg-zinc-50 dark:bg-zinc-900/30 border-t border-b border-zinc-200 dark:border-zinc-800">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-100 dark:bg-zinc-900/50">
                                  <tr>
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Course Offering</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Group</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                  {studentEnrollments.map((enrollment) => {
                                    const offeringDetails = getOfferingDetails(enrollment.offering_id);
                                    return (
                                      <tr key={enrollment.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer">
                                        <td className="px-5 py-4">
                                          <div className="font-medium text-zinc-900 dark:text-white">{offeringDetails.course}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                          <div className="text-sm text-zinc-600 dark:text-zinc-300">{offeringDetails.group}</div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditEnrollmentId(enrollment.id);
                                                setEnrollmentForm({ offering_id: enrollment.offering_id, u_id: enrollment.u_id });
                                              }}
                                              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                                            >
                                              <Edit size={16} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(`/enrollments/${enrollment.id}`, loadEnrollments, `enrollment ${enrollment.id}`);
                                              }}
                                              className="cursor-pointer p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
