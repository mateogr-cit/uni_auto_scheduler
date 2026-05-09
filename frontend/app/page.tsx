import { LayoutDashboard, TrendingUp, Users, Calendar } from "lucide-react";
import DashboardStats from "./DashboardStats";

export const metadata = {
  title: 'Dashboard',
};

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, Admin</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening today in your scheduler.</p>
      </div>

      <DashboardStats />

      {/* Main Content Area Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Calendar className="text-slate-400" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upcoming Schedule</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">No classes scheduled for the next 24 hours. Start by creating a new schedule or checking the history.</p>
          </div>
          <button className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25">
            Create Schedule
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">New professor added</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Dr. Sarah Johnson was assigned to CS101</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
