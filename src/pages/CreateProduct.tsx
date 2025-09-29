"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";
import { CoursesAPI } from "@/service/courses";

// Form components
import GeneralInfoForm from "@/components/product/GeneralInfoForm";
import FeaturesForm from "@/components/product/FeaturesForm";
import DegreesForm from "@/components/product/DegreesForm";
import ModulesTab from "@/components/product/ModulesTab";
import type { ModuloForm } from "@/types/modules";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [createdDegreeId, setCreatedDegreeId] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuloForm[]>([]);

  const [courseAlreadyCreatedInSession, setCourseAlreadyCreatedInSession] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      precio: 0,
      estado: "activo",
      materias: [],
      imagen: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    setCourseCreated(false);
    setCreatedDegreeId(null);
    setModules([]);
    setCurrentTab(0);
    setCourseAlreadyCreatedInSession(false); 
  }, []);

  const onSubmit = async (data: ProductFormData) => {
    if (courseAlreadyCreatedInSession) {
      return;
    }

    setLoading(true);

    const payload = {
      titulo: data.titulo,
      descripcion: data.descripcion,
      precio: data.precio,
      estado: data.estado,
      imagen: data.imagen || "",
      materias: data.materias || [],
    };

    try {
      const response = await CoursesAPI.create(payload);
      const newCourseId = String(response.id);
      setCreatedCourseId(newCourseId);
      setCourseCreated(true);
      setCurrentTab(3);
      setCourseAlreadyCreatedInSession(true);
      toast.success("Curso creado. Ahora puedes agregar módulos");
    } catch (err: unknown) {
      const message = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data 
        ? String(err.response.data.message)
        : "Error al guardar la formación";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // const createModule = async (moduleData: ModuloForm) => {
  //   if (!createdCourseId || createdCourseId.trim() === "") {
  //     toast.error("El ID del curso no está disponible. Por favor, inténtalo de nuevo.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const payload = {
  //       id_curso: createdCourseId,
  //       titulo: moduleData.titulo,
  //       descripcion: moduleData.descripcion,
  //       bibliografia: moduleData.bibliografia,
  //       url_miniatura: moduleData.url_miniatura,
  //       url_contenido: moduleData.url_contenido,
  //       tipo_contenido: moduleData.tipo_contenido,
  //     };

  //     const response = await CoursesAPI.createModule(payload);

  //     setModules((prev) => [...prev, { id: response.id, ...payload }]);
  //     toast.success("Módulo agregado exitosamente");
  //   } catch (err: unknown) {
  //     const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
  //     toast.error("Error al crear módulo: " + errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const finalizeCourse = async () => {
    if (!createdCourseId) return;

    setLoading(true);
    try {
      const moduleIds = modules.map((m) => m.id);
      await CoursesAPI.update(createdCourseId, { id_modulos: moduleIds });
      toast.success("Curso completado exitosamente");
      navigate("/products");
    } catch (err) {
      console.error("Error al finalizar curso:", err);
      toast.error("Error al finalizar curso");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "Información General", component: GeneralInfoForm },
    { id: "features", label: "Características", component: FeaturesForm },
    { id: "materias", label: "Materias", component: DegreesForm },
    { id: "modules", label: "Módulos", component: ModulesTab },
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
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Crear Nueva Formación
          </h1>
          <p className="text-gray-600 mt-1">
            Completa los datos para crear esta formación.
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

      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(index)}
              // disabled={index === 3 && !courseCreated}
              className={`py-2 px-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${currentTab === index
                ? "border-blue-500 text-blue-600"
                : index === 3 && !courseCreated
                  ? "border-transparent text-gray-300"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
              {index === 3 && courseCreated && modules.length > 0 && (
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
              {currentTab === 0 && <GeneralInfoForm control={form.control} />}
              {currentTab === 1 && <FeaturesForm control={form.control} />}
              {currentTab === 2 && <DegreesForm control={form.control} />}
              {currentTab === 3 && (
                <ModulesTab
                  degreeId={createdCourseId}
                  modules={modules}
                  onCreateModule={createModule}
                  loading={loading}
                  mode="create"
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

            {currentTab < 3 ? (
              <Button
                type="button"
                onClick={async () => {
                  if (currentTab === 0 || currentTab === 1) {
                    handleNext();
                  } else if (currentTab === 2) {
                    const isValid = await form.trigger();
                    if (!isValid) {
                      toast.error("Por favor completa todos los campos requeridos.");
                      return;
                    }
                    await onSubmit(form.getValues());
                  }
                }}
                disabled={loading}
              >
                {loading && currentTab === 2 ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : currentTab === 2 ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : null}

                {currentTab === 0 || currentTab === 1 || currentTab === 2 ? (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : currentTab === 3 ? (
                  "Crear Curso"
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