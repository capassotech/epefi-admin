
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
} from "lucide-react";
import { toast } from "sonner";

import { CoursesAPI } from "@/service/courses";
import {
  productFormSchema,
  type ProductFormData,
} from "@/schemas/product-schema";

import GeneralInfoForm from "@/components/product/GeneralInfoForm";
import SubjectList from "@/components/subject/SubjectList";
import type { Subject } from "@/types/types";
import SubjectCreation from "@/components/product/SubjectCreation";


export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(true);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjects, setNewSubjects] = useState<boolean>(false);

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
          estado: data.estado || "activo",
          imagen: data.imagen || "",
          materias: Array.isArray(data.materias) ? data.materias : [],
        });

        try {
          const allSubjects = await CoursesAPI.getMaterias();
          const associated = (allSubjects || []).filter((s: Subject) => Array.isArray(s.id_cursos) && s.id_cursos.includes(id));
          setSubjects(associated);
        } catch (e) {
          console.warn("No se pudieron cargar las materias del curso", e);
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
  }, [id, form, navigate, newSubjects]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;
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
      await CoursesAPI.update(id, payload);
      toast.success("Formación actualizada correctamente");
      handleNext();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || "Error al actualizar la formación";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnDeleteSubject = async (subjectId: string) => {
    try {
      await CoursesAPI.deleteMateria(subjectId);
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar la materia");
    }
  }

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
                <p className="text-sm text-green-600">ID: {createdCourseId}</p>
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
            </button>
          ))}
        </nav>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit(onSubmit)
        }} className="space-y-8">
          <Card>
            <CardContent className="p-6">
              {currentTab < 1 
                ? <GeneralInfoForm control={form.control} />
                : ( 
                  <>
                    <SubjectCreation courseId={createdCourseId} setNewSubjects={setNewSubjects} />
                    <div className="mt-5">
                      <SubjectList
                        subjects={subjects}
                        onDelete={handleOnDeleteSubject}
                      />
                    </div>
                  </>
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

            {currentTab === 0 ? (
              <Button
                type="button"
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (!isValid) {
                    toast.error("Por favor completa todos los campos requeridos.");
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
                  "Actualizar Formación"
                )}
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