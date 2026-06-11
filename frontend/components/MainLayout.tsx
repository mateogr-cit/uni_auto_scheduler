"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import PageTransition from './PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ROLE_HOME: Record<string, string> = {
    student: '/student-view',
    professor: '/professor-view',
    admin: '/',
};

// Routes that any signed-in user may visit, regardless of role.
const SHARED_ROUTES = ['/settings'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.u_role !== 'admin') {
            const home = ROLE_HOME[user.u_role];
            const isShared = SHARED_ROUTES.some(
                (route) => pathname === route || pathname.startsWith(route + '/')
            );
            if (pathname !== home && !isShared) {
                router.push(home);
            }
        }
    }, [user, isLoading, pathname, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex bg-zinc-50 dark:bg-zinc-950">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main
                className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-20' : 'ml-[260px]'}`}
            >
                <div className="p-8 max-w-7xl mx-auto">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </div>
            </main>
        </div>
    );
}
