"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, Card, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FileUploader } from "@/components/files/file-uploader";
import { PrintingOptionsFields } from "@/components/print/options-fields";
import { ordersApi, type CreateOrderItem } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import { toUserMessage } from "@/lib/api/client";
import type { PrintingOptions, UploadedFile } from "@/lib/api/types";
import {
  defaultPrintingOptions,
  MAX_ORDER_ITEMS,
  MAX_PAGE_COUNT,
  MAX_QUANTITY,
  MAX_UPLOAD_FILES,
} from "@/lib/constants";
import { formatBytes, formatNgn } from "@/lib/utils";
import { rangeError } from "@/lib/validation";
import { useToast } from "@/lib/toast";

type Line = {
  file: UploadedFile;
  printingOptions: PrintingOptions;
  quantity: number;
};

function NewOrderInner() {
  const router = useRouter();
  const toast = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [quote, setQuote] = useState<{ totalPrice: number; itemsSubtotal: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<"quote" | "create" | "pay" | null>(null);

  const remainingSlots = Math.max(0, MAX_ORDER_ITEMS - lines.length);

  function addFiles(files: UploadedFile[]) {
    setLines((current) => [
      ...current,
      ...files.map((file) => ({
        file,
        printingOptions: defaultPrintingOptions,
        quantity: 1,
      })),
    ]);
    setQuote(null);
    setError("");
  }

  function update(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    setQuote(null);
  }

  const lineErrors = lines.map((line) => {
    const qty = rangeError(line.quantity, 1, MAX_QUANTITY, "Copies");
    const pages =
      line.file.pages != null ? rangeError(line.file.pages, 1, MAX_PAGE_COUNT, "Pages") : undefined;
    return { qty, pages };
  });
  const hasLineErrors = lineErrors.some((item) => item.qty || item.pages);

  const payload: CreateOrderItem[] = useMemo(
    () =>
      lines.map((line) => ({
        file: {
          publicId: line.file.public_id,
          fileName: line.file.originalFilename,
          mimeType: line.file.mimeType,
          format: line.file.format,
        },
        printingOptions: line.printingOptions,
        quantity: line.quantity,
      })),
    [lines]
  );

  function validateCart(): string | null {
    if (!lines.length) return "Add at least one document.";
    if (lines.length > MAX_ORDER_ITEMS) {
      return `Orders can contain at most ${MAX_ORDER_ITEMS} items.`;
    }
    if (hasLineErrors) {
      return lineErrors.find((item) => item.qty)?.qty || lineErrors.find((item) => item.pages)?.pages || "Check item details.";
    }
    return null;
  }

  async function calculate() {
    const problem = validateCart();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setAction("quote");
    setError("");
    try {
      const result = await ordersApi.calculate(
        payload.map((item) => ({
          file: { publicId: item.file.publicId },
          printingOptions: item.printingOptions,
          quantity: item.quantity,
        }))
      );
      setQuote({ totalPrice: result.totalPrice, itemsSubtotal: result.itemsSubtotal });
    } catch (err) {
      setError(toUserMessage(err, "Unable to calculate price."));
    } finally {
      setBusy(false);
      setAction(null);
    }
  }

  async function create(pay: boolean) {
    const problem = validateCart();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setAction(pay ? "pay" : "create");
    setError("");
    try {
      const order = await ordersApi.create(payload);
      toast.push("Order created");
      if (pay) {
        const init = await paymentsApi.initialize(order._id);
        if (init.authorization_url) {
          window.location.href = init.authorization_url;
          return;
        }
        setError("Payment could not be started. Open the order to try again.");
        router.push(`/orders/${order._id}`);
        return;
      }
      router.push(`/orders/${order._id}`);
    } catch (err) {
      setError(toUserMessage(err, "Unable to create order."));
    } finally {
      setBusy(false);
      setAction(null);
    }
  }

  return (
    <>
      <PageHeader
        title="New order"
        description="Upload owned files, then set print options. Page counts come from Cloudinary — DOCX/PPTX may be rejected if no trusted count exists."
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="mb-6 p-4">
        <FileUploader remainingSlots={Math.min(remainingSlots, MAX_UPLOAD_FILES)} disabled={busy} onUploaded={addFiles} />
      </Card>
      {lines.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Choose up to 10 files per upload. You can add more until the order reaches 20 items."
        />
      ) : (
        <div className="space-y-4">
          {lines.map((line, index) => (
            <Card key={`${line.file.public_id}-${index}`} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{line.file.originalFilename}</p>
                  <p className="text-sm text-muted">
                    {line.file.format.toUpperCase()}
                    {line.file.pages == null
                      ? " · no trusted page count yet"
                      : ` · ${line.file.pages.toLocaleString()} pages`}
                    {` · ${formatBytes(line.file.size)}`}
                  </p>
                  {lineErrors[index]?.pages ? (
                    <p className="mt-1 text-xs text-harvest">{lineErrors[index].pages}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setLines((current) => current.filter((_, i) => i !== index));
                    setQuote(null);
                  }}
                >
                  Remove
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <PrintingOptionsFields
                  value={line.printingOptions}
                  disabled={busy}
                  onChange={(printingOptions) => update(index, { printingOptions })}
                />
                <Field label="Copies" error={lineErrors[index]?.qty}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    disabled={busy}
                    value={Number.isFinite(line.quantity) ? line.quantity : ""}
                    onChange={(e) =>
                      update(index, {
                        quantity: e.target.value === "" ? Number.NaN : Number(e.target.value),
                      })
                    }
                    aria-invalid={Boolean(lineErrors[index]?.qty)}
                  />
                </Field>
              </div>
            </Card>
          ))}
        </div>
      )}
      {lines.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={calculate} disabled={busy}>
            {action === "quote" ? "Calculating…" : "Preview price"}
          </Button>
          <Button onClick={() => create(false)} disabled={busy}>
            {action === "create" ? "Creating…" : "Create unpaid order"}
          </Button>
          <Button onClick={() => create(true)} disabled={busy}>
            {action === "pay" ? "Starting payment…" : "Create and pay"}
          </Button>
          {quote ? (
            <p className="text-sm font-medium">Quote: {formatNgn(quote.totalPrice)}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export default function NewOrderPage() {
  return (
    <Protected>
      <NewOrderInner />
    </Protected>
  );
}
