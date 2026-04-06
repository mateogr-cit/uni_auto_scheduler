import { History, Download, Calendar, ExternalLink } from "lucide-react";

export const metadata = {
  title: 'History',
};

export default function HistoryPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Schedule History</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Review past schedules, versions, and generated reports.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/20 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Fall Semester 2025 - Version {4 - item}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Generated on Feb {10 + item}, 2026 • 124 classes scheduled</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="cursor-pointer p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all" title="View Details">
                                <ExternalLink size={20} />
                            </button>
                            <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hober:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 font-medium">
                                <Download size={18} />
                                <span>Export PDF</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State fallback shown if list was empty - illustrating consistency */}
            {false && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                        <History className="text-slate-400" size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Archive is empty</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">No past schedules were found in the system record.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
