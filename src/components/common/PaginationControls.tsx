import { Fragment } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/types/types";
import type { RefObject } from "react";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
  scrollTargetRef?: RefObject<HTMLElement | null>;
}

const getVisiblePages = (currentPage: number, totalPages: number): number[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, totalPages];
  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
};

export const PaginationControls = ({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50],
  scrollTargetRef,
}: PaginationControlsProps) => {
  const currentPage = Math.max(1, pagination.page);
  const totalPages = Math.max(1, pagination.totalPages);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const firstItem = pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1;
  const lastItem = Math.min(currentPage * pagination.limit, pagination.total);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const scrollToTarget = () => {
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goToPage = (page: number) => {
    onPageChange(page);
    scrollToTarget();
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Desktop meta + limit */}
      <div className="hidden sm:flex items-center gap-4">
        <p className="text-sm text-gray-600 shrink-0">
          Mostrando {firstItem}-{lastItem} de {pagination.total}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="pagination-limit-desktop" className="text-sm text-gray-600">
            Por página
          </label>
          <select
            id="pagination-limit-desktop"
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
            value={pagination.limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              scrollToTarget();
            }}
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile: bloque único compacto */}
      <div className="sm:hidden w-full rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/80">
          <p className="text-xs text-gray-500 tabular-nums">
            {firstItem}–{lastItem} de {pagination.total}
          </p>
          <div className="flex items-center gap-1.5">
            <label htmlFor="pagination-limit-mobile" className="text-xs text-gray-500">
              Por pág.
            </label>
            <select
              id="pagination-limit-mobile"
              className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700"
              value={pagination.limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value));
                scrollToTarget();
              }}
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-stretch">
          <button
            type="button"
            disabled={!canGoPrev}
            aria-label="Página anterior"
            onClick={() => goToPage(currentPage - 1)}
            className="flex h-11 items-center justify-center text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30 transition-colors border-r border-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center justify-center px-2 py-2">
            <span className="text-sm font-semibold text-gray-900 tabular-nums leading-none">
              {currentPage}
              <span className="mx-1 font-normal text-gray-400">/</span>
              {totalPages}
            </span>
            <span className="mt-0.5 text-[0.65rem] text-gray-400 leading-none">
              página
            </span>
          </div>

          <button
            type="button"
            disabled={!canGoNext}
            aria-label="Página siguiente"
            onClick={() => goToPage(currentPage + 1)}
            className="flex h-11 items-center justify-center text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30 transition-colors border-l border-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop: paginación numerada */}
      <Pagination className="mx-0 hidden w-auto sm:flex">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (canGoPrev) goToPage(currentPage - 1);
              }}
              className={!canGoPrev ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {visiblePages.map((page, index) => {
            const prev = visiblePages[index - 1];
            const shouldShowEllipsis = prev && page - prev > 1;

            return (
              <Fragment key={`page-group-${page}`}>
                {shouldShowEllipsis && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </Fragment>
            );
          })}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (canGoNext) goToPage(currentPage + 1);
              }}
              className={!canGoNext ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
