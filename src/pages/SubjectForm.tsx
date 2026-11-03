// src/pages/SubjectForm.tsx — alta (/subjects/new) y edición (/subjects/:id/edit) de materias
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, GraduationCap, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { usePageHeader } from "@/context/PageHeaderContext";
import { subjectFormTourSteps } from "@/config/tourSteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { DetailLayout, InfoList, InfoRow, ProfileCard, SectionCard } from "@/components/common/DetailLayout";
import { FormField } from "@/components/common/FormField";
import { CoursesAPI } from "@/service/courses";
import type { Course, Subject } from "@/types/types";
import { extractErrorMessage } from "@/utils/errorMessages";

export default function SubjectForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [materia, setMateria] = useState<Subject | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [nombre, setNombre] = useState("");
  const [nombreError, setNombreError] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const detailPath = id ? `/subjects/${encodeURIComponent(id)}` : "/subjects";

  useEffect(() => {
    (async () => {
      try {
        const allCourses: Course[] = await CoursesAPI.getAllList();
        setCourses(allCourses);
        if (!id) return;

        const data: Subject = await CoursesAPI.getMateriaById(id, { skipCache: true });
        // Igual que el modal anterior: limpiar referencias a cursos que ya no existen
        const validIds = new Set(allCourses.map((c) => String(c.id)));
        const cleanedCursos = (data.id_cursos || []).filter((courseId) => validIds.has(String(courseId)));
        if (cleanedCursos.length !== (data.id_cursos || []).length) {
          try {
            await CoursesAPI.updateMateria(data.id, { ...data, id_cursos: cleanedCursos });
            toast.info(
              `Se limpiaron ${(data.id_cursos || []).length - cleanedCursos.length} referencia(s) a curso(s) eliminado(s)`
            );
          } catch (error) {
            console.error("Error al limpiar referencias inválidas:", error);
          }
        }
        const cleaned = { ...data, id_cursos: cleanedCursos };
        setMateria(cleaned);
        setNombre(cleaned.nombre || "");
      } catch (err) {
        console.error("Error al cargar la materia:", err);
        if (id) setLoadError(err instanceof Error ? err.message : "No se pudo cargar la materia");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  usePageHeader({
    title: isEditing ? "Editar" : "Nueva materia",
    tourSteps: subjectFormTourSteps,
    breadcrumbs: [
      { label: "Materias", to: "/subjects" },
      ...(isEditing && materia ? [{ label: materia.nombre, to: detailPath }] : []),
    ],
  });

  const isDirty = isEditing ? nombre.trim() !== (materia?.nombre || "").trim() : nombre.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setNombreError("El título de la materia es obligatorio");
      return;
    }
    setSaving(true);
    try {
      if (isEditing && materia) {
        await CoursesAPI.updateMateria(materia.id, { ...materia, nombre: nombre.trim() });
        toast.success("Materia actualizada exitosamente");
        navigate(detailPath);
      } else {
        // Las materias nuevas se crean sin curso: se asocian desde la edición del curso
        const created = await CoursesAPI.createMateria({ nombre: nombre.trim(), id_cursos: [], modulos: [] });
        toast.success("Materia creada. Ahora podés agregarle módulos.");
        navigate(created?.id ? `/subjects/${encodeURIComponent(created.id)}` : "/subjects");
      }
    } catch (error) {
      console.error("Error al guardar la materia:", error);
      toast.error(extractErrorMessage(error) || "Error al guardar la materia. Por favor, inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage={isEditing ? "Cargando materia" : "Cargando formulario"}
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }
  if (isEditing && (loadError || !materia)) {
    return <div className="p-6 text-red-500">❌ {loadError || "No se encontró la materia"}</div>;
  }

  const courseTitles = (materia?.id_cursos || [])
    .map((courseId) => courses.find((c) => String(c.id) === String(courseId))?.titulo)
    .filter((title): title is string => !!title);

  const aside = (
    <ProfileCard
      mobileActionBar
      media={
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-violet-50 text-violet-600">
          <BookOpen className="w-5 h-5" />
        </span>
      }
      title={nombre.trim() || (isEditing ? "Materia" : "Nueva materia")}
      subtitle="Materia"
      footer={
        <>
          <Button type="submit" form="subject-form" size="sm" className="h-8 cursor-pointer" disabled={saving || !isDirty}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear materia"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-gray-500 cursor-pointer"
            onClick={() => navigate(detailPath)}
            disabled={saving}
          >
            Cancelar
          </Button>
        </>
      }
    >
      {isEditing ? (
        <InfoList>
          <InfoRow icon={<GraduationCap />} label="Cursos">
            {courseTitles.length === 0 ? (
              <span className="text-gray-400">Sin curso</span>
            ) : (
              <div className="flex flex-col gap-0.5 whitespace-normal">
                {courseTitles.map((title) => (
                  <span key={title} className="truncate">
                    {title}
                  </span>
                ))}
              </div>
            )}
          </InfoRow>
        </InfoList>
      ) : (
        <p className="px-5 py-3 text-xs text-gray-500">
          Después de crearla vas a poder agregarle módulos desde su detalle.
        </p>
      )}
    </ProfileCard>
  );

  return (
    <DetailLayout aside={aside}>
      <SectionCard
        title="Datos de la materia"
        description={
          isEditing
            ? "Los cursos se asocian desde la edición de cada curso"
            : "La materia se crea sin curso; asociala desde la edición de un curso"
        }
      >
        <form id="subject-form" onSubmit={handleSubmit} className="px-5 py-5">
          <FormField id="nombre" label="Nombre de la materia" icon={<BookOpen />} error={nombreError}>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (nombreError) setNombreError("");
              }}
              placeholder="Ej: Fundamentos del Liderazgo"
              className={nombreError ? "border-red-500" : ""}
              disabled={saving}
              autoFocus
            />
          </FormField>
        </form>
      </SectionCard>
    </DetailLayout>
  );
}
