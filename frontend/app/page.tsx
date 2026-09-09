import Link from "next/link";
import { ArrowRight, Clock3, FileUp, ShieldCheck, Wallet } from "lucide-react";
import { MarketingFooter, MarketingNavbar } from "@/components/marketing/navbar";
import { QuoteCalculator } from "@/components/marketing/quote-calculator";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-[var(--radius-md)] focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <MarketingNavbar />
      <main id="main-content">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#fee3b5_0%,_transparent_55%)]dark:bg-[radial-gradient(circle_at_top,_rgba(250,93,0,0.16)_0%,_transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-sm font-medium tracking-wide text-harvest uppercase">Campus & shop printing</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] font-medium tracking-tight text-ink-text sm:text-6xl lg:text-7xl">
              Print without the queue.
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted sm:text-lg">
              Upload your files, choose paper and finishing, pay with Paystack, and collect when the
              shop marks your order ready. No guessing prices. No standing in line.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg">
                  Create an account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#quote">
                <Button size="lg" variant="secondary">
                  Estimate a quote
                </Button>
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-[var(--shadow-pop)]">
              <p className="text-xs tracking-wide text-subtle uppercase">Pickup ticket</p>
              <p className="mt-4 font-display text-3xl text-ink-text">STAT 201 · 24 pages</p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-line pb-3">
                  <span className="text-muted">Colour / sides</span>
                  <span>Black & white · double</span>
                </div>
                <div className="flex justify-between border-b border-line pb-3">
                  <span className="text-muted">Paper</span>
                  <span>A4 matte</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span className="font-medium text-harvest">Ready for pickup</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-6 hidden w-48 rounded-[var(--radius-lg)] border border-line bg-marigold p-4 text-sm text-ink shadow-[var(--shadow-card)] sm:block">
              Paid online. Walk in, show the ticket, leave.
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <p className="text-sm font-medium text-harvest">How it works</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl text-ink-text sm:text-4xl">Four steps. Then you walk in once.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            { icon: FileUp, title: "Upload", copy: "PDF, DOCX, or PPTX. Page counts come from the file, not from you guessing." },
            { icon: Wallet, title: "Pay", copy: "Server-side pricing. Paystack checkout uses your account email automatically." },
            { icon: Clock3, title: "Track", copy: "Pending, received, processing, ready, delivered — no skipped states." },
            { icon: ShieldCheck, title: "Collect", copy: "Email and optional push when status moves. Show up when it is actually done." },
          ].map((item) => (
            <div key={item.title} className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
              <item.icon className="h-5 w-5 text-ink-text" />
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-surface py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-medium text-harvest">Transparent pricing</p>
          <h2 className="mt-2 font-display text-3xl text-ink-text sm:text-4xl">Quotes from the same rules the shop uses.</h2>
          <p className="mt-4 max-w-2xl text-muted">
            The public calculator is an estimate. Authenticated orders use Cloudinary-trusted page counts
            and never accept a client-supplied total.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {["Per-page base + colour", "Paper, size, binding", "Finishing add-ons"].map((item) => (
              <div key={item} className="rounded-[var(--radius-lg)] border border-line bg-canvas px-5 py-6 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quote" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm font-medium text-harvest">Instant quote</p>
            <h2 className="mt-2 font-display text-3xl text-ink-text sm:text-4xl">See a number before you create an account.</h2>
            <p className="mt-4 text-muted">
              This does not upload a file and does not create an order. For a real order, page counts are
              taken from the uploaded document.
            </p>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
            <QuoteCalculator />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-marigold/40 py-16 sm:py-20 dark:bg-harvest/10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-display text-3xl text-ink-text sm:text-4xl">Ready when you are.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Register, verify your email, then upload. The shop handles the rest.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Start printing smarter</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
      </main>
    </div>
  );
}
