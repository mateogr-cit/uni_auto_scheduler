'use client';

import { User, Plus, Search, Edit, Trash2, CheckCircle, Users, Mail, User as UserIcon, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

interface Student {
    u_id: number;
    s_status: string;
    group_id: number | null;
}

interface StudentGroup {
    group_id: number;
    group_name: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<(User & Student)[]>([]);
    const [groups, setGroups] = useState<StudentGroup[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({ fname: "", lname: "", email: "", username: "", password: "", s_status: "active", group_id: null as number | null });

    useEffect(() => {
        fetchStudents();
        fetchGroups();
    }, []);

    const fetchStudents = async () => {
        try {
            const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`);
            const users: User[] = await usersResponse.json();
            const studentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/students/`);
            const studentsData: Student[] = await studentsResponse.json();
            const studentUsers = users.filter(u => u.u_role === "student").map(u => {
                const student = studentsData.find(s => s.u_id === u.u_id);
                return student ? { ...u, ...student } : null;
            }).filter(Boolean) as (User & Student)[];
            setStudents(studentUsers);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchGroups = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/student-groups/`);
        const data: StudentGroup[] = await response.json();
        setGroups(data);
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            if (field === 'fname' || field === 'lname') {
                const fname = field === 'fname' ? value : prev.fname;
                const lname = field === 'lname' ? value : prev.lname;
                if (fname && lname) {
                    newData.username = `${fname.toLowerCase()}.${lname.toLowerCase()}`;
                    newData.email = `${fname.toLowerCase()}.${lname.toLowerCase()}@cit.edu.al`;
                    newData.password = `${fname.toLowerCase()}.123`;
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData: any = { fname: formData.fname, lname: formData.lname, email: formData.email, username: formData.username, u_role: "student" };
            if (formData.password || !editingStudent) {
                userData.password = formData.password;
            }
            const url = editingStudent ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${editingStudent.u_id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`;
            const method = editingStudent ? "PUT" : "POST";
            const userResponse = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });
            if (!userResponse.ok) {
                throw new Error(`User creation failed: ${userResponse.status} ${userResponse.statusText}`);
            }
            const user = await userResponse.json();
            if (!editingStudent) {
                const studentData: any = { u_id: user.u_id, s_status: formData.s_status };
                if (formData.group_id !== null) {
                    studentData.group_id = formData.group_id;
                }
                const studentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/students/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(studentData),
                });
                if (!studentResponse.ok) {
                    throw new Error(`Student creation failed: ${studentResponse.status} ${studentResponse.statusText}`);
                }
            } else {
                const studentData: any = { u_id: user.u_id, s_status: formData.s_status };
                if (formData.group_id !== null) {
                    studentData.group_id = formData.group_id;
                }
                const studentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/students/${user.u_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(studentData),
                });
                if (!studentResponse.ok) {
                    throw new Error(`Student update failed: ${studentResponse.status} ${studentResponse.statusText}`);
                }
            }
            fetchStudents();
            setShowForm(false);
            setEditingStudent(null);
            setFormData({ fname: "", lname: "", email: "", username: "", password: "", s_status: "active", group_id: null });
        } catch (error:any) {
            console.error("Error:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEdit = (student: User & Student) => {
        setEditingStudent(student);
        setFormData({ fname: student.fname, lname: student.lname, email: student.email, username: student.username, password: "", s_status: student.s_status, group_id: student.group_id });
        setShowForm(true);
    };

    const handleDelete = async (u_id: number) => {
        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${u_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
            }
            await fetchStudents();
        } catch (error: any) {
            console.error('Error deleting student:', error);
            alert(`Error deleting student: ${error.message}`);
        }
    };

    const filteredStudents = students.filter(student =>
        `${student.fname} ${student.lname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Students
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                            Manage student registrations, groups, and academic status.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowForm(true)}
                            className="text-white px-6 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 group bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/25"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            Register Student
                        </motion.button>
                    </div>
                </div>
            </div>

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
                                {editingStudent ? <Edit size={24} /> : <Plus size={24} />}
                            </div>
                            <h2 className="text-2xl font-bold">{editingStudent ? "Update Student Data" : "Add Student"}</h2>
                        </div>
                        <button onClick={() => { setShowForm(false); setEditingStudent(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <Trash2 size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <UserFormFields
                            formData={formData}
                            onChange={handleFormChange}
                            editing={!!editingStudent}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Status</label>
                                <div className="relative group">
                                    <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select
                                        value={formData.s_status}
                                        onChange={(e) => setFormData({ ...formData, s_status: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all appearance-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Student Group</label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <select
                                        value={formData.group_id || ""}
                                        onChange={(e) => setFormData({ ...formData, group_id: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all appearance-none"
                                    >
                                        <option value="">No Group</option>
                                        {groups.map(group => (
                                            <option key={group.group_id} value={group.group_id}>{group.group_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingStudent(null); }}
                                className="px-6 py-3 rounded-2xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                            >
                                {editingStudent ? "Save Changes" : "Add Student"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="relative w-full md:w-[450px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Find a student by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-[1.25rem] border-2 border-transparent bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="p-8">
                    {filteredStudents.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300 rotate-12">
                                <Users size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No students found</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 text-lg">
                                    {searchQuery ? `We couldn't find any results for "${searchQuery}"` : "Your student directory is empty. Start by registering your first student."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStudents.map((student) => {
                                const group = groups.find(g => g.group_id === student.group_id);
                                return (
                                    <motion.div
                                        layout
                                        key={student.u_id}
                                        className="group p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="uppercase w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/25">
                                                {student.fname[0]}{student.lname[0]}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(student)} className="p-2 rounded-xl transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(student.u_id)} className="p-2 rounded-xl transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                {student.fname} {student.lname}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <Mail size={14} />
                                                <span className="truncate">{student.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                                <UserIcon size={14} />
                                                <span>@{student.username}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                    student.s_status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {student.s_status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            {group && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">Group</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                                        <GraduationCap size={14} />
                                                        {group.group_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
