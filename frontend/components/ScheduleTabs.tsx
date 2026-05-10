import React from "react";
import { BookOpen, ClipboardList, LayoutDashboard, Settings, Users, Zap } from "lucide-react";
import { TabId } from "./schedule-types";

const tabList: Array<{ id: TabId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "setup", label: "Semesters", icon: Settings },
  { id: "offerings", label: "Offerings", icon: BookOpen },
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
      <nav className="inline-flex items-center flex-wrap justify-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 shadow-sm">
        {tabList.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <React.Fragment key={tab.id}>
              {index > 0 && (
                <div className="hidden h-6 w-px bg-zinc-200 dark:bg-zinc-700 md:block " />
              )}
              <button
                onClick={() => onTabChange(tab.id)}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "text-red-600 shadow-lg font-semibold"
                    : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-950"
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
