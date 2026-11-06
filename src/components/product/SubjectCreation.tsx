// components/product/edit/FeaturesForm.tsx

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import SubjectModal from "../subject/SubjectModal";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { type Subject, type Module } from "@/types/types";
import { CoursesAPI } from "@/service/courses";
import { toast } from "sonner";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { ProductFormData } from "@/schemas/product-schema";
import { SubjectList } from "../subject/SubjectList";
import ConfirmDeleteModal from "../product/ConfirmDeleteModal";
import { BookOpen, Link2, Loader2, Pencil, Plus, Unlink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fromCourseState } from "@/utils/fromCourse";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import ModulesModal from "../subject/ModulesModal";
import ModulesList from "../subject/ModulesList";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { Badge } from "../ui/badge";
import { X } from "lucide-react";
interface SubjectCreationProps {
    courseId?: string | null;
    control?: Control<ProductFormData>;
    courseTitle?: string | null; // Título del curso para pasar al modal
    /** Guarda los cambios pendientes del curso antes de salir a editar una materia */
    onBeforeOpenSubject?: () => Promise<void>;
    /** Permite a la pantalla del curso guardar las materias agregadas/quitadas al tocar "Guardar cambios" */
    handleRef?: React.Ref<SubjectCreationHandle>;
}

/** Agregar y quitar materias queda pendiente hasta que la pantalla del curso guarde */
export interface SubjectCreationHandle {
    hasPendingChanges: () => boolean;
    savePendingChanges: () => Promise<void>;
}


