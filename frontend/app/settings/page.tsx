'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your application preferences.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Appearance</h2>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
                {theme === 'dark' ? <Moon size={20} className="text-zinc-700 dark:text-zinc-300" /> : <Sun size={20} className="text-zinc-700 dark:text-zinc-300" />}
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">Theme</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{theme} mode</p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-red-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
