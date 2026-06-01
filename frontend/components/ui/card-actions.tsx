import { Edit, Trash2 } from "lucide-react";

interface CardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function CardActions({ onEdit, onDelete, editLabel = "Edit", deleteLabel = "Delete" }: CardActionsProps) {
  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
      <button
        onClick={onEdit}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
      >
        <Edit size={16} /> {editLabel}
      </button>
      <button
        onClick={onDelete}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
      >
        <Trash2 size={16} /> {deleteLabel}
      </button>
    </div>
  );
}
