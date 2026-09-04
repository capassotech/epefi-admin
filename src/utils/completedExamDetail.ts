import type {
  Examen,
  ExamenRealizadoDetalle,
  ExamenRealizadoPreguntaDetalle,
} from "@/types/types";
import { distributePuntosEqually } from "@/utils/examPoints";

function isQuestionCorrectLocally(
  respuestas: Array<{ id: string; esCorrecta: boolean }>,
  selectedIds: string[]
): boolean {
  const correctIds = respuestas
    .filter((r) => r.esCorrecta)
    .map((r) => r.id)
    .sort();
  const selected = [...selectedIds].sort();
  if (correctIds.length !== selected.length) return false;
  return correctIds.every((id, index) => id === selected[index]);
}

function resolveQuestionScore(
  pregunta: ExamenRealizadoPreguntaDetalle,
  selectedIds: string[]
): Pick<ExamenRealizadoPreguntaDetalle, "acertada" | "puntosObtenidos"> {
  if (pregunta.tipoPregunta === "desarrollo") {
    return {
      acertada:
        typeof pregunta.acertada === "boolean" ? pregunta.acertada : false,
      puntosObtenidos:
        typeof pregunta.puntosObtenidos === "number"
          ? pregunta.puntosObtenidos
          : 0,
    };
  }

  const acertada =
    typeof pregunta.acertada === "boolean"
      ? pregunta.acertada
      : isQuestionCorrectLocally(pregunta.respuestas, selectedIds);
  const puntosObtenidos =
    typeof pregunta.puntosObtenidos === "number"
      ? pregunta.puntosObtenidos
      : acertada && typeof pregunta.puntos === "number"
        ? pregunta.puntos
        : 0;

  return { acertada, puntosObtenidos };
}

function toAnswerId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const id =
      o.id ??
      o.idRespuesta ??
      o.id_respuesta ??
      o.respuestaId ??
      o.respuesta_id;
    return id != null ? String(id).trim() : "";
  }
  return "";
}

function asStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map(toAnswerId).filter(Boolean);
  }
  const single = toAnswerId(value);
  return single ? [single] : [];
}

/** IDs de respuestas elegidas (acepta strings, números u objetos con id). */
export function normalizeAnswerIds(value: unknown): string[] {
  return asStringArray(value);
}

/** Mapa idPregunta -> ids de respuestas elegidas por el alumno. */
export function extractStudentSelections(
  raw: Record<string, unknown>
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  const add = (questionId: string, answerIds: string[]) => {
    const qid = questionId.trim();
    if (!qid) return;
    const set = map.get(qid) ?? new Set<string>();
    for (const aid of answerIds) {
      if (aid) set.add(aid);
    }
    map.set(qid, set);
  };

  const rootAnswerLists = [
    "respuestas",
    "respuestasAlumno",
    "respuestasUsuario",
    "respuestasSeleccionadas",
    "detalleRespuestas",
  ];

  for (const key of rootAnswerLists) {
    const arr = raw[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const o = item as Record<string, unknown>;
      const qId = String(
        o.idPregunta ?? o.id_pregunta ?? o.preguntaId ?? o.idPreguntaId ?? ""
      );
      const answerIds = asStringArray(
        o.idRespuesta ??
          o.id_respuesta ??
          o.respuestaId ??
          o.idsRespuestas ??
          o.respuestasSeleccionadas ??
          o.respuestaSeleccionada
      );
      if (qId) add(qId, answerIds);
    }
  }

  const preguntasRaw = raw.preguntas;
  if (Array.isArray(preguntasRaw)) {
    for (const p of preguntasRaw) {
      const pr = p as Record<string, unknown>;
      const qId = String(pr.id ?? pr.idPregunta ?? "");
      const answerIds = asStringArray(
        pr.respuestasSeleccionadas ??
          pr.idsRespuestasSeleccionadas ??
          pr.idRespuesta ??
          pr.respuestaSeleccionada
      );
      if (qId) add(qId, answerIds);

      const respuestasNested = pr.respuestas;
      if (Array.isArray(respuestasNested)) {
        for (const r of respuestasNested) {
          const rr = r as Record<string, unknown>;
          if (
            rr.seleccionada === true ||
            rr.esSeleccionada === true ||
            rr.selected === true
          ) {
            const rid = String(rr.id ?? "");
            if (qId && rid) add(qId, [rid]);
          }
        }
      }
    }
  }

  return map;
}

