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
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";
import { CoursesAPI } from "@/service/courses";

// Form components
import GeneralInfoForm from "@/components/product/GeneralInfoForm";
import FeaturesForm from "@/components/product/FeaturesForm";
import SubjectCreation from "@/components/product/SubjectCreation";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const [courseAlreadyCreatedInSession, setCourseAlreadyCreatedInSession] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      precio: 0,
      estado: "activo",
      imagen: "",
      materias: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    setCourseCreated(false);
    setCurrentTab(0);
    setCourseAlreadyCreatedInSession(false);
  }, []);

  const createCourse = async (data: ProductFormData) => {
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
      setCourseAlreadyCreatedInSession(true);
      toast.success("Curso creado exitosamente");
      handleNext();
    } catch (err: unknown) {
      const message = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
        ? String(err.response.data.message)
        : "Error al guardar la formación";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeCourse = async () => {
    console.log("createdCourseId", createdCourseId);
    if (!createdCourseId) return;

    setLoading(true);
    try {
      const currentFormData = form.getValues();
      await CoursesAPI.update(createdCourseId, {
        ...currentFormData,
        materias: currentFormData.materias || [],
      });

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
      </div>

      <Form {...form}>
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <Card>
            <CardContent className="p-6">
              {currentTab === 0 && <GeneralInfoForm control={form.control} />}
              {currentTab === 1 && <FeaturesForm control={form.control} />}
              {currentTab === 2 && <SubjectCreation control={form.control} courseId={createdCourseId} />}
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

            {currentTab < 2 && !createdCourseId ? (
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
                    console.log("form.getValues()", form.getValues());
                    await createCourse(form.getValues());
                  }
                }}
                disabled={loading}
              >
                {loading && currentTab === 0 ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (currentTab === 0 && !courseCreated) ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : null}

                {currentTab === 0 || currentTab === 1 && !courseCreated ? (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : currentTab === 0 && courseCreated ? (
                  courseCreated ? (
                    <>
                      Siguiente
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "Crear Curso"
                  )
                ) : null}
              </Button>
            ) : (
              <Button type="button" onClick={finalizeCourse} disabled={loading}>
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