// Estado y estilos compartidos de las tablas de listado (orden, filtros por columna, filas deshabilitadas)
import type { FilterOptions } from "@/components/admin/SearchAndFilter";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";
export type ColumnSort = { sortBy: string; sortDirection: SortDirection } | null;

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Habilitados" },
  { value: "inactive", label: "Deshabilitados" },
];

/** Aplica el orden elegido en un encabezado; null vuelve al orden por defecto del listado */
export function applyColumnSort(
  filters: FilterOptions,
  sort: ColumnSort,
  defaults: FilterOptions = {}
): FilterOptions {
  const next: FilterOptions = { ...filters };
  const sortBy = sort?.sortBy ?? defaults.sortBy;
  const sortDirection = sort?.sortDirection ?? defaults.sortDirection;
  if (sortBy) next.sortBy = sortBy;
  else delete next.sortBy;
  if (sortDirection) next.sortDirection = sortDirection;
  else delete next.sortDirection;
  return next;
}

/** Aplica (o quita, con undefined) un filtro elegido en un encabezado */
export function applyColumnFilter(
  filters: FilterOptions,
  key: "status" | "role" | "courseId",
  value: string | undefined
): FilterOptions {
  const next: FilterOptions = { ...filters };
  if (value) next[key] = value;
  else delete next[key];
  return next;
}

/** Texto de filas deshabilitadas: tachado en rojo y atenuado */
export const INACTIVE_ROW_TEXT = "text-gray-400 line-through decoration-red-500 decoration-[1.5px]";

export const inactiveRowClass = (isActive: boolean) =>
  isActive ? "hover:bg-gray-50" : "bg-red-50/40 hover:bg-red-50/70";

/**
 * Clases para el contenedor de un listado mientras se recarga (orden, filtros, página):
 * el contenido actual queda visible pero atenuado y sin interacción.
 */
export function listLoadingClass(loading: boolean, className?: string) {
  return cn(
    "relative [&>:not([data-loading-pill])]:transition-opacity [&>:not([data-loading-pill])]:duration-200",
    loading && "pointer-events-none [&>:not([data-loading-pill])]:opacity-50",
    className
  );
}
