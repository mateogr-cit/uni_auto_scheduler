import { type ReactNode } from "react";

export const SectionCard = ({
  title,
  description,
  icon: Icon,
  children
}: {
  title: string;
  description: string;
  icon?: any;
  children: ReactNode;
}) => (
  <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5 transition-all hover:shadow-md">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
    {children}
  </section>
);
