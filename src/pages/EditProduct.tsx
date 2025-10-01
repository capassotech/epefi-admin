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
import CreateSubjectModal from "@/components/subject/CreateSubjectModal";
import SubjectList from "@/components/subject/SubjectList";
import type { ModuloForm } from "@/types/modules";
import type { Subject } from "@/types/types";



export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [courseCreated, setCourseCreated] = useState(true);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuloForm[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

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

        if (data.modulos && Array.isArray(data.modulos)) {
          setModules(data.modulos);
        } else if (data.id_modulos && Array.isArray(data.id_modulos)) {
          const modulosPromises = data.id_modulos.map((moduleId: string) =>
            CoursesAPI.getModuleById(moduleId).catch(() => {
              console.warn(`Módulo no encontrado: ${moduleId}`);
              return null;
            })
          );
          const modulos = await Promise.all(modulosPromises);
          setModules(modulos.filter(Boolean));
        }

        // Cargar materias asociadas a este curso
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
  }, [id, form, navigate]);

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
      navigate("/products");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr.response?.data?.message || "Error al actualizar la formación";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectCreated = async (payload: { nombre: string; id_cursos: string[]; modulos: string[] }) => {
    try {
      const created = await CoursesAPI.createMateria({
        nombre: payload.nombre,
        id_cursos: payload.id_cursos,
        modulos: payload.modulos,
      } as Omit<Subject, 'id'>);
      setSubjects(prev => [...prev, created]);
      return { id: created.id };
    } catch (e) {
      console.error(e);
      toast.error("Error al crear materia");
      throw e;
    }
  }

  const handleSubjectUpdated = async (data: { id: string; nombre: string; id_cursos: string[]; modulos: string[] }) => {
    try {
      await CoursesAPI.updateMateria(data.id, {
        id: data.id,
        nombre: data.nombre,
        id_cursos: data.id_cursos,
        modulos: data.modulos,
      } as Subject);
      setSubjects(prev => prev.map(s => s.id === data.id ? { ...s, nombre: data.nombre, id_cursos: data.id_cursos, modulos: data.modulos } : s));
      toast.success("Materia actualizada correctamente");
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar la materia");
    }
  }


  const tabs = [
    { id: "general", label: "Información General" },
    { id: "features", label: "Características" },
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
        <form onSubmit={(e) => {
          e.preventDefault() 
          form.handleSubmit(onSubmit)
        }} className="space-y-8">
          <Card>
            <CardContent className="p-6">
              {currentTab < 2 ? (
                currentTab === 0 ? (
                  <GeneralInfoForm control={form.control} />
                ) : (
                  <FeaturesForm control={form.control} />
                )
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6 flex justify-between items-center">
                      <div>
                        <h1 className="text-base">Materias</h1>
                        <div className="text-sm text-muted-foreground">
                          Visualiza y gestiona las materias asociadas a esta formación
                        </div>
                      </div>
                      <Button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => { setEditingSubject(null); setIsSubjectModalOpen(true); }}
                      >
                        Agregar Materia
                      </Button>
                    </CardContent>
                  </Card>

                  <SubjectList
                    subjects={subjects}
                    onEdit={(subject) => { setEditingSubject(subject); setIsSubjectModalOpen(true); }}
                    onDelete={async (subjectId: string) => {
                      try {
                        await CoursesAPI.deleteMateria(subjectId);
                        setSubjects(prev => prev.filter(s => s.id !== subjectId));
                      } catch (e) {
                        console.error(e);
                        toast.error("Error al eliminar la materia");
                      }
                    }}
                  />

                  <CreateSubjectModal
                    isOpen={isSubjectModalOpen}
                    onCancel={() => setIsSubjectModalOpen(false)}
                    courseId={createdCourseId ?? undefined}
                    editingSubject={editingSubject}
                    onSubjectUpdated={handleSubjectUpdated}
                    onSubjectCreated={handleSubjectCreated}
                    onGoToModules={async (subjectId: string) => {
                      setSelectedSubjectId(subjectId);
                      navigate(`/modules/create?subjectId=${subjectId}`);
                      try {
                        const subj = subjects.find(s => s.id === subjectId);
                        if (subj && Array.isArray(subj.modulos) && subj.modulos.length > 0) {
                          const fetched = await CoursesAPI.getModulesByIds(subj.modulos);
                          setModules(fetched as unknown as ModuloForm[]);
                        } else {
                          setModules([]);
                        }
                      } catch (e) {
                        console.error(e);
                        toast.error("No se pudieron cargar los módulos de la materia");
                      }
                    }}
                  />
                </div>
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

            {currentTab < 3 ? (
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
                  } else if (currentTab === 2) {
                    handleNext();
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
                ) : currentTab === 2 ? (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
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