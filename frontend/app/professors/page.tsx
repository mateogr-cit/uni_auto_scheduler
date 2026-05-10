'use client';

import { Users, Plus, Search, Filter, Edit, Trash2, Mail, User as UserIcon, Calendar, Clock, X, Check, ArrowRight, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserFormFields from "../../components/UserFormFields";
import { toast } from "sonner";

interface User {
    u_id: number;
    fname: string;
    lname: string;
    email: string;
    username: string;
    u_role: string;
    createdAt: string;
    updatedAt: string;
}

interface Course {
    c_id: number;
    c_name: string;
    c_abbr: string;
    c_difficulty_weight: number;
}

interface ProfessorAvailability {
    id?: number;
    u_id: number;
    day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
    start_time: string;
    end_time: string;
    is_available: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export default function ProfessorsPage() {
    const [professors, setProfessors] = useState<(User & { availability?: ProfessorAvailability[]; courses?: Course[] })[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [courseSearchQuery, setCourseSearchQuery] = useState("");
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
    const [showAllCourses, setShowAllCourses] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProfessor, setEditingProfessor] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Multi-day availability state
    const [availabilities, setAvailabilities] = useState<Record<string, ProfessorAvailability>>(
        DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: { u_id: 0, day_of_week: day, start_time: "08:00", end_time: "16:00", is_available: true }
        }), {})
    );
    
    const [formData, setFormData] = useState({ fname: "", lname: "", email: "", username: "", password: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'database' | 'dummy'>('database');

    useEffect(() => {
        fetchCourses();
        fetchProfessors();
    }, []);

   const fetchCourses = async () => {
    try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/courses/`;
        console.log("Fetching from:", url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            setError(`Failed to fetch courses: ${response.status}`);
            return;
        }

        const data: Course[] = await response.json();
        console.log("Courses fetched:", data);
        setCourses(data);
        setError(null);
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        setError("Failed to connect to server. Please check if the backend is running.");
    }
};
    const fetchProfessors = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }
            const data: User[] = await response.json();
            const professorsData = data.filter(u => u.u_role === "professor");

            // Fetch availability and courses for each professor
            const professorsWithDetails = await Promise.all(professorsData.map(async (prof) => {
                try {
                    const availResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professor-availability?u_id=${prof.u_id}`);
                    const availData = availResp.ok ? await availResp.json() : [];

                    const courseResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professors/${prof.u_id}`);
                    const profData = courseResp.ok ? await courseResp.json() : { courses: [] };

                    return { ...prof, availability: availData, courses: profData.courses ?? [] };
                } catch (err) {
                    console.error(`Error fetching details for professor ${prof.u_id}:`, err);
                    return { ...prof, availability: [], courses: [] };
                }
            }));

            setProfessors(professorsWithDetails);
            setError(null);
        } catch (error) {
            console.error("Failed to fetch professors:", error);
            setError("Failed to connect to server. Please check if the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            if (!editingProfessor && (field === 'fname' || field === 'lname')) {
                const fname = field === 'fname' ? value : prev.fname;
                const lname = field === 'lname' ? value : prev.lname;
                if (fname && lname) {
                    newData.username = `${fname.toLowerCase().trim()}.${lname.toLowerCase().trim()}`;
                    newData.email = `${fname.toLowerCase().trim()}.${lname.toLowerCase().trim()}@cit.edu.al`;
                    newData.password = `${fname.toLowerCase().trim()}.123`;
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (dataSource === 'dummy') {
            toast.error('Cannot modify professors while using dummy data. Switch to database mode.');
            return;
        }
        const userData: any = { fname: formData.fname, lname: formData.lname, email: formData.email, username: formData.username, u_role: "professor" };
        if (formData.password || !editingProfessor) {
            userData.password = formData.password;
        }

        const userUrl = editingProfessor ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${editingProfessor.u_id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`;
        const userMethod = editingProfessor ? "PUT" : "POST";
        
        try {
            const userResponse = await fetch(userUrl, {
                method: userMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (!userResponse.ok) {
                const errorData = await userResponse.json();
                throw new Error(`User ${userMethod} failed: ${errorData.detail || userResponse.statusText}`);
            }

            const user = await userResponse.json();
            const u_id = user.u_id;

            const professorPayload = { u_id, course_ids: selectedCourseIds };
            const professorUrl = editingProfessor ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professors/${u_id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professors/`;
            const professorMethod = editingProfessor ? "PUT" : "POST";

            const profResponse = await fetch(professorUrl, {
                method: professorMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(professorPayload),
            });

            if (!profResponse.ok) {
                const errorData = await profResponse.json();
                throw new Error(`Professor ${professorMethod} failed: ${errorData.detail || profResponse.statusText}`);
            }

            // Batch update availability
            const availabilityList = Object.values(availabilities).map(a => ({
                ...a,
                u_id,
                start_time: a.start_time.length === 5 ? `${a.start_time}:00` : a.start_time,
                end_time: a.end_time.length === 5 ? `${a.end_time}:00` : a.end_time
            }));

            const availResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professor-availability/batch/?u_id=${u_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(availabilityList),
            });

            if (!availResponse.ok) {
                console.warn("Availability update warning (non-fatal):", availResponse.statusText);
            }

            fetchProfessors();
            resetForm();
        } catch (error) {
            console.error("Error saving professor:", error);
            toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleCourseSelection = (selectedValues: string[]) => {
        setSelectedCourseIds(selectedValues.map((value) => Number(value)));
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingProfessor(null);
        setFormData({ fname: "", lname: "", email: "", username: "", password: "" });
        setSelectedCourseIds([]);
        setCourseSearchQuery("");
        setAvailabilities(DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: { u_id: 0, day_of_week: day, start_time: "08:00", end_time: "16:00", is_available: true }
        }), {}));
    };

    const handleEdit = async (prof: User) => {
        if (dataSource === 'dummy') {
            toast.error('Cannot edit professors while using dummy data. Switch to database mode.');
            return;
        }
        setEditingProfessor(prof);
        setFormData({ fname: prof.fname, lname: prof.lname, email: prof.email, username: prof.username, password: "" });

        try {
            const availResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professor-availability?u_id=${prof.u_id}`);
            const availData: ProfessorAvailability[] = await availResp.json();

            const profResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professors/${prof.u_id}`);
            const profData = await profResp.json();
            setSelectedCourseIds(profData.courses?.map((course: Course) => course.c_id) || []);

            const newAvail: Record<string, ProfessorAvailability> = DAYS.reduce((acc, day) => ({
                ...acc,
                [day]: { u_id: prof.u_id, day_of_week: day, start_time: "08:00", end_time: "16:00", is_available: true }
            }), {});

            availData.forEach(a => {
                newAvail[a.day_of_week] = {
                    ...a,
                    start_time: a.start_time.substring(0, 5),
                    end_time: a.end_time.substring(0, 5)
                };
            });

            setAvailabilities(newAvail);
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Error fetching availability:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (dataSource === 'dummy') {
            toast.error('Cannot delete professors while using dummy data. Switch to database mode.');
            return;
        }
        if (!confirm("Are you sure you want to delete this professor?")) return;
        
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${id}`, { method: "DELETE" });
            fetchProfessors();
        } catch (error) {
            console.error("Error deleting professor:", error);
        }
    };

    const filteredProfessors = professors.filter(p => 
        (p.fname + " " + p.lname).toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Professors
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        Manage faculty members and their weekly availability schedules.
                    </p>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(true)}
                        disabled={dataSource === 'dummy'}
                        className={`cursor-pointer text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group ${dataSource === 'dummy' ? 'bg-zinc-400 cursor-not-allowed opacity-50' : 'bg-red-600 hover:bg-red-500 shadow-xl shadow-red-500/25'}`}
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Add New Professor
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                                    {editingProfessor ? <Settings size={24} /> : <Plus size={24} />}
                                </div>
                                <h2 className="text-xl font-semibold">{editingProfessor ? "Update Professor Data" : "Add Professor"}</h2>
                            </div>
                            <button onClick={resetForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {/* User Fields and Courses in Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-3">
                                    <UserFormFields
                                        formData={formData}
                                        onChange={handleFormChange}
                                        editing={!!editingProfessor}
                                    />
                                    <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Courses Taught</label>

                                    {/* Dropdown Trigger – Search Input */}
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 pointer-events-none" size={16} />
                                            <input
                                                type="text"
                                                placeholder={selectedCourseIds.length > 0 ? `${selectedCourseIds.length} course${selectedCourseIds.length !== 1 ? 's' : ''} selected – search to refine` : "Click to select courses..."}
                                                value={courseSearchQuery}
                                                onFocus={() => { setCourseDropdownOpen(true); setShowAllCourses(false); }}
                                                onBlur={() => setTimeout(() => setCourseDropdownOpen(false), 150)}
                                                onChange={(e) => { setCourseSearchQuery(e.target.value); setCourseDropdownOpen(true); setShowAllCourses(false); }}
                                                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-800 border-2 border-zinc-500 dark:border-zinc-700 rounded-xl outline-none! focus:border-red-500 focus:ring-1 focus:ring-red-500/30 text-sm transition-all cursor-pointer placeholder-zinc-500"
                                                readOnly={false}
                                            />
                                            {/* Chevron indicator */}
                                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-transform duration-200 pointer-events-none ${courseDropdownOpen ? 'rotate-180' : ''}`}>
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                        </div>

                                        {/* Floating Dropdown */}
                                        <AnimatePresence>
                                            {courseDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute z-50 w-full mt-1.5 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl shadow-zinc-900/15 overflow-hidden"
                                                >
                                                    <div className="p-2 flex flex-col gap-1">
                                                        {(() => {
                                                            const filtered = courses.filter(course =>
                                                                course.c_name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                                                                course.c_abbr.toLowerCase().includes(courseSearchQuery.toLowerCase())
                                                            );
                                                            const isSearching = courseSearchQuery.length > 0;
                                                            const visible = (isSearching || showAllCourses) ? filtered : filtered.slice(0, 3);
                                                            const hidden = filtered.length - 3;

                                                            return (
                                                                <>
                                                                    {visible.map(course => (
                                                                        <label
                                                                            key={course.c_id}
                                                                            onMouseDown={(e) => e.preventDefault()}
                                                                            className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                                        >
                                                                            <div className="relative flex items-center justify-center flex-shrink-0">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedCourseIds.includes(course.c_id)}
                                                                                    onChange={(e) => {
                                                                                        if (e.target.checked) {
                                                                                            handleCourseSelection([...selectedCourseIds, course.c_id].map(String));
                                                                                        } else {
                                                                                            handleCourseSelection(selectedCourseIds.filter(id => id !== course.c_id).map(String));
                                                                                        }
                                                                                    }}
                                                                                    className="w-5 h-5 rounded-md accent-red-600 cursor-pointer appearance-none bg-white dark:bg-zinc-600 border-2 border-zinc-300 dark:border-zinc-500 checked:bg-red-600 checked:border-red-600 transition-all duration-200"
                                                                                />
                                                                                {selectedCourseIds.includes(course.c_id) && (
                                                                                    <Check size={14} className="absolute text-white pointer-events-none" />
                                                                                )}
                                                                            </div>
                                                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                                                {course.c_name} <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">({course.c_abbr})</span>
                                                                            </span>
                                                                        </label>
                                                                    ))}

                                                                    {filtered.length === 0 && (
                                                                        <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                                                                            <div className="text-2xl mb-2">○</div>
                                                                            No courses found
                                                                        </div>
                                                                    )}

                                                                    {!isSearching && hidden > 0 && (
                                                                        <button
                                                                            type="button"
                                                                            onMouseDown={(e) => e.preventDefault()}
                                                                            onClick={() => setShowAllCourses(prev => !prev)}
                                                                            className="w-full mt-1 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                                        >
                                                                            {showAllCourses ? (
                                                                                <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Show less</>
                                                                            ) : (
                                                                                <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Show all {filtered.length} courses</>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>

                                                    {selectedCourseIds.length > 0 && (
                                                        <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-700 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-900/10">
                                                            <Check size={12} />
                                                            {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                </div>
                                
                                {/* Courses Section - Right Side */}
                                
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={20} className="text-red-600" />
                                    <h3 className="text-lg font-bold">Weekly Availability</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {DAYS.map((day) => (
                                        <div key={day} className={`p-4 rounded-2xl border-2 transition-all ${availabilities[day].is_available ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50' : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-bold text-sm uppercase tracking-wider">{day.substring(0, 3)}</span>
                                                <input 
                                                    type="checkbox"
                                                    checked={availabilities[day].is_available}
                                                    onChange={(e) => setAvailabilities({
                                                        ...availabilities,
                                                        [day]: { ...availabilities[day], is_available: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <div className="relative">
                                                    <Clock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                    <input 
                                                        type="time"
                                                        value={availabilities[day].start_time}
                                                        disabled={!availabilities[day].is_available}
                                                        onChange={(e) => setAvailabilities({
                                                            ...availabilities,
                                                            [day]: { ...availabilities[day], start_time: e.target.value }
                                                        })}
                                                        className="w-full pl-7 pr-2 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none! focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Clock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                    <input 
                                                        type="time"
                                                        value={availabilities[day].end_time}
                                                        disabled={!availabilities[day].is_available}
                                                        onChange={(e) => setAvailabilities({
                                                            ...availabilities,
                                                            [day]: { ...availabilities[day], end_time: e.target.value }
                                                        })}
                                                        className="w-full pl-7 pr-2 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none! focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 rounded-xl font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/5"
                                >
                                    {editingProfessor ? "Save Changes" : "Add Professor"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <span className="font-semibold">Error:</span>
                                <span>{error}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setError(null);
                                    fetchCourses();
                                    fetchProfessors();
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="relative w-full md:w-[450px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={20} />
                        <input
                            type="text"
                            placeholder="Find a professor by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-zinc-500 dark:border-transparent bg-white dark:bg-zinc-900 shadow-sm focus:border-red-500 focus:outline-none! transition-all placeholder-zinc-500"
                        />
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-zinc-500">Loading faculty directory...</p>
                        </div>
                    ) : filteredProfessors.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center flex flex-col gap-6">
                            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-300 rotate-12">
                                <Users size={48} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">No professors found</h2>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-2">
                                    {searchQuery ? `We couldn't find any results for "${searchQuery}"` : "Your faculty directory is empty. Start by adding your first professor."}
                                </p>
                            </div>
                            {!searchQuery && (
                                <button onClick={() => setShowForm(true)} className="text-red-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                    Add your first professor <ArrowRight size={20} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProfessors.map((prof) => (
                                <motion.div
                                    layout
                                    key={prof.u_id}
                                    className="group p-6 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500/30 dark:hover:border-red-500/30 transition-all hover:shadow-md relative overflow-hidden cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="uppercase w-16 h-16 rounded-xl  bg-gradient-to-br from-red-500 to-rose-400  overflow-hidden flex items-center justify-center text-white font-black text-2xl group-hover:bg-red-600 transition-all duration-500">
                                            {prof.fname[0]}{prof.lname[0]}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(prof)} disabled={dataSource === 'dummy'} className={`p-2 rounded-xl transition-colors ${dataSource === 'dummy' ? "text-zinc-300 cursor-not-allowed opacity-50" : "hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 cursor-pointer"}`}>
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(prof.u_id)} disabled={dataSource === 'dummy'} className={`p-2 rounded-xl transition-colors ${dataSource === 'dummy' ? "text-zinc-300 cursor-not-allowed opacity-50" : "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"}`}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-bold text-xl text-zinc-900 dark:text-white group-hover:text-red-600 transition-colors">
                                            {prof.fname} {prof.lname}
                                        </h3>
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                                            <Mail size={14} />
                                            <span className="truncate">{prof.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                                            <UserIcon size={14} />
                                            <span>@{prof.username}</span>
                                        </div>
                                        <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                                            <span className="font-semibold">Courses:</span>{' '}
                                            {prof.courses && prof.courses.length > 0
                                                ? prof.courses.map((course) => course.c_name).join(', ')
                                                : 'None selected'}
                                        </div>
                                    </div>

                                    {/* Quick Availability Preview with Tooltips */}
                                    <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 flex flex-wrap gap-1.5">
                                        {DAYS.map(day => {
                                            const dayAvail = prof.availability?.find(a => a.day_of_week === day);
                                            const isAvailable = dayAvail?.is_available ?? false;
                                            
                                            return (
                                                <div 
                                                    key={day} 
                                                    className={`group/day relative w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all border
                                                        ${isAvailable 
                                                            ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20' 
                                                            : 'bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-500 text-zinc-400 border-zinc-100 dark:border-zinc-800'
                                                        }`}
                                                >
                                                    {day.substring(0, 1)}
                                                    
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] rounded-lg opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all whitespace-nowrap z-10 shadow-xl pointer-events-none">
                                                        <div className="font-bold border-b border-white/10 dark:border-zinc-200 mb-1 pb-1">{day}</div>
                                                        {isAvailable ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={10} />
                                                                <span>{dayAvail?.start_time.substring(0, 5)} - {dayAvail?.end_time.substring(0, 5)}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-red-400 dark:text-red-500 font-medium">Unavailable</div>
                                                        )}
                                                        {/* Tooltip Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900 dark:border-t-white" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