function normalizeQuestionFromRaw(
  pr: Record<string, unknown>,
  selections: Map<string, Set<string>>
): ExamenRealizadoPreguntaDetalle | null {
  const qId = String(pr.id ?? pr.idPregunta ?? "").trim();
  if (!qId) return null;

  const respuestasRaw = pr.respuestas;
  const respuestas = Array.isArray(respuestasRaw)
    ? respuestasRaw.map((r) => {
        const rr = r as Record<string, unknown>;
        return {
          id: String(rr.id ?? ""),
          texto: String(rr.texto ?? rr.text ?? ""),
          esCorrecta: Boolean(rr.esCorrecta ?? rr.correcta ?? rr.isCorrect),
        };
      })
    : [];

  const explicit = asStringArray(
    pr.respuestasSeleccionadas ??
      pr.idsRespuestasSeleccionadas ??
      pr.idRespuesta ??
      pr.respuestaSeleccionada
  );
  const fromMap = Array.from(selections.get(qId) ?? []);
  const respuestasSeleccionadas =
    explicit.length > 0 ? explicit : fromMap;

  return {
    id: qId,
    texto: String(pr.texto ?? pr.pregunta ?? ""),
    puntos: typeof pr.puntos === "number" ? pr.puntos : undefined,
    puntosObtenidos:
      typeof pr.puntosObtenidos === "number" ? pr.puntosObtenidos : undefined,
    acertada:
      typeof pr.acertada === "boolean"
        ? pr.acertada
        : typeof pr.esCorrecta === "boolean"
          ? pr.esCorrecta
          : undefined,
    tipoPregunta:
      pr.tipoPregunta === "desarrollo"
        ? "desarrollo"
        : pr.tipoPregunta === "opcion_multiple"
          ? "opcion_multiple"
          : undefined,
    respuestas,
    respuestasSeleccionadas,
    respuestaDesarrollo:
      typeof pr.respuestaDesarrollo === "string"
        ? pr.respuestaDesarrollo
        : undefined,
  };
}

function withResolvedScore(
  question: ExamenRealizadoPreguntaDetalle,
  selections: Map<string, Set<string>>
): ExamenRealizadoPreguntaDetalle {
  const selected =
    question.respuestasSeleccionadas?.length
      ? question.respuestasSeleccionadas
      : Array.from(selections.get(question.id) ?? []);
  const withSelected = { ...question, respuestasSeleccionadas: selected };
  const score = resolveQuestionScore(withSelected, selected);
  return { ...withSelected, ...score };
}

/**
 * Preguntas del intento (snapshot). Prioriza el registro ya normalizado y,
 * si hace falta, el payload crudo del backend.
 */
function buildQuestionsFromAttemptSnapshot(
  record: ExamenRealizadoDetalle,
  raw: Record<string, unknown>,
  selections: Map<string, Set<string>>
): ExamenRealizadoPreguntaDetalle[] {
  const fromRecord = record.preguntas ?? [];
  if (fromRecord.length > 0) {
    const built = fromRecord
      .map((p) =>
        normalizeQuestionFromRaw(
          p as unknown as Record<string, unknown>,
          selections
        )
      )
      .filter((q): q is ExamenRealizadoPreguntaDetalle => q != null);
    if (built.length > 0) return built;
  }

  const preguntasRaw = raw.preguntas;
  if (!Array.isArray(preguntasRaw) || preguntasRaw.length === 0) return [];

  return preguntasRaw
    .map((p) =>
      normalizeQuestionFromRaw(p as Record<string, unknown>, selections)
    )
    .filter((q): q is ExamenRealizadoPreguntaDetalle => q != null);
}

/**
 * Completa texto/opciones faltantes desde la plantilla actual, pero solo para
 * IDs que ya estaban en el intento (no agrega preguntas nuevas del examen editado).
 */
