'use client';

import { User, Plus, Search, Mail, Edit, Trash2, CheckCircle, Users } from "lucide-react";
import { useState, useEffect } from "react";
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
    const [formData, setFormData] = useState({ fname: "", lname: "", email: "", username: "", password: "", s_status: "active", group_id: null as number | null });

    useEffect(() => {
        fetchStudents();
        fetchGroups();
    }, []);

    const fetchStudents = async () => {
        const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`);
        const users: User[] = await usersResponse.json();
        const studentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/students/`);
        const studentsData: Student[] = await studentsResponse.json();
        const studentUsers = users.filter(u => u.u_role === "student").map(u => {
            const student = studentsData.find(s => s.u_id === u.u_id);
            return student ? { ...u, ...student } : null;
        }).filter(Boolean) as (User & Student)[];
        setStudents(studentUsers);
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
                // Create student entry
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
                // Update student
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

    const handleDelete = async (id: number) => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/students/${id}`, { method: "DELETE" });
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${id}`, { method: "DELETE" });
        fetchStudents();
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Students</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track student enrollments, attendance, and academic progress.</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25 flex items-center gap-2">
                    <Plus size={20} />
                    Register Student
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">{editingStudent ? "Edit Student" : "Add Student"}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <button className="cursor-pointer flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors font-medium">
                        <Mail size={18} />
                        <span>Broadcast Message</span>
                    </button>
                </div>

                <div className="p-4">
                    {students.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <User className="text-slate-400" size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No students registered</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Register students to start tracking.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {students.map((student) => {
                                const group = groups.find(g => g.group_id === student.group_id);
                                return (
                                <div key={student.u_id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-semibold">{student.fname} {student.lname}</h3>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                        <p className="text-sm text-gray-500">Status: {student.s_status}</p>
                                        {group && <p className="text-sm text-gray-500">Group: {group.group_name}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(student)} className="text-indigo-500"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(student.u_id)} className="text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
