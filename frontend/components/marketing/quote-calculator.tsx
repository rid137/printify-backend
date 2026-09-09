"use client";

import { useState, type FormEvent } from "react";
import { pricingApi } from "@/lib/api/pricing";
import { ApiError, fieldErrors, toUserMessage } from "@/lib/api/client";
import { defaultPrintingOptions, MAX_PAGE_COUNT, MAX_QUANTITY } from "@/lib/constants";
import type { PrintingOptions, PublicQuote } from "@/lib/api/types";
import { formatNgn } from "@/lib/utils";
import { rangeError } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/card";
import { PrintingOptionsFields } from "@/components/print/options-fields";

export function QuoteCalculator() {
  const [options, setOptions] = useState<PrintingOptions>(defaultPrintingOptions);
  const [quantity, setQuantity] = useState(1);
  const [pages, setPages] = useState(10);
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pagesError = rangeError(pages, 1, MAX_PAGE_COUNT, "Pages");
  const quantityError = rangeError(quantity, 1, MAX_QUANTITY, "Copies");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = pagesError || quantityError;
    if (problem) {
      setError(problem);
      setQuote(null);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await pricingApi.quote({ printingOptions: options, quantity, pages });
      setQuote(data);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      const fields = fieldErrors(apiError?.details);
      setError(Object.values(fields)[0] || toUserMessage(err, "Unable to calculate a quote."));
      setQuote(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {error ? (
        <div className="sm:col-span-2">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      <PrintingOptionsFields value={options} onChange={setOptions} />
      <Field label="Pages" hint={`1–${MAX_PAGE_COUNT.toLocaleString()} (quote only)`} error={pagesError}>
        <Input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(pages) ? pages : ""}
          onChange={(e) => setPages(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          required
          aria-invalid={Boolean(pagesError)}
        />
      </Field>
      <Field label="Copies" hint={`1–${MAX_QUANTITY}`} error={quantityError}>
        <Input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(quantity) ? quantity : ""}
          onChange={(e) => setQuantity(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          required
          aria-invalid={Boolean(quantityError)}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Calculating…" : "Calculate quote"}
        </Button>
      </div>
      {quote ? (
        <div className="sm:col-span-2 rounded-[var(--radius-lg)] border border-line bg-surface-muted p-4">
          <p className="text-sm text-muted">Estimated total (not an order)</p>
          <p className="mt-1 text-3xl font-semibold text-ink-text">{formatNgn(quote.totalPrice)}</p>
          <p className="mt-2 text-sm text-subtle">
            {quote.totalPages} pages · {formatNgn(quote.pricePerUnit)} per copy · rules v{quote.rulesVersion}
          </p>
        </div>
      ) : null}
    </form>
  );
}
