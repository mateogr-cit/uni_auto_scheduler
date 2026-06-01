'use client';

import { Building, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/ui/search-bar";
import { API_BASE } from "@/lib/constants";

interface Room {
    room_id: string;
    capacity: number;
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({ room_id: "", capacity: 0 });
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

    const fetchRooms = async () => {
        try {
            const response = await fetch(`${API_BASE}/rooms/`);
            if (!response.ok) throw new Error('Failed to fetch rooms');
            const data = await response.json();
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingRoom ? `${API_BASE}/rooms/${editingRoom.room_id}` : `${API_BASE}/rooms/`;
            const method = editingRoom ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                fetchRooms();
                setShowForm(false);
                setEditingRoom(null);
                setFormData({ room_id: "", capacity: 0 });
            }
        } catch (error) {
            console.error('Error saving room:', error);
        }
    };

    const handleEdit = (room: Room) => {
        setEditingRoom(room);
        setFormData({ room_id: room.room_id, capacity: room.capacity });
        setShowForm(true);
    };

    const handleDelete = async (room_id: string) => {
        setRoomToDelete(room_id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!roomToDelete) return;
        try {
            const response = await fetch(`${API_BASE}/rooms/${roomToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                fetchRooms();
            }
        } catch (error) {
            console.error('Error deleting room:', error);
        } finally {
            setDeleteDialogOpen(false);
            setRoomToDelete(null);
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.room_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="w-8 h-8 rounded-lg" />
                            <Skeleton className="h-9 w-64" />
                        </div>
                        <Skeleton className="h-5 w-80" />
                    </div>

                    {/* Search and Add Skeleton */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                        <Skeleton className="h-12 w-32 rounded-lg" />
                    </div>

                    {/* Rooms Table Skeleton */}
                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-100 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-600">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Classroom</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Capacity</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Skeleton className="h-5 w-32" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Skeleton className="h-5 w-24" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <Skeleton className="w-8 h-8 rounded-md" />
                                                    <Skeleton className="w-8 h-8 rounded-md" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Building className="w-8 h-8 text-red-500 dark:text-red-400" />
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Rooms Management</h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">Manage classroom capacities and availability</p>
                </motion.div>

                {/* Search and Add */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col sm:flex-row gap-4 mb-6"
                >
                    <SearchBar
                        placeholder="Search rooms..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        className="flex-1"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setShowForm(true);
                            setEditingRoom(null);
                            setFormData({ room_id: "", capacity: 0 });
                        }}
                        className="hover:cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400 shadow-lg shadow-red-500/30"
                    >
                        <Plus className="w-5 h-5" />
                        Add Room
                    </motion.button>
                </motion.div>

                {/* Rooms Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-100 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-600">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Classroom</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Capacity</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                                <AnimatePresence>
                                    {filteredRooms.map((room, index) => (
                                        <motion.tr
                                            key={room.room_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">{room.room_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-300">{room.capacity} people</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEdit(room)}
                                                        className="hover:cursor-pointer p-2 rounded-md transition-all duration-200 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-zinc-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(room.room_id)}
                                                        className="hover:cursor-pointer p-2 rounded-md transition-all duration-200 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-zinc-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    {filteredRooms.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <Building className="w-12 h-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" />
                            <p className="text-zinc-500 dark:text-zinc-500">No rooms found</p>
                        </motion.div>
                    )}
                </motion.div>

                {/* Add/Edit Form Modal */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md border border-zinc-200 dark:border-zinc-700 shadow-2xl"
                            >
                                <h2 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-white">{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
                                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor="room_id">Room ID</FieldLabel>
                                            {editingRoom && <p className="text-xs text-zinc-500 dark:text-zinc-500">Room ID cannot be changed.</p>}
                                            <InputGroup>
                                                <InputGroupAddon align="inline-start">
                                                    <Building data-icon="inline-start" />
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    id="room_id"
                                                    value={formData.room_id}
                                                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                                                    placeholder="e.g., A101"
                                                    required
                                                    disabled={!!editingRoom}
                                                />
                                            </InputGroup>
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                                            <InputGroup>
                                                <InputGroupAddon align="inline-start">
                                                    <span className="font-bold">#</span>
                                                </InputGroupAddon>
                                                <InputGroupInput
                                                    id="capacity"
                                                    type="number"
                                                    value={formData.capacity}
                                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                                    placeholder="e.g., 50"
                                                    required
                                                    min="1"
                                                />
                                            </InputGroup>
                                        </Field>
                                    </FieldGroup>
                                    <div className="flex flex-col gap-3 pt-6">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                        >
                                            {editingRoom ? 'Update' : 'Add'} Room
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingRoom(null);
                                                setFormData({ room_id: "", capacity: 0 });
                                            }}
                                            className="w-full"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Room"
                description="Are you sure you want to delete this room? This action cannot be undone."
                onConfirm={confirmDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
