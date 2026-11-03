// Orden y filtros para las listas en mobile, donde no hay encabezados de tabla.
// Usa las mismas opciones que los encabezados de escritorio.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowUpDown, Check, ChevronDown, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnSort, SortDirection } from "@/utils/tableState";

type Option = { value: string; label: string };

export type MobileSortField = {
  key: string;
  label: string;
  ascLabel?: string;
  descLabel?: string;
};

export type MobileFilter = {
  id: string;
  label: string;
  value?: string;
  /** La opción "all" representa "sin filtro" */
  options: Option[];
  onChange: (value: string | undefined) => void;
};

const DEFAULT_SORT = "__default";

const ControlButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; icon: ReactNode }
>(({ active, icon, children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        "inline-flex h-8 max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors cursor-pointer [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:shrink-0",
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        className
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      <ChevronDown className="opacity-60" />
    </button>
  );
});
ControlButton.displayName = "ControlButton";

export function MobileListControls({
  sort,
  filters = [],
  className,
}: {
  sort?: {
    fields: MobileSortField[];
    sortBy?: string;
    sortDirection?: SortDirection;
    onChange: (sort: ColumnSort) => void;
    /** Cómo se llama el orden por defecto del listado (ej. "Más recientes") */
    defaultLabel: string;
  };
  filters?: MobileFilter[];
  className?: string;
}) {
  const sortItems = sort
    ? sort.fields.flatMap((field) => [
        { value: `${field.key}:asc`, label: `${field.label} (${field.ascLabel ?? "A → Z"})` },
        { value: `${field.key}:desc`, label: `${field.label} (${field.descLabel ?? "Z → A"})` },
      ])
    : [];
  const currentSort =
    sort && sort.sortBy && sortItems.some((item) => item.value === `${sort.sortBy}:${sort.sortDirection ?? "asc"}`)
      ? `${sort.sortBy}:${sort.sortDirection ?? "asc"}`
      : DEFAULT_SORT;
  const currentSortLabel =
    currentSort === DEFAULT_SORT ? sort?.defaultLabel : sortItems.find((item) => item.value === currentSort)?.label;

  return (
    <div className={cn("md:hidden -mx-4 flex gap-2 overflow-x-auto px-4 pb-1", className)}>
      {sort && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ControlButton active={currentSort !== DEFAULT_SORT} icon={<ArrowUpDown />}>
              {currentSortLabel}
            </ControlButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-xs text-gray-500">Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={currentSort}
              onValueChange={(value) => {
                if (value === DEFAULT_SORT) return sort.onChange(null);
                const [sortBy, sortDirection] = value.split(":");
                sort.onChange({ sortBy, sortDirection: sortDirection as SortDirection });
              }}
            >
              <DropdownMenuRadioItem value={DEFAULT_SORT}>{sort.defaultLabel}</DropdownMenuRadioItem>
              {sortItems.map((item) => (
                <DropdownMenuRadioItem key={item.value} value={item.value}>
                  {item.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {filters.map((filter) => {
        const current = filter.value && filter.value !== "all" ? filter.value : "all";
        const isActive = current !== "all";
        const activeLabel = filter.options.find((o) => o.value === current)?.label;
        return (
          <DropdownMenu key={filter.id}>
            <DropdownMenuTrigger asChild>
              <ControlButton active={isActive} icon={isActive ? <Check /> : <ListFilter />}>
                {isActive ? activeLabel : filter.label}
              </ControlButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs text-gray-500">{filter.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={current}
                onValueChange={(value) => filter.onChange(value === "all" ? undefined : value)}
              >
                {filter.options.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}
