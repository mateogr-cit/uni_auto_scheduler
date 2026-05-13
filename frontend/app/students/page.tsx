'use client';

import { User, Plus, Search, Edit, Trash2, CheckCircle, Users, Mail, Eye, EyeOff, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

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
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ fname: "", lname: "", email: "", username: "", password: "", s_status: "active", group_id: null as number | null });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(false);
    const ITEMS_PER_PAGE = 100;

    useEffect(() => {
        fetchStudents();
        fetchGroups();
    }, [currentPage]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const skip = currentPage * ITEMS_PER_PAGE;
            const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/?skip=${skip}&limit=${ITEMS_PER_PAGE}`);
            const users: User[] = await usersResponse.json();
            const studentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/students/`);
            const studentsData: Student[] = await studentsResponse.json();
            const studentUsers = users.filter(u => u.u_role === "student").map(u => {
                const student = studentsData.find(s => s.u_id === u.u_id);
                return student ? { ...u, ...student } : null;
            }).filter(Boolean) as (User & Student)[];
            setStudents(studentUsers);
            setTotalStudents(studentsData.length);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
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
            if (!editingStudent && (field === 'fname' || field === 'lname')) {
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
            toast.error(`Error: ${error.message}`);
        }
    };

    const handleEdit = (student: User & Student) => {
        setEditingStudent(student);
        setFormData({ fname: student.fname, lname: student.lname, email: student.email, username: student.username, password: "", s_status: student.s_status, group_id: student.group_id });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (u_id: number) => {
        setStudentToDelete(u_id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (studentToDelete === null) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/${studentToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
            }
            await fetchStudents();
        } catch (error: any) {
            console.error('Error deleting student:', error);
            toast.error(`Error deleting student: ${error.message}`);
        } finally {
            setStudentToDelete(null);
        }
    };

    const filteredStudents = students.filter(student =>
        `${student.fname} ${student.lname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Students
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        Manage student registrations, groups, and academic status.
                    </p>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(true)}
                        className="cursor-pointer text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-xl shadow-red-500/25"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        Register Student
                    </motion.button>
                </div>
            </div>

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
                                {editingStudent ? <Edit size={24} /> : <Plus size={24} />}
                            </div>
                            <h2 className="text-xl font-semibold">{editingStudent ? "Update Student Data" : "Add Student"}</h2>
                        </div>
                        <button onClick={() => { setShowForm(false); setEditingStudent(null); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                            <Trash2 size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field>
                                <FieldLabel htmlFor="fname">First Name</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <User data-icon="inline-start" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="fname"
                                        placeholder="John"
                                        value={formData.fname}
                                        onChange={(e) => handleFormChange('fname', e.target.value)}
                                        className="capitalize"
                                        required
                                    />
                                </InputGroup>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="lname">Last Name</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <User data-icon="inline-start" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="lname"
                                        placeholder="Doe"
                                        value={formData.lname}
                                        onChange={(e) => handleFormChange('lname', e.target.value)}
                                        className="capitalize"
                                        required
                                    />
                                </InputGroup>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <Mail data-icon="inline-start" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="email"
                                        type="email"
                                        placeholder="john.doe@university.edu"
                                        value={formData.email}
                                        onChange={(e) => handleFormChange('email', e.target.value)}
                                        required
                                    />
                                </InputGroup>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="username">Username</FieldLabel>
                                <InputGroup>
                                    <InputGroupAddon align="inline-start">
                                        <span className="font-bold">@</span>
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="username"
                                        placeholder="jdoe"
                                        value={formData.username}
                                        onChange={(e) => handleFormChange('username', e.target.value)}
                                        required
                                    />
                                </InputGroup>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="status">Status</FieldLabel>
                                <Select
                                    value={formData.s_status || ""}
                                    onValueChange={(value) => setFormData({ ...formData, s_status: value || "" })}
                                >
                                    <SelectTrigger>
                                        <InputGroup noBorder>
                                            <InputGroupAddon align="inline-start">
                                                <CheckCircle data-icon="inline-start" />
                                            </InputGroupAddon>
                                            <SelectValue placeholder="Select status" />
                                        </InputGroup>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="group">Student Group</FieldLabel>
                                <Select
                                    value={formData.group_id?.toString() || ""}
                                    onValueChange={(value) => setFormData({ ...formData, group_id: value ? parseInt(value) : null })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Group</SelectItem>
                                        {groups.map(group => (
                                            <SelectItem key={group.group_id} value={group.group_id.toString()}>{group.group_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field className="md:col-span-2">
                                <FieldLabel htmlFor="password">
                                    {editingStudent ? "New Password (Optional)" : "Password"}
                                </FieldLabel>
                                <InputGroup>
                                    <InputGroupInput
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => handleFormChange('password', e.target.value)}
                                        required={!editingStudent}
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </Button>
                                    </InputGroupAddon>
                                </InputGroup>
                            </Field>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingStudent(null); }}
                                className="cursor-pointer px-6 py-3 rounded-xl font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/5"
                            >
                                {editingStudent ? "Save Changes" : "Add Student"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                    <div className="relative w-full md:w-[450px]">
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <Search data-icon="inline-start" />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder="Find a student by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                    <div className="flex justify-between items-start mb-6">
                                        <Skeleton className="w-16 h-16 rounded-xl" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-36" />
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                            <Skeleton className="flex-1 h-10 rounded-lg" />
                                            <Skeleton className="flex-1 h-10 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-20 flex flex-col items-center justify-center text-center flex flex-col gap-6">
                            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-300 rotate-12">
                                <Users size={48} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">No students found</h2>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-2">
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
                                        className="group p-6 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500/30 dark:hover:border-red-500/30 transition-all hover:shadow-md relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="uppercase w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 overflow-hidden flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-500/25">
                                                {student.fname[0]}{student.lname[0]}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-bold text-xl text-zinc-900 dark:text-white group-hover:text-red-600 transition-colors">
                                                {student.fname} {student.lname}
                                            </h3>
                                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                                                <Mail size={14} />
                                                <span className="truncate">{student.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                                                <User size={14} />
                                                <span>@{student.username}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-zinc-500 dark:text-zinc-400">Status</span>
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                    student.s_status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}>
                                                    {student.s_status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            {group && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Group</span>
                                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                                                        <GraduationCap size={14} />
                                                        {group.group_name}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                                <button onClick={() => handleEdit(student)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"><Edit size={16} /> Edit</button>
                                                <button onClick={() => handleDelete(student.u_id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"><Trash2 size={16} /> Delete</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalStudents > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                Showing {currentPage * ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalStudents)} of {totalStudents} students
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.ceil(totalStudents / ITEMS_PER_PAGE) }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-all cursor-pointer ${
                                                currentPage === i
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalStudents / ITEMS_PER_PAGE) - 1, p + 1))}
                                    disabled={currentPage >= Math.ceil(totalStudents / ITEMS_PER_PAGE) - 1}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Student"
                description="Are you sure you want to delete this student? This action cannot be undone."
                onConfirm={handleDeleteConfirm}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
