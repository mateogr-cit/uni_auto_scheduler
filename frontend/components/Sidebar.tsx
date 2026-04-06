"use client";

import React, { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    User,
    History,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Settings,
    Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Professors', href: '/professors' },
    { icon: User, label: 'Student', href: '/students' },
    { icon: History, label: 'Schedule History', href: '/history' },
    { icon: BookOpen, label: 'Course', href: '/courses' },
    { icon: Building, label: 'Rooms', href: '/rooms' },
];

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '80px' : '260px' }}
            className="fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 border-r border-slate-800 z-50 flex flex-col transition-all duration-300 ease-in-out shadow-xl"
        >
            {/* Header / Logo */}
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
                            S
                        </div>
                        <span className="font-bold text-xl text-white tracking-tight">Scheduler</span>
                    </motion.div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white mx-auto shadow-lg shadow-indigo-500/30">
                        S
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 bg-indigo-600 text-white rounded-full p-1 border-2 border-slate-900 hover:bg-indigo-500 transition-colors shadow-md"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Navigation Items */}
            <nav className="flex-1 mt-8 px-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive
                                        ? 'bg-indigo-600/10 text-indigo-400'
                                        : 'hover:bg-slate-800/50 hover:text-white'
                                    }`}
                            >
                                <item.icon
                                    size={22}
                                    className={`${isActive ? 'text-indigo-400' : 'group-hover:text-white'} transition-colors`}
                                />

                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="font-medium whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Section */}
            <div className="p-3 mt-auto border-t border-slate-800/50 space-y-1">
                <button className="cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-slate-800/50 hover:text-white transition-all group">
                    <Settings size={22} className="group-hover:text-white" />
                    {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
                </button>
                <button className="cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all group">
                    <LogOut size={22} className="group-hover:text-red-400" />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
}
