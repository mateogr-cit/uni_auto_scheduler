import React from "react";
import { BookOpen, ClipboardList, LayoutDashboard, Settings, Users, Zap } from "lucide-react";
import { TabId } from "./schedule-types";

const tabList: Array<{ id: TabId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "setup", label: "Groups & Semesters", icon: Settings },
  { id: "curriculum", label: "Curriculum", icon: BookOpen },
  { id: "enrollments", label: "Enrollments", icon: ClipboardList },
  { id: "schedule", label: "Auto-Schedule", icon: Zap },
];

type ScheduleTabsProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export default function ScheduleTabs({ activeTab, onTabChange }: ScheduleTabsProps) {
  return (
    <div className="flex justify-center">
      <nav className="inline-flex items-center flex-wrap justify-center gap-2 rounded-3xl bg-slate-50 dark:bg-slate-900 p-3 shadow-sm">
        {tabList.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <React.Fragment key={tab.id}>
              {index > 0 && (
                <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 md:block " />
              )}
              <button
                onClick={() => onTabChange(tab.id)}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "text-indigo-600 shadow-lg font-semibold"
                    : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-950"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
