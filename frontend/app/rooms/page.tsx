'use client';

import { Building, Plus, Search, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await fetch('http://localhost:8000/rooms/');
            if (!response.ok) throw new Error('Failed to fetch rooms');
            const data = await response.json();
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingRoom ? `http://localhost:8000/rooms/${editingRoom.room_id}` : 'http://localhost:8000/rooms/';
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
        if (confirm('Are you sure you want to delete this room?')) {
            try {
                const response = await fetch(`http://localhost:8000/rooms/${room_id}`, { method: 'DELETE' });
                if (response.ok) {
                    fetchRooms();
                }
            } catch (error) {
                console.error('Error deleting room:', error);
            }
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.room_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-center"
                >
                    <Building className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400">Loading rooms...</p>
                </motion.div>
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
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 dark:text-zinc-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-500 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setShowForm(true);
                            setEditingRoom(null);
                            setFormData({ room_id: "", capacity: 0 });
                        }}
                        className="hover:cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/30"
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
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex flex-col gap-2"
                                    >
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Room ID</label>
                                        {editingRoom && <p className="text-xs text-zinc-500 dark:text-zinc-500">Room ID cannot be changed.</p>}
                                        <input
                                            type="text"
                                            value={formData.room_id}
                                            onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                                            placeholder="e.g., A101"
                                            required
                                            disabled={!!editingRoom}
                                        />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex flex-col gap-2"
                                    >
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Capacity</label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                                            placeholder="e.g., 50"
                                            required
                                            min="1"
                                        />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex flex-col gap-3 pt-6"
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            className="hover:cursor-pointer flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-500 transition-all duration-200 shadow-lg shadow-red-500/30"
                                        >
                                            {editingRoom ? 'Update' : 'Add'} Room
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingRoom(null);
                                                setFormData({ room_id: "", capacity: 0 });
                                            }}
                                            className="hover:cursor-pointer flex-1 bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 py-3 px-4 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-all duration-200"
                                        >
                                            Cancel
                                        </motion.button>
                                    </motion.div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
