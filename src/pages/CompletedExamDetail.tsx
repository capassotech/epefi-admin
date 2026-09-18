import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { CompletedExamsAPI } from "@/service/completedExams";
import { CoursesAPI } from "@/service/courses";
import { ExamsAPI } from "@/service/exams";
import type {
  EstadoExamenRealizado,
  ExamenRealizadoPreguntaDetalle,
  FirestoreTimestamp,
} from "@/types/types";
import {
  buildCompletedExamQuestions,
  normalizeAnswerIds,
} from "@/utils/completedExamDetail";
import {
  computeNotaFromPorcentaje,
  computePorcentajeFromPuntos,
  parsePuntosInput,
  PUNTOS_TOTAL_EXAMEN,
  roundPuntos,
  sumPreguntasPuntosObtenidos,
} from "@/utils/examPoints";
import { formatTimestamp } from "@/utils/formatTimestamp";
import {
  COMPLETED_EXAMS_LIST_PATH,
  type CompletedExamDetailLocationState,
} from "@/utils/completedExamsFilters";
import { toast } from "sonner";

type DetailState = {
  id: string;
  nombreAlumno?: string;
  idFormacion: string;
  idExamen: string;
  nota: number;
  aprobado: boolean;
  estado?: EstadoExamenRealizado;
  fechaRealizacion?: FirestoreTimestamp | string | number;
  intentoNumero?: number;
  totalIntentos?: number;
  porcentajeAciertos?: number;
  puntosObtenidos?: number;
};

type CorrecionDraft = {
  puntosDraft: string;
  puntos: number;
  comentario: string;
  error?: string;
};

