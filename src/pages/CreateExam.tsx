import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageHeader } from "@/context/PageHeaderContext";
import { examFormTourSteps } from "@/config/tourSteps";
import { CheckCircle2, Circle, ClipboardCheck, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DetailLayout, ProfileCard, SectionCard, StatGrid } from "@/components/common/DetailLayout";
import { FormField } from "@/components/common/FormField";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { CoursesAPI } from "@/service/courses";
import { ExamsAPI } from "@/service/exams";
import type { Course, Examen, ExamenCreatePayload, TipoPregunta } from "@/types/types";
import { toast } from "sonner";
import {
  distributePuntosEqually,
  parsePuntosInput,
  puntosSumEqualsTotal,
  PUNTOS_TOTAL_EXAMEN,
  roundPuntos,
  sumPreguntasPuntos,
} from "@/utils/examPoints";

type OptionForm = {
  id: string;
  texto: string;
  esCorrecta: boolean;
};

type QuestionForm = {
  id: string;
  texto: string;
  puntos: number;
  tipoPregunta: TipoPregunta;
  imagenUrl?: string;
  imagenPath?: string;
  /** Archivo pendiente de subir al guardar. */
  imagenFile?: File | null;
  /** Preview local (object URL) o URL remota. */
  imagenPreview?: string;
  respuestas: OptionForm[];
};

type QuestionError = {
  texto?: string;
  respuestas?: string;
  puntos?: string;
};

type ValidationResult = {
  isValid: boolean;
  firstErrorField?: string;
};

const makeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyOption = (): OptionForm => ({
  id: makeId(),
  texto: "",
  esCorrecta: false,
});

const createEmptyQuestion = (): QuestionForm => ({
  id: makeId(),
  texto: "",
  puntos: PUNTOS_TOTAL_EXAMEN,
  tipoPregunta: "opcion_multiple",
  respuestas: [createEmptyOption(), createEmptyOption()],
});

const applyEqualPuntos = (questions: QuestionForm[]): QuestionForm[] => {
  const distribution = distributePuntosEqually(questions.length);
  return questions.map((question, index) => ({
    ...question,
    puntos: distribution[index] ?? 0,
  }));
};

function examToFormState(exam: Examen): {
  title: string;
  idFormacion: string;
  duracionMinutos: number;
  requiereCompletarCurso: boolean;
  notaMinima: number;
  publicacionManualDeNota: boolean;
  intentosMaximos: number;
  permitirRevision: boolean;
  questions: QuestionForm[];
} {
  const duracion =
    typeof exam.duracionMinutos === "number" && exam.duracionMinutos > 0
      ? exam.duracionMinutos
      : 90;

  const rawQuestions =
    exam.preguntas?.length > 0
      ? exam.preguntas.map((q) => ({
          id: q.id || makeId(),
          texto: q.texto || "",
          puntos: typeof q.puntos === "number" ? q.puntos : 0,
          tipoPregunta:
            q.tipoPregunta === "desarrollo"
              ? ("desarrollo" as const)
              : ("opcion_multiple" as const),
          imagenUrl: q.imagenUrl || undefined,
          imagenPath: q.imagenPath || undefined,
          imagenFile: null,
          imagenPreview: q.imagenUrl || undefined,
          respuestas:
            q.tipoPregunta === "desarrollo"
              ? []
              : q.respuestas?.length > 0
                ? q.respuestas.map((r) => ({
                    id: r.id || makeId(),
                    texto: r.texto || "",
                    esCorrecta: Boolean(r.esCorrecta),
                  }))
                : [createEmptyOption(), createEmptyOption()],
        }))
      : [createEmptyQuestion()];

  const hasAllPuntos = rawQuestions.every((q) => q.puntos > 0);
  const questions = hasAllPuntos
    ? rawQuestions
    : applyEqualPuntos(rawQuestions);

  return {
    title: exam.titulo || "",
    idFormacion: exam.idFormacion || "",
    duracionMinutos: duracion,
    requiereCompletarCurso: exam.requiereCompletarCurso !== false,
    notaMinima:
      typeof exam.notaMinima === "number" && exam.notaMinima > 0
        ? exam.notaMinima
        : 70,
    publicacionManualDeNota: exam.publicacionManualDeNota === true,
    intentosMaximos:
      typeof exam.intentosMaximos === "number" && exam.intentosMaximos > 0
        ? exam.intentosMaximos
        : 1,
    permitirRevision: exam.permitirRevision !== false,
    questions,
  };
}

