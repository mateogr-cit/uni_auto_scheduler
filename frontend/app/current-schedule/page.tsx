"use client";

import { CalendarX, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CurrentSchedulePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
        <CalendarX size={40} className="text-zinc-400 dark:text-zinc-500" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">
        No Current Schedule
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
        There is no active schedule at the moment. Create a new schedule to view it here.
      </p>
      <Link href="/history">
        <button className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-500 transition shadow-lg shadow-red-500/30">
          Create Schedule
          <ArrowRight size={16} />
        </button>
      </Link>
    </div>
  );
}
