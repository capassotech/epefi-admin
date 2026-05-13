import type { PaginatedResponse } from "@/types/types";

type AnyRecord = Record<string, unknown>;

const toNumberOr = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const normalizePaginatedResponse = <T>(response: unknown, fallbackPage: number, fallbackLimit: number): PaginatedResponse<T> => {
  if (Array.isArray(response)) {
    return {
      data: response as T[],
      pagination: {
        page: fallbackPage,
        limit: fallbackLimit,
        total: response.length,
        totalPages: Math.max(1, Math.ceil(response.length / fallbackLimit)),
      },
    };
  }

  const payload = (response ?? {}) as AnyRecord;
  const dataCandidate = payload.data;
  const data = Array.isArray(dataCandidate) ? (dataCandidate as T[]) : [];

  const paginationCandidate = (payload.pagination ?? payload.meta ?? {}) as AnyRecord;
  const page = toNumberOr(
    paginationCandidate.page ?? payload.page,
    fallbackPage
  );
  const limit = toNumberOr(
    paginationCandidate.limit ?? payload.limit,
    fallbackLimit
  );
  const total = toNumberOr(
    paginationCandidate.total ?? payload.total,
    data.length
  );
  const totalPages = toNumberOr(
    paginationCandidate.totalPages ?? payload.totalPages,
    Math.max(1, Math.ceil(Math.max(total, 1) / Math.max(limit, 1)))
  );

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
