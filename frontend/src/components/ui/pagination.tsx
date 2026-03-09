"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  /** Current 0-based skip (offset). */
  skip: number;
  /** Page size (limit). */
  pageSize: number;
  /** Total number of items. */
  total: number;
  /** Called with new skip when page changes. */
  onPageChange: (newSkip: number) => void;
  /** Optional class for the wrapper. */
  className?: string;
}

export function Pagination({
  skip,
  pageSize,
  total,
  onPageChange,
  className = "",
}: PaginationProps) {
  const currentPage = pageSize > 0 ? Math.floor(skip / pageSize) + 1 : 1;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const hasPrev = skip > 0;
  const hasNext = skip + pageSize < total;
  const start = total === 0 ? 0 : skip + 1;
  const end = Math.min(skip + pageSize, total);

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}</span>
        –<span className="font-medium text-slate-700">{end}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, skip - pageSize))}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-slate-600 px-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(skip + pageSize)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