export default function CompletedExamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    (location.state as CompletedExamDetailLocationState | null)?.returnTo ??
    COMPLETED_EXAMS_LIST_PATH;
  const [meta, setMeta] = useState<DetailState | null>(null);
  const [preguntas, setPreguntas] = useState<ExamenRealizadoPreguntaDetalle[]>([]);
  const [formationTitle, setFormationTitle] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [detalleIncompleto, setDetalleIncompleto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [correcciones, setCorrecciones] = useState<Record<string, CorrecionDraft>>(
    {}
  );

  const modoCorreccion = meta?.estado === "pendiente_correccion";

  const desarrolloIds = useMemo(
    () =>
      preguntas
        .filter((q) => q.tipoPregunta === "desarrollo")
        .map((q) => q.id)
        .filter(Boolean),
    [preguntas]
  );

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await CompletedExamsAPI.getById(id);
        const raw = data._raw;

        const exam = data.idExamen
          ? await ExamsAPI.getById(data.idExamen).catch(() => null)
          : null;

        const merged = buildCompletedExamQuestions(data, raw, exam);
        setPreguntas(merged);
        setDetalleIncompleto(
          raw.detalleIncompleto === true ||
            (merged.length > 0 &&
              merged.every(
                (q) =>
                  q.tipoPregunta !== "desarrollo" &&
                  (q.respuestas?.length ?? 0) === 0
              ))
        );

        const puntosFromQuestions = sumPreguntasPuntosObtenidos(merged);
        const puntosObtenidos =
          typeof data.puntosObtenidos === "number"
            ? data.puntosObtenidos
            : puntosFromQuestions;
        const porcentajeAciertos =
          typeof data.porcentajeAciertos === "number"
            ? data.porcentajeAciertos
            : computePorcentajeFromPuntos(puntosObtenidos);
        const nota =
          typeof data.nota === "number"
            ? data.nota
            : computeNotaFromPorcentaje(porcentajeAciertos);
        const aprobado =
          typeof data.aprobado === "boolean"
            ? data.aprobado
            : porcentajeAciertos >= 70;
        const estado: EstadoExamenRealizado | undefined =
          data.estado === "pendiente_correccion" ||
          raw.estadoCorreccion === "pendiente_correccion" ||
          raw.estado === "pendiente_correccion"
            ? "pendiente_correccion"
            : data.estado === "completado" ||
                raw.estadoCorreccion === "completado" ||
                raw.estado === "completado"
              ? "completado"
              : merged.some((q) => q.tipoPregunta === "desarrollo")
                ? "pendiente_correccion"
                : undefined;

        setMeta({
          id: data.id,
          nombreAlumno: data.nombreAlumno,
          idFormacion: data.idFormacion,
          idExamen: data.idExamen,
          nota,
          aprobado,
          estado,
          fechaRealizacion: data.fechaRealizacion,
          intentoNumero: data.intentoNumero,
          totalIntentos: data.totalIntentos,
          porcentajeAciertos,
          puntosObtenidos,
        });

        const drafts: Record<string, CorrecionDraft> = {};
        for (const q of merged) {
          if (q.tipoPregunta !== "desarrollo") continue;
          const puntos =
            typeof q.puntosObtenidos === "number" ? q.puntosObtenidos : 0;
          drafts[q.id] = {
            puntosDraft: String(puntos),
            puntos,
            comentario: q.comentario || "",
          };
        }
        setCorrecciones(drafts);

        const course = data.idFormacion
          ? await CoursesAPI.getById(data.idFormacion).catch(() => null)
          : null;
        setFormationTitle(
          data.tituloFormacion || course?.titulo || data.idFormacion || "—"
        );
        setExamTitle(data.tituloExamen || exam?.titulo || data.idExamen || "—");
      } catch (err) {
        console.error("Error al cargar detalle:", err);
        const message =
          err instanceof Error ? err.message : "No se pudo cargar el detalle";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const updatePuntosDraft = (preguntaId: string, value: string, maxPuntos: number) => {
    const normalized = value.replace(",", ".");
    if (normalized !== "" && !/^\d*\.?\d*$/.test(normalized)) return;

    setCorrecciones((prev) => {
      const current = prev[preguntaId] || {
        puntosDraft: "0",
        puntos: 0,
        comentario: "",
      };
      let error: string | undefined;
      let puntos = current.puntos;

      if (normalized === "" || normalized === ".") {
        puntos = 0;
        error = "Ingresá un puntaje";
      } else if (!normalized.endsWith(".")) {
        puntos = parsePuntosInput(value);
        if (puntos < 0) {
          error = "El puntaje no puede ser negativo";
        } else if (puntos > maxPuntos) {
          error = `Máximo ${maxPuntos} pts`;
          puntos = maxPuntos;
        }
      }

      return {
        ...prev,
        [preguntaId]: {
          ...current,
          puntosDraft: value,
          puntos: roundPuntos(puntos),
          error,
        },
      };
    });
  };

  const commitPuntosDraft = (preguntaId: string, maxPuntos: number) => {
    setCorrecciones((prev) => {
      const current = prev[preguntaId];
      if (!current) return prev;
      let puntos = parsePuntosInput(current.puntosDraft);
      let error: string | undefined;
      if (Number.isNaN(puntos) || current.puntosDraft.trim() === "") {
        puntos = 0;
        error = "Ingresá un puntaje";
      } else if (puntos < 0) {
        puntos = 0;
        error = "El puntaje no puede ser negativo";
      } else if (puntos > maxPuntos) {
        puntos = maxPuntos;
        error = `Máximo ${maxPuntos} pts`;
      }
      return {
        ...prev,
        [preguntaId]: {
          ...current,
          puntos: roundPuntos(puntos),
          puntosDraft: String(roundPuntos(puntos)),
          error,
        },
      };
    });
  };

  const updateComentario = (preguntaId: string, comentario: string) => {
    setCorrecciones((prev) => ({
      ...prev,
      [preguntaId]: {
        ...(prev[preguntaId] || { puntosDraft: "0", puntos: 0, comentario: "" }),
        comentario,
      },
    }));
  };

  const handleGuardarCorreccion = async () => {
    if (!id || !meta || !modoCorreccion) return;

    const nextErrors: Record<string, CorrecionDraft> = { ...correcciones };
    let hasError = false;

    for (const preguntaId of desarrolloIds) {
      const pregunta = preguntas.find((q) => q.id === preguntaId);
      const maxPuntos = typeof pregunta?.puntos === "number" ? pregunta.puntos : 0;
      const draft = nextErrors[preguntaId];
      if (!draft) {
        hasError = true;
        nextErrors[preguntaId] = {
          puntosDraft: "",
          puntos: 0,
          comentario: "",
          error: "Ingresá un puntaje",
        };
        continue;
      }
      const puntos = roundPuntos(draft.puntos);
      if (draft.puntosDraft.trim() === "" || Number.isNaN(puntos)) {
        hasError = true;
        nextErrors[preguntaId] = { ...draft, error: "Ingresá un puntaje" };
      } else if (puntos < 0) {
        hasError = true;
        nextErrors[preguntaId] = {
          ...draft,
          error: "El puntaje no puede ser negativo",
        };
      } else if (puntos > maxPuntos) {
        hasError = true;
        nextErrors[preguntaId] = {
          ...draft,
          error: `Máximo ${maxPuntos} pts`,
        };
      } else {
        nextErrors[preguntaId] = { ...draft, error: undefined, puntos };
      }
    }

    setCorrecciones(nextErrors);
    if (hasError) {
      toast.error("Revisá los puntajes de las preguntas de desarrollo");
      return;
    }

    try {
      setSaving(true);
      const resultado = await CompletedExamsAPI.corregir(id, {
        correcciones: desarrolloIds.map((preguntaId) => {
          const draft = nextErrors[preguntaId];
          const comentario = draft.comentario.trim();
          return {
            idPregunta: preguntaId,
            puntosObtenidos: draft.puntos,
            ...(comentario ? { comentario } : {}),
          };
        }),
      });

      toast.success("Examen corregido correctamente");

      setMeta((prev) =>
        prev
          ? {
              ...prev,
              estado: "completado",
              nota: Number(resultado.nota ?? prev.nota),
              aprobado: Boolean(resultado.aprobado),
              puntosObtenidos:
                typeof resultado.puntosObtenidos === "number"
                  ? resultado.puntosObtenidos
                  : prev.puntosObtenidos,
              porcentajeAciertos:
                typeof resultado.porcentajeAciertos === "number"
                  ? resultado.porcentajeAciertos
                  : prev.porcentajeAciertos,
            }
          : prev
      );

      if (Array.isArray(resultado.preguntas)) {
        setPreguntas((prev) =>
          prev.map((q) => {
            const updated = resultado.preguntas?.find((p) => p.id === q.id);
            if (!updated) return q;
            return {
              ...q,
              puntosObtenidos: updated.puntosObtenidos,
              acertada: updated.acertada,
              comentario: updated.comentario ?? q.comentario,
            };
          })
        );
      } else {
        setPreguntas((prev) =>
          prev.map((q) => {
            if (q.tipoPregunta !== "desarrollo") return q;
            const draft = nextErrors[q.id];
            if (!draft) return q;
            return {
              ...q,
              puntosObtenidos: draft.puntos,
              comentario: draft.comentario.trim() || undefined,
              acertada:
                typeof q.puntos === "number" && draft.puntos >= q.puntos,
            };
          })
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar la corrección";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando detalle"
        delayedMessage="Obteniendo respuestas del alumno"
      />
    );
  }

  if (error || !meta) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-red-600">{error || "Registro no encontrado"}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(returnTo)}
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate(returnTo)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a realizados
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {modoCorreccion
              ? "Corregir examen realizado"
              : "Detalle del examen realizado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">Alumno: </span>
            <span className="font-medium">{meta.nombreAlumno || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Formación: </span>
            <span className="font-medium">{formationTitle}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Examen: </span>
            <span className="font-medium">{examTitle}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Nota: </span>
            <span className="font-medium">
              {typeof meta.nota === "number" ? meta.nota : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Puntos obtenidos: </span>
            <span className="font-medium">
              {typeof meta.puntosObtenidos === "number"
                ? `${meta.puntosObtenidos} / ${PUNTOS_TOTAL_EXAMEN}`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Porcentaje de aciertos: </span>
            <span className="font-medium">
              {typeof meta.porcentajeAciertos === "number"
                ? `${meta.porcentajeAciertos}%`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Intento: </span>
            <span className="font-medium">
              {typeof meta.intentoNumero === "number"
                ? meta.totalIntentos != null
                  ? `${meta.intentoNumero} de ${meta.totalIntentos}`
                  : meta.intentoNumero
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Estado: </span>
            {meta.estado === "pendiente_correccion" ? (
              <Badge variant="secondary">Pendiente de corrección</Badge>
            ) : (
              <Badge variant={meta.aprobado ? "default" : "destructive"}>
                {meta.aprobado ? "Aprobado" : "No aprobado"}
              </Badge>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Fecha: </span>
            <span className="font-medium">
              {formatTimestamp(meta.fechaRealizacion)}
            </span>
          </div>
        </CardContent>
      </Card>

      {modoCorreccion && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Asigná el puntaje a cada respuesta de desarrollo (máximo = puntos de la
          pregunta). El comentario es opcional. Al guardar, el examen pasa a
          completado y se recalcula la nota final.
        </p>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Preguntas y respuestas
        </h2>
        {detalleIncompleto && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Este intento se rindió antes de que el sistema guardara una copia de
            las preguntas, y el examen se editó después. La nota del encabezado
            es la correcta; el detalle de cada pregunta ya no se puede
            reconstruir. Los intentos nuevos sí conservan el detalle aunque se
            edite el examen.
          </p>
        )}
        {preguntas.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No se pudo reconstruir el detalle de preguntas. Verifica que el
            registro del intento incluya el snapshot de preguntas y respuestas.
          </p>
        ) : (
          preguntas.map((q, index) => {
            const selectedIds = new Set(
              normalizeAnswerIds(q.respuestasSeleccionadas)
            );
            const correctOptions = q.respuestas.filter((r) => r.esCorrecta);
            const puntosObtenidos =
              typeof q.puntosObtenidos === "number" ? q.puntosObtenidos : 0;
            const esDesarrollo = q.tipoPregunta === "desarrollo";
            const maxPuntos = typeof q.puntos === "number" ? q.puntos : 0;
            const draft = correcciones[q.id];

            return (
              <Card key={q.id || index}>
                <CardHeader className="pb-2 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base leading-snug">
                        Pregunta {index + 1}
                      </CardTitle>
                      <Badge variant="outline">
                        {esDesarrollo ? "Desarrollo" : "Opción múltiple"}
                      </Badge>
                    </div>
                    {typeof q.puntos === "number" && (
                      <Badge
                        variant={
                          modoCorreccion && esDesarrollo
                            ? "secondary"
                            : puntosObtenidos > 0
                              ? "default"
                              : "secondary"
                        }
                      >
                        {esDesarrollo && modoCorreccion
                          ? `Máx. ${q.puntos} pts`
                          : `${puntosObtenidos} / ${q.puntos} pts`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-normal text-foreground">{q.texto}</p>
                </CardHeader>
                <CardContent>
                  {esDesarrollo ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Respuesta del alumno
                        </p>
                        <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm whitespace-pre-wrap">
                          {q.respuestaDesarrollo?.trim()
                            ? q.respuestaDesarrollo
                            : "Sin respuesta"}
                        </div>
                      </div>

                      {modoCorreccion ? (
                        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
                          <div className="space-y-2">
                            <Label htmlFor={`pts-${q.id}`}>
                              Puntaje (0 – {maxPuntos})
                            </Label>
                            <Input
                              id={`pts-${q.id}`}
                              type="text"
                              inputMode="decimal"
                              value={draft?.puntosDraft ?? "0"}
                              onChange={(e) =>
                                updatePuntosDraft(q.id, e.target.value, maxPuntos)
                              }
                              onBlur={() => commitPuntosDraft(q.id, maxPuntos)}
                            />
                            {draft?.error && (
                              <p className="text-sm text-red-600">{draft.error}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`obs-${q.id}`}>
                              Comentario / observación (opcional)
                            </Label>
                            <Textarea
                              id={`obs-${q.id}`}
                              value={draft?.comentario ?? ""}
                              onChange={(e) =>
                                updateComentario(q.id, e.target.value)
                              }
                              placeholder="Observaciones para el alumno"
                              rows={3}
                              maxLength={2000}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              Puntaje asignado
                            </p>
                            <p className="font-medium">
                              {puntosObtenidos} / {maxPuntos} pts
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              Comentario / observación
                            </p>
                            <p className="whitespace-pre-wrap">
                              {q.comentario?.trim() || "—"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-[1fr_minmax(10rem,auto)] md:items-start">
                      <div className="space-y-2 min-w-0">
                        {q.respuestas.length > 0 ? (
                          q.respuestas.map((r) => {
                            const isSelected = selectedIds.has(r.id);
                            const isCorrect = r.esCorrecta;
                            return (
                              <div
                                key={r.id}
                                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                                  isSelected && isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : isSelected && !isCorrect
                                      ? "border-amber-500 bg-amber-50"
                                      : !isSelected && isCorrect
                                        ? "border-blue-300 bg-blue-50/80"
                                        : "border-border bg-muted/30"
                                }`}
                              >
                                {isSelected && isCorrect ? (
                                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                ) : isSelected && !isCorrect ? (
                                  <X className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                ) : isCorrect ? (
                                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                ) : (
                                  <span className="w-4 h-4 shrink-0" />
                                )}
                                <p className="flex-1 min-w-0">
                                  {r.texto || `(opción ${r.id})`}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Sin opciones cargadas.
                          </p>
                        )}
                      </div>

                      <div className="md:text-right md:border-l md:pl-4 shrink-0">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Respuesta correcta
                        </p>
                        {correctOptions.length > 0 ? (
                          <ul className="text-sm text-foreground space-y-1 md:ml-auto md:w-max">
                            {correctOptions.map((r) => (
                              <li key={r.id}>{r.texto || `(opción ${r.id})`}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {modoCorreccion && desarrolloIds.length > 0 && (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(returnTo)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGuardarCorreccion}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando corrección..." : "Guardar corrección"}
          </Button>
        </div>
      )}
    </div>
  );
}
