"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-harvest">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink-text">We hit an unexpected error.</h1>
      <p className="mt-2 text-sm text-muted">You can try again, or head back to a safer page.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard">
          <Button variant="secondary">Return to dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
