export const PUNTOS_TOTAL_EXAMEN = 100;

/** Reparte 100 puntos en partes enteras lo más equitativas posible. */
export const distributePuntosEqually = (count: number): number[] => {
  if (count <= 0) return [];
  const base = Math.floor(PUNTOS_TOTAL_EXAMEN / count);
  const remainder = PUNTOS_TOTAL_EXAMEN - base * count;
  return Array.from({ length: count }, (_, index) =>
    base + (index < remainder ? 1 : 0)
  );
};

export const sumPreguntasPuntos = (
  preguntas: Array<{ puntos?: number }>
): number =>
  preguntas.reduce((acc, pregunta) => acc + (pregunta.puntos ?? 0), 0);

export const sumPreguntasPuntosObtenidos = (
  preguntas: Array<{ puntosObtenidos?: number; acertada?: boolean; puntos?: number }>
): number =>
  preguntas.reduce((acc, pregunta) => {
    if (typeof pregunta.puntosObtenidos === "number") {
      return acc + pregunta.puntosObtenidos;
    }
    if (pregunta.acertada && typeof pregunta.puntos === "number") {
      return acc + pregunta.puntos;
    }
    return acc;
  }, 0);

export const computePorcentajeFromPuntos = (puntosObtenidos: number): number =>
  Math.round(((puntosObtenidos / PUNTOS_TOTAL_EXAMEN) * 100) * 10) / 10;

export const computeNotaFromPorcentaje = (porcentaje: number): number =>
  Math.round((porcentaje / 10) * 10) / 10;
