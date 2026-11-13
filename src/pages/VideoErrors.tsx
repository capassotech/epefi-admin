import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  FileWarning,
  RefreshCw,
  Search,
  Smartphone,
  Users,
  VideoOff,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { usePageHeader } from "@/context/PageHeaderContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IconAction } from "@/components/ui/icon-action";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { cn } from "@/lib/utils";
import { CoursesAPI } from "@/service/courses";
import { VideoErrorsAPI, type VideoError, type VideoErrorOccurrence } from "@/service/videoErrors";
import { formatRelativeTime } from "@/utils/dashboardMetrics";
import { formatTimestamp } from "@/utils/formatTimestamp";

type Cause = "archivo" | "conexion" | "otro";
type CauseFilter = Cause | "todos";
type SortMode = "recientes" | "fallas";

/** Tiempo para deshacer "Marcar como resuelto" antes de borrar el registro. */
const UNDO_MS = 5000;

const CAUSES: Record<
  Cause,
  { label: string; icon: LucideIcon; pill: string; chip: string; tip: string }
> = {
  archivo: {
    label: "Archivo",
    icon: FileWarning,
    pill: "bg-red-50 text-red-700",
    chip: "bg-red-50 text-red-600",
    tip: "El navegador no pudo leer el video. Reconvertilo a MP4 (H.264) y volvé a subirlo.",
  },
  conexion: {
    label: "Conexión",
    icon: WifiOff,
    pill: "bg-amber-50 text-amber-700",
    chip: "bg-amber-50 text-amber-600",
    tip: "Se cortó la descarga, casi siempre por la red del alumno. Si le pasa a muchos, el archivo puede ser muy pesado.",
  },
  otro: {
    label: "Sin datos",
    icon: AlertTriangle,
    pill: "bg-gray-100 text-gray-600",
    chip: "bg-gray-100 text-gray-500",
    tip: "El navegador no informó la causa. Probá abrir el video para ver si carga.",
  },
};

const causeOf = (codigo: number | null): Cause =>
  codigo === 3 || codigo === 4 ? "archivo" : codigo === 2 ? "conexion" : "otro";

/** Causa más frecuente entre las últimas fallas del video. */
function mainCause(row: VideoError): Cause {
  const counts: Record<Cause, number> = { archivo: 0, conexion: 0, otro: 0 };
  row.ultimas.forEach((o) => (counts[causeOf(o.codigo)] += 1));
  if (counts.archivo > 0 && counts.archivo >= counts.conexion) return "archivo";
  if (counts.conexion > 0) return "conexion";
  return "otro";
}

/** "Android 13 · SM-A135M · Chrome" a partir del user agent. */
function describeDevice(ua: string | null): { full: string; short: string } {
  if (!ua) return { full: "Dispositivo desconocido", short: "Desconocido" };
  let os = "";
  let model = "";
  const android = ua.match(/Android ([\d.]+);\s*([^;)]+)?/);
  const ios = ua.match(/(iPhone|iPad)[^)]*OS (\d+)[_\d]*/);
  if (android) {
    os = `Android ${android[1]}`;
    const m = android[2]?.replace(/Build\/.*/, "").trim();
    if (m && m !== "K") model = m;
  } else if (ios) {
    os = `${ios[1]} iOS ${ios[2]}`;
  } else if (/Windows/.test(ua)) {
    os = "Windows";
  } else if (/Mac OS X/.test(ua)) {
    os = "Mac";
  }
  const browser = /SamsungBrowser/.test(ua)
    ? "Samsung Internet"
    : /EdgA?\//.test(ua)
      ? "Edge"
      : /Firefox|FxiOS/.test(ua)
        ? "Firefox"
        : /CriOS|Chrome/.test(ua)
          ? "Chrome"
          : /Safari/.test(ua)
            ? "Safari"
            : "";
  const full = [os, model, browser].filter(Boolean).join(" · ") || "Dispositivo desconocido";
  const short = [os.split(" ")[0], browser].filter(Boolean).join(" · ") || "Desconocido";
  return { full, short };
}

/** Dispositivos agrupados ("Android · Chrome" ×4), los más repetidos primero. */
function deviceSummary(ultimas: VideoErrorOccurrence[]) {
  const counts = new Map<string, number>();
  ultimas.forEach((o) => {
    const key = describeDevice(o.dispositivo).short;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function CausePill({ cause }: { cause: Cause }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", CAUSES[cause].pill)}>
      {CAUSES[cause].label}
    </span>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
  index,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  active?: boolean;
  onClick?: () => void;
  index: number;
}) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg [&_svg]:h-4 [&_svg]:w-4", tone)}>
          <Icon />
        </span>
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">{value}</p>
    </>
  );
  const className = cn(
    "rounded-xl border bg-white p-3.5 text-left transition-all duration-200 sm:p-4",
    active ? "border-orange-300 ring-2 ring-orange-200" : "border-gray-200/70"
  );
  const style = { animation: "fadeInUp 0.4s ease-out both", animationDelay: `${index * 50}ms` };

  if (!onClick) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(className, "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:shadow-gray-200/60")}
      style={style}
    >
      {content}
    </button>
  );
}

