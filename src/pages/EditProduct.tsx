
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { DetailLayout, ProfileCard, SectionCard } from "@/components/common/DetailLayout";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useNavigate, useParams } from "react-router-dom";
import { usePageHeader } from "@/context/PageHeaderContext";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { CoursesAPI } from "@/service/courses";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";
import { slugify } from "@/lib/utils";
import {
  dictadoDateToIsoPayload,
  parseDictadoDateForInput,
} from "@/utils/courseDates";

import GeneralInfoForm from "@/components/product/GeneralInfoForm";
import SubjectCreation from "@/components/product/SubjectCreation";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  usePageHeader({ title: "Editar curso", breadcrumbs: [{ label: "Cursos", to: "/products" }] });
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentPlanDeEstudiosUrl, setCurrentPlanDeEstudiosUrl] = useState<string | null>(null);
  const [currentFechasDeExamenesUrl, setCurrentFechasDeExamenesUrl] = useState<string | null>(null);
  const [planDeEstudiosDeleted, setPlanDeEstudiosDeleted] = useState(false);
  const [fechasDeExamenesDeleted, setFechasDeExamenesDeleted] = useState(false);
  const [pdfsVersion, setPdfsVersion] = useState(0); // Para forzar re-render cuando cambien los PDFs
  
  // Estados para modales de confirmación de eliminación
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [isDeleteFechasModalOpen, setIsDeleteFechasModalOpen] = useState(false);
  const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
  const [deleteCourseLoading, setDeleteCourseLoading] = useState(false);
  
  // Estados para el mensaje de cambios guardados
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [originalCourseData, setOriginalCourseData] = useState<ProductFormData | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      precio: 0,
      estado: "activo",
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
    if (!id) {
      toast.error("ID no proporcionado");
      navigate("/products");
      return;
    }

    const loadCurso = async () => {
      try {
        setLoading(true);
        const data = await CoursesAPI.getById(id);

        setCreatedCourseId(id);

        // El backend puede devolver 'imagen' o 'image', normalizar a 'image'
        const imageUrl = data.imagen || data.image || "";
        setCurrentImageUrl(imageUrl);
        
        // Cargar URLs de PDFs si existen
        setCurrentPlanDeEstudiosUrl(data.planDeEstudiosUrl || null);
        setCurrentFechasDeExamenesUrl(data.fechasDeExamenesUrl || null);
        // Resetear flags de eliminación al cargar
        setPlanDeEstudiosDeleted(false);
        setFechasDeExamenesDeleted(false);
        const formData = {
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          precio: data.precio || 0,
          estado: data.estado || "activo",
          imagen: undefined, // Don't set file object, keep as undefined
          materias: Array.isArray(data.materias) ? data.materias : [],
          planDeEstudios: undefined,
          fechasDeExamenes: undefined,
          fechaInicioDictado: parseDictadoDateForInput(data.fechaInicioDictado),
          fechaFinDictado: parseDictadoDateForInput(data.fechaFinDictado),
        };
        
        form.reset(formData);
        setOriginalCourseData(formData);
        setShowSaveMessage(false); // Ocultar mensaje al cargar

        // Las materias se cargan automáticamente en SubjectCreation
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar el curso");
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    loadCurso();
  }, [id, form, navigate]);

  // Función para comparar si hay cambios
  const hasChanges = (currentData: ProductFormData): boolean => {
    if (!originalCourseData) return false;
    
    return (
      currentData.titulo !== originalCourseData.titulo ||
      currentData.descripcion !== originalCourseData.descripcion ||
      currentData.precio !== originalCourseData.precio ||
      currentData.estado !== originalCourseData.estado ||
      currentData.fechaInicioDictado !== originalCourseData.fechaInicioDictado ||
      currentData.fechaFinDictado !== originalCourseData.fechaFinDictado ||
      JSON.stringify(currentData.materias) !== JSON.stringify(originalCourseData.materias) ||
      currentData.imagen instanceof File || // Si hay una nueva imagen, hay cambios
      currentData.planDeEstudios instanceof File || // Si hay un nuevo PDF de plan de estudios
      currentData.fechasDeExamenes instanceof File || // Si hay un nuevo PDF de fechas
      planDeEstudiosDeleted || // Si se eliminó el plan de estudios
      fechasDeExamenesDeleted // Si se eliminaron las fechas de exámenes
    );
  };

  const handleDeletePlanDeEstudios = () => {
    setIsDeletePlanModalOpen(true);
  };

  const handleDeleteFechasDeExamenes = () => {
    setIsDeleteFechasModalOpen(true);
  };

  const handleConfirmDeletePlanDeEstudios = (_id: string) => {
    setPlanDeEstudiosDeleted(true);
    setCurrentPlanDeEstudiosUrl(null);
    setIsDeletePlanModalOpen(false);
    // Limpiar el campo del formulario para permitir cargar un nuevo archivo
    form.setValue("planDeEstudios", undefined);
    toast.success("Plan de Estudios eliminado. Puedes cargar un nuevo archivo.");
  };

  const handleConfirmDeleteFechasDeExamenes = (_id: string) => {
    setFechasDeExamenesDeleted(true);
    setCurrentFechasDeExamenesUrl(null);
    setIsDeleteFechasModalOpen(false);
    // Limpiar el campo del formulario para permitir cargar un nuevo archivo
    form.setValue("fechasDeExamenes", undefined);
    toast.success("Fechas de Exámenes eliminado. Puedes cargar un nuevo archivo.");
  };

  const handleCancelDeletePlan = () => {
    setIsDeletePlanModalOpen(false);
  };

  const handleCancelDeleteFechas = () => {
    setIsDeleteFechasModalOpen(false);
  };

  const handleCancelDeleteCourse = () => {
    setIsDeleteCourseModalOpen(false);
  };

  const handleConfirmDeleteCourse = async (courseId: string) => {
    if (!courseId) return;
    setDeleteCourseLoading(true);
    try {
      await CoursesAPI.delete(courseId);
      toast.success("Curso eliminado exitosamente");
      navigate("/products");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || "Error al eliminar el curso";
      toast.error(message);
    } finally {
      setDeleteCourseLoading(false);
      setIsDeleteCourseModalOpen(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;
    
    // Verificar si realmente hay cambios
    if (!hasChanges(data)) {
      // No hay cambios, no hacer nada
      return;
    }
    
    setLoading(true);

    try {
      let imageUrl = "";
      
      if (data.imagen instanceof File) {
        const folder = `Imagenes/Formaciones/${slugify(data.titulo)}`;
        const result = await CoursesAPI.uploadImage(data.imagen, {
          directory: folder,
          filename: data.imagen.name,
          contentType: data.imagen.type,
        });
        imageUrl = result.url;
      } else {
        imageUrl = currentImageUrl || "";
      }

      // Manejar PDFs
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: data.precio,
        estado: data.estado,
        imagen: imageUrl,
        materias: data.materias || [],
      };

      payload.fechaInicioDictado = dictadoDateToIsoPayload(data.fechaInicioDictado);
      payload.fechaFinDictado = dictadoDateToIsoPayload(data.fechaFinDictado);

      // Obtener el curso actual para mantener PDFs existentes si no se suben nuevos
      const course = await CoursesAPI.getById(id);

      // Manejar Plan de Estudios
      let newPlanDeEstudiosUrl: string | null = null;
      // Si hay un nuevo archivo, tiene prioridad sobre la eliminación y resetea el flag
      if (data.planDeEstudios instanceof File) {
        try {
          const pdfFolder = `Documentos/Cursos/${slugify(data.titulo)}`;
          const planResult = await CoursesAPI.uploadPDF(data.planDeEstudios, {
            directory: pdfFolder,
            filename: `plan-de-estudios-${Date.now()}.pdf`,
          });
          newPlanDeEstudiosUrl = planResult.url;
          payload.planDeEstudiosUrl = planResult.url;
          payload.planDeEstudiosActualizado = now;
          // Si se cargó un nuevo archivo, resetear el flag de eliminación
          setPlanDeEstudiosDeleted(false);
        } catch (pdfError) {
          console.error("Error al subir plan de estudios:", pdfError);
          toast.error("Error al subir el Plan de Estudios");
          throw pdfError; // Re-lanzar el error para que se maneje en el catch
        }
      } else if (planDeEstudiosDeleted) {
        // Si se marcó para eliminar y no hay nuevo archivo, enviar null
        newPlanDeEstudiosUrl = null;
        payload.planDeEstudiosUrl = null;
        payload.planDeEstudiosActualizado = null;
      } else if (course?.planDeEstudiosUrl) {
        // Mantener el existente si no hay cambios
        newPlanDeEstudiosUrl = course.planDeEstudiosUrl;
        payload.planDeEstudiosUrl = course.planDeEstudiosUrl;
        if (course.planDeEstudiosActualizado) {
          payload.planDeEstudiosActualizado = course.planDeEstudiosActualizado;
        }
      }

      // Manejar Fechas de Exámenes
      let newFechasDeExamenesUrl: string | null = null;
      // Si hay un nuevo archivo, tiene prioridad sobre la eliminación
      if (data.fechasDeExamenes instanceof File) {
        try {
          const pdfFolder = `Documentos/Cursos/${slugify(data.titulo)}`;
          const fechasResult = await CoursesAPI.uploadPDF(data.fechasDeExamenes, {
            directory: pdfFolder,
            filename: `fechas-examenes-${Date.now()}.pdf`,
          });
          newFechasDeExamenesUrl = fechasResult.url;
          payload.fechasDeExamenesUrl = fechasResult.url;
          payload.fechasDeExamenesActualizado = now;
          // Si se cargó un nuevo archivo, resetear el flag de eliminación
          setFechasDeExamenesDeleted(false);
        } catch (pdfError) {
          console.error("Error al subir fechas de exámenes:", pdfError);
          toast.error("Error al subir las Fechas de Exámenes");
          throw pdfError; // Re-lanzar el error para que se maneje en el catch
        }
      } else if (fechasDeExamenesDeleted) {
        // Si se marcó para eliminar y no hay nuevo archivo, enviar null
        newFechasDeExamenesUrl = null;
        payload.fechasDeExamenesUrl = null;
        payload.fechasDeExamenesActualizado = null;
      } else if (course?.fechasDeExamenesUrl) {
        // Mantener el existente si no hay cambios
        newFechasDeExamenesUrl = course.fechasDeExamenesUrl;
        payload.fechasDeExamenesUrl = course.fechasDeExamenesUrl;
        if (course.fechasDeExamenesActualizado) {
          payload.fechasDeExamenesActualizado = course.fechasDeExamenesActualizado;
        }
      }

      await CoursesAPI.update(id, payload);
      
      // Esperar un momento para que el backend procese la actualización
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar el curso para obtener las materias y PDFs actualizados
      const updatedCourse = await CoursesAPI.getById(id);
      
      // Actualizar URLs de PDFs: usar la URL que acabamos de subir si existe, sino usar la del curso recargado
      // Esto asegura que tenemos la URL correcta incluso si el backend tarda en actualizar
      const finalPlanDeEstudiosUrl = newPlanDeEstudiosUrl !== null 
        ? newPlanDeEstudiosUrl 
        : (updatedCourse.planDeEstudiosUrl || null);
      
      const finalFechasDeExamenesUrl = newFechasDeExamenesUrl !== null 
        ? newFechasDeExamenesUrl 
        : (updatedCourse.fechasDeExamenesUrl || null);
      
      // Actualizar estados de PDFs - esto se hace antes para que el estado esté actualizado
      if (finalPlanDeEstudiosUrl === null || finalPlanDeEstudiosUrl === undefined || finalPlanDeEstudiosUrl === "") {
        setCurrentPlanDeEstudiosUrl(null);
        setPlanDeEstudiosDeleted(false);
      } else {
        setCurrentPlanDeEstudiosUrl(finalPlanDeEstudiosUrl);
        setPlanDeEstudiosDeleted(false);
      }
      
      if (finalFechasDeExamenesUrl === null || finalFechasDeExamenesUrl === undefined || finalFechasDeExamenesUrl === "") {
        setCurrentFechasDeExamenesUrl(null);
        setFechasDeExamenesDeleted(false);
      } else {
        setCurrentFechasDeExamenesUrl(finalFechasDeExamenesUrl);
        setFechasDeExamenesDeleted(false);
      }
      
      // Incrementar versión para forzar re-render del componente
      setPdfsVersion(prev => prev + 1);
      
      // Pequeño delay para asegurar que React procese los cambios de estado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Limpiar los campos del formulario después de guardar
      form.setValue("planDeEstudios", undefined);
      form.setValue("fechasDeExamenes", undefined);

      // Actualizar los datos originales con los nuevos datos, incluyendo materias, PDFs y fechas actualizados
      setOriginalCourseData({
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: data.precio,
        estado: data.estado,
        imagen: undefined, // Mantener undefined después de guardar
        materias: Array.isArray(updatedCourse?.materias) ? updatedCourse.materias : data.materias || [],
        planDeEstudios: undefined,
        fechasDeExamenes: undefined,
        fechaInicioDictado: parseDictadoDateForInput(updatedCourse?.fechaInicioDictado),
        fechaFinDictado: parseDictadoDateForInput(updatedCourse?.fechaFinDictado),
      });
      
      // Mostrar mensaje de cambios guardados
      setLastSaveTime(new Date());
      setShowSaveMessage(true);
      setCurrentImageUrl(imageUrl); // Actualizar la URL de la imagen actual
      
      // Si estamos en la pestaña de información general, avanzar a materias
      // Si estamos en la pestaña de materias, redirigir al inicio
      if (currentTab === 0) {
        handleNext();
      } else {
        toast.success("Curso actualizado exitosamente");
        setTimeout(() => {
          navigate("/products");
        }, 1500);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || "Error al actualizar el curso";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Las funciones de gestión de materias están en SubjectCreation

  const tabs = [
    { id: "general", label: "Información General" },
    { id: "subjects", label: "Materias" },
  ] as const;

  const handleNext = () => {
    if (currentTab < tabs.length - 1) setCurrentTab(currentTab + 1);
  };

  const handleBack = () => {
    if (currentTab > 0) setCurrentTab(currentTab - 1);
  };

  if (loading && !createdCourseId) {
    return (
      <InteractiveLoader
        initialMessage="Cargando curso"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }

  const watchedTitle = form.watch("titulo");
  const coverSrc = imagePreviewUrl || currentImageUrl;

  // Guarda automáticamente el cambio de estado (habilitado / deshabilitado)
  const handleEstadoChange = async (
    checked: boolean,
    onChange: (value: "activo" | "inactivo") => void,
    oldEstado: "activo" | "inactivo"
  ) => {
    const newEstado = checked ? "activo" : "inactivo";
    onChange(newEstado);
    if (!id) return;
    try {
      setLoading(true);
      const course = await CoursesAPI.getById(id);
      if (course) {
        await CoursesAPI.update(id, { ...course, estado: newEstado });
        // Actualizar los datos originales
        if (originalCourseData) {
          setOriginalCourseData({ ...originalCourseData, estado: newEstado });
        }
        setLastSaveTime(new Date());
        setShowSaveMessage(true);
      }
    } catch (error) {
      console.error("Error al actualizar estado del curso:", error);
      toast.error("Error al actualizar el estado del curso");
      // Revertir el cambio si falla
      onChange(oldEstado);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    if (!hasChanges(form.getValues())) {
      // Si no hay cambios, solo avanzar a la siguiente pestaña
      handleNext();
      return;
    }
    // Si hay cambios, guardar y luego avanzar (onSubmit ya llama a handleNext)
    await form.handleSubmit(onSubmit)();
  };

  const handleSaveSubjects = async () => {
    // Si hay cambios en los campos del formulario, guardarlos
    if (hasChanges(form.getValues())) {
      await form.handleSubmit(onSubmit)();
      return;
    }
    // Las materias se actualizan automáticamente en SubjectCreation,
    // pero necesitamos actualizar originalCourseData para reflejar el estado actual
    try {
      setLoading(true);
      const course = await CoursesAPI.getById(id!);

      // Actualizar URLs de PDFs desde el curso actualizado
      setCurrentPlanDeEstudiosUrl(course.planDeEstudiosUrl || null);
      setCurrentFechasDeExamenesUrl(course.fechasDeExamenesUrl || null);

      setOriginalCourseData({
        titulo: course.titulo || "",
        descripcion: course.descripcion || "",
        precio: course.precio || 0,
        estado: course.estado || "activo",
        imagen: undefined,
        materias: Array.isArray(course.materias) ? course.materias : [],
        planDeEstudios: undefined,
        fechasDeExamenes: undefined,
        fechaInicioDictado: parseDictadoDateForInput(course.fechaInicioDictado),
        fechaFinDictado: parseDictadoDateForInput(course.fechaFinDictado),
      });

      // Mostrar mensaje de éxito y redirigir
      setLastSaveTime(new Date());
      setShowSaveMessage(true);
      toast.success("Curso actualizado exitosamente");
      setTimeout(() => {
        navigate("/products");
      }, 1500);
    } catch (err) {
      console.error("Error al verificar cambios:", err);
      toast.error("Error al verificar el estado del curso");
    } finally {
      setLoading(false);
    }
  };

  const aside = (
    <ProfileCard
      cover={
        <div className="grid aspect-[16/10] w-full place-items-center overflow-hidden bg-gray-100">
          {coverSrc ? (
            <img src={coverSrc} alt="Portada del curso" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs text-gray-400">
              <ImageIcon className="w-6 h-6 text-gray-300" />
              Sin portada
            </span>
          )}
        </div>
      }
      title={watchedTitle?.trim() || "Curso sin título"}
      subtitle="Curso"
      footer={
        <>
          <Button
            type="button"
            size="sm"
            className="h-8 cursor-pointer"
            onClick={currentTab === 0 ? handleSaveGeneral : handleSaveSubjects}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {loading ? "Guardando…" : currentTab === 0 ? "Guardar y continuar" : "Guardar cambios"}
            {!loading && currentTab === 0 && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
          </Button>
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
          <AlertDialog open={isDeleteCourseModalOpen} onOpenChange={setIsDeleteCourseModalOpen}>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={deleteCourseLoading}
                className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteCourseLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Eliminar curso
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar curso permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará el curso "{form.getValues().titulo || "este curso"}" y todos sus datos asociados de forma permanente.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelDeleteCourse}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (id) {
                      handleConfirmDeleteCourse(id);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Eliminar Permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      }
    >
      {/* Estado del curso: se guarda al instante */}
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
                  disabled={loading}
                  className="data-[state=checked]:bg-green-600"
                />
              </FormControl>
            </label>
          </FormItem>
        )}
      />

      {/* Secciones del curso */}
      <ol className="space-y-0.5 px-3 py-3">
        {tabs.map((tab, index) => {
          const active = currentTab === index;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setCurrentTab(index)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors cursor-pointer ${
                  active ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`grid place-items-center w-5 h-5 shrink-0 rounded-full text-[11px] font-semibold ${
                    active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {index + 1}
                </span>
                {tab.label}
              </button>
            </li>
          );
        })}
      </ol>

      {showSaveMessage && lastSaveTime && (
        <p className="flex items-center gap-1.5 border-t border-gray-100 px-5 py-2.5 text-xs text-green-700">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          Cambios guardados ·{" "}
          {lastSaveTime.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
    </ProfileCard>
  );

  return (
    <Form {...form}>
      <DetailLayout aside={aside}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit);
          }}
        >
          <SectionCard
            title={tabs[currentTab]?.label}
            description={
              currentTab === 0
                ? "Datos generales, portada, fechas y documentos del curso"
                : "Asociá, desasigná o creá materias para este curso"
            }
          >
            <div className="px-5 py-5">
              {currentTab < 1 ? (
                <GeneralInfoForm
                  key={`general-form-${pdfsVersion}-${currentPlanDeEstudiosUrl}-${currentFechasDeExamenesUrl}`}
                  control={form.control}
                  setImagePreviewUrl={setImagePreviewUrl}
                  imagePreviewUrl={imagePreviewUrl}
                  setIsDialogOpen={setIsDialogOpen}
                  isDialogOpen={isDialogOpen}
                  currentImageUrl={currentImageUrl}
                  currentPlanDeEstudiosUrl={currentPlanDeEstudiosUrl}
                  currentFechasDeExamenesUrl={currentFechasDeExamenesUrl}
                  onDeletePlanDeEstudios={handleDeletePlanDeEstudios}
                  onDeleteFechasDeExamenes={handleDeleteFechasDeExamenes}
                  planDeEstudiosDeleted={planDeEstudiosDeleted}
                  fechasDeExamenesDeleted={fechasDeExamenesDeleted}
                />
              ) : (
                <SubjectCreation courseId={createdCourseId} />
              )}
            </div>
          </SectionCard>
        </form>

        {/* Modales de confirmación de eliminación de PDFs */}
        <ConfirmDeleteModal
          isOpen={isDeletePlanModalOpen}
          onCancel={handleCancelDeletePlan}
          onConfirm={handleConfirmDeletePlanDeEstudios}
          itemName="Plan de Estudios"
          deleteLoading={false}
          id="plan-de-estudios"
        />

        <ConfirmDeleteModal
          isOpen={isDeleteFechasModalOpen}
          onCancel={handleCancelDeleteFechas}
          onConfirm={handleConfirmDeleteFechasDeExamenes}
          itemName="Fechas de Exámenes"
          deleteLoading={false}
          id="fechas-de-examenes"
        />
      </DetailLayout>
    </Form>
  );
}
