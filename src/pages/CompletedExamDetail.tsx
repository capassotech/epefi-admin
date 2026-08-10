import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { CompletedExamsAPI } from "@/service/completedExams";
import { CoursesAPI } from "@/service/courses";
import { ExamsAPI } from "@/service/exams";
import type {
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
  PUNTOS_TOTAL_EXAMEN,
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
  fechaRealizacion?: FirestoreTimestamp | string | number;
  intentoNumero?: number;
  totalIntentos?: number;
  porcentajeAciertos?: number;
  puntosObtenidos?: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const aprobado = porcentajeAciertos >= 70;

        setMeta({
          id: data.id,
          nombreAlumno: data.nombreAlumno,
          idFormacion: data.idFormacion,
          idExamen: data.idExamen,
          nota,
          aprobado,
          fechaRealizacion: data.fechaRealizacion,
          intentoNumero: data.intentoNumero,
          totalIntentos: data.totalIntentos,
          porcentajeAciertos,
          puntosObtenidos,
        });

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
          <CardTitle>Detalle del examen realizado</CardTitle>
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
            <Badge variant={meta.aprobado ? "default" : "destructive"}>
              {meta.aprobado ? "Aprobado" : "No aprobado"}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Fecha: </span>
            <span className="font-medium">
              {formatTimestamp(meta.fechaRealizacion)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Preguntas y respuestas
        </h2>
        {preguntas.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No se pudo reconstruir el detalle de preguntas. Verifica que el
            registro incluya respuestas o que el examen original siga existiendo.
          </p>
        ) : (
          preguntas.map((q, index) => {
            const selectedIds = new Set(
              normalizeAnswerIds(q.respuestasSeleccionadas)
            );
            const correctOptions = q.respuestas.filter((r) => r.esCorrecta);
            const puntosObtenidos =
              typeof q.puntosObtenidos === "number" ? q.puntosObtenidos : 0;

            return (
              <Card key={q.id || index}>
                <CardHeader className="pb-2 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      Pregunta {index + 1}
                    </CardTitle>
                    {typeof q.puntos === "number" && (
                      <Badge
                        variant={puntosObtenidos > 0 ? "default" : "secondary"}
                      >
                        {puntosObtenidos} / {q.puntos} pts
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-normal text-foreground">{q.texto}</p>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
