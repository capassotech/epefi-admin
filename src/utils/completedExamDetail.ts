import type {
  Examen,
  ExamenRealizadoDetalle,
  ExamenRealizadoPreguntaDetalle,
} from "@/types/types";

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
    respuestas,
    respuestasSeleccionadas,
  };
}

/**
 * Arma el detalle mostrable: plantilla del examen + respuestas del alumno.
 */
export function buildCompletedExamQuestions(
  record: ExamenRealizadoDetalle,
  raw: Record<string, unknown>,
  examTemplate: Examen | null | undefined
): ExamenRealizadoPreguntaDetalle[] {
  const selections = extractStudentSelections(raw);

  if (examTemplate?.preguntas?.length) {
    return examTemplate.preguntas.map((q) => {
      const selected = Array.from(selections.get(q.id) ?? []);
      const fromQuestion = record.preguntas?.find((p) => p.id === q.id);
      const mergedSelected =
        fromQuestion?.respuestasSeleccionadas?.length
          ? fromQuestion.respuestasSeleccionadas
          : selected;

      return {
        id: q.id,
        texto: q.texto,
        respuestas: q.respuestas.map((r) => ({
          id: r.id,
          texto: r.texto,
          esCorrecta: Boolean(r.esCorrecta),
        })),
        respuestasSeleccionadas: mergedSelected,
      };
    });
  }

  const fromRecord = record.preguntas ?? [];
  if (fromRecord.length > 0) {
    const built = fromRecord
      .map((p) =>
        normalizeQuestionFromRaw(p as unknown as Record<string, unknown>, selections)
      )
      .filter((q): q is ExamenRealizadoPreguntaDetalle => q != null);

    if (built.some((q) => q.respuestas.length > 0)) {
      return built.map((q) => ({
        ...q,
        respuestasSeleccionadas:
          q.respuestasSeleccionadas?.length
            ? q.respuestasSeleccionadas
            : Array.from(selections.get(q.id) ?? []),
      }));
    }
  }

  const preguntasRaw = raw.preguntas;
  if (Array.isArray(preguntasRaw)) {
    return preguntasRaw
      .map((p) =>
        normalizeQuestionFromRaw(p as Record<string, unknown>, selections)
      )
      .filter((q): q is ExamenRealizadoPreguntaDetalle => q != null);
  }

  return [];
}
