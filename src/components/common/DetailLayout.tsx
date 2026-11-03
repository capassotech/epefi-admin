// Bloques compartidos de las pantallas de detalle: ficha lateral fija + contenido principal
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Dos columnas en desktop: ficha angosta (sticky) a la izquierda y contenido a la derecha */
export function DetailLayout({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] max-w-7xl mx-auto">
      {/* Si la ficha es más alta que la pantalla, scrollea por dentro para no cortar contenido */}
      <aside
        data-tour="detail-aside"
        className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      >
        {aside}
      </aside>
      <div data-tour="detail-main" className="min-w-0 space-y-6">
        {children}
      </div>
    </div>
  );
}

/** Ficha lateral: encabezado (media + título + badge), contenido libre y pie de acciones */
export function ProfileCard({
  media,
  title,
  subtitle,
  badge,
  cover,
  children,
  footer,
}: {
  /** Avatar/ícono chico junto al título */
  media?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  /** Imagen grande arriba de todo (portadas) */
  cover?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="admin-card overflow-hidden">
      {cover}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        {media}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900" title={typeof title === "string" ? title : undefined}>
            {title}
          </p>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
        {badge}
      </div>
      {children}
      {/* Acciones apiladas a todo el ancho: la principal primero, las secundarias debajo */}
      {footer && (
        <div data-tour="detail-actions" className="flex flex-col gap-1.5 px-5 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

export function InfoList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-gray-50 px-5">{children}</div>;
}

export function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-gray-400 [&_svg]:w-4 [&_svg]:h-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="mt-0.5 truncate text-sm text-gray-900">{children}</div>
      </div>
    </div>
  );
}

/** Fila de números de resumen (2 a 4 celdas) */
export function StatGrid({ stats }: { stats: { label: string; value: ReactNode }[] }) {
  return (
    <div
      className="grid gap-px border-y border-gray-100 bg-gray-100"
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white px-3 py-3 text-center">
          <p className="truncate text-base font-semibold tabular-nums text-gray-900">{stat.value}</p>
          <p className="text-[11px] text-gray-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Píldora de estado habilitado / deshabilitado */
export function StatusPill({
  active,
  activeLabel = "Habilitado",
  inactiveLabel = "Deshabilitado",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

/** Tarjeta de sección del contenido principal, con encabezado compacto */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  tourId,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Identificador para que el tutorial de la página pueda señalar esta sección */
  tourId?: string;
}) {
  return (
    <section data-tour={tourId} className={cn("admin-card overflow-hidden min-w-0", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Estado vacío/cargando dentro de una SectionCard */
export function SectionEmpty({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center text-sm text-gray-500 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:text-gray-300">
      {icon}
      {children}
    </div>
  );
}
