// Encabezados de tabla compartidos: ordenables y filtrables desde la columna.
// Requieren un `TooltipProvider` arriba en el árbol.
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnSort, SortDirection } from "@/utils/tableState";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const headerText = "text-xs font-medium uppercase tracking-wider";

/** Celda de encabezado sin interacción, con el mismo estilo que las ordenables */
export function PlainHeader({
  children,
  align = "left",
  className = "px-3",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        className,
        "py-2.5 text-gray-500",
        headerText,
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

/**
 * Encabezado ordenable. Ciclo por clic: asc → desc → sin orden de columna (null),
 * que vuelve al orden por defecto del listado (`defaultLabel`).
 */
export function SortableHeader({
  label,
  column,
  sortBy,
  sortDirection,
  onSortChange,
  defaultLabel = "orden por defecto",
  ascHint = "A → Z",
  descHint = "Z → A",
  align = "left",
  className = "px-3",
}: {
  label: string;
  column: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSortChange?: (sort: ColumnSort) => void;
  defaultLabel?: string;
  ascHint?: string;
  descHint?: string;
  align?: "left" | "right";
  className?: string;
}) {
  if (!onSortChange) {
    return (
      <PlainHeader align={align} className={className}>
        {label}
      </PlainHeader>
    );
  }

  const isActive = sortBy === column;
  const Icon = !isActive ? ChevronsUpDown : sortDirection === "desc" ? ArrowDown : ArrowUp;

  const handleClick = () => {
    if (!isActive) onSortChange({ sortBy: column, sortDirection: "asc" });
    else if (sortDirection !== "desc") onSortChange({ sortBy: column, sortDirection: "desc" });
    else onSortChange(null);
  };

  // Describe lo que hará el próximo clic
  const tooltip = !isActive
    ? `Ordenar por ${label.toLowerCase()} (${ascHint})`
    : sortDirection !== "desc"
      ? `Ordenar por ${label.toLowerCase()} (${descHint})`
      : `Quitar orden (volver a ${defaultLabel})`;

  return (
    <th
      className={cn(className, "py-2.5", align === "right" ? "text-right" : "text-left")}
      aria-sort={isActive ? (sortDirection === "desc" ? "descending" : "ascending") : "none"}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            aria-label={tooltip}
            className={cn(
              "group inline-flex items-center gap-1 transition-colors cursor-pointer",
              headerText,
              isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
            )}
          >
            {label}
            <Icon
              className={cn(
                "w-3.5 h-3.5 transition-opacity",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </th>
  );
}

/** Encabezado que abre un menú para filtrar por esa columna; "all" = sin filtro */
export function FilterHeader({
  label,
  tooltip,
  value,
  options,
  onChange,
  align = "left",
  className = "px-3",
}: {
  label: string;
  tooltip: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string | undefined) => void;
  align?: "left" | "right";
  className?: string;
}) {
  if (!onChange) {
    return (
      <PlainHeader align={align} className={className}>
        {label}
      </PlainHeader>
    );
  }

  const current = value && value !== "all" ? value : "all";
  const isActive = current !== "all";
  const activeLabel = options.find((o) => o.value === current)?.label;

  return (
    <th className={cn(className, "py-2.5", align === "right" ? "text-right" : "text-left")}>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "group inline-flex max-w-full items-center gap-1 transition-colors cursor-pointer",
                  headerText,
                  isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
                )}
              >
                {label}
                {isActive && (
                  <span className="truncate normal-case tracking-normal font-normal text-gray-500">
                    · {activeLabel}
                  </span>
                )}
                <ListFilter
                  className={cn(
                    "w-3.5 h-3.5 shrink-0 transition-opacity",
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-60 group-data-[state=open]:opacity-60"
                  )}
                />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align={align === "right" ? "end" : "start"}
          className="w-52 max-h-80 overflow-y-auto"
        >
          <DropdownMenuRadioGroup
            value={current}
            onValueChange={(next) => onChange(next === "all" ? undefined : next)}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </th>
  );
}

