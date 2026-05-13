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
    Users2,
    Eye,
    GraduationCap,
    Bell,
    CalendarClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState as useClientState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NotificationsPanel from './NotificationsPanel';

const menuGroups = [
    {
        label: 'Main',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        ],
    },
    {
        label: 'Views',
        items: [
            { icon: GraduationCap, label: 'Student View', href: '/student-view' },
            { icon: Eye, label: 'Professor View', href: '/professor-view' },
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
        label: 'Schedule Management',
        items: [
            { icon: History, label: 'Schedule Creation', href: '/history' },
            { icon: CalendarClock, label: 'Current Schedule', href: '/current-schedule' },
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
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '80px' : '280px' }}
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
                {!isCollapsed && (
                    <button
                        onClick={() => setNotificationsOpen(true)}
                        className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark'
                                ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                        }`}
                    >
                        <Bell size={20} />
                    </button>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`absolute -right-5 top-20 bg-gradient-to-br from-red-600 to-rose-500 text-white rounded-full p-1 border-2 hover:from-red-500 hover:to-rose-400 transition-colors shadow-md cursor-pointer ${
                    theme === 'dark' ? 'border-zinc-900' : 'border-white'
                }`}
            >
                {isCollapsed ? <ChevronRight size={28} /> : <ChevronLeft size={28} />}
            </button>

            {/* Navigation Items */}
            <nav className="flex-1 mt-8 px-3 flex flex-col gap-6 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
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

            {/* Notifications Panel */}
            <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-zinc-900 dark:text-white">
                            Notifications
                        </DialogTitle>
                        <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                            View all complaints and unavailability requests
                        </DialogDescription>
                    </DialogHeader>
                    <NotificationsPanel />
                </DialogContent>
            </Dialog>
        </motion.aside>
    );
}
