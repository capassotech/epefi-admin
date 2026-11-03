
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DetailLayout, ProfileCard, SectionCard } from "@/components/common/DetailLayout";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/context/PageHeaderContext";
import { createProductTourSteps } from "@/config/tourSteps";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";
import { CoursesAPI } from "@/service/courses";
import { slugify } from "@/lib/utils";
import { dictadoDateToIsoPayload } from "@/utils/courseDates";

// Form components
import GeneralInfoForm from "@/components/product/GeneralInfoForm";
import SubjectCreation from "@/components/product/SubjectCreation";

export default function CreateProduct() {
  const navigate = useNavigate();
  usePageHeader({
    title: "Crear curso",
    tourSteps: createProductTourSteps,
    breadcrumbs: [{ label: "Cursos", to: "/products" }],
  });
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const [courseAlreadyCreatedInSession, setCourseAlreadyCreatedInSession] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlanDeEstudiosUrl] = useState<string | null>(null);
  const [currentFechasDeExamenesUrl] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      precio: 0,
      estado: "inactivo",
      imagen: undefined,
      materias: [],
      planDeEstudios: undefined,
      fechasDeExamenes: undefined,
      fechaInicioDictado: undefined,
      fechaFinDictado: undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    setCourseCreated(false);
    setCurrentTab(0);
    setCourseAlreadyCreatedInSession(false);
  }, []);

  // Establecer estado activo por defecto cuando se cambia a la pestaña de materias
  useEffect(() => {
    if (currentTab === 1 && createdCourseId) {
      const currentEstado = form.getValues("estado");
      if (currentEstado === "inactivo") {
        form.setValue("estado", "activo");
      }
    }
  }, [currentTab, createdCourseId, form]);

  const createCourse = async (data: ProductFormData) => {
    // Si el curso ya fue creado en esta sesión, solo avanzar a la siguiente pestaña
    if (courseAlreadyCreatedInSession && createdCourseId) {
      console.log("Curso ya creado, avanzando a la siguiente pestaña");
      handleNext();
      return;
    }

    // Validar que la imagen existe
    if (!data.imagen || !(data.imagen instanceof File)) {
      toast.error("Por favor selecciona una imagen para el curso");
      return;
    }

    // Prevenir doble clic mientras se está creando
    if (loading) {
      console.log("Ya se está creando el curso, esperando...");
      return;
    }

    setLoading(true);

    try {
      const folder = `Imagenes/Formaciones/${slugify(data.titulo)}`;
      const result = await CoursesAPI.uploadImage(data.imagen, {
        directory: folder,
        filename: data.imagen.name || "",
        contentType: data.imagen.type || "image/jpeg",
      });
      const imageStorageUrl = result.url || "";

      // Subir PDFs si están presentes
      let planDeEstudiosUrl = "";
      let fechasDeExamenesUrl = "";
      const now = new Date().toISOString();

      if (data.planDeEstudios instanceof File) {
        const pdfFolder = `Documentos/Cursos/${slugify(data.titulo)}`;
        const planResult = await CoursesAPI.uploadPDF(data.planDeEstudios, {
          directory: pdfFolder,
          filename: `plan-de-estudios-${Date.now()}.pdf`,
        });
        planDeEstudiosUrl = planResult.url;
      }

      if (data.fechasDeExamenes instanceof File) {
        const pdfFolder = `Documentos/Cursos/${slugify(data.titulo)}`;
        const fechasResult = await CoursesAPI.uploadPDF(data.fechasDeExamenes, {
          directory: pdfFolder,
          filename: `fechas-examenes-${Date.now()}.pdf`,
        });
        fechasDeExamenesUrl = fechasResult.url;
      }

      const payload: Record<string, unknown> = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: data.precio,
        estado: data.estado,
        imagen: imageStorageUrl,
        materias: data.materias || [],
      };

      payload.fechaInicioDictado = dictadoDateToIsoPayload(data.fechaInicioDictado);
      payload.fechaFinDictado = dictadoDateToIsoPayload(data.fechaFinDictado);
      if (planDeEstudiosUrl) {
        payload.planDeEstudiosUrl = planDeEstudiosUrl;
        payload.planDeEstudiosActualizado = now;
      }

      if (fechasDeExamenesUrl) {
        payload.fechasDeExamenesUrl = fechasDeExamenesUrl;
        payload.fechasDeExamenesActualizado = now;
      }

      console.log("Creando curso con payload:", payload);
      const response = await CoursesAPI.create(payload);
      const newCourseId = String(response.id);
      
      console.log("Curso creado con ID:", newCourseId);
      setCreatedCourseId(newCourseId);
      setCourseCreated(true);
      setCourseAlreadyCreatedInSession(true);
      toast.success("Curso creado exitosamente");
      handleNext();
    } catch (err: unknown) {
      console.error("Error al crear curso:", err);
      const message = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
        ? String(err.response.data.message)
        : "Error al guardar el curso";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeCourse = async () => {
    console.log("finalizeCourse - createdCourseId:", createdCourseId);
    
    if (!createdCourseId) {
      toast.error("No se puede finalizar: el curso no ha sido creado");
      return;
    }

    // Prevenir doble clic
    if (loading) {
      console.log("Ya se está guardando el curso, esperando...");
      return;
    }

    setLoading(true);
    try {
      const currentFormData = form.getValues();
      
      // Obtener el curso actual para obtener la imagen existente y las materias
      const course = await CoursesAPI.getById(createdCourseId);
      
      if (!course) {
        toast.error("No se pudo encontrar el curso para actualizar");
        setLoading(false);
        return;
      }
      
      const hasMaterias = Array.isArray(course?.materias) && course.materias.length > 0;
      
      // Si hay materias cargadas, activar el curso automáticamente
      const estadoFinal = hasMaterias ? "activo" : currentFormData.estado;
      
      // Manejar la imagen: si hay una nueva imagen en el formulario, subirla; si no, usar la existente
      let imageUrl = course?.imagen || "";
      
      if (currentFormData.imagen && currentFormData.imagen instanceof File) {
        // Si hay una nueva imagen, subirla
        try {
          const folder = `Imagenes/Formaciones/${slugify(currentFormData.titulo)}`;
          const result = await CoursesAPI.uploadImage(currentFormData.imagen, {
            directory: folder,
            filename: currentFormData.imagen.name || "",
            contentType: currentFormData.imagen.type || "image/jpeg",
          });
          imageUrl = result.url || "";
        } catch (imageError) {
          console.error("Error al subir imagen:", imageError);
          // Si falla, usar la imagen existente
          imageUrl = course?.imagen || "";
        }
      }
      
      // Manejar PDFs
      let planDeEstudiosUrl = course?.planDeEstudiosUrl || "";
      let fechasDeExamenesUrl = course?.fechasDeExamenesUrl || "";
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        titulo: currentFormData.titulo,
        descripcion: currentFormData.descripcion,
        precio: currentFormData.precio,
        estado: estadoFinal,
        imagen: imageUrl,
        materias: Array.isArray(course?.materias) ? course.materias.map(String) : [],
      };

      if (currentFormData.planDeEstudios instanceof File) {
        try {
          const pdfFolder = `Documentos/Cursos/${slugify(currentFormData.titulo)}`;
          const planResult = await CoursesAPI.uploadPDF(currentFormData.planDeEstudios, {
            directory: pdfFolder,
            filename: `plan-de-estudios-${Date.now()}.pdf`,
          });
          planDeEstudiosUrl = planResult.url;
          payload.planDeEstudiosUrl = planDeEstudiosUrl;
          payload.planDeEstudiosActualizado = now;
        } catch (pdfError) {
          console.error("Error al subir plan de estudios:", pdfError);
          if (course?.planDeEstudiosUrl) {
            payload.planDeEstudiosUrl = course.planDeEstudiosUrl;
          }
        }
      } else if (course?.planDeEstudiosUrl) {
        payload.planDeEstudiosUrl = course.planDeEstudiosUrl;
        if (course.planDeEstudiosActualizado) {
          payload.planDeEstudiosActualizado = course.planDeEstudiosActualizado;
        }
      }

      if (currentFormData.fechasDeExamenes instanceof File) {
        try {
          const pdfFolder = `Documentos/Cursos/${slugify(currentFormData.titulo)}`;
          const fechasResult = await CoursesAPI.uploadPDF(currentFormData.fechasDeExamenes, {
            directory: pdfFolder,
            filename: `fechas-examenes-${Date.now()}.pdf`,
          });
          fechasDeExamenesUrl = fechasResult.url;
          payload.fechasDeExamenesUrl = fechasDeExamenesUrl;
          payload.fechasDeExamenesActualizado = now;
        } catch (pdfError) {
          console.error("Error al subir fechas de exámenes:", pdfError);
          if (course?.fechasDeExamenesUrl) {
            payload.fechasDeExamenesUrl = course.fechasDeExamenesUrl;
          }
        }
      } else if (course?.fechasDeExamenesUrl) {
        payload.fechasDeExamenesUrl = course.fechasDeExamenesUrl;
        if (course.fechasDeExamenesActualizado) {
          payload.fechasDeExamenesActualizado = course.fechasDeExamenesActualizado;
        }
      }

      if (currentFormData.fechaInicioDictado && currentFormData.fechaFinDictado) {
        payload.fechaInicioDictado = dictadoDateToIsoPayload(currentFormData.fechaInicioDictado);
        payload.fechaFinDictado = dictadoDateToIsoPayload(currentFormData.fechaFinDictado);
      }
      
      console.log("Actualizando curso existente (ID:", createdCourseId, ") con payload:", payload);
      
      // IMPORTANTE: Usar update, nunca create
      await CoursesAPI.update(createdCourseId, payload);

      toast.success("Curso completado exitosamente");
      navigate("/products");
    } catch (err) {
      console.error("Error al finalizar curso:", err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || "Error al finalizar curso";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "Información General", component: GeneralInfoForm },
    { id: "subjects", label: "Materias", component: SubjectCreation },
  ];

  const handleNext = () => { if (currentTab < tabs.length - 1) setCurrentTab(currentTab + 1) };

  const handleBack = () => { if (currentTab > 0) setCurrentTab(currentTab - 1) };

  const watchedTitle = form.watch("titulo");
  const isStepLocked = (index: number) => index > 0 && !createdCourseId;

  const handleEstadoChange = async (checked: boolean, onChange: (value: "activo" | "inactivo") => void, oldEstado: "activo" | "inactivo") => {
    const newEstado = checked ? "activo" : "inactivo";
    onChange(newEstado);

    // Guardar automáticamente si el curso ya fue creado
    if (courseAlreadyCreatedInSession && createdCourseId) {
      try {
        const course = await CoursesAPI.getById(createdCourseId);
        if (course) {
          await CoursesAPI.update(createdCourseId, { ...course, estado: newEstado });
          toast.success(`Curso ${newEstado === "activo" ? "activado" : "desactivado"} exitosamente`);
        }
      } catch (error) {
        console.error("Error al actualizar estado del curso:", error);
        toast.error("Error al actualizar el estado del curso");
        // Revertir el cambio si falla
        onChange(oldEstado);
      }
    }
  };

  const handleCreateOrNext = async () => {
    // Si el curso ya está creado, solo avanzar
    if (createdCourseId && courseAlreadyCreatedInSession) {
      handleNext();
      return;
    }
    // Validar formulario antes de crear
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    // Prevenir múltiples clics
    if (loading) return;
    await createCourse(form.getValues());
  };

  const aside = (
    <ProfileCard
      cover={
        <div className="grid aspect-[16/10] w-full place-items-center overflow-hidden bg-gray-100">
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="Portada del curso" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs text-gray-400">
              <ImageIcon className="w-6 h-6 text-gray-300" />
              Sin portada
            </span>
          )}
        </div>
      }
      title={watchedTitle?.trim() || "Nuevo curso"}
      subtitle="Curso"
      footer={
        <>
          {currentTab === 0 ? (
            <Button type="button" size="sm" className="h-8 cursor-pointer" onClick={handleCreateOrNext} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {createdCourseId ? "Actualizando…" : "Creando…"}
                </>
              ) : (
                <>
                  {createdCourseId ? "Siguiente" : "Crear y continuar"}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          ) : (
            <Button type="button" size="sm" className="h-8 cursor-pointer" onClick={finalizeCourse} disabled={loading}>
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              {loading ? "Guardando…" : "Finalizar curso"}
            </Button>
          )}
          {currentTab > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-gray-500 cursor-pointer"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Anterior
            </Button>
          )}
        </>
      }
    >
      {/* Estado del curso */}
      <FormField
        control={form.control}
        name="estado"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <div>
                <FormLabel className="text-sm font-medium text-gray-900">Curso habilitado</FormLabel>
                <p className="text-xs text-gray-500">
                  {field.value === "activo" ? "Visible para los alumnos" : "Oculto para los alumnos"}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === "activo"}
                  onCheckedChange={(checked) => handleEstadoChange(checked, field.onChange, field.value)}
                  className="data-[state=checked]:bg-green-600"
                />
              </FormControl>
            </label>
          </FormItem>
        )}
      />

      {/* Pasos del asistente */}
      <ol className="space-y-0.5 px-3 py-3">
        {tabs.map((tab, index) => {
          const active = currentTab === index;
          const locked = isStepLocked(index);
          const done = index < currentTab || (index === 0 && !!createdCourseId);
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setCurrentTab(index)}
                disabled={locked}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-gray-100 font-medium text-gray-900"
                    : locked
                      ? "cursor-not-allowed text-gray-300"
                      : "text-gray-600 hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <span
                  className={`grid place-items-center w-5 h-5 shrink-0 rounded-full text-[11px] font-semibold ${
                    done && !active
                      ? "bg-green-50 text-green-600"
                      : active
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done && !active ? <CheckCircle className="w-3.5 h-3.5" /> : index + 1}
                </span>
                {tab.label}
              </button>
            </li>
          );
        })}
      </ol>
    </ProfileCard>
  );

  return (
    <Form {...form}>
      <DetailLayout aside={aside}>
        {courseCreated && (
          <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
            Curso creado exitosamente. Ahora podés agregarle materias.
          </p>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          <SectionCard
            title={tabs[currentTab]?.label}
            description={
              currentTab === 0
                ? "Completá los datos para crear este curso"
                : "Asociá materias existentes o creá nuevas para este curso"
            }
          >
            <div className="px-5 py-5">
              {currentTab === 0 && (
                <GeneralInfoForm
                  control={form.control}
                  setImagePreviewUrl={setImagePreviewUrl}
                  imagePreviewUrl={imagePreviewUrl}
                  setIsDialogOpen={setIsDialogOpen}
                  isDialogOpen={isDialogOpen}
                  currentImageUrl={null}
                  currentPlanDeEstudiosUrl={currentPlanDeEstudiosUrl}
                  currentFechasDeExamenesUrl={currentFechasDeExamenesUrl}
                />
              )}
              {currentTab === 1 && (
                <SubjectCreation
                  courseId={createdCourseId}
                  control={form.control}
                  courseTitle={form.getValues("titulo") || null}
                />
              )}
            </div>
          </SectionCard>
        </form>
      </DetailLayout>
    </Form>
  );
}
