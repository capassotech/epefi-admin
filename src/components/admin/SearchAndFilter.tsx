import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";

export interface FilterOptions {
  status?: string;
  sortBy?: string;
}

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onCreateNew?: () => void;
  createButtonText?: string;
  filterOptions?: {
    sortOptions?: { value: string; label: string }[];
  };
  hideCreateButton?: boolean;
}

export const SearchAndFilter = ({
  onSearch,
  onFilter,
  onCreateNew,
  createButtonText = "Crear Nuevo",
  filterOptions,
  hideCreateButton = false,
}: SearchAndFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...currentFilters, [key]: value };
    setCurrentFilters(newFilters);
    onFilter(newFilters);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-1 gap-4 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar formaciones..."
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

          {/* Ordenar por */}
          {filterOptions?.sortOptions && (
            <Select
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Botón crear (opcional) */}
      {!hideCreateButton && onCreateNew && (
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          {createButtonText}
        </Button>
      )}
    </div>
  );
};