export default function CreateExam() {
  const navigate = useNavigate();
  const { id: examId } = useParams<{ id: string }>();
  const isEditing = Boolean(examId);
  const [title, setTitle] = useState("");
  const [idFormacion, setIdFormacion] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState(90);
  const [duracionError, setDuracionError] = useState("");
  const [notaMinima, setNotaMinima] = useState(70);
  const [notaMinimaError, setNotaMinimaError] = useState("");
  const [intentosMaximos, setIntentosMaximos] = useState(1);
  const [permitirRevision, setPermitirRevision] = useState(true);
  const [intentosError, setIntentosError] = useState("");
  const [requiereCompletarCurso, setRequiereCompletarCurso] = useState(true);
  const [publicacionManualDeNota, setPublicacionManualDeNota] = useState(false);
  const [questions, setQuestions] = useState<QuestionForm[]>([createEmptyQuestion()]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingExam, setLoadingExam] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [formationError, setFormationError] = useState("");
  const [questionsError, setQuestionsError] = useState("");
  const [questionErrors, setQuestionErrors] = useState<Record<string, QuestionError>>({});
  const [puntosError, setPuntosError] = useState("");
  const [puntosDraft, setPuntosDraft] = useState<Record<string, string>>({});
  const lastQuestionRef = useRef<HTMLDivElement | null>(null);
  const scrollToNewQuestion = useRef(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const setFieldRef = useCallback(
    (fieldId: string) => (element: HTMLElement | null) => {
      fieldRefs.current[fieldId] = element;
    },
    []
  );

  const setQuestionCardRef = useCallback(
    (questionId: string, isLast: boolean) => (element: HTMLDivElement | null) => {
      fieldRefs.current[`question-${questionId}`] = element;
      if (isLast) {
        lastQuestionRef.current = element;
      }
    },
    []
  );

  const scrollToFirstError = useCallback((fieldId: string) => {
    requestAnimationFrame(() => {
      const element = fieldRefs.current[fieldId];
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });

      const focusable = element.querySelector<HTMLElement>(
        "input, textarea, [role='combobox']"
      );
      focusable?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const data = await CoursesAPI.getAllList();
        setCourses(data);
      } catch (error) {
        console.error("Error al cargar formaciones:", error);
        toast.error("No se pudieron cargar las formaciones");
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      try {
        setLoadingExam(true);
        setLoadError("");
        const exam = await ExamsAPI.getById(examId);
        const form = examToFormState(exam);
        setTitle(form.title);
        setIdFormacion(form.idFormacion);
        setDuracionMinutos(form.duracionMinutos);
        setNotaMinima(form.notaMinima);
        setIntentosMaximos(form.intentosMaximos);
        setPermitirRevision(form.permitirRevision);
        setRequiereCompletarCurso(form.requiereCompletarCurso);
        setPublicacionManualDeNota(form.publicacionManualDeNota);
        setQuestions(form.questions);
      } catch (error) {
        console.error("Error al cargar examen:", error);
        const message =
          error instanceof Error ? error.message : "No se pudo cargar el examen";
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoadingExam(false);
      }
    };

    loadExam();
  }, [examId]);

  const canSave = useMemo(
    () => !saving && !loadingCourses && !loadingExam,
    [saving, loadingCourses, loadingExam]
  );

  const tieneDesarrollo = useMemo(
    () => questions.some((q) => q.tipoPregunta === "desarrollo"),
    [questions]
  );

  useEffect(() => {
    if (tieneDesarrollo) setPublicacionManualDeNota(false);
  }, [tieneDesarrollo]);

  const totalPuntos = useMemo(() => sumPreguntasPuntos(questions), [questions]);
  const puntosValidos = puntosSumEqualsTotal(totalPuntos);

  const updateQuestion = (questionId: string, updater: (q: QuestionForm) => QuestionForm) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? updater(q) : q)));
  };

  const addQuestion = () => {
    scrollToNewQuestion.current = true;
    setQuestions((prev) => [
      ...prev,
      { ...createEmptyQuestion(), puntos: 0 },
    ]);
    setPuntosError("");
  };

  useEffect(() => {
    if (!scrollToNewQuestion.current || !lastQuestionRef.current) return;
    scrollToNewQuestion.current = false;
    lastQuestionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [questions.length]);

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setPuntosError("");
    setPuntosDraft((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setQuestionErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const redistributePuntos = () => {
    setQuestions((prev) => applyEqualPuntos(prev));
    setPuntosDraft({});
    setPuntosError("");
  };

  const updateQuestionPuntos = (questionId: string, value: string) => {
    const normalized = value.replace(",", ".");
    // Permitir teclear decimales a medias (ej. "33." / "33,")
    if (normalized !== "" && !/^\d*\.?\d*$/.test(normalized)) {
      return;
    }

    setPuntosDraft((prev) => ({ ...prev, [questionId]: value }));

    if (normalized === "" || normalized === ".") {
      updateQuestion(questionId, (q) => ({ ...q, puntos: 0 }));
    } else if (!normalized.endsWith(".")) {
      updateQuestion(questionId, (q) => ({
        ...q,
        puntos: parsePuntosInput(value),
      }));
    }

    setPuntosError("");
    clearQuestionError(questionId, "puntos");
  };

  const commitQuestionPuntos = (questionId: string) => {
    const draft = puntosDraft[questionId];
    const puntos =
      draft !== undefined ? parsePuntosInput(draft) : undefined;
    if (puntos !== undefined) {
      updateQuestion(questionId, (q) => ({ ...q, puntos }));
    }
    setPuntosDraft((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const addOption = (questionId: string) => {
    updateQuestion(questionId, (q) => ({
      ...q,
      respuestas: [...q.respuestas, createEmptyOption()],
    }));
  };

  const changeQuestionTipo = (questionId: string, tipoPregunta: TipoPregunta) => {
    updateQuestion(questionId, (q) => {
      if (tipoPregunta === "desarrollo") {
        return { ...q, tipoPregunta, respuestas: [] };
      }
      return {
        ...q,
        tipoPregunta,
        respuestas:
          q.respuestas.length >= 2
            ? q.respuestas
            : [createEmptyOption(), createEmptyOption()],
      };
    });
    clearQuestionError(questionId, "respuestas");
  };

  const setQuestionImage = (questionId: string, file: File | null) => {
    updateQuestion(questionId, (q) => {
      if (q.imagenPreview && q.imagenPreview.startsWith("blob:")) {
        URL.revokeObjectURL(q.imagenPreview);
      }
      if (!file) {
        return {
          ...q,
          imagenFile: null,
          imagenPreview: undefined,
          imagenUrl: undefined,
          imagenPath: undefined,
        };
      }
      return {
        ...q,
        imagenFile: file,
        imagenPreview: URL.createObjectURL(file),
      };
    });
  };

  const buildPreguntasPayload = (
    source: QuestionForm[]
  ): ExamenCreatePayload["preguntas"] =>
    source.map((q) => ({
      id: q.id,
      texto: q.texto.trim(),
      puntos: roundPuntos(q.puntos),
      tipoPregunta: q.tipoPregunta,
      ...(q.imagenUrl
        ? { imagenUrl: q.imagenUrl, ...(q.imagenPath ? { imagenPath: q.imagenPath } : {}) }
        : {}),
      respuestas:
        q.tipoPregunta === "desarrollo"
          ? []
          : q.respuestas.map((r) => ({
              id: r.id,
              texto: r.texto.trim(),
              esCorrecta: r.esCorrecta,
            })),
    }));

  const uploadPendingImages = async (
    examenId: string,
    source: QuestionForm[]
  ): Promise<QuestionForm[]> => {
    const next = [...source];
    for (let i = 0; i < next.length; i += 1) {
      const q = next[i];
      if (!q.imagenFile) continue;
      const uploaded = await ExamsAPI.uploadQuestionImage(
        examenId,
        q.id,
        q.imagenFile
      );
      if (q.imagenPreview && q.imagenPreview.startsWith("blob:")) {
        URL.revokeObjectURL(q.imagenPreview);
      }
      next[i] = {
        ...q,
        imagenFile: null,
        imagenUrl: uploaded.url,
        imagenPath: uploaded.path,
        imagenPreview: uploaded.url,
      };
    }
    return next;
  };

  const removeOption = (questionId: string, optionId: string) => {
    updateQuestion(questionId, (q) => ({
      ...q,
      respuestas: q.respuestas.filter((r) => r.id !== optionId),
    }));
  };

  const toggleCorrectOption = (questionId: string, optionId: string) => {
    updateQuestion(questionId, (q) => ({
      ...q,
      respuestas: q.respuestas.map((r) =>
        r.id === optionId ? { ...r, esCorrecta: !r.esCorrecta } : r
      ),
    }));
    clearQuestionError(questionId, "respuestas");
  };

  const clearQuestionError = (questionId: string, field?: keyof QuestionError) => {
    setQuestionErrors((prev) => {
      const current = prev[questionId];
      if (!current) return prev;

      if (!field) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }

      if (!current[field]) return prev;

      const updated = { ...current };
      delete updated[field];
      if (!updated.texto && !updated.respuestas && !updated.puntos) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }

      return { ...prev, [questionId]: updated };
    });
  };

  const validate = (): ValidationResult => {
    let isValid = true;
    let firstErrorField: string | undefined;
    const nextQuestionErrors: Record<string, QuestionError> = {};
    setTitleError("");
    setFormationError("");
    setDuracionError("");
    setQuestionsError("");
    setPuntosError("");

    const markInvalid = (fieldId: string) => {
      isValid = false;
      if (!firstErrorField) firstErrorField = fieldId;
    };

    if (!title.trim()) {
      setTitleError("El título del examen es obligatorio");
      markInvalid("title");
    }

    if (!idFormacion) {
      setFormationError("Debes seleccionar una formación");
      markInvalid("formation");
    }

    if (
      !Number.isFinite(duracionMinutos) ||
      !Number.isInteger(duracionMinutos) ||
      duracionMinutos < 1 ||
      duracionMinutos > 480
    ) {
      setDuracionError("La duración debe ser un número entero entre 1 y 480 minutos");
      markInvalid("duration");
    }

    if (
      !Number.isFinite(notaMinima) ||
      !Number.isInteger(notaMinima) ||
      notaMinima < 1 ||
      notaMinima > 100
    ) {
      setNotaMinimaError("La nota mínima debe ser un número entero entre 1 y 100");
      markInvalid("notaMinima");
    }

    if (
      !Number.isInteger(intentosMaximos) ||
      intentosMaximos < 1 ||
      intentosMaximos > 100
    ) {
      setIntentosError("Los intentos deben ser un número entero entre 1 y 100");
      markInvalid("intentos");
    }

    if (questions.length === 0) {
      setQuestionsError("Debes agregar al menos una pregunta");
      markInvalid("questions");
    }

    questions.forEach((question) => {
      const qError: QuestionError = {};

      if (!question.texto.trim()) {
        qError.texto = "La pregunta no puede estar vacía";
        markInvalid(`question-${question.id}`);
      }
      if (!(question.puntos > 0)) {
        qError.puntos = "La pregunta debe tener más de 0 puntos";
        markInvalid(`question-${question.id}`);
      }

      if (question.tipoPregunta !== "desarrollo") {
        const filledOptions = question.respuestas.filter(
          (r) => r.texto.trim().length > 0
        );
        const hasEmptyOption = question.respuestas.some((r) => !r.texto.trim());
        const hasCorrect = question.respuestas.some(
          (r) => r.esCorrecta && r.texto.trim().length > 0
        );

        if (hasEmptyOption) {
          qError.respuestas = "Todas las respuestas deben tener texto";
          markInvalid(`question-${question.id}`);
        } else if (filledOptions.length < 2) {
          qError.respuestas =
            "Cada pregunta debe tener al menos 2 respuestas con texto";
          markInvalid(`question-${question.id}`);
        } else if (!hasCorrect) {
          qError.respuestas = "Debes marcar al menos una respuesta correcta";
          markInvalid(`question-${question.id}`);
        }
      }

      if (qError.texto || qError.respuestas || qError.puntos) {
        nextQuestionErrors[question.id] = qError;
      }
    });

    if (!puntosSumEqualsTotal(totalPuntos)) {
      setPuntosError(
        `La suma de puntos debe ser ${PUNTOS_TOTAL_EXAMEN} (actual: ${roundPuntos(totalPuntos)})`
      );
      markInvalid("puntos-total");
    }

    setQuestionErrors(nextQuestionErrors);
    return { isValid, firstErrorField };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (!validation.isValid) {
      toast.error("No se pudo guardar. Por favor, revisa los campos incompletos");
      if (validation.firstErrorField) {
        scrollToFirstError(validation.firstErrorField);
      }
      return;
    }

    const basePayload: ExamenCreatePayload = {
      titulo: title.trim(),
      idFormacion,
      duracionMinutos,
      requiereCompletarCurso,
      notaMinima,
      publicacionManualDeNota: publicacionManualDeNota,
      intentosMaximos,
      permitirRevision,
      preguntas: buildPreguntasPayload(questions),
    };

    try {
      setSaving(true);
      let savedId = examId || "";
      let workingQuestions = questions;

      if (isEditing && examId) {
        workingQuestions = await uploadPendingImages(examId, questions);
        setQuestions(workingQuestions);
        await ExamsAPI.update(examId, {
          ...basePayload,
          preguntas: buildPreguntasPayload(workingQuestions),
        });
        toast.success("Examen actualizado exitosamente");
      } else {
        const created = await ExamsAPI.create(basePayload);
        savedId = String(created?.id ?? "").trim();
        if (!savedId) {
          throw new Error("No se pudo obtener el ID del examen creado");
        }
        const hasPendingImages = questions.some((q) => Boolean(q.imagenFile));
        if (hasPendingImages) {
          workingQuestions = await uploadPendingImages(savedId, questions);
          setQuestions(workingQuestions);
          await ExamsAPI.update(savedId, {
            ...basePayload,
            preguntas: buildPreguntasPayload(workingQuestions),
          });
        }
        toast.success("Examen creado exitosamente");
      }
      navigate("/exams");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? "No se pudo actualizar el examen"
            : "No se pudo crear el examen";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  usePageHeader({
    title: isEditing ? "Editar examen" : "Crear examen",
    tourSteps: examFormTourSteps,
    breadcrumbs: [{ label: "Exámenes", to: "/exams" }],
  });

  if (loadingCourses || loadingExam) {
    return (
      <InteractiveLoader
        initialMessage={isEditing ? "Cargando examen" : "Cargando formulario"}
        delayedMessage={
          isEditing
            ? "Obteniendo datos del examen"
            : "Trayendo formaciones disponibles"
        }
      />
    );
  }

  if (isEditing && loadError) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-red-600">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => navigate("/exams")}>
          Volver a Exámenes
        </Button>
      </div>
    );
  }

  const selectedCourse = courses.find((course) => course.id === idFormacion);
  const developmentCount = questions.filter((q) => q.tipoPregunta === "desarrollo").length;

  // Toma el valor numérico de un input: vacío = 0 (la validación lo marca), NaN se ignora
  const numberChange =
    (setter: (value: number) => void, clearError: () => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        setter(0);
        clearError();
        return;
      }
      const value = Number.parseInt(raw, 10);
      if (!Number.isNaN(value)) {
        setter(value);
        clearError();
      }
    };

  const aside = (
    <ProfileCard
      media={
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-orange-50 text-orange-600">
          <ClipboardCheck className="w-5 h-5" />
        </span>
      }
      title={title.trim() || (isEditing ? "Examen sin título" : "Nuevo examen")}
      subtitle={selectedCourse?.titulo || "Sin formación asignada"}
      footer={
        <>
          <Button type="submit" form="exam-form" size="sm" className="h-8 cursor-pointer" disabled={!canSave}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Guardar examen"}
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 cursor-pointer" onClick={addQuestion}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Agregar pregunta
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-gray-500 cursor-pointer"
            onClick={() => navigate("/exams")}
            disabled={saving}
          >
            Cancelar
          </Button>
        </>
      }
    >
      <StatGrid
        stats={[
          { label: "Preguntas", value: questions.length },
          {
            label: "Puntos",
            value: (
              <span className={puntosValidos ? undefined : "text-red-600"}>
                {totalPuntos}/{PUNTOS_TOTAL_EXAMEN}
              </span>
            ),
          },
          { label: "Desarrollo", value: developmentCount },
        ]}
      />
      {!puntosValidos && (
        <p className="px-5 pt-3 text-xs text-red-600">
          Los puntos deben sumar {PUNTOS_TOTAL_EXAMEN} para poder guardar.
        </p>
      )}
    </ProfileCard>
  );

  return (
    <DetailLayout aside={aside}>
      <form id="exam-form" className="space-y-6" onSubmit={handleSave}>
        <SectionCard tourId="exam-config" title="Configuración" description="Datos generales y reglas del examen">
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-3">
            <div ref={setFieldRef("title")} className="sm:col-span-3">
              <FormField id="exam-title" label="Título del examen" error={titleError}>
                <Input
                  id="exam-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError("");
                  }}
                  placeholder="Ej: Evaluación final de Anatomía"
                  className={titleError ? "border-red-500" : ""}
                />
              </FormField>
            </div>

            <div ref={setFieldRef("formation")} className="sm:col-span-3">
              <FormField id="exam-formation" label="Formación asociada" error={formationError}>
                <Select
                  value={idFormacion}
                  onValueChange={(value) => {
                    setIdFormacion(value);
                    if (formationError) setFormationError("");
                  }}
                >
                  <SelectTrigger id="exam-formation" className={`w-full ${formationError ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Selecciona una formación" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div ref={setFieldRef("duration")}>
              <FormField
                id="exam-duration"
                label="Duración (minutos)"
                error={duracionError}
                hint="Valor base: 90 minutos."
              >
                <Input
                  id="exam-duration"
                  type="number"
                  min={1}
                  max={480}
                  step={1}
                  value={duracionMinutos === 0 ? "" : duracionMinutos}
                  onChange={numberChange(setDuracionMinutos, () => duracionError && setDuracionError(""))}
                />
              </FormField>
            </div>

            <div ref={setFieldRef("notaMinima")}>
              <FormField
                id="nota-minima"
                label="Nota de aprobación (%)"
                error={notaMinimaError}
                hint="Mínimo de aciertos. Base: 70%."
              >
                <Input
                  id="nota-minima"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={notaMinima === 0 ? "" : notaMinima}
                  onChange={numberChange(setNotaMinima, () => notaMinimaError && setNotaMinimaError(""))}
                />
              </FormField>
            </div>

            <div ref={setFieldRef("intentos")}>
              <FormField
                id="intentos-maximos"
                label="Intentos por alumno"
                error={intentosError}
                hint='Base: 1. Personalizable desde "Intentos".'
              >
                <Input
                  id="intentos-maximos"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={intentosMaximos === 0 ? "" : intentosMaximos}
                  onChange={numberChange(setIntentosMaximos, () => intentosError && setIntentosError(""))}
                />
              </FormField>
            </div>
          </div>

          <div className="divide-y divide-gray-100 border-t border-gray-100">
            <label
              htmlFor="requiere-completar-curso"
              className="flex cursor-pointer items-center justify-between gap-4 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Requiere completar el curso</p>
                <p className="text-xs text-gray-500">
                  Si está desactivado, el alumno puede rendir sin haber completado todos los módulos.
                </p>
              </div>
              <Switch
                id="requiere-completar-curso"
                checked={requiereCompletarCurso}
                onCheckedChange={setRequiereCompletarCurso}
              />
            </label>
            <label
              htmlFor="publicacion-manual"
              className={`flex items-center justify-between gap-4 px-5 py-3 ${tieneDesarrollo ? "" : "cursor-pointer"}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Publicación manual de nota</p>
                <p className="text-xs text-gray-500">
                  {tieneDesarrollo
                    ? "No disponible para exámenes con preguntas de desarrollo."
                    : "El alumno no verá su nota hasta que un administrador la publique."}
                </p>
              </div>
              <Switch
                id="publicacion-manual"
                checked={publicacionManualDeNota}
                onCheckedChange={setPublicacionManualDeNota}
                disabled={tieneDesarrollo}
              />
            </label>
            <label
              htmlFor="permitir-revision"
              className="flex cursor-pointer items-center justify-between gap-4 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Permitir revisión del examen</p>
                <p className="text-xs text-gray-500">
                  El alumno puede ver sus respuestas corregidas cuando aprueba o usa todos sus intentos.
                  Podés habilitársela a un alumno puntual desde "Intentos".
                </p>
              </div>
              <Switch
                id="permitir-revision"
                checked={permitirRevision}
                onCheckedChange={setPermitirRevision}
              />
            </label>
          </div>
        </SectionCard>

        <div ref={setFieldRef("questions")}>
          <SectionCard
            tourId="exam-questions"
            title="Preguntas"
            description={`${questions.length} pregunta${questions.length !== 1 ? "s" : ""}`}
            action={
              <div className="flex items-center gap-2" ref={setFieldRef("puntos-total")}>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
                    puntosValidos ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {totalPuntos} / {PUNTOS_TOTAL_EXAMEN} pts
                </span>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-gray-600" onClick={redistributePuntos}>
                  Distribuir equitativamente
                </Button>
              </div>
            }
          >
            {(questionsError || puntosError) && (
              <div className="space-y-1 px-5 pt-4">
                {questionsError && <p className="text-xs text-red-600">{questionsError}</p>}
                {puntosError && <p className="text-xs text-red-600">{puntosError}</p>}
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  ref={setQuestionCardRef(question.id, index === questions.length - 1)}
                  className="space-y-4 px-5 py-5"
                >
                  {/* Encabezado: número, tipo, puntos y eliminar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid place-items-center w-6 h-6 shrink-0 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {index + 1}
                    </span>
                    <Select
                      value={question.tipoPregunta}
                      onValueChange={(value) =>
                        changeQuestionTipo(question.id, value === "desarrollo" ? "desarrollo" : "opcion_multiple")
                      }
                    >
                      <SelectTrigger className="h-8 w-auto min-w-[11rem] text-sm" aria-label="Tipo de respuesta">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opcion_multiple">Opción múltiple</SelectItem>
                        <SelectItem value="desarrollo">Desarrollo (texto libre)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Label htmlFor={`puntos-${question.id}`} className="text-xs text-gray-500">
                        Puntos
                      </Label>
                      <Input
                        id={`puntos-${question.id}`}
                        type="text"
                        inputMode="decimal"
                        className="h-8 w-16 text-right tabular-nums"
                        value={puntosDraft[question.id] ?? String(question.puntos)}
                        onChange={(e) => updateQuestionPuntos(question.id, e.target.value)}
                        onBlur={() => commitQuestionPuntos(question.id)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeQuestion(question.id)}
                        disabled={questions.length === 1}
                        title="Eliminar pregunta"
                        aria-label={`Eliminar pregunta ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {questionErrors[question.id]?.puntos && (
                    <p className="text-xs text-red-600 break-words">{questionErrors[question.id]?.puntos}</p>
                  )}

                  <div className="space-y-4 pl-8">
                    <FormField
                      id={`texto-${question.id}`}
                      label="Texto de la pregunta"
                      error={questionErrors[question.id]?.texto}
                    >
                      <Textarea
                        id={`texto-${question.id}`}
                        value={question.texto}
                        onChange={(e) => {
                          updateQuestion(question.id, (q) => ({ ...q, texto: e.target.value }));
                          clearQuestionError(question.id, "texto");
                        }}
                        placeholder="Escribe la pregunta"
                        rows={2}
                      />
                    </FormField>

                    <FormField
                      id={`imagen-${question.id}`}
                      label="Imagen (opcional)"
                      icon={<ImagePlus />}
                      required={false}
                      hint="El alumno la verá al rendir. JPG, PNG, WEBP o GIF · máx. 5 MB."
                    >
                      {question.imagenPreview ? (
                        <div className="flex flex-wrap items-start gap-3">
                          <img
                            src={question.imagenPreview}
                            alt={`Vista previa pregunta ${index + 1}`}
                            className="h-24 max-w-full rounded-md border bg-gray-50 object-contain"
                          />
                          <div className="flex flex-col gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => setQuestionImage(question.id, null)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              Quitar imagen
                            </Button>
                            {question.imagenFile && (
                              <span className="text-xs text-gray-500">Se subirá al guardar</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Input
                          id={`imagen-${question.id}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="cursor-pointer text-sm"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (file && file.size > 5 * 1024 * 1024) {
                              toast.error("La imagen no puede superar 5 MB");
                              e.target.value = "";
                              return;
                            }
                            setQuestionImage(question.id, file);
                            e.target.value = "";
                          }}
                        />
                      )}
                    </FormField>

                    {question.tipoPregunta === "desarrollo" ? (
                      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                        El alumno responderá con texto libre. Esta pregunta no se corrige
                        automáticamente: el examen quedará pendiente de corrección.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-600">
                            Respuestas <span className="font-normal text-gray-400">· marcá la correcta</span>
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-gray-600"
                            onClick={() => addOption(question.id)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Agregar respuesta
                          </Button>
                        </div>

                        {question.respuestas.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleCorrectOption(question.id, option.id)}
                              className={`grid place-items-center w-8 h-8 shrink-0 rounded-md transition-colors cursor-pointer ${
                                option.esCorrecta
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                              }`}
                              title={option.esCorrecta ? "Respuesta correcta" : "Marcar como correcta"}
                              aria-label={option.esCorrecta ? "Respuesta correcta" : "Marcar como correcta"}
                              aria-pressed={option.esCorrecta}
                            >
                              {option.esCorrecta ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <Input
                              className={`h-9 min-w-0 flex-1 ${option.esCorrecta ? "border-green-200 bg-green-50/40" : ""}`}
                              value={option.texto}
                              onChange={(e) => {
                                updateQuestion(question.id, (q) => ({
                                  ...q,
                                  respuestas: q.respuestas.map((r) =>
                                    r.id === option.id ? { ...r, texto: e.target.value } : r
                                  ),
                                }));
                                clearQuestionError(question.id, "respuestas");
                              }}
                              placeholder={`Respuesta ${optionIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              onClick={() => removeOption(question.id, option.id)}
                              disabled={question.respuestas.length <= 2}
                              title="Eliminar respuesta"
                              aria-label={`Eliminar respuesta ${optionIndex + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        {questionErrors[question.id]?.respuestas && (
                          <p className="text-xs text-red-600">{questionErrors[question.id]?.respuestas}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-3">
              <button
                type="button"
                onClick={addQuestion}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 py-2.5 text-sm text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar pregunta
              </button>
            </div>
          </SectionCard>
        </div>
      </form>
    </DetailLayout>
  );
}
