"use client";

import Link from "next/link";
import { MarketingFooter, MarketingNavbar } from "@/components/marketing/navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function NotFound() {
  const { user, ready } = useAuth();
  const signedIn = ready && Boolean(user);

  return (
    <div className="min-h-screen bg-canvas">
      {signedIn ? null : <MarketingNavbar />}
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium text-harvest">404</p>
        <h1 className="mt-2 font-display text-4xl text-ink-text">Page not found</h1>
        <p className="mt-3 max-w-md text-muted">
          That URL is not part of Printify. Check the link, or continue from a page that exists.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {signedIn ? (
            <>
              <Link href="/dashboard">
                <Button>Return to dashboard</Button>
              </Link>
              <Link href="/orders">
                <Button variant="secondary">View orders</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/">
                <Button>Go home</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Sign in</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {signedIn ? null : <MarketingFooter />}
    </div>
  );
}
