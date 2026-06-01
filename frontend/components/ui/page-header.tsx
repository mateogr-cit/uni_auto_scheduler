"use client";

import React from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  onAdd?: () => void;
  /** Extra content rendered to the left of the add button (e.g. a view-toggle). */
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, buttonLabel, onAdd, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-zinc-500 dark:text-zinc-400 mt-2">{subtitle}</p>}
      </div>
      {(children || (buttonLabel && onAdd)) && (
        <div className="flex gap-3 items-center">
          {children}
          {buttonLabel && onAdd && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAdd}
              className="cursor-pointer text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-xl shadow-red-500/25"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              {buttonLabel}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
