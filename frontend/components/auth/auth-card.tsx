import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="font-semibold text-ink-text">
          Printify
        </Link>
        <ThemeToggle />
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
