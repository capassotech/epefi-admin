import { X } from "lucide-react";

export type FilterChip = { key: string; label: string; onRemove: () => void };

/** Un badge por filtro aplicado; cada uno se quita al hacer clic. "Limpiar todo" con 2 o más */
export function FilterChips({ chips, onClearAll }: { chips: FilterChip[]; onClearAll: () => void }) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-white py-0.5 pl-2.5 pr-1.5 text-xs text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
          title="Quitar filtro"
          aria-label={`Quitar filtro ${chip.label}`}
        >
          <span className="truncate">{chip.label}</span>
          <X className="w-3 h-3 shrink-0 text-gray-400 group-hover:text-gray-700" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="px-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
