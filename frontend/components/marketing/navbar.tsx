"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth";
import { useLockBody } from "@/hooks/use-lock-body";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#quote", label: "Quote" },
];

export function MarketingNavbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const accountLinks = user ? (
    <Link href="/dashboard">
      <Button>Open app</Button>
    </Link>
  ) : (
    <>
      <Link href="/login" className="text-sm font-medium text-ink-text hover:text-harvest">
        Log in
      </Link>
      <Link href="/register">
        <Button>Get started</Button>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight text-ink-text">
          Printify
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Marketing">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-harvest">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {accountLinks}
        </div>
        <button
          type="button"
          className="rounded-[var(--radius-md)] p-1 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="marketing-menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {open ? (
        <div
          id="marketing-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 overflow-y-auto bg-canvas p-6 md:hidden"
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="font-semibold">Printify</span>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col gap-4 text-lg">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            {user ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Open app
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-ink-text">Printify</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Remote print orders for people who would rather skip the queue.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" aria-label="Footer">
          <a href="/#how-it-works" className="hover:text-harvest">
            How it works
          </a>
          <a href="/#quote" className="hover:text-harvest">
            Quote
          </a>
          <Link href="/login" className="hover:text-harvest">
            Log in
          </Link>
          <Link href="/register" className="hover:text-harvest">
            Create account
          </Link>
        </nav>
        <p className="text-sm text-subtle">© {new Date().getFullYear()} Printify</p>
      </div>
    </footer>
  );
}
