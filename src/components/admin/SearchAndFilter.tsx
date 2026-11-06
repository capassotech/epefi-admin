import { useState, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Plus, User } from "lucide-react";
import { FilterChips, type FilterChip } from "@/components/common/FilterChips";
import { Button } from "@/components/ui/button";
import type { StudentDB } from "@/types/types";

export interface FilterOptions {
  status?: string;
  sortBy?: string;
  /** Dirección de orden enviada al backend como sortOrder */
  sortDirection?: "asc" | "desc";
  role?: string;
  courseId?: string;
}

const SORT_LABELS: Record<string, string> = {
  date: "Fecha de creación",
  name: "Nombre",
  email: "Email",
  title: "Título",
  price: "Precio",
};
const ROLE_LABELS: Record<string, string> = { student: "Estudiante", admin: "Administrador" };
const STATUS_LABELS: Record<string, string> = { active: "Habilitados", inactive: "Deshabilitados" };

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onCreateNew?: (user?: StudentDB, meta?: { isCreate: boolean }) => void;
  createButtonText?: string;
  filterOptions?: {
    sortOptions?: { value: string; label: string }[];
    courses?: { id: string; titulo: string }[];
  };
  hideCreateButton?: boolean;
  isStudentPage?: boolean;
  currentFilters?: FilterOptions;
  /** Tras «Limpiar filtros» se aplican estos valores (misma forma que el estado inicial del listado) */
  resetFiltersTo?: FilterOptions;
  /** Mostrar acción de limpiar (listados con muchos filtros) */
  showClearFilters?: boolean;
  hideUnsortedOption?: boolean;
  showStateFilter?: boolean;
  /** Oculta el selector de rol (p. ej. cuando el filtro vive en el encabezado de la tabla) */
  hideRoleFilter?: boolean;
  /** Botones extra junto a la acción principal (p. ej. «Ver realizados») */
  extraActions?: ReactNode;
}

