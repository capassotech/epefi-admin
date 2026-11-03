import { Loader } from "lucide-react";

/**
 * Píldora flotante "Cargando…" que se superpone al listado.
 * Se usa junto con `listLoadingClass` (utils/tableState) en el contenedor.
 */
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
