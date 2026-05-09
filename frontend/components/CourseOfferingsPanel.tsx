"use client";

import { useState, useEffect } from "react";
import { BookOpen, Check, X, Plus, Trash2, Calendar } from "lucide-react";

interface Course {
  c_id: number;
  c_name: string;
  c_abbr: string;
  c_year: number;
  c_semester: number;
  is_offered: boolean;
}

interface Semester {
  sem_id: number;
  sem_name: string;
  semester_number: number;
}

interface Offering {
  offering_id: number;
  course: string;
  course_abbr: string;
  group: string;
  year_level: number;
}

interface CourseOfferingsPanelProps {
  semesters: any[];
  onRefresh: () => void;
}

export default function CourseOfferingsPanel({ semesters, onRefresh }: CourseOfferingsPanelProps) {
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [existingOfferings, setExistingOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (selectedSemester) {
      loadAvailableCourses();
      loadExistingOfferings();
    }
  }, [selectedSemester]);

  const loadAvailableCourses = async () => {
    if (!selectedSemester) return;
    try {
      const response = await fetch(`${API_BASE}/course-offerings/available-courses/${selectedSemester}`);
      if (!response.ok) throw new Error("Failed to load courses");
      const data = await response.json();
      setAvailableCourses(data.courses);
    } catch (error) {
      console.error("Error loading courses:", error);
      setMessage({ type: "error", text: "Failed to load courses" });
    }
  };

  const loadExistingOfferings = async () => {
    if (!selectedSemester) return;
    try {
      const response = await fetch(`${API_BASE}/course-offerings/semester/${selectedSemester}`);
      if (!response.ok) throw new Error("Failed to load offerings");
      const data = await response.json();
      setExistingOfferings(data.offerings);
    } catch (error) {
      console.error("Error loading offerings:", error);
    }
  };

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const generateOfferings = async () => {
    if (!selectedSemester || selectedCourses.size === 0) {
      setMessage({ type: "error", text: "Please select a semester and at least one course" });
      return;
    }

    const courseIdsArray = Array.from(selectedCourses);
    console.log("Sending request:", { semester_id: selectedSemester, course_ids: courseIdsArray });

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/course-offerings/generate/${selectedSemester}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_ids: courseIdsArray }),
      });

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        throw new Error(`Failed to generate offerings: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      setMessage({
        type: "success",
        text: `Created ${data.created_count} offerings. Skipped ${data.skipped_count}.`,
      });

      // Refresh data
      loadAvailableCourses();
      loadExistingOfferings();
      setSelectedCourses(new Set());
      onRefresh();
    } catch (error) {
      console.error("Error generating offerings:", error);
      setMessage({ type: "error", text: "Failed to generate offerings" });
    } finally {
      setLoading(false);
    }
  };

  const deleteOffering = async (offeringId: number) => {
    if (!confirm("Are you sure you want to delete this offering?")) return;

    try {
      const response = await fetch(`${API_BASE}/course-offerings/${offeringId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete offering");

      loadExistingOfferings();
      loadAvailableCourses();
      onRefresh();
      setMessage({ type: "success", text: "Offering deleted successfully" });
    } catch (error) {
      console.error("Error deleting offering:", error);
      setMessage({ type: "error", text: "Failed to delete offering" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Semester Selection */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Select Semester
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {semesters.map((sem) => (
            <button
              key={sem.sem_id}
              onClick={() => setSelectedSemester(sem.sem_id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedSemester === sem.sem_id
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-white">{sem.sem_name}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {new Date(sem.start_date).toLocaleDateString()} - {new Date(sem.end_date).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedSemester && (
        <>
          {/* Available Courses */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen size={20} />
                Available Courses
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedCourses.size} selected
              </span>
            </div>

            {availableCourses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No courses available for this semester
              </div>
            ) : (
              <div className="space-y-3">
                {availableCourses.map((course) => (
                  <div
                    key={course.c_id}
                    onClick={() => !course.is_offered && toggleCourseSelection(course.c_id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      course.is_offered
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 opacity-60"
                        : selectedCourses.has(course.c_id)
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        course.is_offered
                          ? "border-emerald-500 bg-emerald-500"
                          : selectedCourses.has(course.c_id)
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {course.is_offered ? (
                          <Check size={14} className="text-white" />
                        ) : selectedCourses.has(course.c_id) ? (
                          <Check size={14} className="text-white" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{course.c_name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {course.c_abbr} • Year {course.c_year}
                        </div>
                      </div>
                    </div>
                    {course.is_offered && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 rounded-full">
                        Already Offered
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedCourses.size > 0 && (
              <button
                onClick={generateOfferings}
                disabled={loading}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Generating..."
                ) : (
                  <>
                    <Plus size={18} />
                    Generate {selectedCourses.size} Course Offering{selectedCourses.size > 1 ? "s" : ""}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Existing Offerings */}
          {existingOfferings.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Existing Offerings</h2>
              <div className="space-y-3">
                {existingOfferings.map((offering) => (
                  <div
                    key={offering.offering_id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{offering.course}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {offering.course_abbr} • {offering.group} • Year {offering.year_level}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteOffering(offering.offering_id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {message && (
        <div
          className={`p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-200"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
