/** Patrón de fecha de dictado en el formulario (input type="date"). */
const YMD = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayLocalYmd(): string {
  const t = new Date();
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
}

/**
 * Convierte YYYY-MM-DD del formulario a ISO UTC medianoche de ese día civil.
 * Evita el desfase al usar `new Date(ymd + 'T00:00:00')` (interpretación local) + `toISOString()`.
 */
export function dictadoDateToIsoPayload(yyyyMmDd: string): string {
  const t = yyyyMmDd.trim();
  if (!YMD.test(t)) return t;
  return `${t}T00:00:00.000Z`;
}

/**
 * Normaliza lo que venga del API (YYYY-MM-DD o ISO) al valor del input date.
 * Para ISO usa componentes UTC para conservar el día civil guardado.
 */
export function parseDictadoDateForInput(dateValue: string | undefined | null): string {
  if (!dateValue || !String(dateValue).trim()) return todayLocalYmd();
  const s = String(dateValue).trim();
  if (YMD.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return todayLocalYmd();
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Texto legible en español usando el día civil en UTC (alineado con cómo guardamos). */
export function formatDictadoDateForDisplay(value: string | undefined): string {
  if (!value) return "";
  const s = value.trim();
  let y: number;
  let m: number;
  let day: number;
  if (YMD.test(s)) {
    const parts = s.split("-").map(Number);
    y = parts[0];
    m = parts[1];
    day = parts[2];
  } else {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return value;
    y = d.getUTCFullYear();
    m = d.getUTCMonth() + 1;
    day = d.getUTCDate();
  }
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("es-AR", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
