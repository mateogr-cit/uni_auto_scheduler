import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn("p-20 flex flex-col items-center justify-center text-center gap-6", className)}>
      <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-300 rotate-12">
        <Icon size={48} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-2">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-red-600 font-bold flex items-center gap-2 hover:gap-3 transition-all cursor-pointer">
          {actionLabel} <ArrowRight size={20} />
        </button>
      )}
    </div>
  );
}
