
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle,
  X,
  Clock,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import { CoursesAPI } from "@/service/courses";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";
import { slugify } from "@/lib/utils";

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
        // Función helper para convertir fecha ISO a formato YYYY-MM-DD
        const formatDateForInput = (dateValue: string | undefined | null): string | undefined => {
          if (!dateValue) return undefined;
          try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return undefined;
            // Convertir a formato YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          } catch {
            return undefined;
          }
        };
        const formData = {
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          precio: data.precio || 0,
          estado: data.estado || "activo",
          imagen: undefined, // Don't set file object, keep as undefined
          materias: Array.isArray(data.materias) ? data.materias : [],
          planDeEstudios: undefined,
          fechasDeExamenes: undefined,
          fechaInicioDictado: formatDateForInput(data.fechaInicioDictado),
          fechaFinDictado: formatDateForInput(data.fechaFinDictado),
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

      // Convertir fechas a formato ISO con hora local para evitar problemas de zona horaria
      const fechaInicio = new Date(data.fechaInicioDictado + 'T00:00:00');
      payload.fechaInicioDictado = fechaInicio.toISOString();
      
      const fechaFin = new Date(data.fechaFinDictado + 'T00:00:00');
      payload.fechaFinDictado = fechaFin.toISOString();

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
      
      // Función helper para formatear fechas
      const formatDateForInput = (dateValue: string | undefined | null): string | undefined => {
        if (!dateValue) return undefined;
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return undefined;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          return undefined;
        }
      };

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
        fechaInicioDictado: formatDateForInput(updatedCourse?.fechaInicioDictado),
        fechaFinDictado: formatDateForInput(updatedCourse?.fechaFinDictado),
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex items-center space-x-4">
        <Link to="/products">
          <Button variant="outline" size="sm" className="flex items-center space-x-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar curso</h1>
        </div>
      </div>

      {showSaveMessage && lastSaveTime && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Cambios guardados</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-green-600" />
                    <p className="text-xs text-green-700">
                      {lastSaveTime.toLocaleTimeString('es-AR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSaveMessage(false)}
                className="text-green-700 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-100"
                aria-label="Cerrar mensaje"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between pb-2">
            <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(index)}
                  className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${currentTab === index
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            
            {/* Checkbox de estado - siempre visible de forma sutil */}
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-50/50 border border-gray-200/50 hover:bg-gray-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={field.value === "activo"}
                        onChange={async (e) => {
                          const newEstado = e.target.checked ? "activo" : "inactivo";
                          const oldEstado = field.value;
                          field.onChange(newEstado);
                          
                          // Guardar automáticamente el cambio de estado
                          if (id) {
                            try {
                              setLoading(true);
                              const course = await CoursesAPI.getById(id);
                              
                              if (course) {
                                await CoursesAPI.update(id, {
                                  ...course,
                                  estado: newEstado,
                                });
                                
                                // Actualizar los datos originales
                                if (originalCourseData) {
                                  setOriginalCourseData({
                                    ...originalCourseData,
                                    estado: newEstado,
                                  });
                                }
                                
                                // Mostrar mensaje de cambios guardados
                                setLastSaveTime(new Date());
                                setShowSaveMessage(true);
                              }
                            } catch (error) {
                              console.error("Error al actualizar estado del curso:", error);
                              toast.error("Error al actualizar el estado del curso");
                              // Revertir el cambio si falla
                              field.onChange(oldEstado);
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        disabled={loading}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <FormLabel className="text-xs font-medium text-gray-600 cursor-pointer">
                        {field.value === "activo" ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Inactivo
                          </span>
                        )}
                      </FormLabel>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit(onSubmit)
        }} className="space-y-8">
          <Card>
            <CardContent className="p-6">
              {currentTab < 1 
                ? <GeneralInfoForm 
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
                : ( 
                  <SubjectCreation courseId={createdCourseId} />
                )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentTab === 0 || loading}
              className="cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentTab === 0 ? (
              <Button
                type="button"
                className="cursor-pointer"
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (!isValid) {
                    toast.error("Por favor completa todos los campos requeridos.");
                    return;
                  }
                  
                  const currentData = form.getValues();
                  if (!hasChanges(currentData)) {
                    // Si no hay cambios, solo avanzar a la siguiente pestaña
                    handleNext();
                    return;
                  }
                  
                  // Si hay cambios, guardar y luego avanzar (onSubmit ya llama a handleNext)
                  await form.handleSubmit(onSubmit)();
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar y Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button 
                className="cursor-pointer" 
                onClick={async () => {
                  const currentData = form.getValues();
                  
                  // Si hay cambios en los campos del formulario, guardarlos
                  if (hasChanges(currentData)) {
                    await form.handleSubmit(onSubmit)();
                  } else {
                    // Si no hay cambios en el formulario, verificar si hay cambios en materias
                    // Las materias se actualizan automáticamente en SubjectCreation,
                    // pero necesitamos actualizar originalCourseData para reflejar el estado actual
                    try {
                      setLoading(true);
                      const course = await CoursesAPI.getById(id!);
                      
                      // Actualizar URLs de PDFs desde el curso actualizado
                      setCurrentPlanDeEstudiosUrl(course.planDeEstudiosUrl || null);
                      setCurrentFechasDeExamenesUrl(course.fechasDeExamenesUrl || null);
                      
                      // Actualizar originalCourseData con los datos actuales del curso
                      const updatedFormData = {
                        titulo: course.titulo || "",
                        descripcion: course.descripcion || "",
                        precio: course.precio || 0,
                        estado: course.estado || "activo",
                        imagen: undefined,
                        materias: Array.isArray(course.materias) ? course.materias : [],
                        planDeEstudios: undefined,
                        fechasDeExamenes: undefined,
                      };
                      
                      setOriginalCourseData(updatedFormData);
                      
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
                  }
                }} 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            )}
          </div>
        </form>
      </Form>

          {/* Los modales de materias están en SubjectCreation */}

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

      {/* Sección de eliminación del curso */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex justify-center">
          <AlertDialog open={isDeleteCourseModalOpen} onOpenChange={setIsDeleteCourseModalOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteCourseLoading}
              >
                {deleteCourseLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4 mr-2" />
                    Eliminar Curso Permanentemente
                  </>
                )}
              </Button>
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
        </div>
      </div>
    </div>
  );
}