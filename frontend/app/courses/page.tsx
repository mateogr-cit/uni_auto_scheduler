'use client';

import { BookOpen, Plus, Grid, List as ListIcon, Tag, Scale, Calendar, Search, Check, ChevronDown } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { CardActions } from "@/components/ui/card-actions";
import { API_BASE } from "@/lib/constants";

interface Degree {
    d_id: number;
    d_name: string;
    degree_abbr: string;
}

interface FormData {
    c_name: string;
    c_abbr: string;
    c_difficulty_weight: string;
    c_year: string;
    c_semester: string;
    degree_ids: string[];
}

interface Course {
    c_id: number;
    c_name: string;
    c_abbr: string;
    c_difficulty_weight: number;
    c_year: number;
    c_semester: number;
    is_active: boolean;
    degree_id?: number;
    degree?: Degree;
    degrees?: Degree[];
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [degrees, setDegrees] = useState<Degree[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [degreeDropdownOpen, setDegreeDropdownOpen] = useState(false);
    const [degreeSearchQuery, setDegreeSearchQuery] = useState("");
    const [showAllDegrees, setShowAllDegrees] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>({
        c_name: "",
        c_abbr: "",
        c_difficulty_weight: "",
        c_year: "",
        c_semester: "",
        degree_ids: []
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDegrees = async () => {
        try {
            const response = await fetch(`${API_BASE}/degrees/`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            setDegrees(data);
        } catch (err) {
            console.error("Failed to fetch degrees", err);
        }
    };

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/courses/`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            setCourses(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchDegrees();
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const url = editingCourse ? `${API_BASE}/courses/${editingCourse.c_id}` : `${API_BASE}/courses/`;
        const method = editingCourse ? "PUT" : "POST";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                c_difficulty_weight: parseFloat(formData.c_difficulty_weight),
                c_year: parseInt(formData.c_year),
                c_semester: parseInt(formData.c_semester),
                is_active: true,
                degree_ids: formData.degree_ids.length > 0 ? formData.degree_ids.map(d => parseInt(d)) : null
            }),
        });
        fetchCourses();
        setShowForm(false);
        setEditingCourse(null);
        setFormData({ c_name: "", c_abbr: "", c_difficulty_weight: "", c_year: "", c_semester: "", degree_ids: [] });
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        // Get degree IDs from degrees array if available, otherwise use degree_id for backward compatibility
        const degreeIds = course.degrees && course.degrees.length > 0 
            ? course.degrees.map(d => d.d_id.toString())
            : (course.degree_id ? [course.degree_id.toString()] : []);
        
        setFormData({
            c_name: course.c_name,
            c_abbr: course.c_abbr,
            c_difficulty_weight: course.c_difficulty_weight.toString(),
            c_year: course.c_year.toString(),
            c_semester: course.c_semester.toString(),
            degree_ids: degreeIds
        });
        setShowForm(true);
    };

    const handleToggleActive = async (courseId: number, isActive: boolean) => {
        try {
            const response = await fetch(`${API_BASE}/courses/${courseId}/toggle-active`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            await fetchCourses();
        } catch (err) {
            console.error("Failed to update course status:", err);
            setError("Failed to update course status");
        }
    };

    const handleDelete = async (id: number) => {
        setCourseToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!courseToDelete) return;
        try {
            await fetch(`${API_BASE}/courses/${courseToDelete}`, { method: "DELETE" });
            fetchCourses();
        } catch (err) {
            console.error("Failed to delete course:", err);
            setError("Failed to delete course");
        } finally {
            setDeleteDialogOpen(false);
            setCourseToDelete(null);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Courses"
                subtitle="See syllabus, credits, and prerequisites for each course."
                buttonLabel="Add Course"
                onAdd={() => setShowForm(true)}
            >
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button className="cursor-pointer p-2 bg-white dark:bg-zinc-700 shadow-sm rounded-lg text-red-600"><Grid size={18} /></button>
                    <button className="cursor-pointer p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><ListIcon size={18} /></button>
                </div>
            </PageHeader>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl text-sm font-medium">
                    ⚠️ {error}
                </div>
            )}

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-7 w-12 rounded-full" />
                            </div>
                            <Skeleton className="h-6 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4 mb-4" />
                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <Skeleton className="h-4 w-1/2 mb-2" />
                                <Skeleton className="h-4 w-1/3 mb-4" />
                                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <Skeleton className="h-10 flex-1 rounded-lg" />
                                    <Skeleton className="h-10 flex-1 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-400 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                            <BookOpen size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{editingCourse ? "Edit Course" : "Add Course"}</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Fill in the course details below</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        {/* Basic Information */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-rose-400 rounded-full" />
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Basic Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field>
                                    <FieldLabel htmlFor="c_name">Course Name</FieldLabel>
                                    <InputGroup>
                                        <InputGroupAddon align="inline-start">
                                            <BookOpen data-icon="inline-start" />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="c_name"
                                            placeholder="e.g. Introduction to Computer Science"
                                            value={formData.c_name}
                                            onChange={(e) => setFormData({ ...formData, c_name: e.target.value })}
                                            required
                                        />
                                    </InputGroup>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="c_abbr">Abbreviation</FieldLabel>
                                    <InputGroup>
                                        <InputGroupAddon align="inline-start">
                                            <Tag data-icon="inline-start" />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="c_abbr"
                                            placeholder="e.g. CS101"
                                            value={formData.c_abbr}
                                            onChange={(e) => setFormData({ ...formData, c_abbr: e.target.value })}
                                            required
                                        />
                                    </InputGroup>
                                </Field>
                            </div>
                        </div>

                        {/* Course Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-rose-400 rounded-full" />
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Course Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Field>
                                    <FieldLabel htmlFor="c_difficulty_weight">Difficulty Weight</FieldLabel>
                                    <InputGroup>
                                        <InputGroupAddon align="inline-start">
                                            <Scale data-icon="inline-start" />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="c_difficulty_weight"
                                            type="number"
                                            placeholder="1-10"
                                            value={formData.c_difficulty_weight}
                                            onChange={(e) => setFormData({ ...formData, c_difficulty_weight: e.target.value })}
                                            required
                                        />
                                    </InputGroup>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="c_year">Year</FieldLabel>
                                    <Select
                                        value={formData.c_year}
                                        onValueChange={(value) => setFormData({ ...formData, c_year: value! })}
                                        required
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Year 1</SelectItem>
                                            <SelectItem value="2">Year 2</SelectItem>
                                            <SelectItem value="3">Year 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="c_semester">Semester Type</FieldLabel>
                                    <Select
                                        value={formData.c_semester}
                                        onValueChange={(value) => setFormData({ ...formData, c_semester: value! })}
                                        required
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Fall (Semester 1)</SelectItem>
                                            <SelectItem value="2">Spring (Semester 2)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                        </div>

                        {/* Associated Degrees */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-rose-400 rounded-full" />
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Associated Degrees</h3>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="degrees">Select Degrees</FieldLabel>
                                <div className="relative">
                                    <InputGroup>
                                        <InputGroupAddon align="inline-start">
                                            <Search data-icon="inline-start" />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="degrees"
                                            placeholder={formData.degree_ids.length > 0 ? `${formData.degree_ids.length} degree${formData.degree_ids.length !== 1 ? 's' : ''} selected` : "Search degrees..."}
                                            value={degreeSearchQuery}
                                            onFocus={() => { setDegreeDropdownOpen(true); setShowAllDegrees(false); }}
                                            onBlur={() => setTimeout(() => setDegreeDropdownOpen(false), 150)}
                                            onChange={(e) => { setDegreeSearchQuery(e.target.value); setDegreeDropdownOpen(true); setShowAllDegrees(false); }}
                                            readOnly={false}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <ChevronDown className={`transition-transform duration-200 ${degreeDropdownOpen ? 'rotate-180' : ''}`} />
                                        </InputGroupAddon>
                                    </InputGroup>

                                    <AnimatePresence>
                                        {degreeDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute z-50 w-full mt-1.5 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl shadow-zinc-900/15 overflow-hidden"
                                            >
                                                <div className="p-2 flex flex-col gap-1">
                                                    {(() => {
                                                        const filtered = degrees.filter(degree =>
                                                            degree.d_name.toLowerCase().includes(degreeSearchQuery.toLowerCase()) ||
                                                            degree.degree_abbr.toLowerCase().includes(degreeSearchQuery.toLowerCase())
                                                        );
                                                        const isSearching = degreeSearchQuery.length > 0;
                                                        const visible = (isSearching || showAllDegrees) ? filtered : filtered.slice(0, 3);
                                                        const hidden = filtered.length - 3;

                                                        return (
                                                            <>
                                                                {visible.map(degree => (
                                                                    <label
                                                                        key={degree.d_id}
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                                    >
                                                                        <Checkbox
                                                                            checked={formData.degree_ids.includes(degree.d_id.toString())}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    setFormData({ ...formData, degree_ids: [...formData.degree_ids, degree.d_id.toString()] });
                                                                                } else {
                                                                                    setFormData({ ...formData, degree_ids: formData.degree_ids.filter(id => id !== degree.d_id.toString()) });
                                                                                }
                                                                            }}
                                                                        />
                                                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                                            {degree.d_name} <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">({degree.degree_abbr})</span>
                                                                        </span>
                                                                    </label>
                                                                ))}

                                                                {filtered.length === 0 && (
                                                                    <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                                                                        <div className="text-2xl mb-2">○</div>
                                                                        No degrees found
                                                                    </div>
                                                                )}

                                                                {!isSearching && hidden > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={() => setShowAllDegrees(prev => !prev)}
                                                                        className="w-full mt-1 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                                    >
                                                                        {showAllDegrees ? (
                                                                            <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Show less</>
                                                                        ) : (
                                                                            <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Show all {filtered.length} degrees</>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>

                                                {formData.degree_ids.length > 0 && (
                                                    <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-700 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-900/10">
                                                        <Check size={12} />
                                                        {formData.degree_ids.length} degree{formData.degree_ids.length !== 1 ? 's' : ''} selected
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Field>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); }} className="cursor-pointer px-6 py-3 rounded-xl font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">Cancel</button>
                            <button type="submit" className="cursor-pointer px-10 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-500/25">Save Course</button>
                        </div>
                    </form>
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div key={course.c_id} className={`bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group flex flex-col h-full ${!course.is_active ? "opacity-60 grayscale" : ""}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">{course.c_abbr}</span>
                            <button
                                onClick={() => handleToggleActive(course.c_id, course.is_active)}
                                title={course.is_active ? "Deactivate course" : "Activate course"}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                                    course.is_active
                                        ? "bg-gradient-to-r from-red-500 to-rose-400 hover:from-red-600 hover:to-rose-500"
                                        : "bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
                                }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                                        course.is_active ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{course.c_name}</h3>
                        <div className="mt-auto pt-4 flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex justify-between">
                                <span>Weight: {course.c_difficulty_weight}</span>
                                <span className="font-medium">Year {course.c_year}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Semester {course.c_semester}</span>
                            </div>
                            {(course.degrees && course.degrees.length > 0) ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {course.degrees.map((deg) => (
                                        <span key={deg.d_id} className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                            {deg.degree_abbr}
                                        </span>
                                    ))}
                                </div>
                            ) : course.degree ? (
                                <div className="mt-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                                    <span>{course.degree.d_name}</span>
                                </div>
                            ) : null}
                            <CardActions
                                onEdit={() => handleEdit(course)}
                                onDelete={() => handleDelete(course.c_id)}
                            />
                        </div>
                    </div>
                ))}

                <button onClick={() => setShowForm(true)} className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-zinc-400 group flex flex-col gap-2 border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:text-red-500 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-red-500/50">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium text-sm">Add New Course</span>
                </button>
            </div>
            )}

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Course"
                description="Are you sure you want to delete this course? This action cannot be undone."
                onConfirm={confirmDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
