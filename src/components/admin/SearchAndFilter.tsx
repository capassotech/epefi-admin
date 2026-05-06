import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { CreateUserModal } from "../students/CreateUserModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { type StudentDB } from "@/types/types";

export interface FilterOptions {
  status?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  role?: string;
  courseId?: string;
}

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onCreateNew?: (user?: StudentDB) => void;
  createButtonText?: string;
  filterOptions?: {
    sortOptions?: { value: string; label: string }[];
    courses?: { id: string; titulo: string }[];
  };
  hideCreateButton?: boolean;
  isStudentPage?: boolean;
  currentFilters?: FilterOptions;
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
    const normalizedValue = value === "all" || value === "none" ? undefined : value;
    const newFilters = {
      ...currentFilters,
      [key]: normalizedValue,
    };
    setCurrentFilters(newFilters);
    onFilter(newFilters);
  };

  const handleSortDirectionToggle = () => {
    const newDirection = currentFilters.sortDirection === "asc" ? "desc" : "asc";
    const newFilters: FilterOptions = {
      ...currentFilters,
      sortDirection: newDirection,
    };
    setCurrentFilters(newFilters);
    onFilter(newFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    const hasDateSort = filterOptions?.sortOptions?.some(
      (option) => option.value === "date"
    );
    const defaultFilters: FilterOptions =
      isStudentPage && hasDateSort
        ? {
            sortBy: "date",
            sortDirection: "desc",
          }
        : {};
    setCurrentFilters(defaultFilters);
    onSearch("");
    onFilter(defaultFilters);
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
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400" />

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
              value={currentFilters.courseId || "all"}
              onValueChange={(value) => handleFilterChange("courseId", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Curso asignado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin orden</SelectItem>
                {filterOptions.sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterOptions?.sortOptions && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSortDirectionToggle}
              className="px-3"
              title={
                currentFilters.sortDirection === "asc"
                  ? "Orden ascendente (A-Z / más antiguos primero)"
                  : "Orden descendente (Z-A / más recientes primero)"
              }
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {currentFilters.sortDirection === "asc" ? "Asc" : "Desc"}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={handleClearFilters}
          >
            Limpiar filtros
          </Button>
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
