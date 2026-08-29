import React from 'react';

const Select = ({
  label,
  id,
  options = [],
  error,
  helperText,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <select
        id={id}
        className={`
          block w-full rounded-xl border bg-white dark:bg-slate-900 
          text-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400
          disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors
          ${
            error
              ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700'
          }
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const label = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value} className="dark:bg-slate-900">
              {label}
            </option>
          );
        })}
      </select>

      {error ? (
        <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Select;
