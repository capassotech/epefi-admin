
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";
import { CoursesAPI } from "@/service/courses";
import { slugify } from "@/lib/utils";

// Form components
import GeneralInfoForm from "@/components/product/GeneralInfoForm";
import SubjectCreation from "@/components/product/SubjectCreation";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const [courseAlreadyCreatedInSession, setCourseAlreadyCreatedInSession] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlanDeEstudiosUrl, setCurrentPlanDeEstudiosUrl] = useState<string | null>(null);
  const [currentFechasDeExamenesUrl, setCurrentFechasDeExamenesUrl] = useState<string | null>(null);

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

      // Incluir fechas siempre, incluso si están vacías (para que el backend pueda procesarlas)
      payload.fechaInicioDictado = data.fechaInicioDictado || null;
      payload.fechaFinDictado = data.fechaFinDictado || null;
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex items-center space-x-4">
        <Link to="/products">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Crear nuevo curso
          </h1>
          <p className="text-gray-600 mt-1">
            Completa los datos para crear este curso.
          </p>
        </div>
      </div>

      {courseCreated && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Curso creado exitosamente
                </p>
              </div>
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
                  disabled={index === 1 && !createdCourseId || index === 2 && !createdCourseId}
                  className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${currentTab === index
                    ? "border-blue-500 text-blue-600"
                    : index === 1 && !createdCourseId || index === 2 && !createdCourseId
                      ? "border-transparent text-gray-300 cursor-not-allowed"
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
                          
                          // Guardar automáticamente si el curso ya fue creado
                          if (courseAlreadyCreatedInSession && createdCourseId) {
                            try {
                              const course = await CoursesAPI.getById(createdCourseId);
                              
                              if (course) {
                                await CoursesAPI.update(createdCourseId, {
                                  ...course,
                                  estado: newEstado,
                                });
                                toast.success(`Curso ${newEstado === "activo" ? "activado" : "desactivado"} exitosamente`);
                              }
                            } catch (error) {
                              console.error("Error al actualizar estado del curso:", error);
                              toast.error("Error al actualizar el estado del curso");
                              // Revertir el cambio si falla
                              field.onChange(oldEstado);
                            }
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <Card>
            <CardContent className="p-6">
              {currentTab === 0 && 
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
              }
              {currentTab === 1 && <SubjectCreation courseId={createdCourseId} control={form.control} courseTitle={form.getValues("titulo") || null} />}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentTab === 0 || loading || currentTab === 2 && !createdCourseId}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentTab === 0 ? (
              <Button
                type="button"
                className="cursor-pointer"
                onClick={async () => {
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
                  if (loading) {
                    return;
                  }
                  
                  await createCourse(form.getValues());
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {createdCourseId ? "Actualizando..." : "Creando..."}
                  </>
                ) : createdCourseId ? (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Crear y Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={finalizeCourse} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Finalizar Curso
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}