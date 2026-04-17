"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Users,
  Clock,
  Trash2,
  Eye,
} from "lucide-react";
import type {
  Semester,
  GenerateScheduleResponse,
  ValidateScheduleResponse,
  ScheduleDetail,
} from "./schedule-types";

const API_BASE = "http://localhost:8000";

type AutoSchedulePanelProps = {
  semesters: Semester[];
  onRefresh: () => void;
};

export default function AutoSchedulePanel({
  semesters,
  onRefresh,
}: AutoSchedulePanelProps) {
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    semesters.length > 0 ? semesters[0].sem_id : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [scheduleResult, setScheduleResult] =
    useState<GenerateScheduleResponse | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidateScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedOffering, setExpandedOffering] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleGenerateSchedule = async () => {
    if (!selectedSemesterId) {
      setError("Please select a semester");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setScheduleResult(null);
    setValidationResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/auto-schedule/generate?semester_id=${selectedSemesterId}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate schedule");
      }

      const data = (await response.json()) as GenerateScheduleResponse;
      setScheduleResult(data);

      // Auto-validate after generation
      setTimeout(() => validateSchedule(), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const validateSchedule = async () => {
    if (!selectedSemesterId) return;

    setIsValidating(true);
    try {
      const response = await fetch(
        `${API_BASE}/auto-schedule/validate/${selectedSemesterId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to validate schedule");
      }

      const data = (await response.json()) as ValidateScheduleResponse;
      setValidationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!selectedSemesterId) return;

    if (!confirm("Are you sure you want to clear the schedule?")) return;

    setIsClearing(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/auto-schedule/clear/${selectedSemesterId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to clear schedule");
      }

      setScheduleResult(null);
      setValidationResult(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsClearing(false);
    }
  };

  const groupedSchedules = scheduleResult?.schedule_details?.reduce(
    (acc, detail) => {
      if (!acc[detail.offering_id]) {
        acc[detail.offering_id] = [];
      }
      acc[detail.offering_id].push(detail);
      return acc;
    },
    {} as Record<number, ScheduleDetail[]>
  ) || {};

  return (
    <div className="space-y-6 font-sans">
      {/* Generate Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Auto-Schedule Generator
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Automatically generate course schedules based on curriculum
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Semester Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Semester
            </label>
            <select
              value={selectedSemesterId || ""}
              onChange={(e) => setSelectedSemesterId(parseInt(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Select Semester --</option>
              {semesters.map((s) => (
                <option key={s.sem_id} value={s.sem_id}>
                  {s.sem_name} ({s.week_count} weeks)
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-200">
                  Error
                </p>
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleGenerateSchedule}
              disabled={isGenerating || !selectedSemesterId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Schedule
                </>
              )}
            </button>

            <button
              onClick={validateSchedule}
              disabled={isValidating || !selectedSemesterId}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Validate
                </>
              )}
            </button>

            <button
              onClick={handleClearSchedule}
              disabled={isClearing || !selectedSemesterId}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Clear Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Validation Results */}
      {validationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-2xl p-6 shadow-sm ${
            validationResult.is_valid
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-3 rounded-xl shadow-lg ${
                validationResult.is_valid
                  ? "bg-emerald-500 shadow-emerald-500/20"
                  : "bg-amber-500 shadow-amber-500/20"
              }`}
            >
              {validationResult.is_valid ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <AlertCircle className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3
                className={`font-bold ${
                  validationResult.is_valid
                    ? "text-emerald-900 dark:text-emerald-200"
                    : "text-amber-900 dark:text-amber-200"
                }`}
              >
                {validationResult.is_valid
                  ? "✓ Schedule is Valid"
                  : "⚠ Schedule Issues Found"}
              </h3>
              <p
                className={`text-sm ${
                  validationResult.is_valid
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {validationResult.total_offerings} total offerings
              </p>
            </div>
          </div>

          {validationResult.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                Issues:
              </h4>
              <ul className="space-y-1">
                {validationResult.issues.map((issue, i) => (
                  <li
                    key={i}
                    className="text-sm text-red-600 dark:text-red-400 flex gap-2"
                  >
                    <span>•</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div>
              <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
                Warnings:
              </h4>
              <ul className="space-y-1">
                {validationResult.warnings.map((warning, i) => (
                  <li
                    key={i}
                    className="text-sm text-amber-600 dark:text-amber-400 flex gap-2"
                  >
                    <span>•</span> {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Generation Results */}
      {scheduleResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Schedule Generated
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {scheduleResult.semester_name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
              <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                Offerings Created
              </div>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {scheduleResult.offerings_created}
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Sessions
              </div>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {scheduleResult.schedule_details.length}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Status
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                Ready
              </div>
            </div>
          </div>

          {/* Details Toggle */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                Schedule Details by Offering:
              </h4>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(groupedSchedules).map(([offeringId, details]) => (
                  <motion.div
                    key={offeringId}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedOffering(
                          expandedOffering === parseInt(offeringId)
                            ? null
                            : parseInt(offeringId)
                        )
                      }
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {details[0]?.course} - {details[0]?.group}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Offering #{offeringId}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`transform transition-transform ${
                          expandedOffering === parseInt(offeringId)
                            ? "rotate-180"
                            : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>

                    {expandedOffering === parseInt(offeringId) && (
                      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
                        {details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 text-sm"
                          >
                            <div className="min-w-20 px-3 py-1 bg-white dark:bg-slate-700 rounded font-semibold text-slate-900 dark:text-white">
                              {detail.type}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Calendar className="w-4 h-4" />
                              {detail.day}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Users className="w-4 h-4" />
                              Room {detail.room}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Clock className="w-4 h-4" />
                              Slot #{detail.slot_id}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                📅 Each course has 1 lecture (2 hrs) + 1 seminar (2 hrs) session
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!scheduleResult && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700"
        >
          <Zap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
            No Schedule Generated Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Select a semester and click "Generate Schedule" to create a new
            timetable
          </p>
        </motion.div>
      )}
    </div>
  );
}