export default function SubjectCreation({ courseId, control, courseTitle, onBeforeOpenSubject, handleRef }: SubjectCreationProps) {
    const navigate = useNavigate();
    /** Materias elegidas para agregar o quitar que todavía no se guardaron en el curso */
    const [pendingAdds, setPendingAdds] = useState<Subject[]>([]);
    const [pendingRemovals, setPendingRemovals] = useState<Subject[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    /** Materia elegida para editar: se pide confirmación antes de salir del curso */
    const [subjectToOpen, setSubjectToOpen] = useState<Subject | null>(null);
    const [openingSubject, setOpeningSubject] = useState(false);
    /** Materia a quitar del curso: se confirma antes de marcarla */
    const [subjectToUnassign, setSubjectToUnassign] = useState<Subject | null>(null);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
    const [courseSubjectIds, setCourseSubjectIds] = useState<string[]>([]);
    const [courseSubjects, setCourseSubjects] = useState<Subject[]>([]); // Materias completas asociadas al curso
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
    const [subjectModulosHabilitadosEstado, setSubjectModulosHabilitadosEstado] = useState<Record<string, boolean>>({});
    const [loadingModules, setLoadingModules] = useState(false);
    const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [isDeleteModuleModalOpen, setIsDeleteModuleModalOpen] = useState(false);
    const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null);
    const [deleteModuleLoading, setDeleteModuleLoading] = useState(false);
    
    // Rastrear si el modal de módulos se abrió desde el modal de materia
    const [shouldCloseSubjectModalOnModuleClose, setShouldCloseSubjectModalOnModuleClose] = useState(false);
    /**
     * En mobile, al cerrar el modal de editar módulo el toque "atraviesa" al padre
     * y lo cierra en el mismo gesto. Este ref bloquea ese cierre en cascada.
     */
    const suppressModulesManagementCloseRef = useRef(false);
    const suppressCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const armSuppressModulesManagementClose = () => {
        suppressModulesManagementCloseRef.current = true;
        if (suppressCloseTimerRef.current) {
            clearTimeout(suppressCloseTimerRef.current);
        }
        suppressCloseTimerRef.current = setTimeout(() => {
            suppressModulesManagementCloseRef.current = false;
            suppressCloseTimerRef.current = null;
        }, 500);
    };

    const closeModuleEditor = () => {
        armSuppressModulesManagementClose();
        setIsCreateModuleModalOpen(false);
        setEditingModule(null);
    };

    const closeModulesManagement = () => {
        setIsCreateModuleModalOpen(false);
        setIsModulesModalOpen(false);
        setCurrentSubjectForModules(null);
        setSubjectModules([]);
        setSubjectModulosHabilitadosEstado({});
        setEditingModule(null);

        if (shouldCloseSubjectModalOnModuleClose) {
            if (isCreateModalOpen) {
                handleCancelCreate();
            } else if (isEditModalOpen) {
                handleCancelEditSubject();
            }
            setShouldCloseSubjectModalOnModuleClose(false);
        }
    };

    useEffect(() => {
        return () => {
            if (suppressCloseTimerRef.current) {
                clearTimeout(suppressCloseTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoadingSubjects(true);
            try {
                const [subjectsList, course] = await Promise.all([
                    CoursesAPI.getAllMateriasList(),
                    courseId ? CoursesAPI.getById(String(courseId)) : Promise.resolve(null),
                ]);
                setAllSubjects(subjectsList);
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

    const removedIds = useMemo(() => new Set(pendingRemovals.map((s) => s.id)), [pendingRemovals]);

    /** Materias como van a quedar al guardar: las guardadas menos las quitadas, más las agregadas */
    const displayedSubjects = useMemo(
        () => [...courseSubjects.filter((s) => !removedIds.has(s.id)), ...pendingAdds],
        [courseSubjects, removedIds, pendingAdds]
    );

    const selectableSubjects = useMemo(() => {
        const inCourse = new Set(displayedSubjects.map((s) => s.id));
        return allSubjects.filter(
            (s) => (!subjectsAlreadyInCourse.has(s.id) || removedIds.has(s.id)) && !inCourse.has(s.id)
        );
    }, [allSubjects, subjectsAlreadyInCourse, removedIds, displayedSubjects]);

    const hasPendingChanges = pendingAdds.length > 0 || pendingRemovals.length > 0;

    /** Aplica en el curso las materias agregadas y quitadas (se llama al guardar el curso) */
    const savePendingChanges = useCallback(async () => {
        if (!courseId || (pendingAdds.length === 0 && pendingRemovals.length === 0)) return;
        const course = await CoursesAPI.getById(String(courseId));
        const existingIds: string[] = Array.isArray(course?.materias) ? course.materias.map(String) : [];
        const removed = new Set(pendingRemovals.map((s) => s.id));
        const updatedIds = Array.from(
            new Set([...existingIds.filter((sid) => !removed.has(sid)), ...pendingAdds.map((s) => s.id)])
        );
        await CoursesAPI.update(String(courseId), { ...course, materias: updatedIds });
        setCourseSubjectIds(updatedIds);
        setCourseSubjects((prev) => [...prev.filter((s) => !removed.has(s.id)), ...pendingAdds]);
        setPendingAdds([]);
        setPendingRemovals([]);
    }, [courseId, pendingAdds, pendingRemovals]);

    useImperativeHandle(
        handleRef,
        () => ({ hasPendingChanges: () => hasPendingChanges, savePendingChanges }),
        [hasPendingChanges, savePendingChanges]
    );

    // Avisar antes de cerrar o recargar la página con materias sin guardar
    useEffect(() => {
        if (!hasPendingChanges) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [hasPendingChanges]);

    const discardPendingChanges = () => {
        setPendingAdds([]);
        setPendingRemovals([]);
        setSelectedSubjects([]);
    };

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
                        const subjectsList = await CoursesAPI.getAllMateriasList();
                        setAllSubjects(subjectsList);
                        
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
                        const subjectsList = await CoursesAPI.getAllMateriasList();
                        setAllSubjects(subjectsList);
                        
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
            // SubjectModal muestra el mensaje del backend (p. ej. nombre duplicado)
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
            const subjectsList = await CoursesAPI.getAllMateriasList();
            setAllSubjects(subjectsList);
            
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

    /** Editar una materia abre su página: antes se confirma y se guardan los cambios del curso */
    const handleOnEditSubjectClick = (subject: Subject) => {
        setSubjectToOpen(subject);
    };

    const confirmOpenSubject = async () => {
        if (!subjectToOpen || !courseId) return;
        setOpeningSubject(true);
        try {
            await savePendingChanges();
            await onBeforeOpenSubject?.();
            navigate(`/subjects/${encodeURIComponent(subjectToOpen.id)}`, {
                state: fromCourseState({
                    // Volver lleva directo al paso "Materias" del curso
                    to: `/products/${encodeURIComponent(courseId)}/edit?tab=materias`,
                    label: currentCourseTitle || "Curso",
                }),
            });
        } catch (error) {
            console.error("Error al guardar el curso antes de abrir la materia:", error);
            toast.error("No se pudieron guardar los cambios del curso");
            setOpeningSubject(false);
        }
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
            // SubjectModal muestra el mensaje del backend
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

    /** Suma las materias elegidas como cambio pendiente: se guardan con "Guardar cambios" */
    const handleConfirmAssociation = () => {
        if (selectedSubjects.length === 0) {
            toast.error("Selecciona al menos una materia");
            return;
        }
        const selectedIds = new Set(selectedSubjects.map((s) => s.id));
        // Si estaba marcada para quitar, alcanza con deshacer la quita
        setPendingRemovals((prev) => prev.filter((s) => !selectedIds.has(s.id)));
        setPendingAdds((prev) => [
            ...prev,
            ...selectedSubjects.filter(
                (s) => !subjectsAlreadyInCourse.has(s.id) && !prev.some((p) => p.id === s.id)
            ),
        ]);
        setSelectedSubjects([]);
    };

    /** Marca una materia para quitar del curso (o deshace un agregado todavía sin guardar) */
    const markSubjectForRemoval = (subject: Subject) => {
        if (pendingAdds.some((s) => s.id === subject.id)) {
            setPendingAdds((prev) => prev.filter((s) => s.id !== subject.id));
        } else {
            setPendingRemovals((prev) => (prev.some((s) => s.id === subject.id) ? prev : [...prev, subject]));
        }
    };


    return (
        <div className="space-y-4">
            {/* Encabezado: cantidad de materias y acción principal */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    Materias del curso
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 tabular-nums">
                        {displayedSubjects.length}
                    </span>
                </h3>
                <Button
                    type="button"
                    size="sm"
                    className="h-9 cursor-pointer"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Nueva materia
                </Button>
            </div>

            {/* Sumar materias que ya existen en el sistema */}
            {selectableSubjects.length > 0 && (
                <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <SearchableSelect
                            value=""
                            options={selectableSubjects.map((s) => ({ value: s.id, label: s.nombre }))}
                            onChange={handleSelectSubject}
                            placeholder="Agregar materia existente…"
                            searchPlaceholder="Buscar materia…"
                            emptyText="Ninguna materia coincide con la búsqueda"
                            className="sm:flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 cursor-pointer"
                            onClick={handleConfirmAssociation}
                            disabled={!courseId || selectedSubjects.length === 0}
                        >
                            <Link2 className="w-4 h-4 mr-1.5" />
                            {selectedSubjects.length > 0 ? `Agregar ${selectedSubjects.length}` : "Agregar"}
                        </Button>
                    </div>

                    {selectedSubjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedSubjects.map((s) => (
                                <Badge
                                    key={s.id}
                                    variant="secondary"
                                    className="flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700"
                                >
                                    {s.nombre}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSelected(s.id)}
                                        className="rounded-full p-0.5 transition-colors hover:bg-blue-200"
                                        aria-label={`Quitar ${s.nombre}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Cambios de materias pendientes: se aplican al tocar "Guardar cambios" */}
            {hasPendingChanges && (
                <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium text-amber-900">Cambios sin guardar</p>
                        {pendingAdds.length > 0 && (
                            <p className="text-xs text-amber-800">
                                Se agregará{pendingAdds.length > 1 ? "n" : ""}:{" "}
                                {pendingAdds.map((s) => s.nombre).join(", ")}
                            </p>
                        )}
                        {pendingRemovals.length > 0 && (
                            <p className="text-xs text-amber-800">
                                Se quitará{pendingRemovals.length > 1 ? "n" : ""}:{" "}
                                {pendingRemovals.map((s) => s.nombre).join(", ")}
                            </p>
                        )}
                        <p className="text-xs text-amber-700">Tocá “Guardar cambios” para aplicarlos al curso.</p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 text-amber-800 hover:bg-amber-100"
                        onClick={discardPendingChanges}
                    >
                        Descartar
                    </Button>
                </div>
            )}

            {/* Lista de materias del curso (como va a quedar al guardar) */}
            {loadingSubjects ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-10 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando materias…
                </div>
            ) : displayedSubjects.length > 0 ? (
                <SubjectList
                    subjects={displayedSubjects}
                    onDelete={handleOnDeleteSubject}
                    onEdit={handleOnEditSubjectClick}
                    onUnassign={async (id) => {
                        // Se pide confirmación antes de quitarla del curso
                        setSubjectToUnassign(displayedSubjects.find((s) => s.id === id) ?? null);
                    }}
                    showUnassign={true}
                    showTitle={false}
                    onSubjectStatusUpdated={(id, newEstado) => {
                        const newActivo = newEstado === "activo";
                        const normalizedId = String(id);
                        setCourseSubjects((prev) =>
                            prev.map((m) =>
                                String(m.id) === normalizedId
                                    ? { ...m, activo: newActivo, estado: newEstado }
                                    : m
                            )
                        );
                        setAllSubjects((prev) =>
                            prev.map((m) =>
                                String(m.id) === normalizedId
                                    ? { ...m, activo: newActivo, estado: newEstado }
                                    : m
                            )
                        );
                    }}
                />
            ) : courseId ? (
                <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-gray-200 px-6 py-8 text-center">
                    <BookOpen className="mb-1 w-6 h-6 text-gray-300" />
                    <p className="text-sm text-gray-500">Este curso todavía no tiene materias.</p>
                    <p className="text-xs text-gray-400">Creá una nueva o agregá una existente.</p>
                </div>
            ) : null}

            {/* Confirmación antes de quitar una materia del curso */}
            <AlertDialog
                open={subjectToUnassign !== null}
                onOpenChange={(open) => {
                    if (!open) setSubjectToUnassign(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Unlink className="w-5 h-5 text-red-600" />
                            Quitar materia del curso
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <span className="block">
                                Se quitará{" "}
                                <strong className="font-semibold text-gray-900">
                                    “{subjectToUnassign?.nombre}”
                                </strong>{" "}
                                de este curso al tocar “Guardar cambios”.
                            </span>
                            <span className="block">
                                La materia y sus módulos no se eliminan: podés volver a agregarla cuando quieras.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => {
                                if (subjectToUnassign) markSubjectForRemoval(subjectToUnassign);
                                setSubjectToUnassign(null);
                            }}
                        >
                            Quitar del curso
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirmación antes de salir a editar una materia */}
            <AlertDialog
                open={subjectToOpen !== null}
                onOpenChange={(open) => {
                    if (!open && !openingSubject) setSubjectToOpen(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-gray-700" />
                            Editar materia
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <span className="block">
                                Se guardarán los cambios del curso y se abrirá la materia{" "}
                                <strong className="font-semibold text-gray-900">
                                    “{subjectToOpen?.nombre}”
                                </strong>{" "}
                                con sus módulos.
                            </span>
                            <span className="block">¿Deseás continuar?</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={openingSubject}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={openingSubject}
                            onClick={(e) => {
                                e.preventDefault();
                                void confirmOpenSubject();
                            }}
                        >
                            {openingSubject && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                            {openingSubject ? "Guardando…" : "Guardar y abrir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SubjectModal
                isOpen={isCreateModalOpen || isEditModalOpen}
                onCancel={() => {
                    // No cerrar la materia si hay modales de módulos encima (dismiss anidado en mobile)
                    if (
                        isModulesModalOpen ||
                        isCreateModuleModalOpen ||
                        suppressModulesManagementCloseRef.current
                    ) {
                        return;
                    }
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
                        
                        // Cargar módulos y estado habilitado desde BD
                        if (Array.isArray(subject.modulos) && subject.modulos.length > 0) {
                            const [modules, estado] = await Promise.all([
                                CoursesAPI.getModulesByIds(subject.modulos),
                                CoursesAPI.getModulosHabilitadosEstado(subjectId),
                            ]);
                            setSubjectModules(modules);
                            setSubjectModulosHabilitadosEstado(estado);
                        } else {
                            setSubjectModules([]);
                            setSubjectModulosHabilitadosEstado({});
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
                onSubjectDeleted={async (subjectId: string) => {
                    // Actualizar el estado local removiendo la materia eliminada
                    setAllSubjects(prev => prev.filter(s => s.id !== subjectId));
                    setCourseSubjects(prev => prev.filter(s => s.id !== subjectId));
                    setCourseSubjectIds(prev => prev.filter(id => id !== subjectId));
                    setPendingAdds(prev => prev.filter(s => s.id !== subjectId));
                    setPendingRemovals(prev => prev.filter(s => s.id !== subjectId));
                    setEditingSubject(null);
                    
                    // Si hay courseId, actualizar el curso para remover la referencia a la materia
                    if (courseId) {
                        try {
                            const course = await CoursesAPI.getById(String(courseId));
                            const updatedMaterias = Array.isArray(course?.materias) 
                                ? course.materias.filter((id: string) => id !== subjectId)
                                : [];
                            await CoursesAPI.update(String(courseId), { ...course, materias: updatedMaterias });
                            setCourseSubjectIds(updatedMaterias);
                        } catch (error) {
                            console.error("Error al actualizar curso después de eliminar materia:", error);
                        }
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
                    // Evitar cierre en cascada al cerrar editar/crear módulo (sobre todo en mobile)
                    if (
                        isCreateModuleModalOpen ||
                        suppressModulesManagementCloseRef.current
                    ) {
                        return;
                    }
                    closeModulesManagement();
                }
            }}>
                <DialogContent
                    className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto"
                    // Solo cerrar con "Cerrar" / X: evita ghost-clicks del modal hijo en mobile
                    onInteractOutside={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onFocusOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => {
                        e.preventDefault();
                        if (isCreateModuleModalOpen) {
                            closeModuleEditor();
                            return;
                        }
                        closeModulesManagement();
                    }}
                >
                    <DialogTitle className="sr-only">Gestionar Módulos</DialogTitle>
                    <DialogDescription className="sr-only">
                        Gestión de módulos para la materia {currentSubjectForModules?.nombre}
                    </DialogDescription>
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
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
                                            materiaId={currentSubjectForModules?.id || ''}
                                            defaultEnabledByModule={subjectModulosHabilitadosEstado}
                                            onToggleSuccess={async () => {
                                                if (currentSubjectForModules?.id) {
                                                    const estado = await CoursesAPI.getModulosHabilitadosEstado(currentSubjectForModules.id);
                                                    setSubjectModulosHabilitadosEstado(estado);
                                                }
                                            }}
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
                                onClick={closeModulesManagement}
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
                    onCancel={closeModuleEditor}
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
                            
                            // Cargar todos los módulos actualizados y estado desde BD
                            if (Array.isArray(updatedSubjectData.modulos) && updatedSubjectData.modulos.length > 0) {
                                const [updatedModules, estado] = await Promise.all([
                                    CoursesAPI.getModulesByIds(updatedSubjectData.modulos),
                                    CoursesAPI.getModulosHabilitadosEstado(currentSubjectForModules.id),
                                ]);
                                setSubjectModules(updatedModules);
                                setSubjectModulosHabilitadosEstado(estado);
                            } else {
                                setSubjectModules([]);
                                setSubjectModulosHabilitadosEstado({});
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
                            closeModuleEditor();
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
                                    const [updatedModules, estado] = await Promise.all([
                                        CoursesAPI.getModulesByIds(updatedSubjectData.modulos),
                                        CoursesAPI.getModulosHabilitadosEstado(currentSubjectForModules.id),
                                    ]);
                                    setSubjectModules(updatedModules);
                                    setSubjectModulosHabilitadosEstado(estado);
                                } else {
                                    setSubjectModules([]);
                                    setSubjectModulosHabilitadosEstado({});
                                }
                                
                                // Refrescar las materias del curso
                                if (courseId) {
                                    setCourseSubjects((prev) =>
                                        prev.map((s) => (s.id === currentSubjectForModules.id ? updatedSubjectData : s))
                                    );
                                }
                            }

                            toast.success("Módulo actualizado exitosamente");
                            closeModuleEditor();
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
                        
                        // Cargar módulos actualizados y estado desde BD
                        if (Array.isArray(updatedSubjectData.modulos) && updatedSubjectData.modulos.length > 0) {
                            const [updatedModules, estado] = await Promise.all([
                                CoursesAPI.getModulesByIds(updatedSubjectData.modulos),
                                CoursesAPI.getModulosHabilitadosEstado(currentSubjectForModules.id),
                            ]);
                            setSubjectModules(updatedModules);
                            setSubjectModulosHabilitadosEstado(estado);
                        } else {
                            setSubjectModules([]);
                            setSubjectModulosHabilitadosEstado({});
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