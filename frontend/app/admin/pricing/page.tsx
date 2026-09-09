"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, Card, ErrorState, LoadingState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { pricingApi } from "@/lib/api/pricing";
import { ApiError, fieldErrors, toUserMessage } from "@/lib/api/client";
import type { PricingRules } from "@/lib/api/types";
import { MAX_PRICING_MONEY, MIN_PRICING_DISCOUNT } from "@/lib/constants";
import { useToast } from "@/lib/toast";

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const invalid =
    !Number.isFinite(value) || value < min || value > max
      ? `Must be between ${min.toLocaleString()} and ${max.toLocaleString()}.`
      : undefined;
  return (
    <Field label={label} hint={`${min.toLocaleString()} to ${max.toLocaleString()}`} error={invalid}>
      <Input
        type="number"
        step="any"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
        required
        aria-invalid={Boolean(invalid)}
      />
    </Field>
  );
}

function isOutOfRange(value: number, min: number, max: number) {
  return !Number.isFinite(value) || value < min || value > max;
}

function PricingInner() {
  const toast = useToast();
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    pricingApi
      .getConfig()
      .then((config) => {
        setRules(config.rules);
        setVersion(config.version);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load pricing.")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function validate(next: PricingRules): string | null {
    if (
      isOutOfRange(next.basePricePerPage, 0, MAX_PRICING_MONEY) ||
      isOutOfRange(next.colorPremium, 0, MAX_PRICING_MONEY) ||
      isOutOfRange(next.doubleSidedDiscount, MIN_PRICING_DISCOUNT, MAX_PRICING_MONEY)
    ) {
      return "One or more amounts are outside the allowed range. Values are not adjusted automatically.";
    }
    const groups = [next.paperTypePremium, next.paperSizePremium, next.bindingCost, next.finishingCost];
    for (const group of groups) {
      for (const value of Object.values(group)) {
        if (isOutOfRange(value, 0, MAX_PRICING_MONEY)) {
          return "One or more amounts are outside the allowed range. Values are not adjusted automatically.";
        }
      }
    }
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!rules) return;
    const problem = validate(rules);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await pricingApi.updateConfig(rules);
      setRules(updated.rules);
      setVersion(updated.version);
      toast.push("Pricing updated");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      const fields = fieldErrors(apiError?.details);
      setError(Object.values(fields)[0] || toUserMessage(err, "Unable to update pricing."));
    } finally {
      setBusy(false);
    }
  }

  if (!rules && !error) return <LoadingState />;
  if (!rules) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Pricing rules"
        description={`Active version ${version ?? "—"}. Out-of-range values are rejected; they are not clamped.`}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="grid gap-4 p-5 sm:grid-cols-3">
          <NumberField label="Base per page" value={rules.basePricePerPage} min={0} max={MAX_PRICING_MONEY} onChange={(basePricePerPage) => setRules({ ...rules, basePricePerPage })} />
          <NumberField label="Colour premium" value={rules.colorPremium} min={0} max={MAX_PRICING_MONEY} onChange={(colorPremium) => setRules({ ...rules, colorPremium })} />
          <NumberField label="Double-sided discount" value={rules.doubleSidedDiscount} min={MIN_PRICING_DISCOUNT} max={MAX_PRICING_MONEY} onChange={(doubleSidedDiscount) => setRules({ ...rules, doubleSidedDiscount })} />
        </Card>
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          {(Object.keys(rules.paperTypePremium) as Array<keyof typeof rules.paperTypePremium>).map((key) => (
            <NumberField key={key} label={`Paper · ${key}`} value={rules.paperTypePremium[key]} min={0} max={MAX_PRICING_MONEY} onChange={(value) => setRules({ ...rules, paperTypePremium: { ...rules.paperTypePremium, [key]: value } })} />
          ))}
        </Card>
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          {(Object.keys(rules.paperSizePremium) as Array<keyof typeof rules.paperSizePremium>).map((key) => (
            <NumberField key={key} label={`Size · ${key}`} value={rules.paperSizePremium[key]} min={0} max={MAX_PRICING_MONEY} onChange={(value) => setRules({ ...rules, paperSizePremium: { ...rules.paperSizePremium, [key]: value } })} />
          ))}
        </Card>
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          {(Object.keys(rules.bindingCost) as Array<keyof typeof rules.bindingCost>).map((key) => (
            <NumberField key={key} label={`Binding · ${key}`} value={rules.bindingCost[key]} min={0} max={MAX_PRICING_MONEY} onChange={(value) => setRules({ ...rules, bindingCost: { ...rules.bindingCost, [key]: value } })} />
          ))}
        </Card>
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          {(Object.keys(rules.finishingCost) as Array<keyof typeof rules.finishingCost>).map((key) => (
            <NumberField key={key} label={`Finishing · ${key}`} value={rules.finishingCost[key]} min={0} max={MAX_PRICING_MONEY} onChange={(value) => setRules({ ...rules, finishingCost: { ...rules.finishingCost, [key]: value } })} />
          ))}
        </Card>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save rules"}</Button>
      </form>
    </>
  );
}

export default function AdminPricingPage() {
  return (
    <Protected admin>
      <PricingInner />
    </Protected>
  );
}
