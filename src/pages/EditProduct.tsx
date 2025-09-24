"use client";

import React, { useState, useEffect } from "react"; 
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

import GeneralInfoForm from "@/components/product/edit/GeneralInfoForm";
import FeaturesForm from "@/components/product/edit/FeaturesForm";

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(true);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);

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

  useEffect(() => {
    if (!id) {
      toast.error("ID no proporcionado");
      navigate("/products");
      return;
    }

    const loadFormacion = async () => {
      try {
        setLoading(true);
        const data = await FormacionesAPI.getById(id);

        setCreatedCourseId(id);
        setCourseCreated(true);

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
          isActive: data.estado === "activo",
        });

        if (data.modulos && Array.isArray(data.modulos)) {
          setModules(data.modulos);
        } else if (data.id_modulos && Array.isArray(data.id_modulos)) {
          const modulosPromises = data.id_modulos.map((moduleId: string) =>
            FormacionesAPI.getModuleById(moduleId).catch(err => {
              console.warn(`Módulo no encontrado: ${moduleId}`);
              return null;
            })
          );
          const modulos = await Promise.all(modulosPromises);
          setModules(modulos.filter(Boolean));
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar la formación");
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    loadFormacion();
  }, [id, form, navigate]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;
    setLoading(true);

    const payload = {
      titulo: data.title,
      descripcion: data.description,
      precio: data.price,
      duracion: parseInt(data.duration) || 0,
      nivel: data.level,
      modalidad: data.modality,
      pilar: data.pilar,
      estado: data.isActive ? "activo" : "inactivo",
      imagen: data.imagen || "",
      id_profesor: data.id_profesor,
      tags: data.tags || [],
      id_modulos: modules.map(m => m.id).filter(id => id != null),
    };

    try {
      await FormacionesAPI.update(id, payload);
      toast.success("Formación actualizada correctamente");
      navigate("/products");
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al actualizar la formación";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createModule = async (moduleData: any) => {
    if (!createdCourseId) return;

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
      console.error(err);
      toast.error("Error al crear módulo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "Información General", component: GeneralInfoForm },
    { id: "features", label: "Características", component: FeaturesForm },
    { id: "modules", label: "Módulos", component: ModulesTab },
  ];

  const CurrentComponent = tabs[currentTab]?.component;

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
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Formación</h1>
          <p className="text-gray-600 mt-1">Modifica los datos de esta formación.</p>
        </div>
      </div>

      {courseCreated && createdCourseId && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Curso cargado exitosamente</p>
                <p className="text-sm text-green-600">ID: {createdCourseId} | Módulos: {modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
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
              {index === 2 && modules.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {modules.length}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="p-6">
              {currentTab < 2 ? (
                CurrentComponent && <CurrentComponent control={form.control} />
              ) : (
                <ModulesTab
                  courseId={createdCourseId}
                  modules={modules}
                  setModules={setModules}
                  onCreateModule={createModule}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>

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
                    form.handleSubmit(onSubmit)();
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
                  "Actualizar Formación"
                ) : null}
              </Button>
            ) : (
              <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
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
    </div>
  );
}

// Tipos para el formulario de módulo
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

// Componente principal de Módulos — ¡AHORA CON EDICIÓN Y setModules!
function ModulesTab({
  courseId,
  modules,
  setModules,
  onCreateModule,
  loading: externalLoading,
}: {
  courseId: string | null;
  modules: any[];
  setModules: React.Dispatch<React.SetStateAction<any[]>>;
  onCreateModule: (moduleData: any) => Promise<void>;
  loading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);

    try {
      const basePayload = {
        titulo: moduleForm.titulo.trim(),
        descripcion: moduleForm.descripcion.trim(),
        temas: moduleForm.temas.filter(t => t.trim()),
        contenido: moduleForm.contenido.map((c) => ({
          titulo: c.titulo?.trim() || "",
          descripcion: c.descripcion?.trim() || "",
          tipo_contenido: c.tipo_contenido || "video",
          duracion: Math.max(0, c.duracion) || 0,
          url_contenido: c.url_contenido?.trim() || "",
          url_miniatura: c.url_miniatura?.trim() || null,
        })),
      };

      if (editingModuleId) {
        if (!courseId) {
          throw new Error("ID del curso no disponible para edición");
        }

        const payload = {
          ...basePayload,
          id_curso: courseId, 
        };

        await FormacionesAPI.updateModule(editingModuleId, payload);
        setModules((prev) =>
          prev.map((mod) =>
            mod.id === editingModuleId ? { ...mod, ...payload } : mod
          )
        );
        toast.success("Módulo actualizado correctamente");
      } else {
        if (!courseId) {
          toast.error("ID del curso no disponible");
          return;
        }
        const payload = {
          ...basePayload,
          id_curso: courseId,
        };
        const response = await FormacionesAPI.createModule(payload);
        setModules((prev) => [...prev, { id: response.id, ...payload }]);
        toast.success("Módulo creado correctamente");
      }
    } catch (err: any) {
      console.error("❌ Error al guardar módulo:", err);
      let message = "Error al guardar cambios";
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      toast.error("⚠️ " + message);
    } finally {
      setLoading(false);
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
      setEditingModuleId(null);
      setShowForm(false);
    }
  };

  const editModule = async (module: any) => {
    if (!module?.id) {
      toast.error("Módulo inválido");
      return;
    }

    setLoading(true);
    try {
      const moduleData = await FormacionesAPI.getModuleById(module.id);

      setEditingModuleId(moduleData.id);
      setModuleForm({
        titulo: moduleData.titulo || "",
        descripcion: moduleData.descripcion || "",
        temas: Array.isArray(moduleData.temas) ? [...moduleData.temas] : [],
        contenido: Array.isArray(moduleData.contenido)
          ? moduleData.contenido.map((c: any) => ({
            titulo: c.titulo || "",
            descripcion: c.descripcion || "",
            tipo_contenido: c.tipo_contenido || "video",
            duracion: c.duracion || 0,
            url_contenido: c.url_contenido || "",
            url_miniatura: c.url_miniatura || null,
          }))
          : [
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
      setShowForm(true);
    } catch (err: any) {
      console.error("Error al cargar módulo:", err);
      toast.error("No se pudo cargar el módulo. Puede que haya sido eliminado.");
    } finally {
      setLoading(false);
    }
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
          Primero debes cargar el curso para poder gestionar módulos
        </p>
        <Button disabled variant="outline">
          Cargar Curso Primero
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos del Curso</h3>
        <Button type="button" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Módulo
        </Button>
      </div>

      {/* Formulario de módulo */}
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium">
              {editingModuleId ? "Editar Módulo" : "Nuevo Módulo"}
            </h4>

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
                type="button"
                onClick={handleCreateModule}
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingModuleId ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Módulo"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingModuleId(null);
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
                }}
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
                    <p className="text-sm text-gray-600 mt-1">{module.descripcion}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editModule(module)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Editar"}
                  </Button>
                </div>

                {/* Temas */}
                {Array.isArray(module.temas) && module.temas.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">
                      Temas:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {module.temas.map((tema: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
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
                    {Array.isArray(module.contenido) && module.contenido.length > 0 ? (
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
                                  {Math.floor(content.duracion / 60)}min {content.duracion % 60}s
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