import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { usePageHeader } from "@/context/PageHeaderContext";
import { completedExamDetailTourSteps } from "@/config/tourSteps";
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  GraduationCap,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DetailLayout,
  InfoList,
  InfoRow,
  ProfileCard,
  SectionCard,
  SectionEmpty,
  StatGrid,
} from "@/components/common/DetailLayout";
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

  const handlePublicarNota = async () => {
    if (!id || !meta) return;
    try {
      setSaving(true);
      await CompletedExamsAPI.corregir(id, { correcciones: [] });
      toast.success("Nota publicada correctamente");
      setMeta((prev) => prev ? { ...prev, estado: "completado" } : prev);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo publicar la nota";
      toast.error(message);
    } finally {
      setSaving(false);
    }
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

  usePageHeader({
    title: `${modoCorreccion ? "Corregir" : "Detalle"}${meta?.nombreAlumno ? ` · ${meta.nombreAlumno}` : ""}`,
    tourSteps: completedExamDetailTourSteps,
    // Si se llegó desde el panel general, la ruta lo refleja; si no, cuelga de Exámenes › Realizados
    breadcrumbs: returnTo.startsWith(COMPLETED_EXAMS_LIST_PATH)
      ? [
          { label: "Exámenes", to: "/exams" },
          { label: "Realizados", to: returnTo },
        ]
      : [{ label: "Panel general", to: returnTo }],
  });

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

  const isPending = meta.estado === "pendiente_correccion";
  const alumnoInitials = (meta.nombreAlumno || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const resultPill = isPending ? (
    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
      Por corregir
    </span>
  ) : (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        meta.aprobado ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      {meta.aprobado ? "Aprobado" : "No aprobado"}
    </span>
  );

  // En modo corrección las acciones viven en la ficha fija, siempre a mano
  const correctionActions = modoCorreccion ? (
    <>
      <Button
        type="button"
        size="sm"
        className="h-8"
        onClick={desarrolloIds.length > 0 ? handleGuardarCorreccion : handlePublicarNota}
        disabled={saving}
      >
        <Save className="w-3.5 h-3.5 mr-1.5" />
        {desarrolloIds.length > 0
          ? saving
            ? "Guardando…"
            : "Guardar corrección"
          : saving
            ? "Publicando…"
            : "Publicar nota"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-gray-500"
        onClick={() => navigate(returnTo)}
        disabled={saving}
      >
        Cancelar
      </Button>
    </>
  ) : undefined;

  const aside = (
    <ProfileCard
      media={
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
          {alumnoInitials || "?"}
        </span>
      }
      title={meta.nombreAlumno || "Alumno"}
      subtitle={modoCorreccion ? "Corrección de examen" : "Examen realizado"}
      badge={resultPill}
      footer={correctionActions}
    >
      <InfoList>
        <InfoRow icon={<ClipboardCheck />} label="Examen">
          <span title={examTitle}>{examTitle}</span>
        </InfoRow>
        <InfoRow icon={<GraduationCap />} label="Formación">
          <span title={formationTitle}>{formationTitle}</span>
        </InfoRow>
        <InfoRow icon={<CalendarDays />} label="Fecha">
          {formatTimestamp(meta.fechaRealizacion)}
        </InfoRow>
        <InfoRow icon={<RotateCcw />} label="Intento">
          {typeof meta.intentoNumero === "number"
            ? meta.totalIntentos != null
              ? `${meta.intentoNumero} de ${meta.totalIntentos}`
              : meta.intentoNumero
            : "—"}
        </InfoRow>
      </InfoList>
      <StatGrid
        stats={[
          { label: "Nota", value: typeof meta.nota === "number" ? meta.nota : "—" },
          {
            label: "Puntos",
            value:
              typeof meta.puntosObtenidos === "number"
                ? `${meta.puntosObtenidos}/${PUNTOS_TOTAL_EXAMEN}`
                : "—",
          },
          {
            label: "Aciertos",
            value: typeof meta.porcentajeAciertos === "number" ? `${meta.porcentajeAciertos}%` : "—",
          },
        ]}
      />
    </ProfileCard>
  );

  const notice = (text: string) => (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{text}</p>
  );

  return (
    <DetailLayout aside={aside}>
      {modoCorreccion &&
        desarrolloIds.length === 0 &&
        notice(
          "Este examen no tiene preguntas de desarrollo. La nota ya está calculada. Al publicarla, el alumno podrá verla."
        )}
      {modoCorreccion &&
        desarrolloIds.length > 0 &&
        notice(
          "Asigná el puntaje a cada respuesta de desarrollo (máximo = puntos de la pregunta). El comentario es opcional. Al guardar, el examen pasa a completado y se recalcula la nota final."
        )}

      <SectionCard
        title="Preguntas y respuestas"
        description={`${preguntas.length} pregunta${preguntas.length !== 1 ? "s" : ""}`}
      >
        {detalleIncompleto && (
          <p className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Este intento se rindió antes de que el sistema guardara una copia de
            las preguntas, y el examen se editó después. La nota del encabezado
            es la correcta; el detalle de cada pregunta ya no se puede
            reconstruir. Los intentos nuevos sí conservan el detalle aunque se
            edite el examen.
          </p>
        )}
        {preguntas.length === 0 ? (
          <SectionEmpty icon={<ClipboardCheck />}>
            No se pudo reconstruir el detalle de preguntas. Verifica que el
            registro del intento incluya el snapshot de preguntas y respuestas.
          </SectionEmpty>
        ) : (
          <ol className="divide-y divide-gray-100">
            {preguntas.map((q, index) => {
              const selectedIds = new Set(normalizeAnswerIds(q.respuestasSeleccionadas));
              const correctOptions = q.respuestas.filter((r) => r.esCorrecta);
              const puntosObtenidos = typeof q.puntosObtenidos === "number" ? q.puntosObtenidos : 0;
              const esDesarrollo = q.tipoPregunta === "desarrollo";
              const maxPuntos = typeof q.puntos === "number" ? q.puntos : 0;
              const draft = correcciones[q.id];
              const scored = puntosObtenidos > 0;

              return (
                <li key={q.id || index} className="space-y-3 px-5 py-4">
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <span className="grid place-items-center w-6 h-6 shrink-0 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {index + 1}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-gray-900">{q.texto}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                        {esDesarrollo ? "Desarrollo" : "Opción múltiple"}
                      </span>
                      {typeof q.puntos === "number" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                            esDesarrollo && modoCorreccion
                              ? "bg-amber-50 text-amber-700"
                              : scored
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {esDesarrollo && modoCorreccion
                            ? `Máx. ${q.puntos} pts`
                            : `${puntosObtenidos} / ${q.puntos} pts`}
                        </span>
                      )}
                    </div>
                  </div>

                  {q.imagenUrl ? (
                    <div className="ml-9 rounded-md border bg-gray-50 p-2">
                      <img
                        src={q.imagenUrl}
                        alt={`Imagen de la pregunta ${index + 1}`}
                        className="max-h-64 w-full rounded object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  <div className="ml-9">
                    {esDesarrollo ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Respuesta del alumno</p>
                          <div className="whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm">
                            {q.respuestaDesarrollo?.trim() ? q.respuestaDesarrollo : "Sin respuesta"}
                          </div>
                        </div>

                        {modoCorreccion ? (
                          <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
                            <div className="space-y-1.5">
                              <Label htmlFor={`pts-${q.id}`} className="text-xs text-gray-500">
                                Puntaje (0 – {maxPuntos})
                              </Label>
                              <Input
                                id={`pts-${q.id}`}
                                type="text"
                                inputMode="decimal"
                                value={draft?.puntosDraft ?? "0"}
                                onChange={(e) => updatePuntosDraft(q.id, e.target.value, maxPuntos)}
                                onBlur={() => commitPuntosDraft(q.id, maxPuntos)}
                              />
                              {draft?.error && <p className="text-xs text-red-600">{draft.error}</p>}
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`obs-${q.id}`} className="text-xs text-gray-500">
                                Comentario (opcional)
                              </Label>
                              <Textarea
                                id={`obs-${q.id}`}
                                value={draft?.comentario ?? ""}
                                onChange={(e) => updateComentario(q.id, e.target.value)}
                                placeholder="Observaciones para el alumno"
                                rows={2}
                                maxLength={2000}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-3 text-sm sm:grid-cols-[9rem_1fr]">
                            <div>
                              <p className="text-xs text-gray-500">Puntaje asignado</p>
                              <p className="font-medium tabular-nums">
                                {puntosObtenidos} / {maxPuntos} pts
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Comentario</p>
                              <p className="whitespace-pre-wrap">{q.comentario?.trim() || "—"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-[1fr_minmax(10rem,auto)] md:items-start">
                        <div className="min-w-0 space-y-1.5">
                          {q.respuestas.length > 0 ? (
                            q.respuestas.map((r) => {
                              const isSelected = selectedIds.has(r.id);
                              const isCorrect = r.esCorrecta;
                              return (
                                <div
                                  key={r.id}
                                  className={`flex items-start gap-2 rounded-md border px-3 py-1.5 text-sm ${
                                    isSelected && isCorrect
                                      ? "border-green-200 bg-green-50"
                                      : isSelected && !isCorrect
                                        ? "border-amber-200 bg-amber-50"
                                        : !isSelected && isCorrect
                                          ? "border-blue-200 bg-blue-50/60"
                                          : "border-gray-100 bg-white"
                                  }`}
                                >
                                  {isSelected && isCorrect ? (
                                    <Check className="mt-0.5 w-4 h-4 shrink-0 text-green-600" />
                                  ) : isSelected && !isCorrect ? (
                                    <X className="mt-0.5 w-4 h-4 shrink-0 text-amber-600" />
                                  ) : isCorrect ? (
                                    <Check className="mt-0.5 w-4 h-4 shrink-0 text-blue-600" />
                                  ) : (
                                    <span className="w-4 h-4 shrink-0" />
                                  )}
                                  <p className="min-w-0 flex-1">{r.texto || `(opción ${r.id})`}</p>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm italic text-gray-400">Sin opciones cargadas.</p>
                          )}
                        </div>

                        <div className="shrink-0 md:border-l md:border-gray-100 md:pl-4 md:text-right">
                          <p className="mb-1 text-xs text-gray-500">Respuesta correcta</p>
                          {correctOptions.length > 0 ? (
                            <ul className="space-y-1 text-sm text-gray-900 md:ml-auto md:w-max">
                              {correctOptions.map((r) => (
                                <li key={r.id}>{r.texto || `(opción ${r.id})`}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-400">—</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </SectionCard>
    </DetailLayout>
  );
}