function SegmentedSort({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
  const options: { value: SortMode; label: string }[] = [
    { value: "recientes", label: "Recientes" },
    { value: "fallas", label: "Más fallas" },
  ];
  return (
    <div className="inline-flex h-10 shrink-0 rounded-lg border border-gray-200 bg-white p-1" role="group" aria-label="Ordenar">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-md px-3 text-sm font-medium transition-colors cursor-pointer",
            value === o.value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Contenedor que anima la altura al abrir/cerrar. */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function VideoRow({
  row,
  course,
  open,
  onToggle,
  onResolve,
  index,
}: {
  row: VideoError;
  course?: string;
  open: boolean;
  onToggle: () => void;
  onResolve: () => void;
  index: number;
}) {
  const cause = mainCause(row);
  const { icon: CauseIcon, chip, tip } = CAUSES[cause];
  const alumnos = new Set(row.ultimas.map((o) => o.uid)).size;
  const devices = deviceSummary(row.ultimas);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(row.url);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <li
      className={cn("transition-colors", open && "bg-gray-50/70")}
      style={{ animation: "fadeInUp 0.35s ease-out both", animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
      >
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl [&_svg]:h-5 [&_svg]:w-5", chip)}>
          <CauseIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{row.material || "Video sin nombre"}</p>
          <p className="truncate text-xs text-gray-500">
            {course ? `${course} · ` : ""}
            {plural(alumnos, "alumno", "alumnos")} · {formatRelativeTime(row.ultimaFecha)}
          </p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-lg font-semibold leading-none text-gray-900 tabular-nums">{row.total}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">{row.total === 1 ? "falla" : "fallas"}</p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 tabular-nums sm:hidden">
          {row.total}
        </span>
        <CausePill cause={cause} />
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <Collapse open={open}>
        <div className="space-y-4 px-4 pb-4 pt-1 sm:pl-[4.25rem]">
          {/* Qué hacer + acciones */}
          <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm", CAUSES[cause].pill)}>
            <CauseIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{tip}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 sm:h-9 sm:flex-none"
              onClick={() => window.open(row.url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Probar video
            </Button>
            <Button type="button" variant="outline" className="h-11 flex-1 sm:h-9 sm:flex-none" onClick={() => void copyLink()}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar link
            </Button>
            <Button
              type="button"
              className="h-11 w-full bg-green-600 text-white hover:bg-green-700 sm:h-9 sm:w-auto"
              onClick={onResolve}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar resuelto
            </Button>
          </div>

          {/* Dispositivos */}
          {devices.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-gray-400" aria-hidden />
              {devices.map(([name, count]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-700"
                >
                  {name}
                  {count > 1 && <span className="font-semibold text-gray-900">×{count}</span>}
                </span>
              ))}
            </div>
          )}

          {/* Últimas fallas */}
          <ul role="list" className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200/70 bg-white">
            {row.ultimas.map((o, i) => {
              const device = describeDevice(o.dispositivo);
              const who = o.email || o.uid;
              return (
                <li key={`${o.fecha}-${i}`} className="flex items-center gap-3 px-3 py-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-semibold uppercase text-gray-600">
                    {who.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-900">{who}</p>
                    <p className="truncate text-xs text-gray-500" title={o.dispositivo ?? undefined}>
                      {device.full}
                      {o.conexion ? ` · ${o.conexion}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <CausePill cause={causeOf(o.codigo)} />
                    <span className="text-[11px] text-gray-500" title={formatTimestamp(o.fecha)}>
                      {formatRelativeTime(o.fecha)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Collapse>
    </li>
  );
}

export default function VideoErrors() {
  usePageHeader({ title: "Errores de video" });
  const [rows, setRows] = useState<VideoError[]>([]);
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cause, setCause] = useState<CauseFilter>("todos");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recientes");
  /** Registros marcados como resueltos que todavía se pueden deshacer. */
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await VideoErrorsAPI.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los errores de video");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    CoursesAPI.getAllList()
      .then((list) => setCourseTitles(Object.fromEntries(list.map((c) => [c.id, c.titulo]))))
      .catch(() => {
        // Sin títulos se muestra solo el material
      });
  }, [load]);

  // Al salir de la página se confirman los "resuelto" que estaban esperando
  useEffect(() => {
    const pending = pendingDeletes.current;
    return () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer);
        void VideoErrorsAPI.resolve(id).catch(() => undefined);
      });
      pending.clear();
    };
  }, []);

  const visibleRows = useMemo(() => rows.filter((r) => !hidden.has(r.id)), [rows, hidden]);

  const stats = useMemo(() => {
    const byCause: Record<Cause, number> = { archivo: 0, conexion: 0, otro: 0 };
    const alumnos = new Set<string>();
    visibleRows.forEach((r) => {
      byCause[mainCause(r)] += 1;
      r.ultimas.forEach((o) => alumnos.add(o.uid));
    });
    return { byCause, alumnos: alumnos.size };
  }, [visibleRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = visibleRows.filter((r) => {
      if (cause !== "todos" && mainCause(r) !== cause) return false;
      if (!q) return true;
      const course = r.idCurso ? courseTitles[r.idCurso] ?? "" : "";
      return (
        (r.material ?? "").toLowerCase().includes(q) ||
        course.toLowerCase().includes(q) ||
        r.ultimas.some((o) => (o.email ?? "").toLowerCase().includes(q))
      );
    });
    return sort === "fallas"
      ? [...list].sort((a, b) => b.total - a.total)
      : [...list].sort((a, b) => b.ultimaFecha.localeCompare(a.ultimaFecha));
  }, [visibleRows, cause, search, sort, courseTitles]);

  const toggleCause = (next: Cause) => setCause((prev) => (prev === next ? "todos" : next));
  const clearFilters = () => {
    setCause("todos");
    setSearch("");
  };

  const undoResolve = (id: string) => {
    const timer = pendingDeletes.current.get(id);
    if (timer) clearTimeout(timer);
    pendingDeletes.current.delete(id);
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const resolve = (row: VideoError) => {
    setHidden((prev) => new Set(prev).add(row.id));
    setExpanded(null);
    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(row.id);
      try {
        await VideoErrorsAPI.resolve(row.id);
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } catch (err) {
        undoResolve(row.id);
        toast.error(err instanceof Error ? err.message : "No se pudo marcar como resuelto");
      }
    }, UNDO_MS);
    pendingDeletes.current.set(row.id, timer);
    toast.success(`“${row.material || "Video"}” resuelto`, {
      duration: UNDO_MS,
      action: { label: "Deshacer", onClick: () => undoResolve(row.id) },
    });
  };

  if (loading && rows.length === 0 && !error) {
    return <InteractiveLoader initialMessage="Cargando errores de video" delayedMessage="Buscando videos con fallas" />;
  }

  const hasFilters = cause !== "todos" || search.trim() !== "";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        {/* Resumen: los tiles de causa filtran la lista */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile
            index={0}
            label="Videos"
            value={visibleRows.length}
            icon={VideoOff}
            tone="bg-orange-50 text-orange-600"
            active={cause === "todos" && visibleRows.length > 0}
            onClick={() => setCause("todos")}
          />
          <StatTile
            index={1}
            label="Archivo"
            value={stats.byCause.archivo}
            icon={FileWarning}
            tone="bg-red-50 text-red-600"
            active={cause === "archivo"}
            onClick={() => toggleCause("archivo")}
          />
          <StatTile
            index={2}
            label="Conexión"
            value={stats.byCause.conexion}
            icon={WifiOff}
            tone="bg-amber-50 text-amber-600"
            active={cause === "conexion"}
            onClick={() => toggleCause("conexion")}
          />
          <StatTile index={3} label="Alumnos" value={stats.alumnos} icon={Users} tone="bg-blue-50 text-blue-600" />
        </div>

        {/* Búsqueda, orden y actualizar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar video, curso o alumno..."
              className="h-10 pl-10 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <SegmentedSort value={sort} onChange={setSort} />
            <IconAction label="Actualizar" onClick={() => void load()} disabled={loading} className="h-10 w-10">
              <RefreshCw className={cn(loading && "animate-spin")} />
            </IconAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Ayuda"
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-72">
                <p>Videos que algún alumno no pudo reproducir. Tocá uno para ver quién, con qué celular y qué hacer.</p>
                <p className="mt-1">Al marcarlo resuelto se quita de la lista; si vuelve a fallar, aparece de nuevo.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {error ? (
          <div className="admin-card flex flex-col items-center gap-3 px-6 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-gray-700">{error}</p>
            <Button type="button" variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="admin-card flex flex-col items-center gap-2 px-6 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="mt-1 font-medium text-gray-900">Todos los videos andan bien</p>
            <p className="text-sm text-gray-500">No hay fallas registradas.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-card flex flex-col items-center gap-3 px-6 py-10 text-center">
            <p className="text-sm text-gray-600">Ningún video coincide con los filtros.</p>
            {hasFilters && (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <ul role="list" className="admin-card divide-y divide-gray-100 overflow-hidden">
            {filtered.map((row, i) => (
              <VideoRow
                key={row.id}
                index={i}
                row={row}
                course={row.idCurso ? courseTitles[row.idCurso] : undefined}
                open={expanded === row.id}
                onToggle={() => setExpanded((prev) => (prev === row.id ? null : row.id))}
                onResolve={() => resolve(row)}
              />
            ))}
          </ul>
        )}
      </div>
    </TooltipProvider>
  );
}
