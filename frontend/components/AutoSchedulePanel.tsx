"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Users,
  Clock,
  Trash2,
  Eye,
} from "lucide-react";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type {
  GenerateScheduleResponse,
  ValidateScheduleResponse,
  ScheduleDetail,
  SkippedEntry,
} from "./schedule-types";
import { API_BASE } from "@/lib/constants";

type AutoSchedulePanelProps = {
  onRefresh: () => void;
};

export default function AutoSchedulePanel({
  onRefresh,
}: AutoSchedulePanelProps) {
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
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
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    setError(null);
    setScheduleResult(null);
    setValidationResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/auto-schedule/generate?year=${selectedYear}&semester_number=${selectedSemester}`,
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
    setIsValidating(true);
    try {
      const response = await fetch(
        `${API_BASE}/auto-schedule/validate?year=${selectedYear}&semester_number=${selectedSemester}`
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
    setClearDialogOpen(true);
  };

  const handleClearConfirm = async () => {
    setIsClearing(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/auto-schedule/clear?year=${selectedYear}&semester_number=${selectedSemester}`,
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
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl shadow-lg shadow-red-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Auto-Schedule Generator
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Automatically generate course schedules based on curriculum
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Year and Semester Selection */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Year Level</FieldLabel>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Year {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Semester</FieldLabel>
                <Select
                  value={selectedSemester.toString()}
                  onValueChange={(value) => setSelectedSemester(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Fall Semester</SelectItem>
                    <SelectItem value="2">Spring Semester</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
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
            <Button
              onClick={handleGenerateSchedule}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Generate Schedule
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={validateSchedule}
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Validate
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleClearSchedule}
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Clear Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Validation Results */}
      {validationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-xl p-6 shadow-sm ${
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
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-300 rounded-xl shadow-lg shadow-rose-300/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Schedule Generated
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {scheduleResult.semester_name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye size={20} />
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                Offerings Created
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
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
            <div className={`rounded-lg p-4 border ${
              (scheduleResult.skipped_count ?? 0) > 0
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
            }`}>
              <div className={`text-sm font-medium ${
                (scheduleResult.skipped_count ?? 0) > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
                Skipped
              </div>
              <div className={`text-2xl font-bold ${
                (scheduleResult.skipped_count ?? 0) > 0
                  ? "text-amber-900 dark:text-amber-100"
                  : "text-rose-900 dark:text-rose-100"
              }`}>
                {scheduleResult.skipped_count ?? 0}
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
              <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">
                Schedule Details by Offering:
              </h4>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(groupedSchedules).map(([offeringId, details]) => (
                  <motion.div
                    key={offeringId}
                    className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() =>
                        setExpandedOffering(
                          expandedOffering === parseInt(offeringId)
                            ? null
                            : parseInt(offeringId)
                        )
                      }
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-white">
                            {details[0]?.course} - {details[0]?.group}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
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
                    </Button>

                    {expandedOffering === parseInt(offeringId) && (
                      <div className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-2">
                        {details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 text-sm"
                          >
                            <div className="min-w-20 px-3 py-1 bg-white dark:bg-zinc-700 rounded font-semibold text-zinc-900 dark:text-white">
                              {detail.type}
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                              <Calendar className="w-4 h-4" />
                              {detail.day}
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                              <Users className="w-4 h-4" />
                              Room {detail.room}
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
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

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                📅 Each course has 1 lecture (2 hrs) + 1 seminar (2 hrs) session
              </p>
            </motion.div>
          )}

          {/* Skipped Entries */}
          {(scheduleResult.skipped?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                  {scheduleResult.skipped.length} course-group pair(s) could not be scheduled
                </span>
              </div>
              <div className="divide-y divide-amber-100 dark:divide-amber-900/40 max-h-80 overflow-y-auto">
                {scheduleResult.skipped.map((entry, i) => (
                  <div key={i} className="px-4 py-3 bg-white dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-white text-sm">
                          {entry.course}
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          ({entry.course_abbr})
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {entry.group}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          {entry.session_type}
                        </span>
                      </div>
                      {entry.missing.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                          {entry.missing.map((m) => (
                            <span
                              key={m}
                              className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium"
                            >
                              {m.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {entry.professor && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Professor: {entry.professor}
                      </p>
                    )}
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {entry.reason}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!scheduleResult && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700"
        >
          <Zap className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-300 mb-2">
            No Schedule Generated Yet
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400">
            Select a semester and click "Generate Schedule" to create a new
            timetable
          </p>
        </motion.div>
      )}

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Clear Schedule"
        description="Are you sure you want to clear the schedule? This will remove all generated sessions and cannot be undone."
        onConfirm={handleClearConfirm}
        confirmText="Clear Schedule"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
