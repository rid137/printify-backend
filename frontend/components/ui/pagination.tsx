"use client";

import { Button } from "./button";
import type { PaginationMeta } from "@/lib/api/types";

export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta;
  onPage: (page: number) => void;
}) {
  const { currentPage, totalPages, totalDocuments, perPage } = meta;
  if (totalPages <= 1 && totalDocuments <= perPage) {
    return totalDocuments ? (
      <p className="text-sm text-subtle">
        {totalDocuments} result{totalDocuments === 1 ? "" : "s"}
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-subtle">
        Page {currentPage} of {Math.max(totalPages, 1)} · {totalDocuments.toLocaleString()}{" "}
        {totalDocuments === 1 ? "result" : "results"}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPage(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPage(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
