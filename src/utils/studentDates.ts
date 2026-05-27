import type { FirestoreTimestamp, StudentDB } from "@/types/types";

function parseDateValue(r: unknown): number {
  if (r == null) return 0;
  if (typeof r === "number" && Number.isFinite(r)) {
    return r > 1e12 ? Math.floor(r / 1000) : Math.floor(r);
  }
  if (typeof r === "string" && r.trim()) {
    const ms = Date.parse(r);
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
  }
  if (typeof r === "object") {
    const obj = r as FirestoreTimestamp & {
      seconds?: number;
      toDate?: () => Date;
    };
    const sec = obj._seconds ?? obj.seconds;
    if (typeof sec === "number" && Number.isFinite(sec)) return sec;
    if (typeof obj.toDate === "function") {
      const ms = obj.toDate().getTime();
      return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
    }
  }
  return 0;
}

export function getFechaRegistroSeconds(student: StudentDB): number {
  const raw = student as StudentDB & {
    fechaCreacion?: unknown;
    createdAt?: unknown;
    fechaActualizacion?: unknown;
  };
  const primary =
    raw.fechaRegistro ?? raw.fechaCreacion ?? raw.createdAt;
  const fromPrimary = parseDateValue(primary);
  if (fromPrimary > 0) return fromPrimary;
  return parseDateValue(raw.fechaActualizacion);
}

export function extractStudentsFromResponse(response: unknown): StudentDB[] {
  if (Array.isArray(response)) return response as StudentDB[];
  const payload = response as { data?: unknown };
  return Array.isArray(payload?.data) ? (payload.data as StudentDB[]) : [];
}
