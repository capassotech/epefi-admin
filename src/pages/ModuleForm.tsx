// src/pages/ModuleForm.tsx — alta (/subjects/:subjectId/modules/new) y edición
// (/subjects/:subjectId/modules/:moduleId/edit) de un módulo de una materia existente
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { usePageHeader } from "@/context/PageHeaderContext";
import { moduleFormTourSteps } from "@/config/tourSteps";
import { Button } from "@/components/ui/button";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { DetailLayout, ProfileCard, SectionCard } from "@/components/common/DetailLayout";
import ModulesModal from "@/components/subject/ModulesModal";
import { CoursesAPI } from "@/service/courses";
import type { Module, Subject } from "@/types/types";
import { courseBreadcrumbs, fromCourseState, readFromCourse, type FromCourse } from "@/utils/fromCourse";

/** Estado de navegación opcional: a dónde volver al guardar o cancelar, y el curso de origen */
export type ModuleFormLocationState = { returnTo?: string; fromCourse?: FromCourse };

const FORM_ID = "module-form";

export default function ModuleForm() {
  const { subjectId, moduleId } = useParams<{ subjectId: string; moduleId?: string }>();
  const isEditing = Boolean(moduleId);
  const navigate = useNavigate();
  const location = useLocation();
  const subjectPath = `/subjects/${encodeURIComponent(subjectId ?? "")}`;
  const returnTo = (location.state as ModuleFormLocationState | null)?.returnTo || subjectPath;
  // Si la materia se abrió desde un curso, se conserva para la ruta de navegación y el "volver"
  const fromCourse = readFromCourse(location.state);

  const [materia, setMateria] = useState<Subject | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!subjectId) {
      setLoadError("Materia no especificada");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const subject = await CoursesAPI.getMateriaById(subjectId);
        setMateria(subject);
        if (moduleId) {
          const [found] = await CoursesAPI.getModulesByIds([moduleId]);
          if (!found) throw new Error("No se encontró el módulo");
          setModule(found);
        }
      } catch (err) {
        console.error("Error al cargar el módulo:", err);
        setLoadError(err instanceof Error ? err.message : "No se pudo cargar el módulo");
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectId, moduleId]);

  usePageHeader({
    title: isEditing ? module?.titulo || "Editar módulo" : "Nuevo módulo",
    tourSteps: moduleFormTourSteps,
    breadcrumbs: [
      ...(fromCourse ? courseBreadcrumbs(fromCourse) : [{ label: "Materias", to: "/subjects" }]),
      ...(materia ? [{ label: materia.nombre, to: subjectPath }] : []),
    ],
  });

  const goBack = useCallback(
    () => navigate(returnTo, { state: fromCourseState(fromCourse) }),
    // fromCourse se recalcula en cada render; alcanza con su destino para detectar cambios
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, returnTo, fromCourse?.to]
  );

  // Misma lógica que usaban las pantallas que abrían el modal
  const handleCreated = async (data: Module): Promise<{ id: string }> => {
    if (!materia) throw new Error("No se encontró la materia del módulo");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _omit, ...payload } = data;
    const created = await CoursesAPI.createModule({ ...payload, tipo_contenido: "pdf" } as Omit<Module, "id">);
    const newModuleId: string = created.id;
    await CoursesAPI.updateMateria(materia.id, {
      ...materia,
      modulos: [...(materia.modulos || []), newModuleId],
    });
    toast.success("Módulo creado con éxito");
    return { id: newModuleId };
  };

  const handleUpdated = async (data: Module): Promise<void> => {
    await CoursesAPI.updateModule(data.id, {
      id: data.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      id_materia: data.id_materia,
      tipo_contenido: data.tipo_contenido,
      bibliografia: data.bibliografia,
      url_miniatura: data.url_miniatura,
      url_archivo: data.url_archivo,
      url_video: data.url_video,
      nombres_archivos: data.nombres_archivos || "",
      nombres_videos: data.nombres_videos || "",
    });
    toast.success("Módulo actualizado con éxito");
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage={isEditing ? "Cargando módulo" : "Cargando formulario"}
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }
  if (loadError || !materia) {
    return <div className="p-6 text-red-500">❌ {loadError || "No se encontró la materia"}</div>;
  }

  const aside = (
    <ProfileCard
      mobileActionBar
      media={
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-violet-50 text-violet-600">
          <FileText className="w-5 h-5" />
        </span>
      }
      title={isEditing ? module?.titulo || "Módulo" : "Nuevo módulo"}
      subtitle={materia.nombre}
      footer={
        <>
          <Button type="submit" form={FORM_ID} size="sm" className="h-8 cursor-pointer" disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear módulo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-gray-500 cursor-pointer"
            onClick={goBack}
            disabled={saving}
          >
            Cancelar
          </Button>
        </>
      }
    >
      <p className="px-5 py-3 text-xs text-gray-500">
        {saving
          ? "Subiendo archivos y guardando… no cierres esta página."
          : "Los documentos y videos se suben al guardar."}
      </p>
    </ProfileCard>
  );

  return (
    <DetailLayout aside={aside}>
      <SectionCard
        title={isEditing ? "Datos del módulo" : "Nuevo módulo"}
        description="Título, descripción, documentos y videos"
      >
        <div className="px-5 py-5">
          <ModulesModal
            variant="page"
            formId={FORM_ID}
            isOpen
            courseId={materia.id}
            editingModule={module}
            onModuleCreated={handleCreated}
            onModuleUpdated={handleUpdated}
            onCancel={goBack}
            onLoadingChange={setSaving}
          />
        </div>
      </SectionCard>
    </DetailLayout>
  );
}
