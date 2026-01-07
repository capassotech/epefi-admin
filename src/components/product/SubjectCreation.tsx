// components/product/edit/FeaturesForm.tsx

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import SubjectModal from "../subject/SubjectModal";
import { useEffect, useMemo, useState } from "react";
import { type Subject, type Module } from "@/types/types";
import { CoursesAPI } from "@/service/courses";
import { toast } from "sonner";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { ProductFormData } from "@/schemas/product-schema";
import { SubjectList } from "../subject/SubjectList";
import ConfirmDeleteModal from "../product/ConfirmDeleteModal";
import { Loader2, Plus } from "lucide-react";
import ModulesModal from "../subject/ModulesModal";
import ModulesList from "../subject/ModulesList";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
interface SubjectCreationProps {
    courseId?: string | null;
    control?: Control<ProductFormData>;
    courseTitle?: string | null; // Título del curso para pasar al modal
}


export default function SubjectCreation({ courseId, control, courseTitle }: SubjectCreationProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
    const [courseSubjectIds, setCourseSubjectIds] = useState<string[]>([]);
    const [courseSubjects, setCourseSubjects] = useState<Subject[]>([]); // Materias completas asociadas al curso
    const [loading, setLoading] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false); // Estado de carga para el listado de materias
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentCourseTitle, setCurrentCourseTitle] = useState<string | null>(courseTitle || null);
    
    // Estados para gestión de módulos
    const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
    const [currentSubjectForModules, setCurrentSubjectForModules] = useState<Subject | null>(null);
    const [subjectModules, setSubjectModules] = useState<Module[]>([]);
    const [loadingModules, setLoadingModules] = useState(false);
    const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [isDeleteModuleModalOpen, setIsDeleteModuleModalOpen] = useState(false);
    const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null);
    const [deleteModuleLoading, setDeleteModuleLoading] = useState(false);
    
    // Rastrear si el modal de módulos se abrió desde el modal de materia
    const [shouldCloseSubjectModalOnModuleClose, setShouldCloseSubjectModalOnModuleClose] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoadingSubjects(true);
            try {
                const [subjectsList, course] = await Promise.all([
                    CoursesAPI.getMaterias(),
                    courseId ? CoursesAPI.getById(String(courseId)) : Promise.resolve(null),
                ]);
                setAllSubjects(Array.isArray(subjectsList) ? subjectsList : []);
                const existingIds = Array.isArray(course?.materias) ? course.materias.map(String) : [];
                setCourseSubjectIds(existingIds);
                
                // Cargar las materias completas asociadas al curso
                if (existingIds.length > 0) {
                    try {
                        const associatedSubjects = await CoursesAPI.getMateriasByIds(existingIds);
                        setCourseSubjects(Array.isArray(associatedSubjects) ? associatedSubjects : []);
                    } catch (e) {
                        console.error("Error al cargar materias asociadas:", e);
                        // Filtrar manualmente de la lista si falla
                        const associated = subjectsList.filter((s: Subject) => existingIds.includes(s.id));
                        setCourseSubjects(associated);
                    }
                } else {
                    setCourseSubjects([]);
                }
                
                // Si hay curso, obtener su título
                if (course && course.titulo) {
                    setCurrentCourseTitle(course.titulo);
                } else if (courseTitle) {
                    setCurrentCourseTitle(courseTitle);
                }
            } catch (e) {
                console.error(e);
                toast.error("No se pudieron cargar las materias");
            } finally {
                setLoadingSubjects(false);
            }
        };
        load();
    }, [courseId, courseTitle]);
    
    // Obtener título del formulario si está disponible (usando useWatch para reactividad)
    const formTitle = control ? useWatch({ control, name: "titulo" }) : null;
    
    useEffect(() => {
        if (formTitle && formTitle !== currentCourseTitle) {
            setCurrentCourseTitle(formTitle);
        }
    }, [formTitle]);

    const subjectsAlreadyInCourse = useMemo(() => {
        return new Set<string>(courseSubjectIds);
    }, [courseSubjectIds]);

    const selectableSubjects = useMemo(() => {
        return allSubjects.filter((s) => !subjectsAlreadyInCourse.has(s.id));
    }, [allSubjects, subjectsAlreadyInCourse]);

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreateSubject = async (subjectData: { nombre: string, id_cursos: string[], modulos: string[] }): Promise<Subject> => {
        try {
            // Asegurar que el curso actual está incluido en id_cursos
            const courseIds = courseId 
                ? Array.from(new Set([...subjectData.id_cursos, courseId]))
                : subjectData.id_cursos;

            const payload = {
                nombre: subjectData.nombre,
                id_cursos: courseIds,
                modulos: subjectData.modulos || [],
            };

            const response = await CoursesAPI.createMateria({
                nombre: payload.nombre,
                id_cursos: payload.id_cursos,
                modulos: payload.modulos,
            });
            
            console.log("Materia creada:", response.id);
            toast.success("Materia creada exitosamente");
            
            // Si hay un courseId, asociar automáticamente la materia al curso
            // Esto se hace incluso si ya está en id_cursos, porque el curso también necesita tener la materia en su lista de materias
            if (courseId) {
                try {
                    const course = await CoursesAPI.getById(String(courseId));
                    const existingIds: string[] = Array.isArray(course?.materias) ? course.materias.map(String) : [];
                    const subjectIdStr = String(response.id);
                    
                    console.log("Asociando materia al curso:", { courseId, subjectIdStr, existingIds });
                    
                    if (!existingIds.includes(subjectIdStr)) {
                        const updatedIds = [...existingIds, subjectIdStr];
                        await CoursesAPI.update(String(courseId), { ...course, materias: updatedIds });
                        console.log("Curso actualizado con nueva materia:", updatedIds);
                        setCourseSubjectIds(updatedIds);
                        
                        // Recargar las materias disponibles
                        const subjectsList = await CoursesAPI.getMaterias();
                        setAllSubjects(Array.isArray(subjectsList) ? subjectsList : []);
                        
                        // Cargar y agregar la nueva materia a la lista de materias del curso
                        try {
                            const newSubject = await CoursesAPI.getMateriaById(subjectIdStr);
                            console.log("Materia cargada:", newSubject);
                            if (newSubject) {
                                setCourseSubjects(prev => {
                                    // Evitar duplicados
                                    if (prev.some(s => s.id === newSubject.id)) {
                                        console.log("Materia ya existe en la lista");
                                        return prev;
                                    }
                                    console.log("Agregando materia a la lista");
                                    return [...prev, newSubject];
                                });
                            }
                        } catch (e) {
                            console.error("Error al cargar la nueva materia:", e);
                            // Si no se puede cargar, usar la respuesta directamente
                            setCourseSubjects(prev => {
                                if (prev.some(s => s.id === response.id)) {
                                    return prev;
                                }
                                return [...prev, response as Subject];
                            });
                        }
                    } else {
                        console.log("La materia ya estaba asociada al curso");
                        // La materia ya está asociada, pero asegurémonos de que esté en la lista visual
                        const subjectsList = await CoursesAPI.getMaterias();
                        setAllSubjects(Array.isArray(subjectsList) ? subjectsList : []);
                        
                        // Verificar si la materia está en courseSubjects y agregarla si no está
                        setCourseSubjects(prev => {
                            if (prev.some(s => s.id === response.id)) {
                                return prev;
                            }
                            // Intentar cargar la materia de forma asíncrona
                            CoursesAPI.getMateriaById(subjectIdStr).then(newSubject => {
                                setCourseSubjects(prevSubjects => {
                                    if (prevSubjects.some(s => s.id === newSubject.id)) {
                                        return prevSubjects;
                                    }
                                    return [...prevSubjects, newSubject];
                                });
                            }).catch(e => {
                                console.error("Error al cargar la materia:", e);
                            });
                            return prev;
                        });
                    }
                } catch (e) {
                    console.error("Error al asociar materia al curso:", e);
                    toast.error("La materia se creó pero hubo un problema al asociarla al curso");
                }
            }
            
            return response;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            toast.error("Error al crear materia: " + errorMessage);
            throw err;
        }
    };

    const handleSubjectCreatedComplete = async (subjectId: string) => {
        // Refrescar la lista de materias después de crear una nueva
        // Este callback se ejecuta después de que handleCreateSubject haya terminado
        console.log("handleSubjectCreatedComplete llamado con subjectId:", subjectId);
        setLoadingSubjects(true);
        try {
            // Refrescar todas las materias
            const subjectsList = await CoursesAPI.getMaterias();
            setAllSubjects(Array.isArray(subjectsList) ? subjectsList : []);
            
            // Si hay courseId, recargar el curso y las materias asociadas para asegurar que todo esté sincronizado
            if (courseId) {
                try {
                    // Esperar un poco para asegurar que la actualización previa haya terminado
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Recargar el curso para obtener la lista actualizada de materias
                    const course = await CoursesAPI.getById(String(courseId));
                    const existingIds: string[] = Array.isArray(course?.materias) ? course.materias.map(String) : [];
                    const subjectIdStr = String(subjectId);
                    
                    console.log("handleSubjectCreatedComplete - curso recargado:", { existingIds, subjectIdStr });
                    
                    // Asegurar que la materia esté asociada al curso (por si acaso)
                    if (!existingIds.includes(subjectIdStr)) {
                        console.log("Materia no encontrada en curso, asociándola ahora");
                        const updatedIds = [...existingIds, subjectIdStr];
                        await CoursesAPI.update(String(courseId), { ...course, materias: updatedIds });
                        setCourseSubjectIds(updatedIds);
                        
                        // Cargar todas las materias asociadas incluyendo la nueva
                        try {
                            const associatedSubjects = await CoursesAPI.getMateriasByIds(updatedIds);
                            console.log("Materias asociadas cargadas:", associatedSubjects);
                            setCourseSubjects(Array.isArray(associatedSubjects) ? associatedSubjects : []);
                        } catch (e) {
                            console.error("Error al cargar materias asociadas:", e);
                        }
                    } else {
                        // Ya está asociada, actualizar el estado y recargar todas las materias
                        console.log("Materia ya asociada, recargando lista completa");
                        setCourseSubjectIds(existingIds);
                        
                        // Cargar todas las materias asociadas al curso
                        if (existingIds.length > 0) {
                            try {
                                const associatedSubjects = await CoursesAPI.getMateriasByIds(existingIds);
                                console.log("Todas las materias asociadas cargadas:", associatedSubjects);
                                setCourseSubjects(Array.isArray(associatedSubjects) ? associatedSubjects : []);
                            } catch (e) {
                                console.error("Error al cargar materias asociadas:", e);
                                // Fallback: intentar cargar solo la nueva materia
                                try {
                                    const newSubject = await CoursesAPI.getMateriaById(subjectIdStr);
                                    if (newSubject) {
                                        setCourseSubjects(prev => {
                                            if (prev.some(s => s.id === newSubject.id)) {
                                                return prev;
                                            }
                                            return [...prev, newSubject];
                                        });
                                    }
                                } catch (e2) {
                                    console.error("Error al cargar la nueva materia:", e2);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error al refrescar curso y materias:", e);
                    toast.error("Error al refrescar las materias del curso");
                }
            }
        } catch (e) {
            console.error("Error al refrescar materias:", e);
        } finally {
            setLoadingSubjects(false);
        }
    };
    
    const handleOnDeleteSubject = (subjectId: string) => {
        setConfirmDeleteId(subjectId);
        setIsDeleteModalOpen(true);
    };

    const handleCancelDeleteSubject = () => {
        setIsDeleteModalOpen(false);
        setConfirmDeleteId(null);
    };

    const handleConfirmDeleteSubject = async (id: string) => {
        if (!id || !courseId) return;
        setDeleteLoading(true);
        try {
            // Remover la materia del curso
            const course = await CoursesAPI.getById(String(courseId));
            const existingIds: string[] = Array.isArray(course?.materias) ? course.materias.map(String) : [];
            const updatedIds = existingIds.filter(pid => pid !== id);
            
            await CoursesAPI.update(String(courseId), { ...course, materias: updatedIds });
            setCourseSubjectIds(updatedIds);
            setCourseSubjects(prev => prev.filter(s => s.id !== id));
            toast.success("Materia eliminada del curso exitosamente");
            handleCancelDeleteSubject();
        } catch (e) {
            console.error(e);
            toast.error("Error al eliminar la materia del curso");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleUnassignSubject = async (id: string) => {
        if (!id || !courseId) return;
        setLoadingSubjects(true);
        try {
            // Remover la materia del curso (desasignar)
            const course = await CoursesAPI.getById(String(courseId));
            const existingIds: string[] = Array.isArray(course?.materias) ? course.materias.map(String) : [];
            const updatedIds = existingIds.filter(pid => pid !== id);
            
            await CoursesAPI.update(String(courseId), { ...course, materias: updatedIds });
            setCourseSubjectIds(updatedIds);
            setCourseSubjects(prev => prev.filter(s => s.id !== id));
            toast.success("Materia desasignada del curso exitosamente");
        } catch (e) {
            console.error(e);
            toast.error("Error al desasignar la materia del curso");
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleOnEditSubjectClick = (subject: Subject) => {
        setEditingSubject(subject);
        setIsEditModalOpen(true);
    };

    const handleCancelEditSubject = () => {
        setIsEditModalOpen(false);
        setEditingSubject(null);
    };

    const handleUpdateSubjectSubject = async (subjectData: { id: string; nombre: string; id_cursos: string[]; modulos: string[] }) => {
        try {
            await CoursesAPI.updateMateria(subjectData.id, {
                id: subjectData.id,
                nombre: subjectData.nombre,
                id_cursos: subjectData.id_cursos,
                modulos: subjectData.modulos,
            });

            // Recargar la materia actualizada desde el servidor
            try {
                const updatedSubject = await CoursesAPI.getMateriaById(subjectData.id);
                setCourseSubjects(prev => prev.map(s =>
                    s.id === subjectData.id ? updatedSubject : s
                ));
            } catch (e) {
                console.error("Error al cargar la materia actualizada:", e);
                // Fallback: actualizar manualmente
                setCourseSubjects(prev => prev.map(s =>
                    s.id === subjectData.id
                        ? { ...s, nombre: subjectData.nombre, id_cursos: subjectData.id_cursos, modulos: subjectData.modulos }
                        : s
                ));
            }
            
            toast.success("Materia actualizada exitosamente");
            handleCancelEditSubject();
        } catch (err) {
            console.error(err);
            toast.error("Error al actualizar la materia");
            throw err;
        }
    };


    const handleSelectSubject = (subjectId: string) => {
        const found = selectableSubjects.find((s) => s.id === subjectId);
        if (!found) return;
        if (selectedSubjects.some((s) => s.id === found.id)) return;
        setSelectedSubjects((prev) => [...prev, found]);
    };

    const handleRemoveSelected = (subjectId: string) => {
        setSelectedSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    };

    const handleConfirmAssociation = async () => {
        if (!courseId) {
            toast.error("Primero debes crear/guardar el curso");
            return;
        }
        if (selectedSubjects.length === 0) {
            toast.error("Selecciona al menos una materia");
            return;
        }
        setLoading(true);
        try {
            const course = await CoursesAPI.getById(String(courseId));
            const existingIds: string[] = Array.isArray(course?.materias) ? course.materias.map(String) : [];
            const toAdd = selectedSubjects.map((s) => s.id);
            const updatedIds = Array.from(new Set([...existingIds, ...toAdd]));
            await CoursesAPI.update(String(courseId), { ...course, materias: updatedIds });
            
            // Actualizar cada materia para incluir el curso en su campo id_cursos
            const courseIdStr = String(courseId);
            for (const subjectId of toAdd) {
                try {
                    const materia = await CoursesAPI.getMateriaById(subjectId);
                    const currentCursos = Array.isArray(materia.id_cursos) ? materia.id_cursos.map(String) : [];
                    
                    // Verificar si el curso ya está en id_cursos
                    if (!currentCursos.includes(courseIdStr)) {
                        const updatedCursos = [...currentCursos, courseIdStr];
                        await CoursesAPI.updateMateria(subjectId, {
                            ...materia,
                            id_cursos: updatedCursos,
                        });
                        console.log(`Materia ${subjectId} actualizada con el curso ${courseIdStr}`);
                    }
                } catch (materiaError) {
                    console.error(`Error al actualizar materia ${subjectId}:`, materiaError);
                    // Continuar con las demás materias aunque una falle
                }
            }
            
            setCourseSubjectIds(updatedIds);
                    
            // Cargar las materias asociadas y actualizar la lista
            setLoadingSubjects(true);
            try {
                const associatedSubjects = await CoursesAPI.getMateriasByIds(updatedIds);
                setCourseSubjects(Array.isArray(associatedSubjects) ? associatedSubjects : []);
            } catch (e) {
                console.error("Error al cargar materias asociadas:", e);
                // Si falla, agregar manualmente las seleccionadas
                setCourseSubjects(prev => {
                    const newSubjects = selectedSubjects.filter(s => !prev.some(p => p.id === s.id));
                    return [...prev, ...newSubjects];
                });
            } finally {
                setLoadingSubjects(false);
            }
                    
            toast.success("Materias asociadas al curso");
            setSelectedSubjects([]);
        } catch (e) {
            console.error(e);
            toast.error("Error al asociar materias");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="space-y-4">
            {/* Card unificado para agregar y crear materias */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        {/* Sección: Agregar materias existentes - Solo se muestra si hay materias disponibles */}
                        {selectableSubjects.length > 0 && (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                    <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Agregar Materias Existentes</h4>
                                            <p className="text-xs text-gray-500">Selecciona materias que ya están creadas en el sistema</p>
                        </div>
                    </div>

                                    <div className="pl-10 space-y-3">
                        <Select onValueChange={handleSelectSubject}>
                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Buscar y seleccionar materia..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectableSubjects.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    {selectedSubjects.length > 0 && (
                        <div className="space-y-2">
                                                <div className="text-xs font-medium text-gray-700">Materias seleccionadas ({selectedSubjects.length}):</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedSubjects.map((s) => (
                                                        <Badge key={s.id} variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200">
                                        {s.nombre}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSelected(s.id)}
                                                                className="rounded-full hover:bg-blue-200 p-0.5 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                                        <div className="flex justify-end pt-2">
                        <Button
                            type="button"
                            className="cursor-pointer"
                            onClick={handleConfirmAssociation}
                            disabled={loading || !courseId || selectedSubjects.length === 0}
                        >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Asociando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Asociar {selectedSubjects.length > 0 ? `${selectedSubjects.length} materia${selectedSubjects.length > 1 ? 's' : ''}` : 'materias'}
                                                    </>
                                                )}
                        </Button>
                    </div>
                                    </div>
                                </div>

                                {/* Divider - Solo se muestra si hay materias disponibles */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">O</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Sección: Crear nueva materia */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">Crear Nueva Materia</h4>
                                    <p className="text-xs text-gray-500">Crea una materia nueva que se asociará automáticamente a este curso</p>
                                </div>
                            </div>
                            
                            <div className="pl-10">
                                <Button 
                                    type="button" 
                                    className="cursor-pointer w-full sm:w-auto"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Crear Nueva Materia
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* Lista de materias asociadas al curso */}
            {loadingSubjects ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center space-y-3">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                <p className="text-sm text-gray-500 font-medium">Cargando materias...</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : courseSubjects.length > 0 ? (
                <Card>
                    <CardContent className="p-6">
                        <SubjectList
                            subjects={courseSubjects}
                            onDelete={handleOnDeleteSubject}
                            onEdit={handleOnEditSubjectClick}
                            onUnassign={handleUnassignSubject}
                            showUnassign={true}
                            showTitle={true}
                        />
                    </CardContent>
                </Card>
            ) : courseId ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">No hay materias asociadas a este curso</p>
                            <p className="text-sm text-gray-400 mt-1">Agrega materias existentes o crea una nueva</p>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            <SubjectModal
                isOpen={isCreateModalOpen || isEditModalOpen}
                onCancel={() => {
                    if (isCreateModalOpen) {
                        handleCancelCreate();
                    } else {
                        handleCancelEditSubject();
                    }
                }}
                onSubjectCreated={handleCreateSubject}
                courseId={courseId}
                courseTitle={currentCourseTitle}
                editingSubject={editingSubject}
                onSubjectUpdated={handleUpdateSubjectSubject}
                fromCourseCreation={true}
                onSubjectCreatedComplete={handleSubjectCreatedComplete}
                onGoToModules={async (subjectId: string, _moduleIds: string[]) => {
                    // Abrir modal de gestión de módulos sin salir del flujo
                    // Marcar que el modal de materia debe cerrarse cuando se cierre el modal de módulos
                    setShouldCloseSubjectModalOnModuleClose(true);
                    
                    try {
                        setLoadingModules(true);
                        const subject = await CoursesAPI.getMateriaById(subjectId);
                        setCurrentSubjectForModules(subject);
                        
                        // Cargar módulos de la materia
                        if (Array.isArray(subject.modulos) && subject.modulos.length > 0) {
                            const modules = await CoursesAPI.getModulesByIds(subject.modulos);
                            setSubjectModules(modules);
                        } else {
                            setSubjectModules([]);
                        }
                        
                        setIsModulesModalOpen(true);
                    } catch (error) {
                        console.error("Error al cargar materia para módulos:", error);
                        toast.error("Error al cargar los módulos de la materia");
                        setShouldCloseSubjectModalOnModuleClose(false);
                    } finally {
                        setLoadingModules(false);
                    }
                }}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onCancel={handleCancelDeleteSubject}
                onConfirm={handleConfirmDeleteSubject}
                deleteLoading={deleteLoading}
                itemName={courseSubjects.find(s => s.id === confirmDeleteId)?.nombre || "esta materia"}
                id={confirmDeleteId || ""}
            />

            {/* Modal de gestión de módulos */}
            <Dialog open={isModulesModalOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsModulesModalOpen(false);
                    setCurrentSubjectForModules(null);
                    setSubjectModules([]);
                    setEditingModule(null);
                    
                    // Si el modal de materia está abierto y debe cerrarse, cerrarlo también
                    if (shouldCloseSubjectModalOnModuleClose) {
                        if (isCreateModalOpen) {
                            handleCancelCreate();
                        } else if (isEditModalOpen) {
                            handleCancelEditSubject();
                        }
                        setShouldCloseSubjectModalOnModuleClose(false);
                    }
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogTitle className="sr-only">Gestionar Módulos</DialogTitle>
                    <DialogDescription className="sr-only">
                        Gestión de módulos para la materia {currentSubjectForModules?.nombre}
                    </DialogDescription>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Módulos de {currentSubjectForModules?.nombre}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gestiona los módulos de esta materia
                                </p>
                            </div>
                            <Button
                                type="button"
                                className="cursor-pointer"
                                onClick={() => {
                                    setEditingModule(null);
                                    setIsCreateModuleModalOpen(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear Módulo
                            </Button>
                        </div>

                        {loadingModules ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex flex-col items-center space-y-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    <p className="text-sm text-gray-500 font-medium">Cargando módulos...</p>
                                </div>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-6">
                                    {subjectModules.length > 0 ? (
                                        <ModulesList
                                            modules={subjectModules}
                                            onDelete={(moduleId: string) => {
                                                setConfirmDeleteModuleId(moduleId);
                                                setIsDeleteModuleModalOpen(true);
                                            }}
                                            onEdit={(module: Module) => {
                                                setEditingModule(module);
                                                setIsCreateModuleModalOpen(true);
                                            }}
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500 font-medium">No hay módulos en esta materia</p>
                                            <p className="text-sm text-gray-400 mt-1">Crea tu primer módulo para comenzar</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsModulesModalOpen(false);
                                    setCurrentSubjectForModules(null);
                                    setSubjectModules([]);
                                    setEditingModule(null);
                                    
                                    // Si el modal de materia está abierto y debe cerrarse, cerrarlo también
                                    if (shouldCloseSubjectModalOnModuleClose) {
                                        if (isCreateModalOpen) {
                                            handleCancelCreate();
                                        } else if (isEditModalOpen) {
                                            handleCancelEditSubject();
                                        }
                                        setShouldCloseSubjectModalOnModuleClose(false);
                                    }
                                }}
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal para crear/editar módulo */}
            {currentSubjectForModules && (
                <ModulesModal
                    isOpen={isCreateModuleModalOpen}
                    onCancel={() => {
                        setIsCreateModuleModalOpen(false);
                        setEditingModule(null);
                    }}
                    onModuleCreated={async (moduleData: Module) => {
                        try {
                            if (!currentSubjectForModules?.id) {
                                toast.error("No hay materia seleccionada");
                                return { id: "" };
                            }

                            // Preparar payload para crear módulo (sin 'id')
                            // El backend espera tipo_contenido en minúsculas: "pdf", "video", etc.
                            // Siempre usar "pdf" (minúsculas) ya que es el único tipo permitido ahora
                            const tipoContenidoNormalized = "pdf";
                            
                            const modulePayload = {
                                titulo: moduleData.titulo.trim(),
                                descripcion: (moduleData.descripcion || "").trim(),
                                id_materia: currentSubjectForModules.id,
                                tipo_contenido: tipoContenidoNormalized as any, // Siempre "pdf" en minúsculas
                                bibliografia: (moduleData.bibliografia || "").trim(),
                                url_miniatura: (moduleData.url_miniatura || "").trim(),
                                url_archivo: (moduleData.url_archivo || "").trim(),
                                url_video: Array.isArray(moduleData.url_video) ? moduleData.url_video : [],
                            } as Omit<Module, "id">;
                            
                            console.log("Payload preparado en SubjectCreation:", modulePayload);

                            const createdModule = await CoursesAPI.createModule(modulePayload);

                            // Actualizar la materia con el nuevo módulo
                            const updatedSubject: Subject = {
                                ...currentSubjectForModules,
                                modulos: [...(currentSubjectForModules.modulos || []), createdModule.id],
                            };
                            await CoursesAPI.updateMateria(currentSubjectForModules.id, updatedSubject);
                            
                            // Recargar la materia actualizada para obtener los módulos completos
                            const updatedSubjectData = await CoursesAPI.getMateriaById(currentSubjectForModules.id);
                            setCurrentSubjectForModules(updatedSubjectData);
                            
                            // Cargar todos los módulos actualizados
                            if (Array.isArray(updatedSubjectData.modulos) && updatedSubjectData.modulos.length > 0) {
                                const updatedModules = await CoursesAPI.getModulesByIds(updatedSubjectData.modulos);
                                setSubjectModules(updatedModules);
                            } else {
                                setSubjectModules([]);
                            }
                            
                            // Refrescar las materias del curso
                            if (courseId) {
                                const course = await CoursesAPI.getById(String(courseId));
                                const existingIds: string[] = Array.isArray(course?.materias) ? course.materias.map(String) : [];
                                if (existingIds.includes(currentSubjectForModules.id)) {
                                    setCourseSubjects((prev) =>
                                        prev.map((s) => (s.id === currentSubjectForModules.id ? updatedSubjectData : s))
                                    );
                                }
                            }

                            toast.success("Módulo creado exitosamente");
                            setIsCreateModuleModalOpen(false);
                            return { id: createdModule.id };
                        } catch (error) {
                            console.error("Error al crear módulo:", error);
                            toast.error("Error al crear el módulo");
                            throw error;
                        }
                    }}
                    courseId={currentSubjectForModules.id}
                    editingModule={editingModule}
                    onModuleUpdated={async (moduleData: Module) => {
                        try {
                            await CoursesAPI.updateModule(moduleData.id, moduleData);
                            
                            // Recargar los módulos para asegurar sincronización
                            if (currentSubjectForModules) {
                                const updatedSubjectData = await CoursesAPI.getMateriaById(currentSubjectForModules.id);
                                setCurrentSubjectForModules(updatedSubjectData);
                                
                                if (Array.isArray(updatedSubjectData.modulos) && updatedSubjectData.modulos.length > 0) {
                                    const updatedModules = await CoursesAPI.getModulesByIds(updatedSubjectData.modulos);
                                    setSubjectModules(updatedModules);
                                } else {
                                    setSubjectModules([]);
                                }
                                
                                // Refrescar las materias del curso
                                if (courseId) {
                                    setCourseSubjects((prev) =>
                                        prev.map((s) => (s.id === currentSubjectForModules.id ? updatedSubjectData : s))
                                    );
                                }
                            }

                            toast.success("Módulo actualizado exitosamente");
                            setIsCreateModuleModalOpen(false);
                            setEditingModule(null);
                        } catch (error) {
                            console.error("Error al actualizar módulo:", error);
                            toast.error("Error al actualizar el módulo");
                            throw error;
                        }
                    }}
                />
            )}

            {/* Modal de confirmación para eliminar módulo */}
            <ConfirmDeleteModal
                isOpen={isDeleteModuleModalOpen}
                onCancel={() => {
                    setIsDeleteModuleModalOpen(false);
                    setConfirmDeleteModuleId(null);
                }}
                onConfirm={async (moduleId: string) => {
                    if (!moduleId || !currentSubjectForModules) return;
                    
                    setDeleteModuleLoading(true);
                    try {
                        // Eliminar el módulo
                        await CoursesAPI.deleteModule(moduleId, currentSubjectForModules.id);
                        
                        // Actualizar la materia removiendo el módulo
                        const updatedModulos = (currentSubjectForModules.modulos || []).filter(
                            (id) => id !== moduleId
                        );
                        const updatedSubject: Subject = {
                            ...currentSubjectForModules,
                            modulos: updatedModulos,
                        };
                        await CoursesAPI.updateMateria(currentSubjectForModules.id, updatedSubject);
                        
                        // Recargar la materia actualizada
                        const updatedSubjectData = await CoursesAPI.getMateriaById(currentSubjectForModules.id);
                        setCurrentSubjectForModules(updatedSubjectData);
                        
                        // Cargar módulos actualizados
                        if (Array.isArray(updatedSubjectData.modulos) && updatedSubjectData.modulos.length > 0) {
                            const updatedModules = await CoursesAPI.getModulesByIds(updatedSubjectData.modulos);
                            setSubjectModules(updatedModules);
                        } else {
                            setSubjectModules([]);
                        }
                        
                        // Refrescar las materias del curso
                        if (courseId) {
                            setCourseSubjects((prev) =>
                                prev.map((s) => (s.id === currentSubjectForModules.id ? updatedSubjectData : s))
                            );
                        }

                        toast.success("Módulo eliminado exitosamente");
                        setIsDeleteModuleModalOpen(false);
                        setConfirmDeleteModuleId(null);
                    } catch (error) {
                        console.error("Error al eliminar módulo:", error);
                        toast.error("Error al eliminar el módulo");
                    } finally {
                        setDeleteModuleLoading(false);
                    }
                }}
                deleteLoading={deleteModuleLoading}
                itemName={subjectModules.find((m) => m.id === confirmDeleteModuleId)?.titulo || "este módulo"}
                id={confirmDeleteModuleId || ""}
            />
        </div>
    );
}