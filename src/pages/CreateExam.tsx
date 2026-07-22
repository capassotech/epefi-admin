import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { CoursesAPI } from "@/service/courses";
import { ExamsAPI } from "@/service/exams";
import type { Course, Examen, ExamenCreatePayload } from "@/types/types";
import { toast } from "sonner";
import { useSidebarLayout } from "@/context/SidebarLayoutContext";

type OptionForm = {
  id: string;
  texto: string;
  esCorrecta: boolean;
};

type QuestionForm = {
  id: string;
  texto: string;
  respuestas: OptionForm[];
};

type QuestionError = {
  texto?: string;
  respuestas?: string;
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
  respuestas: [createEmptyOption(), createEmptyOption()],
});

function examToFormState(exam: Examen): {
  title: string;
  idFormacion: string;
  questions: QuestionForm[];
} {
  return {
    title: exam.titulo || "",
    idFormacion: exam.idFormacion || "",
    questions:
      exam.preguntas?.length > 0
        ? exam.preguntas.map((q) => ({
            id: q.id || makeId(),
            texto: q.texto || "",
            respuestas:
              q.respuestas?.length > 0
                ? q.respuestas.map((r) => ({
                    id: r.id || makeId(),
                    texto: r.texto || "",
                    esCorrecta: Boolean(r.esCorrecta),
                  }))
                : [createEmptyOption(), createEmptyOption()],
          }))
        : [createEmptyQuestion()],
  };
}

