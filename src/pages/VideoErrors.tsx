import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, CircleHelp, ExternalLink, CheckCircle2, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { usePageHeader } from "@/context/PageHeaderContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IconAction } from "@/components/ui/icon-action";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { CoursesAPI } from "@/service/courses";
import { VideoErrorsAPI, type VideoError, type VideoErrorOccurrence } from "@/service/videoErrors";
import { formatTimestamp } from "@/utils/formatTimestamp";

type Cause = "archivo" | "conexion" | "otro";

const CAUSE_LABEL: Record<Cause, string> = {
  archivo: "Archivo",
  conexion: "Conexión",
  otro: "Sin datos",
};

const CAUSE_CLASS: Record<Cause, string> = {
  archivo: "bg-red-50 text-red-700",
  conexion: "bg-amber-50 text-amber-700",
  otro: "bg-gray-100 text-gray-600",
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

/** "Android 13 · Samsung SM-A135M · Chrome" a partir del user agent. */
function describeDevice(ua: string | null): string {
  if (!ua) return "Dispositivo desconocido";
  const parts: string[] = [];
  const android = ua.match(/Android ([\d.]+);\s*([^;)]+)?/);
  const ios = ua.match(/(iPhone|iPad)[^)]*OS (\d+)[_\d]*/);
  if (android) {
    parts.push(`Android ${android[1]}`);
    const model = android[2]?.replace(/Build\/.*/, "").trim();
    if (model && model !== "K") parts.push(model);
  } else if (ios) {
    parts.push(`${ios[1]} iOS ${ios[2]}`);
  } else if (/Windows/.test(ua)) {
    parts.push("Windows");
  } else if (/Mac OS X/.test(ua)) {
    parts.push("Mac");
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
            : null;
  if (browser) parts.push(browser);
  return parts.join(" · ") || "Dispositivo desconocido";
}

function CausePill({ cause }: { cause: Cause }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", CAUSE_CLASS[cause])}>
      {CAUSE_LABEL[cause]}
    </span>
  );
}

function OccurrenceRow({ o }: { o: VideoErrorOccurrence }) {
  return (
    <li className="flex items-start gap-3 py-2 text-sm">
      <CausePill cause={causeOf(o.codigo)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-gray-900">{o.email || o.uid}</p>
        <p className="truncate text-xs text-gray-500" title={o.dispositivo ?? undefined}>
          {describeDevice(o.dispositivo)}
          {o.conexion ? ` · ${o.conexion}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-xs text-gray-500">{formatTimestamp(o.fecha)}</span>
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
  const [toResolve, setToResolve] = useState<VideoError | null>(null);

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

  const totalFallas = useMemo(() => rows.reduce((sum, r) => sum + (r.total || 0), 0), [rows]);

  const resolve = async () => {
    if (!toResolve) return;
    const target = toResolve;
    setToResolve(null);
    try {
      await VideoErrorsAPI.resolve(target.id);
      setRows((prev) => prev.filter((r) => r.id !== target.id));
      toast.success("Marcado como resuelto");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo marcar como resuelto");
    }
  };

  if (loading && rows.length === 0 && !error) {
    return <InteractiveLoader initialMessage="Cargando errores de video" delayedMessage="Buscando videos con fallas" />;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            {rows.length === 1 ? "1 video" : `${rows.length} videos`} · {totalFallas}{" "}
            {totalFallas === 1 ? "falla" : "fallas"}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Qué significa cada causa">
                <CircleHelp className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-72">
              <p>
                <strong>Archivo:</strong> el navegador no pudo leer el video. Suele ser el formato: conviene subirlo
                como MP4 (H.264).
              </p>
              <p className="mt-1">
                <strong>Conexión:</strong> se cortó la descarga. Suele ser la red del alumno.
              </p>
              <p className="mt-1">Al marcar como resuelto se borra el registro; si vuelve a fallar, aparece de nuevo.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {error ? (
          <p className="py-6 text-center text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-600">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            No hay videos con errores.
          </div>
        ) : (
          <ul role="list" className="admin-card divide-y divide-gray-100 overflow-hidden bg-white">
            {rows.map((row) => {
              const isOpen = expanded === row.id;
              const course = row.idCurso ? courseTitles[row.idCurso] : undefined;
              const alumnos = new Set(row.ultimas.map((o) => o.uid)).size;
              return (
                <li key={row.id}>
                  <div className="flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                      aria-expanded={isOpen}
                      className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                    >
                      <VideoOff className="h-4 w-4 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{row.material || "Video sin nombre"}</p>
                        <p className="truncate text-xs text-gray-500">
                          {course ? `${course} · ` : ""}
                          {row.total} {row.total === 1 ? "falla" : "fallas"} · {alumnos}{" "}
                          {alumnos === 1 ? "alumno" : "alumnos"} · {formatTimestamp(row.ultimaFecha)}
                        </p>
                      </div>
                      <CausePill cause={mainCause(row)} />
                      <ChevronDown
                        className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                    <IconAction label="Abrir video" onClick={() => window.open(row.url, "_blank", "noopener,noreferrer")}>
                      <ExternalLink />
                    </IconAction>
                    <IconAction
                      label="Marcar como resuelto"
                      onClick={() => setToResolve(row)}
                      className="hover:bg-green-50 hover:text-green-700"
                    >
                      <CheckCircle2 />
                    </IconAction>
                  </div>
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-4 pb-2 pt-1">
                      <p className="truncate pt-1 text-xs text-gray-500" title={row.url}>
                        {row.url}
                      </p>
                      <ul role="list" className="divide-y divide-gray-100">
                        {row.ultimas.map((o, i) => (
                          <OccurrenceRow key={`${o.fecha}-${i}`} o={o} />
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={!!toResolve} onOpenChange={(open) => !open && setToResolve(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como resuelto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borra el registro de “{toResolve?.material || "este video"}”. Si vuelve a fallar, aparece de nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void resolve()}>Marcar resuelto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
