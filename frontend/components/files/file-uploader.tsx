"use client";

import { useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { uploadsApi } from "@/lib/api/uploads";
import { ApiError, toUserMessage } from "@/lib/api/client";
import type { UploadedFile } from "@/lib/api/types";
import {
  ACCEPTED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
} from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

type FailedFile = { file: File; reason: string };

type Props = {
  remainingSlots: number;
  disabled?: boolean;
  onUploaded: (files: UploadedFile[]) => void;
};

function extensionOf(name: string) {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function validateFiles(files: File[], remainingSlots: number): string | null {
  if (!files.length) return "Select at least one file.";
  if (files.length > MAX_UPLOAD_FILES) {
    return `Too many files selected. You can upload a maximum of ${MAX_UPLOAD_FILES} files.`;
  }
  if (files.length > remainingSlots) {
    return `You can add ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} to this order.`;
  }
  for (const file of files) {
    const ext = extensionOf(file.name);
    if (!ACCEPTED_UPLOAD_EXTENSIONS.includes(ext as (typeof ACCEPTED_UPLOAD_EXTENSIONS)[number])) {
      return `${file.name} is not a supported type. Use PDF, DOCX, or PPTX.`;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return `${file.name} is larger than ${formatBytes(MAX_UPLOAD_BYTES)}.`;
    }
  }
  return null;
}

export function FileUploader({ remainingSlots, disabled, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState<FailedFile[]>([]);

  async function send(files: File[]) {
    const problem = validateFiles(files, remainingSlots);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const result = await uploadsApi.upload(files, setProgress);
      onUploaded(result.uploadedFiles);
      const nextFailed: FailedFile[] = result.failedFiles.map((item) => {
        const match = files.find((file) => file.name === item.originalFilename);
        return { file: match || new File([], item.originalFilename), reason: item.reason };
      });
      setFailed(nextFailed);
      if (nextFailed.length) {
        setError(nextFailed.map((item) => `${item.file.name}: ${item.reason}`).join(" "));
      }
    } catch (err) {
      setFailed(files.map((file) => ({ file, reason: toUserMessage(err, "Upload failed.") })));
      setError(err instanceof ApiError ? toUserMessage(err, "Upload failed.") : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = "";
    if (!selected.length) return;
    void send(selected);
  }

  const accept = ACCEPTED_UPLOAD_EXTENSIONS.join(",");
  const full = remainingSlots <= 0;

  return (
    <div className="space-y-3">
      <Field
        label="Documents"
        htmlFor="order-files"
        hint={`PDF, DOCX, or PPTX. Up to ${MAX_UPLOAD_FILES} files per upload, about ${formatBytes(MAX_UPLOAD_BYTES)} each.`}
      >
        <Input
          id="order-files"
          type="file"
          multiple
          accept={accept}
          onChange={onPick}
          disabled={disabled || busy || full}
        />
      </Field>
      {progress != null ? (
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Upload progress"
        >
          <div className="h-full bg-harvest transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {failed.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || disabled}
            onClick={() => void send(failed.map((item) => item.file))}
          >
            Retry failed files
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setFailed([]); setError(""); }}>
            Dismiss
          </Button>
        </div>
      ) : null}
    </div>
  );
}