export default function CreateExam() {
  const navigate = useNavigate();
  const { id: examId } = useParams<{ id: string }>();
  const isEditing = Boolean(examId);
  const { sidebarWidth } = useSidebarLayout();
  const [title, setTitle] = useState("");
  const [idFormacion, setIdFormacion] = useState("");
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

  const updateQuestion = (questionId: string, updater: (q: QuestionForm) => QuestionForm) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? updater(q) : q)));
  };

  const addQuestion = () => {
    scrollToNewQuestion.current = true;
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  useEffect(() => {
    if (!scrollToNewQuestion.current || !lastQuestionRef.current) return;
    scrollToNewQuestion.current = false;
    lastQuestionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [questions.length]);

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setQuestionErrors((prev) => {
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
      if (!updated.texto && !updated.respuestas) {
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
    setQuestionsError("");

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

    if (questions.length === 0) {
      setQuestionsError("Debes agregar al menos una pregunta");
      markInvalid("questions");
    }

    questions.forEach((question) => {
      const qError: QuestionError = {};
      const filledOptions = question.respuestas.filter((r) => r.texto.trim().length > 0);
      const hasEmptyOption = question.respuestas.some((r) => !r.texto.trim());
      const hasCorrect = question.respuestas.some((r) => r.esCorrecta && r.texto.trim().length > 0);

      if (!question.texto.trim()) {
        qError.texto = "La pregunta no puede estar vacía";
        markInvalid(`question-${question.id}`);
      }
      if (hasEmptyOption) {
        qError.respuestas = "Todas las respuestas deben tener texto";
        markInvalid(`question-${question.id}`);
      } else if (filledOptions.length < 2) {
        qError.respuestas = "Cada pregunta debe tener al menos 2 respuestas con texto";
        markInvalid(`question-${question.id}`);
      } else if (!hasCorrect) {
        qError.respuestas = "Debes marcar al menos una respuesta correcta";
        markInvalid(`question-${question.id}`);
      }

      if (qError.texto || qError.respuestas) {
        nextQuestionErrors[question.id] = qError;
      }
    });

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

    const payload: ExamenCreatePayload = {
      titulo: title.trim(),
      idFormacion,
      preguntas: questions.map((q) => ({
        id: q.id,
        texto: q.texto.trim(),
        respuestas: q.respuestas.map((r) => ({
            id: r.id,
            texto: r.texto.trim(),
            esCorrecta: r.esCorrecta,
          })),
      })),
    };

    try {
      setSaving(true);
      if (isEditing && examId) {
        await ExamsAPI.update(examId, payload);
        toast.success("Examen actualizado exitosamente");
      } else {
        await ExamsAPI.create(payload);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => navigate("/exams")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Exámenes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar examen" : "Crear examen"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSave}>
            <div className="space-y-2" ref={setFieldRef("title")}>
              <Label htmlFor="exam-title">Título del examen</Label>
              <Input
                id="exam-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder="Ej: Evaluación final de Anatomía"
              />
              {titleError && <p className="text-sm text-red-600">{titleError}</p>}
            </div>

            <div className="space-y-2" ref={setFieldRef("formation")}>
              <Label>Formación asociada</Label>
              <Select
                value={idFormacion}
                onValueChange={(value) => {
                  setIdFormacion(value);
                  if (formationError) setFormationError("");
                }}
              >
                <SelectTrigger>
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
              {formationError && <p className="text-sm text-red-600">{formationError}</p>}
            </div>

            <div className="space-y-4" ref={setFieldRef("questions")}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label className="text-base">Preguntas</Label>
                {questionsError && (
                  <p className="text-sm text-red-600">{questionsError}</p>
                )}
              </div>

              {questions.map((question, index) => (
                <Card
                  key={question.id}
                  ref={setQuestionCardRef(question.id, index === questions.length - 1)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">Pregunta {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        disabled={questions.length === 1}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Texto de la pregunta</Label>
                      <Textarea
                        value={question.texto}
                        onChange={(e) => {
                          updateQuestion(question.id, (q) => ({
                            ...q,
                            texto: e.target.value,
                          }));
                          clearQuestionError(question.id, "texto");
                        }}
                        placeholder="Escribe la pregunta"
                      />
                      {questionErrors[question.id]?.texto && (
                        <p className="text-sm text-red-600">{questionErrors[question.id]?.texto}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Label>Respuestas</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar respuesta
                        </Button>
                      </div>

                      {question.respuestas.map((option, optionIndex) => (
                        <div
                          key={option.id}
                          className="flex flex-col gap-2 sm:flex-row sm:items-center"
                        >
                          <Input
                            className="min-w-0 flex-1"
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
                          <div className="flex gap-2 w-full sm:w-auto shrink-0">
                            <Button
                              type="button"
                              variant={option.esCorrecta ? "default" : "outline"}
                              className="flex-1 sm:flex-none"
                              onClick={() => toggleCorrectOption(question.id, option.id)}
                            >
                              <span className="sm:hidden">
                                {option.esCorrecta ? "✓ Correcta" : "Marcar"}
                              </span>
                              <span className="hidden sm:inline">
                                {option.esCorrecta ? "Correcta" : "Marcar correcta"}
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => removeOption(question.id, option.id)}
                              disabled={question.respuestas.length <= 2}
                              title="Eliminar respuesta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-wrap gap-2">
                        {question.respuestas.map((option) => (
                          <Badge
                            key={option.id}
                            variant={option.esCorrecta ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleCorrectOption(question.id, option.id)}
                          >
                            {option.texto.trim() || "Respuesta sin texto"}
                          </Badge>
                        ))}
                      </div>

                      {questionErrors[question.id]?.respuestas && (
                        <p className="text-sm text-red-600">
                          {questionErrors[question.id]?.respuestas}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div
              role="toolbar"
              aria-label="Acciones de preguntas"
              className="fixed z-40 bottom-6 -translate-x-1/2 transition-[left] duration-300"
              style={{ left: `calc(50vw + ${sidebarWidth / 2}px)` }}
            >
              <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg p-2">
                <Button type="button" onClick={addQuestion} className="shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar pregunta
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pb-20">
              <Button type="button" variant="outline" onClick={() => navigate("/exams")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!canSave}>
                <Save className="w-4 h-4 mr-2" />
                {saving
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Guardar examen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
