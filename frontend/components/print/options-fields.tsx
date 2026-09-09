"use client";

import type { PrintingOptions } from "@/lib/api/types";
import { Field, Select } from "@/components/ui/field";

type Props = {
  value: PrintingOptions;
  onChange: (next: PrintingOptions) => void;
  disabled?: boolean;
};

export function PrintingOptionsFields({ value, onChange, disabled }: Props) {
  const set = <K extends keyof PrintingOptions>(key: K, next: PrintingOptions[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <>
      <Field label="Colour">
        <Select
          disabled={disabled}
          value={value.color}
          onChange={(e) => set("color", e.target.value as PrintingOptions["color"])}
          aria-label="Colour"
        >
          <option value="black-white">Black & white</option>
          <option value="color">Colour</option>
        </Select>
      </Field>
      <Field label="Sides">
        <Select
          disabled={disabled}
          value={value.sides}
          onChange={(e) => set("sides", e.target.value as PrintingOptions["sides"])}
          aria-label="Sides"
        >
          <option value="single">Single sided</option>
          <option value="double">Double sided</option>
        </Select>
      </Field>
      <Field label="Paper type">
        <Select
          disabled={disabled}
          value={value.paperType}
          onChange={(e) => set("paperType", e.target.value as PrintingOptions["paperType"])}
          aria-label="Paper type"
        >
          <option value="matte">Matte</option>
          <option value="glossy">Glossy</option>
          <option value="cardstock">Cardstock</option>
          <option value="recycled">Recycled</option>
        </Select>
      </Field>
      <Field label="Paper size">
        <Select
          disabled={disabled}
          value={value.paperSize}
          onChange={(e) => set("paperSize", e.target.value as PrintingOptions["paperSize"])}
          aria-label="Paper size"
        >
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="A5">A5</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
        </Select>
      </Field>
      <Field label="Binding">
        <Select
          disabled={disabled}
          value={value.binding}
          onChange={(e) => set("binding", e.target.value as PrintingOptions["binding"])}
          aria-label="Binding"
        >
          <option value="none">No binding</option>
          <option value="stapled">Stapled</option>
          <option value="spiral">Spiral</option>
          <option value="hardcover">Hardcover</option>
        </Select>
      </Field>
      <Field label="Finishing">
        <Select
          disabled={disabled}
          value={value.finishing}
          onChange={(e) => set("finishing", e.target.value as PrintingOptions["finishing"])}
          aria-label="Finishing"
        >
          <option value="none">None</option>
          <option value="lamination">Lamination</option>
        </Select>
      </Field>
    </>
  );
}
