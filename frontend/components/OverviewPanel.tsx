import { type TabId } from "./schedule-types";
import { motion } from "framer-motion";
import { Users, Calendar, GraduationCap, CheckCircle, Settings, UserPlus, Grid2x2Plus, Building, BookOpen, UserCheck, Plus } from "lucide-react";

type OverviewPanelProps = {
  studentGroupsCount: number;
  semestersCount: number;
  degreesCount: number;
  onGoto: (tab: TabId) => void;
};

export default function OverviewPanel({ studentGroupsCount, semestersCount, degreesCount, onGoto }: OverviewPanelProps) {
  const prerequisites = [
    "Student groups defined",
    "Semesters configured",
    "Faculty and professors set up",
    "Degrees and curriculum mapped",
    "Rooms available",
    "Enrollments completed"
  ];

  return (
    <div className="grid grid-cols-4 gap-6 h-full font-sans">
      {/* Overview Stats - Large Bento Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="col-span-2 row-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Overview</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time academic statistics</p>
          </div>
        </div>

        <div className="grid gap-4 flex-1">
          {[
            { label: "Student groups", value: studentGroupsCount, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { label: "Semesters", value: semestersCount, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Degrees", value: degreesCount, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
              className={`flex items-center justify-between ${item.bg} border border-slate-100 dark:border-slate-800/10 rounded-xl p-4 group hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{item.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Prerequisites Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Prerequisites</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">All resources needed to generate a schedule</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {prerequisites.map((prereq, index) => (
            <motion.div
              key={prereq}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
              className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 group"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors">
                <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
              </div>
              <span className="truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{prereq}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Workflow Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Workflow</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Academic structure setup</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { step: 1, title: "Infrastructure", desc: "Groups & academic cycles", color: "text-blue-500", icon: Building },
            { step: 2, title: "Curriculum", desc: "Course & degree mapping", color: "text-indigo-500", icon: BookOpen },
            { step: 3, title: "Assignment", desc: "Student enrollment phase", color: "text-purple-500", icon: Users }
          ].map((w, i) => (
            <motion.div
              key={w.step}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
              className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                  <w.icon className={`w-5 h-5 ${w.color}`} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {w.step}
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{w.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{w.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions - Fill row for rectangular form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="col-span-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative">
              <UserCheck className="w-8 h-8 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Quick Management</h3>
              <p className="text-slate-400 font-medium">Access primary scheduling controls</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: "Add New Groups", action: () => onGoto("setup"), icon: Plus, primary: true },
              { label: "Add Faculty", action: () => onGoto("faculty"), icon: Grid2x2Plus, primary: false },
              { label: "Add Enrollments", action: () => onGoto("enrollments"), icon: UserPlus, primary: false }
            ].map((btn, i) => (
              <motion.button
                key={btn.label}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={btn.action}
                className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg
                  ${btn.primary
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/25'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white shadow-black/20 border border-slate-700'
                  }`}
              >
                <btn.icon className="w-4 h-4" />
                {btn.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
