import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common/FormField';
import { Loader2, BookOpen, Save, Settings, Trash2 } from 'lucide-react';
import { safeSetItem } from '@/utils/storage';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/errorMessages';

import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CoursesAPI } from '@/service/courses';
import { type Course, type Subject } from '@/types/types';


interface SubjectModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onSubjectCreated: (subjectData: { nombre: string; id_cursos: string[], modulos: string[] }) => Promise<{ id: string }>;
    courseId?: string | null;
    courseTitle?: string | null; // Título del curso para mostrar cuando no está en la lista
    editingSubject?: Subject | null;
    onSubjectUpdated?: (subjectData: { id: string; nombre: string; id_cursos: string[], modulos: string[] }) => Promise<void>;
    onGoToModules?: (subjectId: string, moduleIds: string[]) => void;
    fromCourseCreation?: boolean; // Indica si se está creando desde el flujo de creación de curso
    onSubjectCreatedComplete?: (subjectId: string) => void; // Callback cuando se completa la creación (materia + módulos)
    onSubjectDeleted?: (subjectId: string) => Promise<void>; // Callback cuando se elimina una materia
}


const SubjectModal = ({
    isOpen,
    onCancel,
    courseId,
    courseTitle,
    onSubjectCreated,
    editingSubject,
    onSubjectUpdated,
    onGoToModules,
    fromCourseCreation = false,
    onSubjectCreatedComplete,
    onSubjectDeleted
}: SubjectModalProps) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentCourseTitle, setCurrentCourseTitle] = useState<string | null>(courseTitle || null);
    const [subjectForm, setSubjectForm] = useState({
        nombre: "",
        id_cursos: Array.isArray(courseId) ? courseId : courseId ? [courseId] : [] as string[],
        modulos: [] as string[],
    });
    const [showConfirmSaveDialog, setShowConfirmSaveDialog] = useState(false);
    const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [courseNamesCache, setCourseNamesCache] = useState<Record<string, string>>({});

    const loadCourseById = async (id: string) => {
        try {
            const course = await CoursesAPI.getById(id);
            if (course && course.titulo) {
                setCurrentCourseTitle(course.titulo);
                // Agregar al caché
                setCourseNamesCache(prev => ({ ...prev, [id]: course.titulo }));
            }
        } catch (error) {
            console.error('Error al cargar el curso:', error);
        }
    };

    const loadExistingCourses = async () => {
        const courses = await CoursesAPI.getAllList();
        setCourses(courses);
        
        // Agregar los cursos cargados al caché
        const newCache: Record<string, string> = {};
        courses.forEach((course: Course) => {
            if (course.titulo) {
                newCache[course.id] = course.titulo;
            }
        });
        setCourseNamesCache(prev => ({ ...prev, ...newCache }));
        return courses;
    };

    // Función para validar y limpiar referencias a cursos eliminados
    const validateAndCleanCourseReferences = async (subjectCourseIds: string[]): Promise<string[]> => {
        if (!subjectCourseIds || subjectCourseIds.length === 0) return [];
        
        // Cargar todos los cursos existentes
        const allCourses = await CoursesAPI.getAllList();
        const validCourseIds = allCourses.map((c: Course) => String(c.id));
        
        // Filtrar solo los IDs que existen
        const validIds = subjectCourseIds.filter(id => validCourseIds.includes(String(id)));
        
        // Si hay IDs inválidos, actualizar la materia en el backend
        if (validIds.length !== subjectCourseIds.length && editingSubject) {
            const invalidIds = subjectCourseIds.filter(id => !validCourseIds.includes(String(id)));
            console.warn(`⚠️ Se encontraron referencias a cursos eliminados en la materia ${editingSubject.id}:`, invalidIds);
            
            // Actualizar la materia para limpiar las referencias inválidas
            try {
                await CoursesAPI.updateMateria(editingSubject.id, {
                    ...editingSubject,
                    id_cursos: validIds,
                });
                toast.info(`Se limpiaron ${subjectCourseIds.length - validIds.length} referencia(s) a curso(s) eliminado(s)`);
            } catch (error) {
                console.error('Error al limpiar referencias inválidas:', error);
                // No mostrar error al usuario, solo continuar con los IDs válidos
            }
        }
        
        return validIds;
    };

    useEffect(() => {
        if (isOpen) {
            const initializeSubject = async () => {
                if (editingSubject) {
                    // Validar y limpiar referencias a cursos eliminados
                    const validCourseIds = await validateAndCleanCourseReferences(editingSubject.id_cursos || []);
                    
                    setSubjectForm({
                        nombre: editingSubject.nombre,
                        id_cursos: validCourseIds,
                        modulos: editingSubject.modulos || [],
                    });
                } else {
                    const initialCourses = fromCourseCreation && courseId 
                        ? (Array.isArray(courseId) ? courseId : courseId ? [courseId] : [])
                        : [];
                    setSubjectForm({
                        nombre: "",
                        id_cursos: initialCourses,
                        modulos: [],
                    });
                }

                // Si hay courseTitle, usarlo directamente
                if (courseTitle) {
                    setCurrentCourseTitle(courseTitle);
                } else if (courseId && !courseTitle) {
                    // Si no hay courseTitle pero hay courseId, intentar cargar el curso
                    loadCourseById(courseId);
                }

                // Cargar todos los cursos existentes
                // Esto carga todos los cursos y los agrega automáticamente al caché
                await loadExistingCourses();
            };
            
            initializeSubject();
        }
    }, [isOpen, courseId, courseTitle, editingSubject]);

    const getCourseName = (id: string) => {
        // Primero buscar en el caché
        if (courseNamesCache[id]) {
            return courseNamesCache[id];
        }
        
        // Si es el curso actual (el que se está creando) y tenemos el título, usarlo
        if (id === courseId && currentCourseTitle) {
            return currentCourseTitle;
        }
        
        // Buscar en la lista de cursos cargados (que debería tener todos los cursos)
        const course = courses.find(c => String(c.id) === String(id));
        if (course && course.titulo) {
            // Agregar al caché y retornar el título
            setCourseNamesCache(prev => {
                if (!prev[id]) {
                    return { ...prev, [id]: course.titulo };
                }
                return prev;
            });
            return course.titulo;
        }
        
        // Si no se encuentra en la lista de cursos cargados y ya se cargaron todos los cursos,
        // significa que el curso fue eliminado
        if (id && courses.length > 0) {
            // El curso no existe, retornar un mensaje indicando que fue eliminado
            return `[Curso eliminado]`;
        }
        
        // Retornar el ID como fallback mientras se carga
        return id;
    };

    const validateForm = () => {
        if (!subjectForm.nombre.trim()) {
            return "El título de la materia es obligatorio";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        const error = validateForm();
        if (error) {
            toast.error(error);
            setLoading(false);
            return;
        }

        try {
            // Si estamos en el flujo de creación de curso, usar el courseId
            // Si no, usar un array vacío (no se pueden asignar cursos desde la gestión de materias)
            const cursosAsignados = fromCourseCreation && courseId 
                ? (Array.isArray(courseId) ? courseId : [courseId])
                : (editingSubject?.id_cursos || []);
            
            const subjectDataToSend = {
                nombre: subjectForm.nombre,
                id_cursos: cursosAsignados,
                modulos: subjectForm.modulos,
            };

            if (editingSubject && onSubjectUpdated) {
                await onSubjectUpdated({
                    id: editingSubject.id,
                    ...subjectDataToSend
                });
                toast.success("Materia actualizada exitosamente");
                onCancel();
            } else {
                // Crear la materia en el backend - esto la guarda automáticamente
                const res = await onSubjectCreated(subjectDataToSend);

                // Si estamos en el flujo de creación de curso, NO navegar
                // La materia ya está creada y asociada al curso automáticamente
                if (fromCourseCreation) {
                    // Si hay callback, llamarlo para que el padre maneje la actualización
                    if (onSubjectCreatedComplete) {
                        onSubjectCreatedComplete(res.id);
                    }
                    // Cerrar el modal de materia
                    onCancel();
                    // Nota: Los módulos se pueden agregar después desde la edición de la materia
                } else {
                    // Flujo desde la página de materias: la materia ya está guardada en el backend
                    // La materia se guarda automáticamente al llamar a onSubjectCreated
                    // Mostrar mensaje de éxito y luego navegar a módulos
                    toast.success("Materia guardada exitosamente. Redirigiendo a módulos...");
                    
                    // Usar onGoToModules si está disponible (pasa el subjectId como query param)
                    if (onGoToModules) {
                        // La materia ya está guardada en el backend, navegar con el ID
                        onCancel();
                        // Pequeño delay para que se vea el toast antes de navegar
                        setTimeout(() => {
                            const resModulos = Array.isArray((res as { modulos?: any })?.modulos) ? (res as { modulos?: any }).modulos : [];
                            onGoToModules(res.id, resModulos);
                        }, 500);
                    } else {
                        // Fallback al flujo antiguo con localStorage (para compatibilidad)
                        // Si estamos en el flujo de creación de curso, usar el courseId
                        // Si no, usar un array vacío (no se pueden asignar cursos desde la gestión de materias)
                        const cursosAsignados = fromCourseCreation && courseId 
                            ? (Array.isArray(courseId) ? courseId : [courseId])
                            : [];
                        
                        const subjectData = {
                            id: res.id,
                            nombre: subjectForm.nombre,
                            id_cursos: cursosAsignados,
                            modulos: subjectForm.modulos,
                        };

                        if (!safeSetItem('pendingSubjectData', subjectData)) {
                            console.error('Error al guardar datos de materia pendiente: espacio de almacenamiento agotado');
                        }

                        onCancel();
                        navigate('/modules/create');
                    }
                }
            }
        } catch (error) {
            console.error('Error al procesar materia:', error);
            toast.error(extractErrorMessage(error) || 'Error al guardar la materia. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
            <DialogTrigger></DialogTrigger>
            <DialogContent
                className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">
                    {editingSubject ? 'Editar Materia' : 'Crear Nueva Materia'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    {editingSubject 
                        ? 'Formulario para editar los datos de la materia' 
                        : 'Formulario para crear una nueva materia'}
                </DialogDescription>
                <div
                    className="w-full min-w-0 overflow-x-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Encabezado compacto: título y curso al que pertenece */}
                    <div className="border-b border-gray-100 px-5 py-4 pr-12">
                        <h2 className="text-base font-semibold text-gray-900 break-words">
                            {editingSubject ? 'Editar materia' : 'Nueva materia'}
                        </h2>
                        {courseId && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                                {currentCourseTitle || getCourseName(courseId)}
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 px-5 py-5">
                            <FormField id="subject-name" label="Nombre de la materia">
                                <Input
                                    id="subject-name"
                                    value={subjectForm.nombre}
                                    onChange={(e) =>
                                        setSubjectForm((prev) => ({
                                            ...prev,
                                            nombre: e.target.value,
                                        }))
                                    }
                                    placeholder="Ej: Fundamentos del Liderazgo"
                                    required
                                />
                            </FormField>

                            {/* Módulos: fila simple con la cantidad y el acceso a gestionarlos */}
                            {(editingSubject || (fromCourseCreation && subjectForm.nombre.trim())) && (
                                <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-600">
                                        <BookOpen className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            Módulos
                                            <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 tabular-nums">
                                                {subjectForm.modulos.length}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {editingSubject
                                                ? 'Agregá, editá o eliminá los módulos de esta materia.'
                                                : 'Se guarda la materia y después cargás sus módulos.'}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-9 shrink-0 cursor-pointer"
                                        onClick={() => {
                                            const error = validateForm();
                                            if (error) {
                                                toast.error(error);
                                                return;
                                            }
                                            setShowConfirmSaveDialog(true);
                                        }}
                                        disabled={loading}
                                    >
                                        <Settings className="w-4 h-4 mr-1.5" />
                                        {editingSubject ? 'Gestionar' : 'Guardar y gestionar'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Pie: eliminar discreto a la izquierda, acciones principales a la derecha */}
                        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 sm:flex-row sm:items-center">
                            {editingSubject && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowConfirmDeleteDialog(true)}
                                    disabled={loading || deleteLoading}
                                    className="h-9 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    {deleteLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-1.5" />
                                    )}
                                    {deleteLoading ? 'Eliminando…' : 'Eliminar materia'}
                                </Button>
                            )}
                            <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onCancel}
                                    disabled={loading || deleteLoading}
                                    className="h-9 text-gray-600"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="h-9 cursor-pointer"
                                    size="sm"
                                    type="submit"
                                    disabled={loading || deleteLoading}
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-1.5" />
                                    )}
                                    {editingSubject
                                        ? 'Guardar cambios'
                                        : fromCourseCreation
                                            ? 'Crear materia'
                                            : 'Continuar con módulos'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
            
            {/* Dialog de confirmación para guardar y gestionar módulos */}
            <AlertDialog open={showConfirmSaveDialog} onOpenChange={setShowConfirmSaveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-blue-600" />
                            {editingSubject ? "Gestionar Módulos" : "Guardar y Gestionar Módulos"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left pt-2">
                            {editingSubject ? (
                                <>
                                    Se guardarán los cambios realizados en la materia <strong>"{subjectForm.nombre}"</strong> y se abrirá el gestor de módulos.
                                    <br /><br />
                                    ¿Deseas continuar?
                                </>
                            ) : (
                                <>
                                    Se guardará la materia <strong>"{subjectForm.nombre}"</strong> con los datos ingresados y se abrirá el gestor de módulos.
                                    <br /><br />
                                    ¿Deseas continuar?
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer bg-blue-600 hover:bg-blue-700"
                            onClick={async () => {
                                setShowConfirmSaveDialog(false);
                                
                                // Si estamos creando una nueva materia, guardarla primero
                                if (!editingSubject) {
                                    setLoading(true);
                                    try {
                                        // Si estamos en el flujo de creación de curso, usar el courseId
                                        // Si no, usar un array vacío (no se pueden asignar cursos desde la gestión de materias)
                                        const cursosAsignados = fromCourseCreation && courseId 
                                            ? (Array.isArray(courseId) ? courseId : [courseId])
                                            : [];
                                        
                                        const subjectDataToSend = {
                                            nombre: subjectForm.nombre,
                                            id_cursos: cursosAsignados,
                                            modulos: subjectForm.modulos,
                                        };
                                        
                                        // Guardar la materia en el backend
                                        const res = await onSubjectCreated(subjectDataToSend);
                                        
                                        // Si estamos en el flujo de creación de curso
                                        if (fromCourseCreation) {
                                            // Llamar al callback para actualizar el estado
                                            if (onSubjectCreatedComplete) {
                                                await onSubjectCreatedComplete(res.id);
                                            }
                                            // No cerrar el modal todavía, se cerrará cuando se cierre el modal de módulos
                                            // Ahora abrir el modal de módulos con el ID de la materia recién creada
                                            if (onGoToModules) {
                                                onGoToModules(res.id, []);
                                            }
                                        } else {
                                            // Flujo desde la página de materias: la materia ya está guardada
                                            // La materia se guarda automáticamente al llamar a onSubjectCreated
                                            toast.success("Materia guardada exitosamente. Redirigiendo a módulos...");
                                            onCancel();
                                            if (onGoToModules) {
                                                // Pequeño delay para que se vea el toast antes de navegar
                                                setTimeout(() => {
                                                    const resModulos = Array.isArray((res as { modulos?: any })?.modulos) ? (res as { modulos?: any }).modulos : [];
                                                    onGoToModules(res.id, resModulos);
                                                }, 500);
                                            }
                                        }
                                    } catch (error) {
                                        console.error('Error al guardar materia:', error);
                                        toast.error(extractErrorMessage(error) || 'Error al guardar la materia. Por favor, inténtalo de nuevo.');
                                    } finally {
                                        setLoading(false);
                                    }
                                } else if (editingSubject) {
                                    // Si estamos editando, guardar cambios primero
                                    setLoading(true);
                                    try {
                                        // Si estamos en el flujo de creación de curso, usar el courseId
                                        // Si no, mantener los cursos existentes de la materia
                                        const cursosAsignados = fromCourseCreation && courseId 
                                            ? (Array.isArray(courseId) ? courseId : [courseId])
                                            : (editingSubject?.id_cursos || []);
                                        
                                        const subjectDataToSend = {
                                            nombre: subjectForm.nombre,
                                            id_cursos: cursosAsignados,
                                            modulos: subjectForm.modulos,
                                        };
                                        
                                        if (onSubjectUpdated) {
                                            await onSubjectUpdated({
                                                id: editingSubject.id,
                                                ...subjectDataToSend
                                            });
                                        }
                                        
                                        // Abrir el modal de módulos
                                        if (onGoToModules) {
                                            onGoToModules(editingSubject.id, editingSubject.modulos || []);
                                        }
                                    } catch (error) {
                                        console.error('Error al guardar materia:', error);
                                        toast.error(extractErrorMessage(error) || 'Error al guardar la materia. Por favor, inténtalo de nuevo.');
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Guardando...
                                </>
                            ) : (
                                editingSubject ? "Guardar y Continuar" : "Guardar y Continuar"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Dialog de confirmación para eliminar materia */}
            <AlertDialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Eliminar Materia
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left pt-2">
                            ¿Estás seguro de que deseas eliminar la materia <strong>"{editingSubject?.nombre}"</strong>?
                            <br /><br />
                            Esta acción eliminará permanentemente la materia y todos sus módulos asociados. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            className="cursor-pointer"
                            disabled={deleteLoading}
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="cursor-pointer bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                                if (!editingSubject?.id) return;
                                
                                setDeleteLoading(true);
                                try {
                                    await CoursesAPI.deleteMateria(editingSubject.id);
                                    toast.success("Materia eliminada exitosamente");
                                    
                                    // Cerrar el modal
                                    setShowConfirmDeleteDialog(false);
                                    onCancel();
                                    
                                    // Llamar al callback si existe
                                    if (onSubjectDeleted) {
                                        await onSubjectDeleted(editingSubject.id);
                                    }
                                } catch (error) {
                                    console.error('Error al eliminar materia:', error);
                                    toast.error('Error al eliminar la materia. Por favor, inténtalo de nuevo.');
                                } finally {
                                    setDeleteLoading(false);
                                }
                            }}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
};

export default SubjectModal;
