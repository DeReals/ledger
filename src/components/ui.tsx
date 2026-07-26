import type { ReactNode } from "react";

/** A page title + optional action button on the right. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** A rounded white panel used to group content. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-stone-200/80 bg-white p-5 shadow-[0_4px_24px_-10px_rgba(120,72,40,0.18)] dark:border-stone-800 dark:bg-stone-900 dark:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

/** Empty-state message when there's no data yet. */
export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-stone-700">
      <p className="font-medium text-stone-700 dark:text-stone-200">{title}</p>
      {hint && (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{hint}</p>
      )}
    </div>
  );
}

// Shared input styling so all form fields match.
export const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-800 dark:text-white";

export const labelClass =
  "block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1";

export const primaryBtn =
  "rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-orange-600/30 disabled:opacity-60";

export const secondaryBtn =
  "rounded-full border border-stone-300 px-5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800";
