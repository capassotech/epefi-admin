import type { FilterOptions } from "@/components/admin/SearchAndFilter";
import type { PaginatedResponse, StudentDB } from "@/types/types";
import { getFechaRegistroSeconds } from "@/utils/studentDates";

export function getEffectiveStudentFilters(
  filters: FilterOptions
): FilterOptions {
  return {
    ...filters,
    sortBy: !filters.sortBy || filters.sortBy === "none" ? "date" : filters.sortBy,
    sortDirection: filters.sortDirection ?? "desc",
  };
}

export function sortStudentsList(
  list: StudentDB[],
  filters: FilterOptions
): StudentDB[] {
  const key = filters.sortBy === "none" || !filters.sortBy ? "date" : filters.sortBy;
  const defaultDir: "asc" | "desc" = key === "date" ? "desc" : "asc";
  const asc = (filters.sortDirection ?? defaultDir) === "asc";
  const dir = asc ? 1 : -1;
  const out = [...list];
  switch (key) {
    case "name":
      out.sort(
        (a, b) =>
          dir *
          (a.nombre || "").localeCompare(b.nombre || "", undefined, {
            sensitivity: "base",
          })
      );
      break;
    case "email":
      out.sort(
        (a, b) =>
          dir *
          (a.email || "").localeCompare(b.email || "", undefined, {
            sensitivity: "base",
          })
      );
      break;
    case "date":
      out.sort((a, b) => {
        const diff =
          dir * (getFechaRegistroSeconds(a) - getFechaRegistroSeconds(b));
        if (diff !== 0) return diff;
        return (a.id || "").localeCompare(b.id || "");
      });
      break;
    default:
      return [...list];
  }
  return out;
}

function matchesSearch(student: StudentDB, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${student.nombre || ""} ${student.apellido || ""} ${student.email || ""} ${student.dni || ""}`.toLowerCase();
  return haystack.includes(q);
}

function matchesStatus(student: StudentDB, status?: string): boolean {
  if (!status || status === "all") return true;
  const activo = student.activo !== false;
  if (status === "active") return activo;
  if (status === "inactive") return !activo;
  return true;
}

function matchesRole(student: StudentDB, role?: string): boolean {
  if (!role || role === "all") return true;
  if (role === "admin") return Boolean(student.role?.admin);
  if (role === "student") return Boolean(student.role?.student);
  return true;
}

export function paginateStudentsClientSide(
  all: StudentDB[],
  options: {
    search: string;
    status?: string;
    role?: string;
    filters: FilterOptions;
    page: number;
    limit: number;
  }
): PaginatedResponse<StudentDB> {
  let list = all.filter(
    (s) =>
      matchesSearch(s, options.search) &&
      matchesStatus(s, options.status) &&
      matchesRole(s, options.role)
  );
  list = sortStudentsList(list, options.filters);

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / options.limit));
  const page = Math.min(Math.max(1, options.page), totalPages);
  const start = (page - 1) * options.limit;

  return {
    data: list.slice(start, start + options.limit),
    pagination: {
      page,
      limit: options.limit,
      total,
      totalPages,
    },
  };
}

export function mergeCreatedUserAtTop(
  rows: StudentDB[],
  created: StudentDB,
  filters: FilterOptions,
  limit: number
): StudentDB[] {
  const nowSec = Math.floor(Date.now() / 1000);
  const row: StudentDB = {
    ...created,
    fechaRegistro:
      created.fechaRegistro ??
      ({ _seconds: nowSec, _nanoseconds: 0 } as StudentDB["fechaRegistro"]),
  };
  const effectiveFilters = getEffectiveStudentFilters(filters);
  const merged = [row, ...rows.filter((s) => s.id !== row.id)];
  return sortStudentsList(merged, effectiveFilters).slice(0, limit);
}
