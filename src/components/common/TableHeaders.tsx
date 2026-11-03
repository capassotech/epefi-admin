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
  trailing,
  firstDirection = "asc",
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
  /** Contenido extra junto al encabezado (ej: un FilterMenuButton) */
  trailing?: ReactNode;
  /** Dirección del primer clic (ej: "desc" para fechas, más recientes primero) */
  firstDirection?: SortDirection;
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

  // Ciclo: primera dirección → la opuesta → sin orden de columna
  const secondDirection: SortDirection = firstDirection === "asc" ? "desc" : "asc";
  const currentDirection = sortDirection ?? firstDirection;
  const hint = (dir: SortDirection) => (dir === "asc" ? ascHint : descHint);

  const handleClick = () => {
    if (!isActive) onSortChange({ sortBy: column, sortDirection: firstDirection });
    else if (currentDirection === firstDirection) onSortChange({ sortBy: column, sortDirection: secondDirection });
    else onSortChange(null);
  };

  // Describe lo que hará el próximo clic
  const tooltip = !isActive
    ? `Ordenar por ${label.toLowerCase()} (${hint(firstDirection)})`
    : currentDirection === firstDirection
      ? `Ordenar por ${label.toLowerCase()} (${hint(secondDirection)})`
      : `Quitar orden (volver a ${defaultLabel})`;

  return (
    <th
      className={cn(className, "py-2.5", align === "right" ? "text-right" : "text-left")}
      aria-sort={isActive ? (sortDirection === "desc" ? "descending" : "ascending") : "none"}
    >
      <div className="group/header inline-flex items-center gap-1">
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
      {trailing}
      </div>
    </th>
  );
}

/**
 * Botón de solo ícono que abre un menú de filtro; va dentro de otro encabezado
 * (cuando la columna filtrada no tiene encabezado propio). "all" = sin filtro.
 */
export function FilterMenuButton({
  tooltip,
  value,
  options,
  onChange,
}: {
  tooltip: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  const current = value && value !== "all" ? value : "all";
  const isActive = current !== "all";

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={tooltip}
              className={cn(
                "grid place-items-center rounded p-0.5 transition-all cursor-pointer hover:bg-gray-200/60",
                isActive
                  ? "text-gray-900"
                  : "text-gray-300 hover:text-gray-700 focus-visible:text-gray-700 data-[state=open]:text-gray-700"
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-52">
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
                    "w-3.5 h-3.5 shrink-0 transition-colors",
                    isActive
                      ? "text-gray-900"
                      : "text-gray-300 group-hover:text-gray-600 group-data-[state=open]:text-gray-600"
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

