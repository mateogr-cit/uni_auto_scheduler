'use client';

import { Users, Plus, Search, Filter, Edit, Trash2, Mail, User as UserIcon, Calendar, Clock, X, Check, ArrowRight, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserFormFields from "../../components/UserFormFields";

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
    const [professors, setProfessors] = useState<(User & { availability?: ProfessorAvailability[] })[]>([]);
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

    useEffect(() => {
        fetchProfessors();
    }, []);

    const fetchProfessors = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`);
            const data: User[] = await response.json();
            const professorsData = data.filter(u => u.u_role === "professor");
            
            // Fetch availability for each professor to show in tooltips
            const professorsWithAvail = await Promise.all(professorsData.map(async (prof) => {
                const availResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professor-availability?u_id=${prof.u_id}`);
                const availData = await availResp.json();
                return { ...prof, availability: availData };
            }));
            
            setProfessors(professorsWithAvail);
        } catch (error) {
            console.error("Failed to fetch professors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const userData: any = { fname: formData.fname, lname: formData.lname, email: formData.email, username: formData.username, u_role: "professor" };
        if (formData.password || !editingProfessor) {
            userData.password = formData.password;
        }

        const url = editingProfessor ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${editingProfessor.u_id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`;
        const method = editingProfessor ? "PUT" : "POST";
        
        try {
            const userResponse = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const user = await userResponse.json();
            const u_id = user.u_id;

            // Batch update availability
            const availabilityList = Object.values(availabilities).map(a => ({
                ...a,
                u_id,
                start_time: a.start_time.length === 5 ? `${a.start_time}:00` : a.start_time,
                end_time: a.end_time.length === 5 ? `${a.end_time}:00` : a.end_time
            }));

            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professor-availability/batch/?u_id=${u_id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(availabilityList),
            });

            fetchProfessors();
            resetForm();
        } catch (error) {
            console.error("Error saving professor:", error);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingProfessor(null);
        setFormData({ fname: "", lname: "", email: "", username: "", password: "" });
        setAvailabilities(DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: { u_id: 0, day_of_week: day, start_time: "08:00", end_time: "16:00", is_available: true }
        }), {}));
    };

    const handleEdit = async (prof: User) => {
        setEditingProfessor(prof);
        setFormData({ fname: prof.fname, lname: prof.lname, email: prof.email, username: prof.username, password: "" });

        try {
            const availResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/professor-availability?u_id=${prof.u_id}`);
            const availData: ProfessorAvailability[] = await availResp.json();
            
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
        } catch (error) {
            console.error("Error fetching availability:", error);
        }
    };

    const handleDelete = async (id: number) => {
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
        <div className="space-y-8 pb-12">
            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Professors
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                            Manage faculty members and their weekly availability schedules.
                        </p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(true)} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 group"
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
                        className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    {editingProfessor ? <Settings size={24} /> : <Plus size={24} />}
                                </div>
                                <h2 className="text-2xl font-bold">{editingProfessor ? "Update Faculty Profile" : "Create Faculty Profile"}</h2>
                            </div>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <UserFormFields
                                formData={formData}
                                onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                                editing={!!editingProfessor}
                            />

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={20} className="text-indigo-600" />
                                    <h3 className="text-lg font-bold">Weekly Availability</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {DAYS.map((day) => (
                                        <div key={day} className={`p-4 rounded-2xl border-2 transition-all ${availabilities[day].is_available ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-bold text-sm uppercase tracking-wider">{day.substring(0, 3)}</span>
                                                <input 
                                                    type="checkbox"
                                                    checked={availabilities[day].is_available}
                                                    onChange={(e) => setAvailabilities({
                                                        ...availabilities,
                                                        [day]: { ...availabilities[day], is_available: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <Clock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="time"
                                                        value={availabilities[day].start_time}
                                                        disabled={!availabilities[day].is_available}
                                                        onChange={(e) => setAvailabilities({
                                                            ...availabilities,
                                                            [day]: { ...availabilities[day], start_time: e.target.value }
                                                        })}
                                                        className="w-full pl-7 pr-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Clock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="time"
                                                        value={availabilities[day].end_time}
                                                        disabled={!availabilities[day].is_available}
                                                        onChange={(e) => setAvailabilities({
                                                            ...availabilities,
                                                            [day]: { ...availabilities[day], end_time: e.target.value }
                                                        })}
                                                        className="w-full pl-7 pr-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
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
                                    className="px-6 py-3 rounded-2xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-10 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                                >
                                    {editingProfessor ? "Save Changes" : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative w-full md:w-[450px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Find a professor by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-[1.25rem] border-2 border-transparent bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300 font-semibold shadow-sm">
                            <Filter size={18} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-slate-500">Loading faculty directory...</p>
                        </div>
                    ) : filteredProfessors.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300 rotate-12">
                                <Users size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No professors found</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 text-lg">
                                    {searchQuery ? `We couldn't find any results for "${searchQuery}"` : "Your faculty directory is empty. Start by adding your first professor."}
                                </p>
                            </div>
                            {!searchQuery && (
                                <button onClick={() => setShowForm(true)} className="text-indigo-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
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
                                    className="group p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="uppercase w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-slate-400 font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            {prof.fname[0]}{prof.lname[0]}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(prof)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 rounded-xl transition-colors">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(prof.u_id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                            {prof.fname} {prof.lname}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                            <Mail size={14} />
                                            <span className="truncate">{prof.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                            <UserIcon size={14} />
                                            <span>@{prof.username}</span>
                                        </div>
                                    </div>

                                    {/* Quick Availability Preview with Tooltips */}
                                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-1.5">
                                        {DAYS.map(day => {
                                            const dayAvail = prof.availability?.find(a => a.day_of_week === day);
                                            const isAvailable = dayAvail?.is_available ?? false;
                                            
                                            return (
                                                <div 
                                                    key={day} 
                                                    className={`group/day relative w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all border
                                                        ${isAvailable 
                                                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20' 
                                                            : 'bg-slate-50 dark:bg-slate-800 dark:text-slate-500 text-slate-400 border-slate-100 dark:border-slate-800'
                                                        }`}
                                                >
                                                    {day.substring(0, 1)}
                                                    
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] rounded-lg opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all whitespace-nowrap z-10 shadow-xl pointer-events-none">
                                                        <div className="font-bold border-b border-white/10 dark:border-slate-200 mb-1 pb-1">{day}</div>
                                                        {isAvailable ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={10} />
                                                                <span>{dayAvail?.start_time.substring(0, 5)} - {dayAvail?.end_time.substring(0, 5)}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-red-400 dark:text-red-500 font-medium">Unavailable</div>
                                                        )}
                                                        {/* Tooltip Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 dark:border-t-white" />
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
