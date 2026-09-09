import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Alert({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[var(--radius-lg)] border px-4 py-3 text-sm",
        tone === "error"
          ? "border-harvest/40 bg-marigold/20 text-ink-text dark:bg-harvest/10"
          : "border-line bg-surface-muted text-muted"
      )}
    >
      {title ? <p className="mb-1 font-medium text-ink-text">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-line px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-ink-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-harvest/40 bg-marigold/20 px-4 py-4 dark:bg-harvest/10" role="alert">
      <p className="text-sm text-ink-text">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-harvest hover:underline"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label={label}>
      <div className="h-4 w-40 animate-pulse rounded bg-surface-muted" />
      <div className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
      <div className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-text">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
