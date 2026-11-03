import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

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

/** Píldora flotante "Cargando…" que se superpone al listado */
export function ListLoadingPill({ loading, label }: { loading: boolean; label: string }) {
  if (!loading) return null;
  return (
    <div
      data-loading-pill
      className="absolute inset-x-0 top-0 z-10 flex justify-center pt-16 pointer-events-none"
    >
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-xs text-gray-600 shadow-sm backdrop-blur">
        <Loader className="w-3.5 h-3.5 animate-spin" />
        {label}
      </div>
    </div>
  );
}
