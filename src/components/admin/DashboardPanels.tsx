// src/components/admin/DashboardPanels.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamenRealizado } from "@/types/types";
import {
  formatRelativeTime,
  type CourseSchedule,
  type ExamApproval,
  type ExamPerformance,
} from "@/utils/dashboardMetrics";

const COMPLETED_DETAIL_STATE = { returnTo: "/" };

function Panel({
  title,
  description,
  action,
  children,
  className,
  ...rest
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  "data-tour"?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-gray-200/70 bg-white", className)} {...rest}>
      <header className="flex items-start justify-between gap-4 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1 px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </section>
  );
}

function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
    >
      {children}
      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 text-center text-sm text-gray-400">
      {children}
    </div>
  );
}

function Initials({ name }: { name?: string }) {
  const initials = (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
      {initials || "?"}
    </span>
  );
}

function ExamSubtitle({ row }: { row: ExamenRealizado }) {
  return (
    <p className="truncate text-xs text-gray-500">
      {row.tituloExamen || "Examen"}
      {row.tituloFormacion ? ` · ${row.tituloFormacion}` : ""}
    </p>
  );
}

export function PendingCorrectionsPanel({
  rows,
  total,
  unavailable,
  className,
}: {
  rows: ExamenRealizado[];
  total: number;
  unavailable?: boolean;
  className?: string;
}) {
  return (
    <Panel
      className={className}
      title="Para corregir"
      description={
        total > 0
          ? `${total} ${total === 1 ? "examen espera" : "exámenes esperan"} tu corrección`
          : "Exámenes con preguntas de desarrollo"
      }
      action={total > rows.length && <PanelLink to="/exams/completed">Ver todos</PanelLink>}
      data-tour="pending-corrections"
    >
      {unavailable ? (
        <EmptyState>No se pudieron cargar los exámenes realizados</EmptyState>
      ) : rows.length === 0 ? (
        <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <p className="text-sm font-medium text-gray-700">Todo al día</p>
          <p className="text-xs text-gray-500">No hay exámenes esperando corrección</p>
        </div>
      ) : (
        <ul className="-mx-2 divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-2 py-2.5">
              <Initials name={row.nombreAlumno} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{row.nombreAlumno || "Alumno"}</p>
                <ExamSubtitle row={row} />
              </div>
              <span className="hidden sm:block shrink-0 text-xs text-gray-400">
                {formatRelativeTime(row.fechaRealizacion)}
              </span>
              <Link
                to={`/exams/completed/${encodeURIComponent(row.id)}`}
                state={COMPLETED_DETAIL_STATE}
                className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Corregir
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function PerformancePanel({ performance }: { performance: ExamPerformance | null }) {
  const rate = performance?.approvalRate;

  return (
    <Panel title="Rendimiento" description="Exámenes corregidos" data-tour="exam-performance">
      {!performance || performance.graded === 0 ? (
        <EmptyState>Todavía no hay exámenes corregidos</EmptyState>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-gray-500">Aprobación</p>
              <p className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">{rate}%</p>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-red-100">
              <div
                className="h-full rounded-full bg-green-500 transition-[width] duration-700"
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {performance.approved} aprobados
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
                {performance.failed} desaprobados
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">Nota promedio</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900 tabular-nums">
                {performance.averageNota ?? "—"}
                <span className="text-xs font-normal text-gray-400"> / 10</span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">Últimos 30 días</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900 tabular-nums">
                {performance.last30Days}
                <span className="text-xs font-normal text-gray-400"> rendidos</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function ResultBadge({ row }: { row: ExamenRealizado }) {
  if (row.estado === "pendiente_correccion") {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
        Por corregir
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        row.aprobado ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      )}
      title={row.aprobado ? "Aprobado" : "Desaprobado"}
    >
      {Number.isFinite(row.nota) ? row.nota : "—"}
    </span>
  );
}

export function RecentActivityPanel({ rows }: { rows: ExamenRealizado[] }) {
  return (
    <Panel
      title="Actividad reciente"
      description="Últimos exámenes rendidos"
      action={<PanelLink to="/exams/completed">Ver todos</PanelLink>}
    >
      {rows.length === 0 ? (
        <EmptyState>Todavía no se rindieron exámenes</EmptyState>
      ) : (
        <ul className="-mx-2 divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                to={`/exams/completed/${encodeURIComponent(row.id)}`}
                state={COMPLETED_DETAIL_STATE}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{row.nombreAlumno || "Alumno"}</p>
                  <p className="truncate text-xs text-gray-500">
                    {row.tituloExamen || "Examen"} · {formatRelativeTime(row.fechaRealizacion)}
                  </p>
                </div>
                <ResultBadge row={row} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function rateColor(rate: number) {
  if (rate < 50) return "bg-red-400";
  if (rate < 70) return "bg-amber-400";
  return "bg-green-500";
}

export function HardestExamsPanel({ exams }: { exams: ExamApproval[] }) {
  return (
    <Panel title="Exámenes más difíciles" description="Menor porcentaje de aprobación">
      {exams.length === 0 ? (
        <EmptyState>Se necesitan al menos 3 exámenes corregidos por examen</EmptyState>
      ) : (
        <ul className="space-y-4">
          {exams.map((exam) => (
            <li key={exam.idExamen}>
              <Link to={`/exams/${encodeURIComponent(exam.idExamen)}/intentos`} className="group block">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                    {exam.titulo}
                  </p>
                  <p className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">{exam.rate}%</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-700", rateColor(exam.rate))}
                    style={{ width: `${Math.max(exam.rate, 2)}%` }}
                  />
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {exam.approved} de {exam.total} aprobados
                  {exam.tituloFormacion ? ` · ${exam.tituloFormacion}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function scheduleLabel({ status, daysLeft, start }: CourseSchedule) {
  switch (status) {
    case "en_dictado":
      return {
        text: daysLeft !== undefined ? `En dictado · termina en ${daysLeft} d` : "En dictado",
        className: "bg-green-50 text-green-700",
      };
    case "proximo":
      return {
        text:
          daysLeft !== undefined && daysLeft <= 30
            ? `Inicia en ${daysLeft} d`
            : `Inicia ${start?.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`,
        className: "bg-blue-50 text-blue-700",
      };
    case "finalizado":
      return { text: "Finalizado", className: "bg-gray-100 text-gray-500" };
    default:
      return { text: "Sin fechas", className: "bg-gray-100 text-gray-500" };
  }
}

export function CourseSchedulePanel({ schedules }: { schedules: CourseSchedule[] }) {
  const visible = schedules.slice(0, 6);

  return (
    <Panel
      title="Calendario de cursos"
      description="Según las fechas de dictado"
      action={schedules.length > visible.length && <PanelLink to="/products">Ver todos</PanelLink>}
    >
      {visible.length === 0 ? (
        <EmptyState>No hay cursos cargados</EmptyState>
      ) : (
        <ul className="-mx-2 divide-y divide-gray-100">
          {visible.map((schedule) => {
            const label = scheduleLabel(schedule);
            return (
              <li key={schedule.course.id}>
                <Link
                  to={`/products/${encodeURIComponent(schedule.course.id)}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <p className="truncate text-sm text-gray-900">{schedule.course.titulo}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                      label.className
                    )}
                  >
                    {label.text}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
