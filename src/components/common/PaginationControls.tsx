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
  const scrollToTarget = () => {
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-gray-600">
        Mostrando {firstItem}-{lastItem} de {pagination.total}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="pagination-limit" className="text-sm text-gray-600">
            Por página
          </label>
          <select
            id="pagination-limit"
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

        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    onPageChange(currentPage - 1);
                    scrollToTarget();
                  }
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                        onPageChange(page);
                        scrollToTarget();
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
                  if (currentPage < totalPages) {
                    onPageChange(currentPage + 1);
                    scrollToTarget();
                  }
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
