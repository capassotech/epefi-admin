import type { Course, ExamenRealizado } from "@/types/types";
import { parseTimestampSeconds } from "./formatTimestamp";
import { parseDictadoDateForInput, ymdToLocalDate } from "./courseDates";

const DAY_SECONDS = 86400;

export type ExamPerformance = {
  /** Exámenes ya corregidos (excluye pendientes de corrección) */
  graded: number;
  approved: number;
  failed: number;
  /** Porcentaje 0-100, null si todavía no hay exámenes corregidos */
  approvalRate: number | null;
  /** Nota promedio sobre 10, null si no hay notas */
  averageNota: number | null;
  /** Exámenes rendidos (cualquier estado) en los últimos 30 días */
  last30Days: number;
};

export function computeExamPerformance(rows: ExamenRealizado[]): ExamPerformance {
  const nowSec = Date.now() / 1000;
  const graded = rows.filter((r) => r.estado !== "pendiente_correccion");
  const approved = graded.filter((r) => r.aprobado).length;
  const notas = graded.map((r) => r.nota).filter((n) => Number.isFinite(n));

  return {
    graded: graded.length,
    approved,
    failed: graded.length - approved,
    approvalRate: graded.length > 0 ? Math.round((approved / graded.length) * 100) : null,
    averageNota:
      notas.length > 0
        ? Math.round((notas.reduce((sum, n) => sum + n, 0) / notas.length) * 10) / 10
        : null,
    last30Days: rows.filter(
      (r) => parseTimestampSeconds(r.fechaRealizacion) >= nowSec - 30 * DAY_SECONDS
    ).length,
  };
}

export function sortByMostRecent(rows: ExamenRealizado[]): ExamenRealizado[] {
  return [...rows].sort(
    (a, b) => parseTimestampSeconds(b.fechaRealizacion) - parseTimestampSeconds(a.fechaRealizacion)
  );
}

export type ExamApproval = {
  idExamen: string;
  titulo: string;
  tituloFormacion?: string;
  total: number;
  approved: number;
  /** Porcentaje 0-100 */
  rate: number;
};

/** Exámenes con menor porcentaje de aprobación (solo los que tienen suficientes intentos corregidos) */
export function lowestApprovalExams(
  rows: ExamenRealizado[],
  { minAttempts = 3, max = 4 } = {}
): ExamApproval[] {
  const byExam = new Map<string, ExamApproval>();

  for (const row of rows) {
    if (row.estado === "pendiente_correccion" || !row.idExamen) continue;
    const current = byExam.get(row.idExamen) ?? {
      idExamen: row.idExamen,
      titulo: row.tituloExamen || "Examen sin título",
      tituloFormacion: row.tituloFormacion,
      total: 0,
      approved: 0,
      rate: 0,
    };
    current.total += 1;
    if (row.aprobado) current.approved += 1;
    byExam.set(row.idExamen, current);
  }

  return [...byExam.values()]
    .filter((e) => e.total >= minAttempts)
    .map((e) => ({ ...e, rate: Math.round((e.approved / e.total) * 100) }))
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
    .slice(0, max);
}

export type CourseScheduleStatus = "en_dictado" | "proximo" | "finalizado" | "sin_fecha";

export type CourseSchedule = {
  course: Course;
  status: CourseScheduleStatus;
  start?: Date;
  end?: Date;
  /** Días hasta el inicio (proximo) o hasta el fin (en_dictado) */
  daysLeft?: number;
};

function toLocalDate(value?: string): Date | undefined {
  if (!value || !value.trim()) return undefined;
  return ymdToLocalDate(parseDictadoDateForInput(value));
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (DAY_SECONDS * 1000));
}

export function getCourseSchedules(courses: Course[]): CourseSchedule[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const order: Record<CourseScheduleStatus, number> = {
    en_dictado: 0,
    proximo: 1,
    sin_fecha: 2,
    finalizado: 3,
  };

  return courses
    .map((course): CourseSchedule => {
      const start = toLocalDate(course.fechaInicioDictado);
      const end = toLocalDate(course.fechaFinDictado);

      if (!start && !end) return { course, status: "sin_fecha" };
      if (start && start > today) {
        return { course, status: "proximo", start, end, daysLeft: daysBetween(today, start) };
      }
      if (end && end < today) return { course, status: "finalizado", start, end };
      return {
        course,
        status: "en_dictado",
        start,
        end,
        daysLeft: end ? daysBetween(today, end) : undefined,
      };
    })
    .sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity)
    );
}

const relativeFormatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 3 horas", "ayer", "hace 2 semanas"... */
export function formatRelativeTime(value: ExamenRealizado["fechaRealizacion"]): string {
  const sec = parseTimestampSeconds(value);
  if (!sec) return "—";
  const diff = sec - Date.now() / 1000;
  const abs = Math.abs(diff);

  if (abs < 60) return "recién";
  if (abs < 3600) return relativeFormatter.format(Math.round(diff / 60), "minute");
  if (abs < DAY_SECONDS) return relativeFormatter.format(Math.round(diff / 3600), "hour");
  if (abs < 7 * DAY_SECONDS) return relativeFormatter.format(Math.round(diff / DAY_SECONDS), "day");
  if (abs < 30 * DAY_SECONDS)
    return relativeFormatter.format(Math.round(diff / (7 * DAY_SECONDS)), "week");
  return new Date(sec * 1000).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
