'use client';

import { BookOpen, Plus, Grid, List as ListIcon, Edit, Trash2, Tag, Scale } from "lucide-react";
import { useState, useEffect } from "react";

interface Course {
    c_id: number;
    c_name: string;
    c_abbr: string;
    c_difficulty_weight: number;
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState({ c_name: "", c_abbr: "", c_difficulty_weight: "" });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/courses/`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            setCourses(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch courses");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingCourse ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/courses/${editingCourse.c_id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/courses/`;
        const method = editingCourse ? "PUT" : "POST";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, c_difficulty_weight: parseFloat(formData.c_difficulty_weight) }),
        });
        fetchCourses();
        setShowForm(false);
        setEditingCourse(null);
        setFormData({ c_name: "", c_abbr: "", c_difficulty_weight: "" });
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setFormData({ c_name: course.c_name, c_abbr: course.c_abbr, c_difficulty_weight: course.c_difficulty_weight.toString() });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/courses/${id}`, { method: "DELETE" });
        fetchCourses();
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Courses</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">See syllabus, credits, and prerequisites for each course.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
                        <button className="cursor-pointer p-2 bg-white dark:bg-slate-700 shadow-sm rounded-lg text-indigo-600"><Grid size={18} /></button>
                        <button className="cursor-pointer p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><ListIcon size={18} /></button>
                    </div>
                    <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                        <Plus size={20} />
                        Add Course
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-5 py-4 rounded-2xl text-sm font-medium">
                    ⚠️ {error}
                </div>
            )}

            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">{editingCourse ? "Edit Course" : "Add Course"}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Course Name</label>
                            <div className="relative group">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Course Name"
                                    value={formData.c_name}
                                    onChange={(e) => setFormData({ ...formData, c_name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Abbreviation</label>
                            <div className="relative group">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Abbreviation"
                                    value={formData.c_abbr}
                                    onChange={(e) => setFormData({ ...formData, c_abbr: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Difficulty Weight</label>
                            <div className="relative group">
                                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="number"
                                    placeholder="Difficulty Weight"
                                    value={formData.c_difficulty_weight}
                                    onChange={(e) => setFormData({ ...formData, c_difficulty_weight: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div className="col-span-full flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); }} className="px-6 py-3 rounded-2xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                            <button type="submit" className="px-10 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5">Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div key={course.c_id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full">{course.c_abbr}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(course)} className="bg-gray-500 text-white px-4 py-2 rounded"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(course.c_id)} className="bg-indigo-600 text-white px-4 py-2 rounded"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{course.c_name}</h3>
                        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                            <span>Weight: {course.c_difficulty_weight}</span>
                        </div>
                    </div>
                ))}

                <button onClick={() => setShowForm(true)} className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500/50 hover:text-indigo-500 transition-all space-y-2 group">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-indigo-500/50">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium text-sm">Add New Course</span>
                </button>
            </div>
        </div>
    );
}
