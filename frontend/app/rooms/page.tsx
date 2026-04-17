'use client';

import { Building, Plus, Search, Edit, Trash2, Database } from "lucide-react";
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
    const [useDummyData, setUseDummyData] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, [useDummyData]);

    const fetchRooms = async () => {
        try {
            let data;
            if (useDummyData) {
                const response = await fetch('/rooms-dummy.json');
                if (!response.ok) throw new Error('Failed to load dummy data');
                data = await response.json();
            } else {
                const response = await fetch('http://localhost:8000/rooms/');
                if (!response.ok) throw new Error('Failed to fetch rooms');
                data = await response.json();
            }
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (useDummyData) {
            alert('Cannot modify rooms while using dummy data. Switch to database mode.');
            return;
        }
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
        if (useDummyData) {
            alert('Cannot edit rooms while using dummy data. Switch to database mode.');
            return;
        }
        setEditingRoom(room);
        setFormData({ room_id: room.room_id, capacity: room.capacity });
        setShowForm(true);
    };

    const handleDelete = async (room_id: string) => {
        if (useDummyData) {
            alert('Cannot delete rooms while using dummy data. Switch to database mode.');
            return;
        }
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
            <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-center"
                >
                    <Building className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <p className="text-slate-400">Loading rooms...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Building className="w-8 h-8 text-indigo-400" />
                        <h1 className="text-3xl font-bold text-white">Rooms Management</h1>
                    </div>
                    <p className="text-slate-400">Manage classroom capacities and availability</p>
                </motion.div>

                {/* Search and Add */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col sm:flex-row gap-4 mb-6"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-3 rounded-lg border border-slate-700">
                        <Database size={18} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-400">{useDummyData ? "Dummy" : "Live"}</span>
                        <button
                            onClick={() => setUseDummyData(!useDummyData)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                useDummyData ? "bg-indigo-600" : "bg-slate-600"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    useDummyData ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (useDummyData) {
                                alert('Cannot modify rooms while using dummy data. Switch to database mode.');
                                return;
                            }
                            setShowForm(true);
                            setEditingRoom(null);
                            setFormData({ room_id: "", capacity: 0 });
                        }}
                        disabled={useDummyData}
                        className={`hover:cursor-pointer flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${useDummyData ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30'}`}
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
                    className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-700/50 border-b border-slate-600">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Classroom</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Capacity</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                <AnimatePresence>
                                    {filteredRooms.map((room, index) => (
                                        <motion.tr
                                            key={room.room_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="hover:bg-slate-700/50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{room.room_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{room.capacity} people</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: useDummyData ? 1 : 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleEdit(room)}
                                                        disabled={useDummyData}
                                                        className={`hover:cursor-pointer p-2 rounded-md transition-all duration-200 ${useDummyData ? "text-slate-500 opacity-50 cursor-not-allowed" : "text-indigo-400 hover:text-indigo-300 hover:bg-slate-600"}`}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: useDummyData ? 1 : 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(room.room_id)}
                                                        disabled={useDummyData}
                                                        className={`hover:cursor-pointer p-2 rounded-md transition-all duration-200 ${useDummyData ? "text-slate-500 opacity-50 cursor-not-allowed" : "text-red-400 hover:text-red-300 hover:bg-slate-600"}`}
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
                            <Building className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-500">No rooms found</p>
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
                                className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700 shadow-2xl"
                            >
                                <h2 className="text-xl font-bold mb-6 text-white">{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Room ID</label>
                                        {editingRoom && <p className="text-xs text-slate-500 mb-1">Room ID cannot be changed.</p>}
                                        <input
                                            type="text"
                                            value={formData.room_id}
                                            onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="e.g., A101"
                                            required
                                            disabled={!!editingRoom}
                                        />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Capacity</label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="e.g., 50"
                                            required
                                            min="1"
                                        />
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex gap-3 pt-6"
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            className="hover:cursor-pointer flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-500/30"
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
                                            className="hover:cursor-pointer flex-1 bg-slate-600 text-slate-300 py-3 px-4 rounded-md hover:bg-slate-500 transition-all duration-200"
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