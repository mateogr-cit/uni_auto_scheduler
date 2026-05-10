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
    Building,
    School,
    Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState as useClientState } from 'react';

const menuGroups = [
    {
        label: 'Main',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        ],
    },
    {
        label: 'User Management',
        items: [
            { icon: Users, label: 'Professors', href: '/professors' },
            { icon: User, label: 'Students', href: '/students' },
            { icon: Users2, label: 'Student Groups', href: '/student-groups' },
        ],
    },
    {
        label: 'Schedule Creation',
        items: [
            { icon: History, label: 'Schedule History', href: '/history' },
        ],
    },
    {
        label: 'Resource Management',
        items: [
            { icon: BookOpen, label: 'Course', href: '/courses' },
            { icon: Building, label: 'Rooms', href: '/rooms' },
            { icon: School, label: 'Faculty & Degrees', href: '/faculties' },
        ],
    },
];

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const { theme } = useTheme();
    const [mounted, setMounted] = useClientState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '80px' : '260px' }}
            className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out shadow-xl ${
                theme === 'dark'
                    ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    : 'bg-white text-zinc-700 border-zinc-200'
            }`}
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
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/30">
                            S
                        </div>
                        <span className={`font-semibold text-xl tracking-wide ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Scheduler</span>
                    </motion.div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center font-bold text-white mx-auto shadow-lg shadow-red-500/30">
                        S
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`absolute -right-3 top-20 bg-gradient-to-br from-red-600 to-rose-500 text-white rounded-full p-1 border-2 hover:from-red-500 hover:to-rose-400 transition-colors shadow-md cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-900' : 'border-white'
                }`}
            >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Navigation Items */}
            <nav className="flex-1 mt-8 px-3 flex flex-col gap-6">
                {menuGroups.map((group) => (
                    <div key={group.label} className="flex flex-col gap-2">
                        {!isCollapsed && (
                            <div className={`px-3 text-xs uppercase tracking-[0.24em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {group.label}
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.label} href={item.href}>
                                        <motion.div
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive
                                            ? 'bg-red-600/10 text-red-400'
                                            : theme === 'dark'
                                                ? 'hover:bg-zinc-800/50 hover:text-white'
                                                : 'hover:bg-zinc-100/50 hover:text-zinc-900'
                                        }`}
                                        >
                                            <item.icon
                                                size={22}
                                                className={`${isActive ? 'text-red-400' : theme === 'dark' ? 'group-hover:text-white' : 'group-hover:text-zinc-900'} transition-colors`}
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
                                                    className="absolute left-0 w-1 h-6 bg-gradient-to-b from-red-500 to-rose-400 rounded-r-full"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Section */}
            <div className={`p-3 mt-auto flex flex-col gap-1 ${theme === 'dark' ? 'border-t border-zinc-800/50' : 'border-t border-zinc-200/50'}`}>
                <Link href="/settings">
                    <motion.div
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative
                        ${pathname === '/settings'
                            ? 'bg-red-600/10 text-red-400'
                            : theme === 'dark'
                                ? 'hover:bg-zinc-800/50 hover:text-white'
                                : 'hover:bg-zinc-100/50 hover:text-zinc-900'
                        }`}
                    >
                        <Settings size={22} className={`${pathname === '/settings' ? 'text-red-400' : theme === 'dark' ? 'group-hover:text-white' : 'group-hover:text-zinc-900'} transition-colors`} />
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="font-medium whitespace-nowrap"
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {pathname === '/settings' && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute left-0 w-1 h-6 bg-gradient-to-b from-red-500 to-rose-400 rounded-r-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </motion.div>
                </Link>
                <button className={`cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group ${
                    theme === 'dark'
                        ? 'hover:bg-red-500/10 hover:text-red-400'
                        : 'hover:bg-red-50 hover:text-red-600'
                }`}>
                    <LogOut size={22} className={theme === 'dark' ? 'group-hover:text-red-400' : 'group-hover:text-red-600'} />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
}