function enrichSnapshotFromTemplate(
  snapshot: ExamenRealizadoPreguntaDetalle[],
  examTemplate: Examen,
  selections: Map<string, Set<string>>
): ExamenRealizadoPreguntaDetalle[] {
  const templateById = new Map(
    examTemplate.preguntas.map((q) => [q.id, q] as const)
  );

  return snapshot.map((q) => {
    const template = templateById.get(q.id);
    if (!template) return withResolvedScore(q, selections);

    const respuestas =
      q.respuestas.length > 0
        ? q.respuestas
        : template.respuestas.map((r) => ({
            id: r.id,
            texto: r.texto,
            esCorrecta: Boolean(r.esCorrecta),
          }));

    return withResolvedScore(
      {
        ...q,
        texto: q.texto || template.texto,
        puntos:
          typeof q.puntos === "number"
            ? q.puntos
            : typeof template.puntos === "number"
              ? template.puntos
              : q.puntos,
        respuestas,
      },
      selections
    );
  });
}

function buildQuestionsFromLiveTemplate(
  record: ExamenRealizadoDetalle,
  examTemplate: Examen,
  selections: Map<string, Set<string>>
): ExamenRealizadoPreguntaDetalle[] {
  const puntosDistribution = distributePuntosEqually(
    examTemplate.preguntas.length
  );

  return examTemplate.preguntas.map((q, index) => {
    const selected = Array.from(selections.get(q.id) ?? []);
    const fromQuestion = record.preguntas?.find((p) => p.id === q.id);
    const mergedSelected =
      fromQuestion?.respuestasSeleccionadas?.length
        ? fromQuestion.respuestasSeleccionadas
        : selected;
    const puntos =
      typeof fromQuestion?.puntos === "number"
        ? fromQuestion.puntos
        : typeof q.puntos === "number"
          ? q.puntos
          : puntosDistribution[index];

    return withResolvedScore(
      {
        id: q.id,
        texto: q.texto,
        puntos,
        puntosObtenidos: fromQuestion?.puntosObtenidos,
        acertada: fromQuestion?.acertada,
        respuestas: q.respuestas.map((r) => ({
          id: r.id,
          texto: r.texto,
          esCorrecta: Boolean(r.esCorrecta),
        })),
        respuestasSeleccionadas: mergedSelected,
      },
      selections
    );
  });
}

/**
 * Arma el detalle mostrable priorizando el snapshot del intento.
 * La plantilla actual del examen solo se usa como respaldo legacy o para
 * completar opciones faltantes de preguntas que ya existían al rendir.
 */
export function buildCompletedExamQuestions(
  record: ExamenRealizadoDetalle,
  raw: Record<string, unknown>,
  examTemplate: Examen | null | undefined
): ExamenRealizadoPreguntaDetalle[] {
  const selections = extractStudentSelections(raw);
  const snapshot = buildQuestionsFromAttemptSnapshot(record, raw, selections);

  if (snapshot.length > 0) {
    const hasOptions = snapshot.some((q) => q.respuestas.length > 0);
    if (hasOptions) {
      return snapshot.map((q) => withResolvedScore(q, selections));
    }
    if (examTemplate?.preguntas?.length) {
      return enrichSnapshotFromTemplate(snapshot, examTemplate, selections);
    }
    // Sin opciones en plantilla: respetar puntaje/acertada ya guardados en el intento
    return snapshot.map((q) => {
      const selected =
        q.respuestasSeleccionadas?.length
          ? q.respuestasSeleccionadas
          : Array.from(selections.get(q.id) ?? []);
      if (
        typeof q.acertada === "boolean" ||
        typeof q.puntosObtenidos === "number"
      ) {
        return { ...q, respuestasSeleccionadas: selected };
      }
      return withResolvedScore({ ...q, respuestasSeleccionadas: selected }, selections);
    });
  }

  // Legacy: intentos sin snapshot de preguntas → reconstruir con plantilla actual
  if (examTemplate?.preguntas?.length) {
    return buildQuestionsFromLiveTemplate(record, examTemplate, selections);
  }

  return [];
}
