"use client";

import React, { useState, useEffect } from 'react';
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
    CalendarClock,
    Sparkles,
    Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NotificationsPanel from './NotificationsPanel';
import { useAuth } from '@/contexts/AuthContext';

function LogoMark({ size = 36 }: { size?: number }) {
    return (
        <Link href="/">
            <div
                className="rounded-full flex items-center justify-center cursor-pointer shrink-0 bg-gradient-to-br from-[#991b1b] to-[#c2185b] hover:opacity-90 transition-opacity"
                style={{ width: size, height: size, filter: 'drop-shadow(0 1px 3px rgba(153,27,27,0.2))' }}
            >
                <span
                    className="text-white select-none"
                    style={{
                        fontFamily: "var(--font-cinzel), 'Cinzel', Georgia, serif",
                        fontWeight: 700,
                        fontSize: size * 0.38,
                        lineHeight: 1,
                    }}
                >
                    K
                </span>
            </div>
        </Link>
    );
}

const adminMenuGroups = [
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
    {
        label: 'AI',
        items: [
            { icon: Sparkles, label: 'AI Suggestions', href: '/ai-suggestions' },
        ],
    },
    {
        label: 'Audit',
        items: [
            { icon: Archive, label: 'Resolved (30d)', href: '/resolved' },
        ],
    },
];

const professorMenuGroups = [
    {
        label: 'Views',
        items: [
            { icon: Eye, label: 'My Schedule', href: '/professor-view' },
        ],
    },
];

const studentMenuGroups = [
    {
        label: 'Views',
        items: [
            { icon: GraduationCap, label: 'My Schedule', href: '/student-view' },
        ],
    },
];

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme } = useTheme();
    const { user, logout } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const menuGroups =
        user?.u_role === 'professor' ? professorMenuGroups :
        user?.u_role === 'student' ? studentMenuGroups :
        adminMenuGroups;

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

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
                        className="flex items-center gap-2.5"
                    >
                        <LogoMark size={36} />
                        <span
                            className={`text-base font-semibold tracking-[0.18em] uppercase ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}
                            style={{ fontFamily: "var(--font-cinzel), 'Cinzel', Georgia, serif" }}
                        >
                            Kronos
                        </span>
                    </motion.div>
                )}
                {isCollapsed && (
                    <div className="mx-auto">
                        <LogoMark size={34} />
                    </div>
                )}
                {!isCollapsed && user?.u_role === 'admin' && (
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
                {/* User display */}
                {!isCollapsed && user && (
                    <div className={`px-3 py-2 mb-1 rounded-xl ${theme === 'dark' ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}>
                        <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                            {user.fname} {user.lname}
                        </p>
                        <p className={`text-xs capitalize ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {user.u_role}
                        </p>
                    </div>
                )}

                {user && (
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
                                    layoutId="active-pill-settings"
                                    className="absolute left-0 w-1 h-6 bg-gradient-to-b from-red-500 to-rose-400 rounded-r-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.div>
                    </Link>
                )}

                <button
                    onClick={handleLogout}
                    className={`cursor-pointer w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group ${
                        theme === 'dark'
                            ? 'hover:bg-red-500/10 hover:text-red-400'
                            : 'hover:bg-red-50 hover:text-red-600'
                    }`}
                >
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
