"use client";

import { forwardRef } from "react";

const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(function Input({ className = "", label, error, ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-label-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`h-10 w-full rounded-apple border border-border bg-white px-3 text-sm text-label-primary placeholder:text-label-tertiary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});
export default Input;
