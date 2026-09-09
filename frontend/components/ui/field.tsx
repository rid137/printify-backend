import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-sm font-medium text-ink-text">{label}</span>
      {children}
      {hint && !error ? <span className="block text-xs text-subtle">{hint}</span> : null}
      {error ? (
        <span role="alert" className="block text-xs text-harvest">
          {error}
        </span>
      ) : null}
    </label>
  );
}

const control =
  "w-full rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2.5 text-sm text-ink-text placeholder:text-subtle disabled:opacity-60";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(control, "min-w-0", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24", className)} {...props} />;
}