export const SearchAndFilter = ({
  onSearch,
  onFilter,
  onCreateNew,
  createButtonText = "Crear Nuevo",
  isStudentPage = false,
  filterOptions,
  hideCreateButton = false,
  currentFilters: externalFilters,
  resetFiltersTo,
  showClearFilters = false,
  hideUnsortedOption = false,
  showStateFilter = true,
  hideRoleFilter = false,
  extraActions,
}: SearchAndFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>(externalFilters || {});
  
  // Sincronizar filtros externos con el estado interno
  useEffect(() => {
    if (externalFilters) {
      setCurrentFilters(externalFilters);
    }
  }, [externalFilters]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters: FilterOptions = { ...currentFilters };

    if (key === "status") {
      if (value === "all") delete newFilters.status;
      else newFilters.status = value;
    } else if (key === "role") {
      if (value === "all") delete newFilters.role;
      else newFilters.role = value;
    } else if (key === "courseId") {
      if (value === "all" || value === "__unfiltered__") delete newFilters.courseId;
      else newFilters.courseId = value;
    } else if (key === "sortBy") {
      if (value === "none") {
        delete newFilters.sortBy;
        delete newFilters.sortDirection;
      } else {
        newFilters.sortBy = value;
        if (!newFilters.sortDirection) {
          newFilters.sortDirection = value === "date" ? "desc" : "asc";
        }
      }
    }

    setCurrentFilters(newFilters);
    onFilter(newFilters);
  };

  const defaultSortDirection = (
    sortKey: string | undefined
  ): "asc" | "desc" => (sortKey === "date" ? "desc" : "asc");

  const handleSortDirectionToggle = () => {
    const sortBy = currentFilters.sortBy;
    const effectiveDir =
      currentFilters.sortDirection ?? defaultSortDirection(sortBy || "date");
    const next: FilterOptions = {
      ...currentFilters,
      sortBy: sortBy || "date",
      sortDirection: effectiveDir === "asc" ? "desc" : "asc",
    };
    setCurrentFilters(next);
    onFilter(next);
  };

  const handleClearFilters = () => {
    const next = resetFiltersTo ? { ...resetFiltersTo } : {};
    setSearchQuery("");
    setCurrentFilters(next);
    onSearch("");
    onFilter(next);
  };

  /** Vuelve una o más claves a su valor inicial (o las quita si no tienen) */
  const resetKeys = (keys: (keyof FilterOptions)[]) => {
    const next: FilterOptions = { ...currentFilters };
    for (const key of keys) {
      const initial = resetFiltersTo?.[key];
      if (initial === undefined) delete next[key];
      else (next as Record<string, unknown>)[key] = initial;
    }
    setCurrentFilters(next);
    onFilter(next);
  };

  // Un badge por cada filtro que difiere del estado inicial
  const differs = (key: keyof FilterOptions) =>
    (currentFilters[key] ?? undefined) !== (resetFiltersTo?.[key] ?? undefined);

  const activeChips: FilterChip[] = [];
  if (searchQuery.trim()) {
    activeChips.push({
      key: "search",
      label: `“${searchQuery.trim()}”`,
      onRemove: () => handleSearchChange(""),
    });
  }
  if (differs("sortBy") || differs("sortDirection")) {
    const sortKey = currentFilters.sortBy;
    const sortLabel =
      filterOptions?.sortOptions?.find((o) => o.value === sortKey)?.label ??
      SORT_LABELS[sortKey ?? ""] ??
      sortKey;
    const dir = currentFilters.sortDirection ?? defaultSortDirection(sortKey);
    activeChips.push({
      key: "sort",
      label: `Orden: ${sortLabel} ${dir === "asc" ? "↑" : "↓"}`,
      onRemove: () => resetKeys(["sortBy", "sortDirection"]),
    });
  }
  if (differs("role") && currentFilters.role) {
    activeChips.push({
      key: "role",
      label: `Rol: ${ROLE_LABELS[currentFilters.role] ?? currentFilters.role}`,
      onRemove: () => resetKeys(["role"]),
    });
  }
  if (differs("status") && currentFilters.status) {
    activeChips.push({
      key: "status",
      label: `Estado: ${STATUS_LABELS[currentFilters.status] ?? currentFilters.status}`,
      onRemove: () => resetKeys(["status"]),
    });
  }
  if (differs("courseId") && currentFilters.courseId) {
    const courseLabel =
      currentFilters.courseId === "none"
        ? "Sin curso asignado"
        : filterOptions?.courses?.find((c) => c.id === currentFilters.courseId)?.titulo ?? "Curso";
    activeChips.push({
      key: "course",
      label: `Curso: ${courseLabel}`,
      onRemove: () => resetKeys(["courseId"]),
    });
  }

  return (
    <div className="w-full space-y-3">
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
      <div className="flex flex-col w-full gap-3 sm:flex-row sm:flex-1 sm:gap-4 sm:items-center">
        {/* Búsqueda */}
        <div className="relative w-full sm:w-72 sm:shrink-0 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto sm:flex-1 min-h-10">
          {(showStateFilter ||
            (isStudentPage && !hideRoleFilter) ||
            (isStudentPage && !!filterOptions?.courses?.length) ||
            !!filterOptions?.sortOptions) && (
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          )}

          {/* Estado */}
          {showStateFilter && (
            <Select
              value={currentFilters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Rol - Solo mostrar en la página de estudiantes */}
          {isStudentPage && !hideRoleFilter && (
            <Select
              value={currentFilters.role || "all"}
              onValueChange={(value) => handleFilterChange("role", value)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="student">Estudiante</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Curso asignado - Solo en la página de estudiantes */}
          {isStudentPage && filterOptions?.courses && filterOptions.courses.length > 0 && (
            <Select
              value={currentFilters.courseId ?? "__unfiltered__"}
              onValueChange={(value) => handleFilterChange("courseId", value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Curso asignado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unfiltered__">Sin filtrar por curso</SelectItem>
                <SelectItem value="none">Sin curso asignado</SelectItem>
                {filterOptions.courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Ordenar por */}
          {filterOptions?.sortOptions && (
            <Select
              value={
                currentFilters.sortBy ||
                (hideUnsortedOption ? "date" : "none")
              }
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger className="w-full sm:w-40 sm:min-w-[10rem]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {!hideUnsortedOption && (
                  <SelectItem value="none">Sin ordenar</SelectItem>
                )}
                {filterOptions.sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Misma línea: Desc + Limpiar + Crear (mobile) */}
          {(!!(
            filterOptions?.sortOptions &&
            (currentFilters.sortBy || (hideUnsortedOption && "date"))
          ) ||
            (!hideCreateButton && onCreateNew)) && (
            <div className="flex w-full min-w-0 flex-nowrap items-center gap-1.5 sm:w-auto sm:gap-2">
              {filterOptions?.sortOptions &&
                (currentFilters.sortBy ||
                  (hideUnsortedOption && "date")) && (
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 h-10 px-2.5 sm:px-3"
                    onClick={handleSortDirectionToggle}
                    title={
                      (currentFilters.sortDirection ??
                        defaultSortDirection(currentFilters.sortBy)) === "asc"
                        ? "Orden ascendente"
                        : "Orden descendente"
                    }
                  >
                    <ArrowUpDown className="w-4 h-4 mr-1" />
                    {(currentFilters.sortDirection ??
                      defaultSortDirection(currentFilters.sortBy)) === "asc"
                      ? "Asc"
                      : "Desc"}
                  </Button>
                )}
              {!hideCreateButton && onCreateNew && (
                <div className="sm:hidden flex-1 min-w-0 ml-auto">
                  {isStudentPage ? (
                    <Button
                      onClick={() => onCreateNew?.()}
                      className="cursor-pointer w-full justify-center px-4"
                      data-tour="create-user"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Crear usuario
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onCreateNew?.()}
                      className="cursor-pointer w-full justify-center px-4"
                      data-tour="create-course"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createButtonText}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {(extraActions || (!hideCreateButton && onCreateNew)) && (
        <div
          className={`flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 ${
            !extraActions && !hideCreateButton && onCreateNew
              ? "hidden sm:flex"
              : ""
          }`}
        >
          {extraActions}
          {!hideCreateButton && onCreateNew && (
            <div className={extraActions ? "hidden sm:block" : undefined}>
              {isStudentPage ? (
                <Button
                  onClick={() => onCreateNew?.()}
                  className="cursor-pointer"
                  data-tour="create-user"
                >
                  <User className="w-4 h-4 mr-2" />
                  {createButtonText}
                </Button>
              ) : (
                <Button
                  onClick={() => onCreateNew?.()}
                  className="cursor-pointer"
                  data-tour="create-course"
                >
                  <Plus className="w-4 h-4 mr-2 cursor-pointer" />
                  {createButtonText}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>

      {/* Filtros aplicados: cada badge quita su filtro */}
      {showClearFilters && <FilterChips chips={activeChips} onClearAll={handleClearFilters} />}
    </div>
  );
};
