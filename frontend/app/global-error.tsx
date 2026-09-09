"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-[#fff8f1] font-sans text-[#1d1e1c] antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <p className="text-sm font-medium text-[#fa5d00]">Something went wrong</p>
          <h1 className="mt-2 text-2xl font-semibold">Printify could not load this page.</h1>
          <p className="mt-2 text-sm text-[#615f5c]">Try again, or return to the home page.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center rounded-[10px] bg-[#fa5d00] px-4 text-sm font-medium text-white"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex h-10 items-center rounded-[10px] border border-[#e3d6c5] bg-white px-4 text-sm font-medium"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
