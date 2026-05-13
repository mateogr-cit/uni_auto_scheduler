import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Calendar, GraduationCap, CheckCircle, Settings, UserPlus, Grid2x2Plus, Building, BookOpen, UserCheck, Plus } from "lucide-react";

type OverviewPanelProps = {
  studentGroupsCount: number;
  degreesCount: number;
  onGoto: (tab: any) => void;
};

export default function OverviewPanel({ studentGroupsCount, degreesCount, onGoto }: OverviewPanelProps) {
  const router = useRouter();
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
        className="col-span-2 row-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -translate-y-16 -translate-x-16 blur-2xl" />
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl shadow-lg shadow-red-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Active Overview</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Real-time academic statistics</p>
          </div>
        </div>

        <div className="grid gap-4 flex-1">
          {[
            { label: "Student groups", value: studentGroupsCount, icon: Users, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "Degrees", value: degreesCount, icon: GraduationCap, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
              className={`flex items-center justify-between ${item.bg} border border-zinc-100 dark:border-zinc-800/10 rounded-xl p-4 group hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.label}</span>
              </div>
              <span className="text-2xl font-black text-zinc-900 dark:text-white">{item.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Prerequisites Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-red-500 to-rose-400 rounded-xl shadow-lg shadow-red-500/20">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Prerequisites</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">All resources needed to generate a schedule</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {prerequisites.map((prereq, index) => (
            <motion.div
              key={prereq}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
              className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 group"
            >
              <div className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-800 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-rose-400 group-hover:border-red-500 transition-colors cursor-pointer">
                <CheckCircle className="w-3 h-3 text-red-600 dark:text-red-400 group-hover:text-white transition-colors" />
              </div>
              <span className="truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{prereq}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Workflow Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Workflow</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Academic structure setup</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { step: 1, title: "Infrastructure", desc: "Groups & academic cycles", color: "text-red-500", icon: Building },
            { step: 2, title: "Curriculum", desc: "Course & degree mapping", color: "text-red-500", icon: BookOpen },
            { step: 3, title: "Assignment", desc: "Student enrollment phase", color: "text-red-500", icon: Users }
          ].map((w, i) => (
            <motion.div
              key={w.step}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
              className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 rounded-xl p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 shadow-sm border border-zinc-100 dark:border-zinc-600 flex items-center justify-center">
                  <w.icon className={`w-5 h-5 ${w.color}`} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {w.step}
                </div>
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight">{w.title}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{w.desc}</p>
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
        className="col-span-4 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-8 shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-600/10 to-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-2xl shadow-red-500/40 relative">
              <UserCheck className="w-8 h-8 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Quick Management</h3>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">Access primary scheduling controls</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: "Add New Groups", action: () => onGoto("setup"), icon: Plus, primary: true },
              { label: "Add Faculty", action: () => router.push("/faculties"), icon: Grid2x2Plus, primary: false },
              { label: "Add Enrollments", action: () => onGoto("enrollments"), icon: UserPlus, primary: false }
            ].map((btn, i) => (
              <motion.button
                key={btn.label}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={btn.action}
                className={`flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg
                  ${btn.primary
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400 shadow-red-600/25'
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white shadow-black/20 border border-zinc-300 dark:border-zinc-700'
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
