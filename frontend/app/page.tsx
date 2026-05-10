import { LayoutDashboard, TrendingUp, Users, Calendar } from "lucide-react";
import DashboardStats from "./DashboardStats";

export const metadata = {
  title: 'Dashboard',
};

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Welcome back, Admin</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Here's what's happening today in your scheduler.</p>
      </div>

      <DashboardStats />

      {/* Main Content Area Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 min-h-[400px] flex flex-col items-center justify-center text-center flex flex-col gap-4">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <Calendar className="text-zinc-400 dark:text-zinc-500" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Upcoming Schedule</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">No classes scheduled for the next 24 hours. Start by creating a new schedule or checking the history.</p>
          </div>
          <button className="cursor-pointer bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-red-500/25">
            Create Schedule
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-gradient-to-b from-red-500 to-rose-400 mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">New professor added</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Dr. Sarah Johnson was assigned to CS101</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider font-semibold">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
