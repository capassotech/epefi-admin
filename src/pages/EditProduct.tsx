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
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { CoursesAPI } from "@/service/courses";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";

import GeneralInfoForm from "@/components/product/GeneralInfoForm";
import FeaturesForm from "@/components/product/FeaturesForm";
import ModulesTab from "@/components/subject/ModulesTab";
import type { ModuloForm } from "@/types/modules";



export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(true);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuloForm[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      precio: 0,
      duracion: "",
      nivel: "intermedio",
      modalidad: "virtual",
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
        const data = await CoursesAPI.getById(id);

        setCreatedCourseId(id);
        setCourseCreated(true);

        form.reset({
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          precio: data.precio || 0,
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
            CoursesAPI.getModuleById(moduleId).catch(err => {
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
      descripcion: data.descripcion,
      precio: data.precio,
      duracion: parseInt(data.duracion) || 0,
      nivel: data.nivel,
      modalidad: data.modalidad,
      pilar: data.pilar,
      estado: data.isActive ? "activo" : "inactivo",
      imagen: data.imagen || "",
      id_profesor: data.id_profesor,
      tags: data.tags || [],
      id_modulos: modules.map(m => m.id).filter(id => id != null),
    };

    try {
      await CoursesAPI.update(id, payload);
      toast.success("Formación actualizada correctamente");
      navigate("/products");
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al actualizar la formación";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createModule = async (moduleData: ModuloForm) => {
    if (!createdCourseId) return;

    setLoading(true);
    try {
      const payload = {
        id_curso: createdCourseId,
        titulo: moduleData.titulo,
        descripcion: moduleData.descripcion,
        temas: moduleData.temas,
        contenido: moduleData.contenido.map((c) => ({
          titulo: c.titulo,
          descripcion: c.descripcion,
          tipo_contenido: c.tipo_contenido,
          duracion: c.duracion,
          url_contenido: c.url_contenido,
          url_miniatura: c.url_miniatura ?? null,
        })),
      };

      const response = await CoursesAPI.createModule(payload);
      setModules((prev) => [...prev, { id: response.id, ...payload }]);
      toast.success("Módulo agregado exitosamente");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error("Error al crear módulo: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const editModule = async (moduleId: string, moduleData: ModuloForm) => {
    if (!createdCourseId) return;

    setLoading(true);
    try {
      const payload = {
        id_curso: createdCourseId,
        titulo: moduleData.titulo,
        descripcion: moduleData.descripcion,
        temas: moduleData.temas,
        contenido: moduleData.contenido.map((c) => ({
          titulo: c.titulo,
          descripcion: c.descripcion,
          tipo_contenido: c.tipo_contenido,
          duracion: c.duracion,
          url_contenido: c.url_contenido,
          url_miniatura: c.url_miniatura ?? null,
        })),
      };

      await CoursesAPI.updateModule(moduleId, payload);
      setModules((prev) =>
        prev.map((mod) =>
          mod.id === moduleId ? { ...mod, ...payload } : mod
        )
      );
      toast.success("Módulo actualizado correctamente");
    } catch (err: unknown) {
      console.error("Error al actualizar módulo:", err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error("Error al actualizar módulo: " + errorMessage);
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
                  onCreateModule={createModule}
                  loading={loading}
                  setModules={setModules}
                  onEditModule={editModule}
                  mode="edit"
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