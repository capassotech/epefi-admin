import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowUpDown, Plus } from "lucide-react";
import { CreateUserModal } from "../students/CreateUserModal";
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

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-1 gap-4 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Estado */}
          <Select
            value={currentFilters.status || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          {/* Rol - Solo mostrar en la página de estudiantes */}
          {isStudentPage && (
            <Select
              value={currentFilters.role || "all"}
              onValueChange={(value) => handleFilterChange("role", value)}
            >
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-48">
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
              value={currentFilters.sortBy || "none"}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger className="w-40 min-w-[10rem]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin ordenar</SelectItem>
                {filterOptions.sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterOptions?.sortOptions && currentFilters.sortBy && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleSortDirectionToggle}
              title={
                (currentFilters.sortDirection ??
                  defaultSortDirection(currentFilters.sortBy)) === "asc"
                  ? "Orden ascendente"
                  : "Orden descendente"
              }
            >
              <ArrowUpDown className="w-4 h-4 mr-1.5" />
              {(currentFilters.sortDirection ??
                defaultSortDirection(currentFilters.sortBy)) === "asc"
                ? "Asc"
                : "Desc"}
            </Button>
          )}

          {showClearFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>


      {!hideCreateButton && onCreateNew && (
        isStudentPage ? (
          <CreateUserModal onUserCreated={onCreateNew} triggerText={createButtonText} />
        ) : (
          <Button onClick={onCreateNew} className="cursor-pointer" data-tour="create-course">
            <Plus className="w-4 h-4 mr-2 cursor-pointer" />
            {createButtonText}
          </Button>
        )
      )}
    </div>
  );
};
