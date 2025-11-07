
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


export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
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
        
        const formData = {
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          precio: data.precio || 0,
          estado: data.estado || "activo",
          imagen: undefined, // Don't set file object, keep as undefined
          materias: Array.isArray(data.materias) ? data.materias : [],
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
    
    // Comparar campos principales (ignorar imagen ya que es un File)
    return (
      currentData.titulo !== originalCourseData.titulo ||
      currentData.descripcion !== originalCourseData.descripcion ||
      currentData.precio !== originalCourseData.precio ||
      currentData.estado !== originalCourseData.estado ||
      JSON.stringify(currentData.materias) !== JSON.stringify(originalCourseData.materias) ||
      currentData.imagen instanceof File // Si hay una nueva imagen, hay cambios
    );
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

      const payload = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        precio: data.precio,
        estado: data.estado,
        imagen: imageUrl,
        materias: data.materias || [],
      };

      await CoursesAPI.update(id, payload);
      
      // Actualizar los datos originales con los nuevos datos
      setOriginalCourseData({
        ...data,
        imagen: undefined, // Mantener undefined después de guardar
      });
      
      // Mostrar mensaje de cambios guardados (sin toast, solo el Card)
      setLastSaveTime(new Date());
      setShowSaveMessage(true);
      setCurrentImageUrl(imageUrl); // Actualizar la URL de la imagen actual
      
      handleNext();
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
          <h1 className="text-3xl font-bold text-gray-900">Editar Curso</h1>
          <p className="text-gray-600 mt-1">Modifica los datos de este curso.</p>
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
                    control={form.control} 
                    setImagePreviewUrl={setImagePreviewUrl}
                    imagePreviewUrl={imagePreviewUrl}
                    setIsDialogOpen={setIsDialogOpen}
                    isDialogOpen={isDialogOpen}
                    currentImageUrl={currentImageUrl}
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
                  
                  form.handleSubmit(onSubmit)();
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}

                {currentTab === 0 ? (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Actualizar Curso"
                )}
              </Button>
            ) : (
              <Button 
                className="cursor-pointer" 
                onClick={() => {
                  const currentData = form.getValues();
                  if (!hasChanges(currentData)) {
                    toast.info("No hay cambios para guardar");
                    return;
                  }
                  form.handleSubmit(onSubmit)();
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
    </div>
  );
}