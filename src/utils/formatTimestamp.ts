import type { FirestoreTimestamp } from "@/types/types";

export function parseTimestampSeconds(
  value: FirestoreTimestamp | string | number | undefined | null
): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
  }
  if (typeof value === "object") {
    const obj = value as FirestoreTimestamp & {
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

export function formatTimestamp(
  value: FirestoreTimestamp | string | number | undefined | null,
  fallback = "—"
): string {
  const sec = parseTimestampSeconds(value);
  if (!sec) return fallback;
  return new Date(sec * 1000).toLocaleString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
