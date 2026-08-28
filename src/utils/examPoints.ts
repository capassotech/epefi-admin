export const PUNTOS_TOTAL_EXAMEN = 100;

/** Redondea puntos a 2 decimales (centésimas). */
export const roundPuntos = (value: number): number =>
  Math.round(value * 100) / 100;

/** True si la suma (con 2 decimales) alcanza el total del examen. */
export const puntosSumEqualsTotal = (sum: number): boolean =>
  roundPuntos(sum) === PUNTOS_TOTAL_EXAMEN;

/**
 * Reparte 100 puntos en partes lo más equitativas posible, con hasta 2 decimales.
 * Ej.: 3 preguntas → [33.34, 33.33, 33.33]
 */
export const distributePuntosEqually = (count: number): number[] => {
  if (count <= 0) return [];

  const totalCents = Math.round(PUNTOS_TOTAL_EXAMEN * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count;

  return Array.from({ length: count }, (_, index) =>
    roundPuntos((baseCents + (index < remainder ? 1 : 0)) / 100)
  );
};

export const sumPreguntasPuntos = (
  preguntas: Array<{ puntos?: number }>
): number =>
  roundPuntos(
    preguntas.reduce((acc, pregunta) => acc + (pregunta.puntos ?? 0), 0)
  );

export const sumPreguntasPuntosObtenidos = (
  preguntas: Array<{ puntosObtenidos?: number; acertada?: boolean; puntos?: number }>
): number =>
  roundPuntos(
    preguntas.reduce((acc, pregunta) => {
      if (typeof pregunta.puntosObtenidos === "number") {
        return acc + pregunta.puntosObtenidos;
      }
      if (pregunta.acertada && typeof pregunta.puntos === "number") {
        return acc + pregunta.puntos;
      }
      return acc;
    }, 0)
  );

export const computePorcentajeFromPuntos = (puntosObtenidos: number): number =>
  Math.round(((puntosObtenidos / PUNTOS_TOTAL_EXAMEN) * 100) * 10) / 10;

export const computeNotaFromPorcentaje = (porcentaje: number): number =>
  Math.round((porcentaje / 10) * 10) / 10;

/** Parsea input de puntos (acepta punto o coma). */
export const parsePuntosInput = (value: string): number => {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "" || normalized === ".") return 0;
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(PUNTOS_TOTAL_EXAMEN, roundPuntos(parsed)));
};
