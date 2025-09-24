"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle,
  Plus,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  ImageIcon,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { FormacionesAPI } from "@/lib/api";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";

// Form components
import GeneralInfoForm from "@/components/product/edit/GeneralInfoForm";
import CourseInfoForm from "@/components/product/edit/CourseInfoForm";
import FeaturesForm from "@/components/product/edit/FeaturesForm";
import PricingForm from "@/components/product/edit/PricingForm";

export default function CreateProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estados para el flujo de creación
  const [courseCreated, setCourseCreated] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);

  // 🔥 NUEVO: Flag para evitar crear curso más de una vez por sesión
  const [courseAlreadyCreatedInSession, setCourseAlreadyCreatedInSession] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      duration: "",
      level: "intermedio",
      modality: "virtual",
      pilar: "liderazgo",
      id_profesor: "",
      imagen: "",
      tags: [],
      isActive: true,
    },
    mode: "onChange",
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (!id) {
      setCourseCreated(false);
      setCreatedCourseId(null);
      setModules([]);
      setCurrentTab(0);
      setCourseAlreadyCreatedInSession(false); // Reiniciar flag también
    }

    if (id) {
      const loadFormacion = async () => {
        try {
          const data = await FormacionesAPI.getById(id);
          setCourseCreated(true);
          setCreatedCourseId(id);

          form.reset({
            title: data.titulo || "",
            description: data.descripcion || "",
            price: data.precio || 0,
            duration: data.duracion?.toString() || "",
            level: data.nivel || "intermedio",
            modality: data.modalidad || "virtual",
            pilar: data.pilar || "liderazgo",
            id_profesor: data.id_profesor || "",
            imagen: data.imagen || "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            isActive: data.estado === "activo" || true,
          });
        } catch (err) {
          toast.error("No se pudo cargar la formación");
          navigate("/products");
        }
      };
      loadFormacion();
    }
  }, [id, form, navigate]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id && courseAlreadyCreatedInSession) {
      return;
    }

    setLoading(true);

    const payload = {
      titulo: data.title,
      descripcion: data.description,
      precio: data.price,
      duracion: parseInt(data.duration),
      nivel: data.level,
      modalidad: data.modality,
      pilar: data.pilar,
      estado: "activo",
      imagen: data.imagen || "",
      id_profesor: data.id_profesor,
      tags: data.tags || [],
      id_modulos: [],
    };

    try {
      if (id) {
        await FormacionesAPI.update(id, payload);
        toast.success("Formación actualizada correctamente");
        navigate("/products");
      } else {
        const response = await FormacionesAPI.create(payload);
        const newCourseId = String(response.id);
        setCreatedCourseId(newCourseId);
        setCourseCreated(true);
        setCurrentTab(2);
        setCourseAlreadyCreatedInSession(true);
        toast.success("Curso creado. Ahora puedes agregar módulos");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Error al guardar la formación";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createModule = async (moduleData: any) => {
    if (!createdCourseId || createdCourseId.trim() === "") {
      toast.error("El ID del curso no está disponible. Por favor, inténtalo de nuevo.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id_curso: createdCourseId,
        titulo: moduleData.titulo,
        descripcion: moduleData.descripcion,
        temas: moduleData.temas,
        contenido: moduleData.contenido.map((c: any) => ({
          titulo: c.titulo,
          descripcion: c.descripcion,
          tipo_contenido: c.tipo_contenido,
          duracion: c.duracion,
          url_contenido: c.url_contenido,
          url_miniatura: c.url_miniatura ?? null,
        })),
      };

      const response = await FormacionesAPI.createModule(payload);

      setModules((prev) => [...prev, { id: response.id, ...payload }]);
      toast.success("Módulo agregado exitosamente");
    } catch (err: any) {
      toast.error("Error al crear módulo: " + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Finalizar curso
  const finalizeCourse = async () => {
    if (!createdCourseId) return;

    setLoading(true);
    try {
      const moduleIds = modules.map((m) => m.id);
      await FormacionesAPI.update(createdCourseId, { id_modulos: moduleIds });
      toast.success("Curso completado exitosamente");
      navigate("/products");
    } catch (err) {
      toast.error("Error al finalizar curso");
    } finally {
      setLoading(false);
    }
  };

  // Tabs
  const tabs = [
    { id: "general", label: "Información General", component: GeneralInfoForm },
    { id: "features", label: "Características", component: FeaturesForm },
    { id: "modules", label: "Módulos", component: ModulesTab },
  ];

  // const CurrentComponent = tabs[currentTab]?.component;

  const handleNext = () => {
    if (currentTab < tabs.length - 1) setCurrentTab(currentTab + 1);
  };

  const handleBack = () => {
    if (currentTab > 0) setCurrentTab(currentTab - 1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/products">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? "Editar Formación" : "Crear Nueva Formación"}
          </h1>
          <p className="text-gray-600 mt-1">
            Completa los datos para {id ? "actualizar" : "crear"} esta
            formación.
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
                <p className="text-xs text-green-600">ID: {createdCourseId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(index)}
              disabled={index === 2 && !courseCreated}
              className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${currentTab === index
                ? "border-blue-500 text-blue-600"
                : index === 2 && !courseCreated
                  ? "border-transparent text-gray-300 cursor-not-allowed"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
              {index === 2 && courseCreated && modules.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {modules.length}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      <Form {...form}>
        <form className="space-y-8">
          <Card>
            <CardContent className="p-6">
              {currentTab < 2 ? (
                <div> <h1>CurrentComponent</h1> </div>
                // CurrentComponent && <CurrentComponent control={form.control} />
              ) : (
                <ModulesTab
                  courseId={createdCourseId}
                  modules={modules}
                  onCreateModule={createModule}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>

          {/* Botones de navegación */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentTab === 0 || loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentTab < 2 ? (
              <Button
                type="button"
                onClick={async () => {
                  if (currentTab === 0) {
                    handleNext();
                  } else if (currentTab === 1) {
                    const isValid = await form.trigger();
                    if (!isValid) {
                      toast.error("Por favor completa todos los campos requeridos.");
                      return;
                    }
                    onSubmit(form.getValues());
                  }
                }}
                disabled={loading}
              >
                {loading && currentTab === 1 ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : currentTab === 1 ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : null}

                {currentTab === 0 ? (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : currentTab === 1 ? (
                  id ? "Actualizar Formación" : "Crear Curso"
                ) : null}
              </Button>
            ) : (
              <Button onClick={finalizeCourse} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Finalizar Curso
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

// Interfaces
interface ContenidoForm {
  titulo: string;
  descripcion: string;
  tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra";
  duracion: number;
  url_contenido: string;
  url_miniatura: string | null;
}

interface ModuloForm {
  titulo: string;
  descripcion: string;
  temas: string[];
  contenido: ContenidoForm[];
}

// Componente para formulario de contenido individual
function ContenidoFormRow({
  index,
  content,
  onChange,
  onRemove,
}: {
  index: number;
  content: ContenidoForm;
  onChange: (updated: ContenidoForm) => void;
  onRemove: () => void;
}) {
  const tipos = [
    { value: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
    { value: "pdf", label: "PDF", icon: <FileText className="w-4 h-4" /> },
    {
      value: "evaluacion",
      label: "Evaluación",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      value: "imagen",
      label: "Imagen",
      icon: <ImageIcon className="w-4 h-4" />,
    },
    {
      value: "contenido_extra",
      label: "Contenido Extra",
      icon: <File className="w-4 h-4" />,
    },
  ];

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm">Contenido {index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          Eliminar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Título *</label>
          <input
            type="text"
            className="w-full p-2 border rounded text-sm"
            value={content.titulo}
            onChange={(e) => onChange({ ...content, titulo: e.target.value })}
            placeholder="Ej: Introducción al Liderazgo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Tipo de Contenido *
          </label>
          <select
            className="w-full p-2 border rounded text-sm"
            value={content.tipo_contenido}
            onChange={(e) =>
              onChange({
                ...content,
                tipo_contenido: e.target.value as any,
              })
            }
          >
            {tipos.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Descripción *
        </label>
        <textarea
          className="w-full p-2 border rounded text-sm"
          rows={2}
          value={content.descripcion}
          onChange={(e) =>
            onChange({ ...content, descripcion: e.target.value })
          }
          placeholder="Describe el contenido..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">
            URL del Contenido *
          </label>
          <input
            type="url"
            className="w-full p-2 border rounded text-sm"
            value={content.url_contenido}
            onChange={(e) =>
              onChange({ ...content, url_contenido: e.target.value })
            }
            placeholder="https://example.com/..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            URL Miniatura (opcional)
          </label>
          <input
            type="url"
            className="w-full p-2 border rounded text-sm"
            value={content.url_miniatura || ""}
            onChange={(e) =>
              onChange({
                ...content,
                url_miniatura: e.target.value || null,
              })
            }
            placeholder="https://example.com/thumbnail.jpg"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Duración (segundos) *
        </label>
        <input
          type="number"
          min="0"
          className="w-full p-2 border rounded text-sm"
          value={content.duracion}
          onChange={(e) =>
            onChange({
              ...content,
              duracion: parseInt(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          Ej: 1800 segundos = 30 minutos
        </p>
      </div>
    </div>
  );
}

// Componente principal actualizado (SIN useEffect innecesario)
function ModulesTab({
  courseId,
  modules,
  onCreateModule,
  loading,
}: {
  courseId: string | null;
  modules: any[];
  onCreateModule: (moduleData: any) => Promise<void>;
  loading: boolean;
}) {
  // ✅ useEffect eliminado — no era necesario y causaba problemas

  const [showForm, setShowForm] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuloForm>({
    titulo: "",
    descripcion: "",
    temas: [],
    contenido: [
      {
        titulo: "",
        descripcion: "",
        tipo_contenido: "video",
        duracion: 0,
        url_contenido: "",
        url_miniatura: null,
      },
    ],
  });

  const handleAddContent = () => {
    setModuleForm((prev) => ({
      ...prev,
      contenido: [
        ...prev.contenido,
        {
          titulo: "",
          descripcion: "",
          tipo_contenido: "video",
          duracion: 0,
          url_contenido: "",
          url_miniatura: null,
        },
      ],
    }));
  };

  const handleUpdateContent = (index: number, updated: ContenidoForm) => {
    setModuleForm((prev) => {
      const newContenido = [...prev.contenido];
      newContenido[index] = updated;
      return { ...prev, contenido: newContenido };
    });
  };

  const handleRemoveContent = (index: number) => {
    setModuleForm((prev) => ({
      ...prev,
      contenido: prev.contenido.filter((_, i) => i !== index),
    }));
  };

  const handleCreateModule = async () => {
    // Validaciones
    if (!moduleForm.titulo.trim()) {
      toast.error("El título del módulo es obligatorio");
      return;
    }
    if (!moduleForm.descripcion.trim()) {
      toast.error("La descripción del módulo es obligatoria");
      return;
    }
    if (moduleForm.temas.length === 0) {
      toast.error("Debe ingresar al menos un tema");
      return;
    }
    if (moduleForm.contenido.length === 0) {
      toast.error("Debe agregar al menos un contenido");
      return;
    }

    // Validar cada contenido
    for (let i = 0; i < moduleForm.contenido.length; i++) {
      const c = moduleForm.contenido[i];
      if (!c.titulo.trim()) {
        toast.error(`El título del contenido ${i + 1} es obligatorio`);
        return;
      }
      if (!c.descripcion.trim()) {
        toast.error(`La descripción del contenido ${i + 1} es obligatoria`);
        return;
      }
      if (!c.url_contenido.trim()) {
        toast.error(`La URL del contenido ${i + 1} es obligatoria`);
        return;
      }
      if (isNaN(c.duracion) || c.duracion < 0) {
        toast.error(`La duración del contenido ${i + 1} debe ser válida`);
        return;
      }
    }

    await onCreateModule({
      titulo: moduleForm.titulo,
      descripcion: moduleForm.descripcion,
      temas: moduleForm.temas,
      contenido: moduleForm.contenido.map((c) => ({
        ...c,
        duracion: Math.max(0, c.duracion),
      })),
    });

    // Reset form
    setModuleForm({
      titulo: "",
      descripcion: "",
      temas: [],
      contenido: [
        {
          titulo: "",
          descripcion: "",
          tipo_contenido: "video",
          duracion: 0,
          url_contenido: "",
          url_miniatura: null,
        },
      ],
    });
    setShowForm(false);
  };

  const handleTemasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temas = e.target.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setModuleForm((prev) => ({ ...prev, temas }));
  };

  const getContentIcon = (tipo: string) => {
    switch (tipo) {
      case "video":
        return <Video className="w-4 h-4 text-blue-500" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "evaluacion":
        return <HelpCircle className="w-4 h-4 text-yellow-500" />;
      case "imagen":
        return <ImageIcon className="w-4 h-4 text-green-500" />;
      case "contenido_extra":
        return <File className="w-4 h-4 text-purple-500" />;
      default:
        return <Video className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!courseId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          Primero debes crear el curso para poder agregar módulos
        </p>
        <Button disabled variant="outline">
          Crear Curso Primero
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos del Curso</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Módulo
        </Button>
      </div>

      {/* Formulario de módulo */}
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium">Nuevo Módulo</h4>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={moduleForm.titulo}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      titulo: e.target.value,
                    }))
                  }
                  placeholder="Ej: Fundamentos del Liderazgo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción *
                </label>
                <textarea
                  className="w-full p-2 border rounded h-20"
                  value={moduleForm.descripcion}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Describe el contenido del módulo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Temas * (separados por coma)
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={moduleForm.temas.join(", ")}
                  onChange={handleTemasChange}
                  placeholder="Ej: liderazgo, comunicación, gestión"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: liderazgo, comunicación, gestión de equipos
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium">Contenidos *</h5>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddContent}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Agregar Contenido
                  </Button>
                </div>

                {moduleForm.contenido.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No hay contenidos. Haz clic en "Agregar Contenido".
                  </p>
                ) : (
                  <div className="space-y-4">
                    {moduleForm.contenido.map((content, idx) => (
                      <ContenidoFormRow
                        key={idx}
                        index={idx}
                        content={content}
                        onChange={(updated) => handleUpdateContent(idx, updated)}
                        onRemove={() => handleRemoveContent(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleCreateModule}
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Crear Módulo"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de módulos existentes */}
      <div className="space-y-3">
        {modules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No hay módulos creados aún</p>
              <p className="text-sm">
                Haz clic en "Agregar Módulo" para comenzar
              </p>
            </CardContent>
          </Card>
        ) : (
          modules.map((module: any, index: number) => (
            <Card key={module.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium flex items-center space-x-2">
                      <Badge variant="outline">Módulo {index + 1}</Badge>
                      <span>{module.titulo}</span>
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {module.descripcion}
                    </p>
                  </div>
                </div>

                {/* Temas */}
                {Array.isArray(module.temas) && module.temas.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">
                      Temas:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {module.temas.map((tema: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tema}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contenidos */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Contenidos ({module.contenido?.length || 0}):
                  </h5>
                  <div className="space-y-2">
                    {Array.isArray(module.contenido) &&
                      module.contenido.length > 0 ? (
                      module.contenido.map((content: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded border"
                        >
                          <div className="mt-1">
                            {getContentIcon(content.tipo_contenido)}
                          </div>
                          <div className="flex-1">
                            <h6 className="font-medium text-sm">
                              {content.titulo}
                            </h6>
                            <p className="text-xs text-gray-600 mb-1">
                              {content.descripcion}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {content.tipo_contenido}
                              </Badge>
                              {content.duracion > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {Math.floor(content.duracion / 60)}min{" "}
                                  {content.duracion % 60}s
                                </Badge>
                              )}
                            </div>
                          </div>
                          {content.url_miniatura && (
                            <img
                              src={content.url_miniatura}
                              alt="Miniatura"
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Sin contenidos agregados
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}