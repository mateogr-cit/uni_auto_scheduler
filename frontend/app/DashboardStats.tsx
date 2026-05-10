"use client";

import { LayoutDashboard, TrendingUp, Users, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  total_students: number;
  active_courses: number;
  scheduled_classes: number;
  completion_rate: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData = stats ? [
    { label: "Total Students", value: stats.total_students.toLocaleString(), icon: Users, color: "text-blue-600 dark:text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/10" },
    { label: "Active Courses", value: stats.active_courses.toString(), icon: LayoutDashboard, color: "text-red-600 dark:text-red-500", bg: "bg-red-100 dark:bg-red-500/10" },
    { label: "Scheduled Classes", value: stats.scheduled_classes.toString(), icon: Calendar, color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
    { label: "Completion Rate", value: `${stats.completion_rate}%`, icon: TrendingUp, color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/10" },
  ] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {loading ? (
        <div className="col-span-4 text-center py-8 text-zinc-500 dark:text-zinc-400">Loading stats...</div>
      ) : (
        statsData.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">+12%</span>
            </div>
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))
      )}
    </div>
  );
}
