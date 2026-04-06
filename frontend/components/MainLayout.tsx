"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import PageTransition from './PageTransition';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex bg-slate-50 dark:bg-slate-950">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main
                className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-20' : 'ml-[260px]'
                    }`}
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
