import { LayoutDashboard, TrendingUp, Users, Calendar } from "lucide-react";

export const metadata = {
  title: 'Dashboard',
};

export default function Home() {
  const stats = [
    { label: "Total Students", value: "1,234", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Courses", value: "42", icon: LayoutDashboard, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Scheduled Classes", value: "156", icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Completion Rate", value: "94%", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, Admin</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening today in your scheduler.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">+12%</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

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
