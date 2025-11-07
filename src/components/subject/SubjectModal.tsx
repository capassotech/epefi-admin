import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, BookOpen, Settings } from 'lucide-react';
import { safeSetItem } from '@/utils/storage';
import { toast } from 'sonner';

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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    onSubjectCreatedComplete
}: SubjectModalProps) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentCourseTitle, setCurrentCourseTitle] = useState<string | null>(courseTitle || null);
    const location = useLocation();
    const [subjectForm, setSubjectForm] = useState({
        nombre: "",
        id_cursos: Array.isArray(courseId) ? courseId : courseId ? [courseId] : [] as string[],
        modulos: [] as string[],
    });
    const [showConfirmSaveDialog, setShowConfirmSaveDialog] = useState(false);
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
        const courses = await CoursesAPI.getAll();
        setCourses(courses);
        
        // Agregar los cursos cargados al caché
        const newCache: Record<string, string> = {};
        courses.forEach((course: Course) => {
            if (course.titulo) {
                newCache[course.id] = course.titulo;
            }
        });
        setCourseNamesCache(prev => ({ ...prev, ...newCache }));
    };

    useEffect(() => {
        if (isOpen) {
            if (editingSubject) {
                setSubjectForm({
                    nombre: editingSubject.nombre,
                    id_cursos: editingSubject.id_cursos || [],
                    modulos: editingSubject.modulos || [],
                });
                setSelectedCourses(editingSubject.id_cursos || []);
            } else {
                const initialCourses = Array.isArray(courseId) ? courseId : courseId ? [courseId] : [];
                setSubjectForm({
                    nombre: "",
                    id_cursos: initialCourses,
                    modulos: [],
                });
                setSelectedCourses(initialCourses);
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
            loadExistingCourses();
        }
    }, [isOpen, courseId, courseTitle, editingSubject]);

    const handleCourseSelect = (courseId: string) => {
        if (!selectedCourses.includes(courseId)) {
            const newSelectedCourses = [...selectedCourses, courseId];
            setSelectedCourses(newSelectedCourses);
            setSubjectForm(prev => ({
                ...prev,
                id_cursos: newSelectedCourses
            }));
        }
    };

    const handleCourseRemove = (courseId: string) => {
        const newSelectedCourses = selectedCourses.filter(id => id !== courseId);
        setSelectedCourses(newSelectedCourses);
        setSubjectForm(prev => ({
            ...prev,
            id_cursos: newSelectedCourses
        }));
    };

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
        const course = courses.find(c => c.id === id);
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
        
        // Si no se encuentra en la lista de cursos cargados, intentar cargarlo individualmente
        // Solo si no está ya en proceso de carga
        if (id && !courseNamesCache[id] && courses.length > 0) {
            // Si ya se cargaron todos los cursos y no está en la lista, 
            // probablemente el curso no existe o fue eliminado
            // Pero intentemos cargarlo de todas formas
            loadCourseById(id).catch(() => {
                // Si falla, no hacer nada, simplemente mostrar el ID
            });
        }
        
        // Retornar el ID como fallback mientras se carga o si no se encuentra
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
            const subjectDataToSend = {
                nombre: subjectForm.nombre,
                id_cursos: selectedCourses,
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
                        const subjectData = {
                            id: res.id,
                            nombre: subjectForm.nombre,
                            id_cursos: selectedCourses,
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
            toast.error('Error al guardar la materia. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
            <DialogTrigger></DialogTrigger>
            <DialogContent>
                <DialogTitle className="sr-only">
                    {editingSubject ? 'Editar Materia' : 'Crear Nueva Materia'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    {editingSubject 
                        ? 'Formulario para editar los datos de la materia' 
                        : 'Formulario para crear una nueva materia'}
                </DialogDescription>
                <div
                    className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingSubject ? 'Editar Materia' : 'Crear Nueva Materia'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Materia *
                            </label>
                            <input
                                type="text"
                                value={subjectForm.nombre}
                                onChange={(e) =>
                                    setSubjectForm((prev) => ({
                                        ...prev,
                                        nombre: e.target.value,
                                    }))
                                }
                                placeholder="Ej: Fundamentos del Liderazgo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {!location.pathname.includes('products') ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Curso/s asociado/s
                                    </label>
                                    <Select onValueChange={handleCourseSelect}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar cursos..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses
                                                .filter(course => !selectedCourses.includes(course.id))
                                                .map((course) => (
                                                    <SelectItem key={course.id} value={course.id}>
                                                        {course.titulo}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Mostrar cursos seleccionados */}
                                    {selectedCourses.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600 mb-2">Cursos seleccionados:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCourses.map((courseId) => (
                                                    <Badge key={courseId} variant="secondary" className="flex items-center gap-1">
                                                        {getCourseName(courseId)}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCourseRemove(courseId)}
                                                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedCourses.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-blue-700">
                                                    Esta materia se asociará a {selectedCourses.length} curso{selectedCourses.length > 1 ? 's' : ''} seleccionado{selectedCourses.length > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                <h1 className="text-sm font-medium text-gray-700 mb-2">Esta materia se asociará al curso:</h1>
                                <Badge key={courseId} variant="default" className="flex items-center gap-1 w-fit mt-3">
                                    {currentCourseTitle || (courseId ? getCourseName(courseId) : 'Sin curso')}
                                </Badge>
                            </div>
                        )}

                        {/* Sección para gestionar módulos - Parte del contenido del modal */}
                        {(editingSubject || (fromCourseCreation && subjectForm.nombre.trim())) && (
                            <div className="pt-6 border-t border-gray-200">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                                                Gestión de Módulos
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                {editingSubject 
                                                    ? "Gestiona los módulos de esta materia. Puedes agregar, editar o eliminar módulos."
                                                    : "Guarda esta materia para comenzar a gestionar sus módulos. Podrás agregar, editar o eliminar módulos después de guardar."
                                                }
                                            </p>
                                            <Button
                                                type="button"
                                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => {
                                                    const error = validateForm();
                                                    if (error) {
                                                        alert(error);
                                                        return;
                                                    }
                                                    setShowConfirmSaveDialog(true);
                                                }}
                                                disabled={loading}
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                {editingSubject ? "Gestionar Módulos" : "Guardar y Gestionar Módulos"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className='cursor-pointer'
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : editingSubject ? (
                                    'Guardar Cambios'
                                ) : fromCourseCreation ? (
                                    'Crear Materia'
                                ) : (
                                    'Continuar con Módulos'
                                )}
                            </Button>
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
                                        const subjectDataToSend = {
                                            nombre: subjectForm.nombre,
                                            id_cursos: selectedCourses,
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
                                        toast.error('Error al guardar la materia. Por favor, inténtalo de nuevo.');
                                    } finally {
                                        setLoading(false);
                                    }
                                } else if (editingSubject) {
                                    // Si estamos editando, guardar cambios primero
                                    setLoading(true);
                                    try {
                                        const subjectDataToSend = {
                                            nombre: subjectForm.nombre,
                                            id_cursos: selectedCourses,
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
                                        alert('Error al guardar la materia. Por favor, inténtalo de nuevo.');
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
        </Dialog>
    );
};

export default SubjectModal;
