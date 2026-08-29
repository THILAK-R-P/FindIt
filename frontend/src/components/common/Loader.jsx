import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ message = 'Loading content...', fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 gap-3">
      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
      <span className="text-sm text-slate-500 dark:text-slate-400">{message}</span>
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse space-y-3"
        >
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full mt-4" />
        </div>
      ))}
    </div>
  );
};

export default Loader;
