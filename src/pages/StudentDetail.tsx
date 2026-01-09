// src/pages/StudentDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { Switch } from '@/components/ui/switch';
import {
    ArrowLeft,
    BookOpen,
    Mail,
    IdCard,
    User,
    CheckCircle,
    XCircle,
    Calendar,
    Trash,
    Loader2,
    ChevronDown,
    ChevronRight,
    Play,
    FileText,
    GraduationCap,
    Edit2,
} from 'lucide-react';
import type { Course, StudentDB, Subject, Module } from '@/types/types';
import { StudentsAPI } from '@/service/students';
import { CoursesAPI } from '@/service/courses';
import { toast } from 'sonner';
import { CoursesAsignStudentModal } from '@/components/students/CoursesAsignStudentModal';
import { CreateUserModal } from '@/components/students/CreateUserModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CourseWithDetails extends Omit<Course, 'materias'> {
    materias: SubjectWithDetails[];
}

interface SubjectWithDetails extends Omit<Subject, 'modulos'> {
    modulos: ModuleWithStatus[];
}

interface ModuleWithStatus extends Module {
    enabled: boolean;
    progress?: number; // Para uso futuro
}

export const StudentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<StudentDB | null>(null);
    const [courses, setCourses] = useState<CourseWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
    const [updatingModules, setUpdatingModules] = useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

    // Cargar datos del estudiante y módulos habilitados
    useEffect(() => {
        if (!id) {
            setError('ID de estudiante no proporcionado');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentData, modulesData] = await Promise.all([
                    StudentsAPI.getById(id),
                    StudentsAPI.getStudentModules(id).catch(() => ({ modulos_habilitados: {} })),
                ]);

                setStudent(studentData);
                const modulesHabilitados = modulesData.modulos_habilitados || {};

                // Cargar cursos si el estudiante tiene cursos asignados
                if (studentData.cursos_asignados && studentData.cursos_asignados.length > 0) {
                    await loadCoursesWithDetails(studentData.cursos_asignados, modulesHabilitados);
                }
            } catch (error: unknown) {
                console.error("❌ Error al cargar estudiante:", error);
                setError(error instanceof Error ? error.message : 'Error al cargar el estudiante');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const loadCoursesWithDetails = async (courseIds: string[], modulesHabilitados: Record<string, boolean>) => {
        setLoadingCourses(true);
        try {
            const coursesData: CourseWithDetails[] = [];

            for (const courseId of courseIds) {
                try {
                    const course = await CoursesAPI.getById(courseId);
                    if (!course) continue;

                    // Cargar materias del curso
                    const materias: SubjectWithDetails[] = [];
                    if (course.materias && course.materias.length > 0) {
                        const subjectsData = await CoursesAPI.getMateriasByIds(course.materias);
                        
                        for (const subject of subjectsData) {
                            // Cargar módulos de la materia
                            const modulos: ModuleWithStatus[] = [];
                            if (subject.modulos && subject.modulos.length > 0) {
                                const modulesData = await CoursesAPI.getModulesByIds(subject.modulos);
                                
                                for (const module of modulesData) {
                                    modulos.push({
                                        ...module,
                                        enabled: modulesHabilitados[module.id] !== false, // Por defecto habilitado si no está explícitamente deshabilitado
                                        progress: 0, // Para uso futuro
                                    });
                                }
                            }

                            materias.push({
                                ...subject,
                                modulos,
                            });
                        }
                    }

                    coursesData.push({
                        ...course,
                        materias,
                    });
                } catch (error) {
                    console.warn(`⚠️ Error al cargar curso ${courseId}:`, error);
                }
            }

            setCourses(coursesData);
        } catch (error) {
            console.error("⚠️ Error general al cargar cursos:", error);
            setCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    const toggleCourse = (courseId: string) => {
        const newExpanded = new Set(expandedCourses);
        if (newExpanded.has(courseId)) {
            newExpanded.delete(courseId);
        } else {
            newExpanded.add(courseId);
        }
        setExpandedCourses(newExpanded);
    };

    const toggleSubject = (subjectId: string) => {
        const newExpanded = new Set(expandedSubjects);
        if (newExpanded.has(subjectId)) {
            newExpanded.delete(subjectId);
        } else {
            newExpanded.add(subjectId);
        }
        setExpandedSubjects(newExpanded);
    };

    const handleModuleToggle = async (moduleId: string, currentEnabled: boolean) => {
        if (!id) return;

        setUpdatingModules(prev => new Set(prev).add(moduleId));

        try {
            const newEnabled = !currentEnabled;
            await StudentsAPI.updateStudentModule(id, moduleId, newEnabled);

            // El estado se actualiza directamente en courses, no necesitamos moduleStates separado

            // Actualizar en la lista de cursos
            setCourses(prev => prev.map(course => ({
                ...course,
                materias: course.materias.map(subject => ({
                    ...subject,
                    modulos: subject.modulos.map(module =>
                        module.id === moduleId
                            ? { ...module, enabled: newEnabled }
                            : module
                    ),
                })),
            })));

            toast.success(`Módulo ${newEnabled ? 'habilitado' : 'deshabilitado'} exitosamente`);
        } catch (error) {
            console.error('Error al actualizar módulo:', error);
            toast.error('Error al actualizar el módulo');
        } finally {
            setUpdatingModules(prev => {
                const newSet = new Set(prev);
                newSet.delete(moduleId);
                return newSet;
            });
        }
    };

    if (loading) return (
        <InteractiveLoader
            initialMessage="Cargando estudiante"
            delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
        />
    );
    if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
    if (!student) return <div className="p-6">No se encontró el estudiante</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} className='cursor-pointer'>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">{student.nombre} {student.apellido}</h1>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <CreateUserModal
                        onUserCreated={async () => {
                            // Recargar datos del estudiante después de editar
                            if (!id) return;
                            try {
                                const studentData = await StudentsAPI.getById(id);
                                setStudent(studentData);
                            } catch (error) {
                                console.error("Error al recargar datos del estudiante:", error);
                            }
                        }}
                        triggerText=""
                        isEditing={true}
                        editingUser={student}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm cursor-pointer"
                            title="Editar usuario"
                        >
                            <Edit2 className="w-4 h-4 mr-1.5" />
                            Editar
                        </Button>
                    </CreateUserModal>
                </div>
            </div>

            {/* Información del estudiante */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2 text-gray-600" />
                        Información del Estudiante
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                            
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900">{student.email || 'No especificado'}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <IdCard className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="text-sm text-gray-500">DNI</p>
                                    <p className="font-medium text-gray-900">{student.dni || 'No especificado'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Cuenta</h3>
                        
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <User className="w-5 h-5 text-purple-500" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Rol</p>
                                    <div className="mt-1">
                                        {student.role?.admin ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Estudiante
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                {student.activo ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Estado</p>
                                    <div className="mt-1">
                                        {student.activo ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {student.fechaRegistro && (
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Fecha de Registro</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(student.fechaRegistro._seconds * 1000).toLocaleDateString('es-AR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cursos y Módulos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            <GraduationCap className="w-5 h-5 mr-2 text-gray-600" />
                            Cursos y Módulos ({courses.length})
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setSelectedCourseIds([]);
                                setAssignDialogOpen(true);
                            }}
                            className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm cursor-pointer"
                            title="Asignar cursos"
                        >
                            <Calendar className="w-4 h-4 mr-1.5 text-white" />
                            Asignar Cursos
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingCourses ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Cargando cursos y módulos...</span>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No hay cursos asignados a este estudiante.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {courses.map((course) => (
                                <div key={course.id} className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleCourse(course.id)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {expandedCourses.has(course.id) ? (
                                                <ChevronDown className="w-6 h-6 text-gray-500 flex-shrink-0" />
                                            ) : (
                                                <ChevronRight className="w-6 h-6 text-gray-500 flex-shrink-0" />
                                            )}
                                            <BookOpen className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                            <div className="text-left">
                                                <h3 className="font-semibold text-lg text-gray-900">{course.titulo}</h3>
                                                <p className="text-sm text-gray-600">{course.descripcion}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {course.materias.length} materia{course.materias.length !== 1 ? 's' : ''}
                                        </span>
                                    </button>

                                    {expandedCourses.has(course.id) && (
                                        <div className="p-4 bg-white border-t">
                                            {course.materias.length === 0 ? (
                                                <p className="text-gray-500 text-sm">No hay materias en este curso.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {course.materias.map((subject) => (
                                                        <div key={subject.id} className="border rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => toggleSubject(subject.id)}
                                                                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    {expandedSubjects.has(subject.id) ? (
                                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                                    ) : (
                                                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                                                    )}
                                                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                                                    <span className="font-medium text-gray-900">{subject.nombre}</span>
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {subject.modulos.length} módulo{subject.modulos.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </button>

                                                            {expandedSubjects.has(subject.id) && (
                                                                <div className="p-3 bg-white border-t">
                                                                    {subject.modulos.length === 0 ? (
                                                                        <p className="text-gray-500 text-sm">No hay módulos en esta materia.</p>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {subject.modulos.map((module) => (
                                                                                <div
                                                                                    key={module.id}
                                                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                                                >
                                                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                                        {module.tipo_contenido === 'video' ? (
                                                                                            <Play className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                                                        ) : (
                                                                                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                                        )}
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                                                                {module.titulo}
                                                                                            </p>
                                                                                            <p className="text-xs text-gray-500 truncate">
                                                                                                {module.descripcion}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center space-x-3 ml-4">
                                                                                        {updatingModules.has(module.id) ? (
                                                                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                                                        ) : (
                                                                                            <Switch
                                                                                                checked={module.enabled}
                                                                                                onCheckedChange={() => handleModuleToggle(module.id, module.enabled)}
                                                                                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                                                                                            />
                                                                                        )}
                                                                                        <span className={`text-xs font-medium w-20 text-right ${
                                                                                            module.enabled ? 'text-green-700' : 'text-red-700'
                                                                                        }`}>
                                                                                            {module.enabled ? 'Habilitado' : 'Deshabilitado'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sección de eliminación del usuario */}
            <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex justify-center">
                    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="destructive"
                                size="lg"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <Trash className="w-4 h-4 mr-2" />
                                        Eliminar Usuario Permanentemente
                                    </>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar usuario permanentemente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción eliminará el usuario "{student?.nombre || ""} {student?.apellido || ""}" y todos sus datos asociados de forma permanente. 
                                    Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={async () => {
                                        if (!id) return;
                                        setIsDeleting(true);
                                        try {
                                            await StudentsAPI.delete(id);
                                            toast.success('Usuario eliminado exitosamente');
                                            setDeleteConfirmOpen(false);
                                            navigate('/students');
                                        } catch (err) {
                                            toast.error('Error al eliminar el usuario');
                                            console.error('Error al eliminar:', err);
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Eliminar Permanentemente
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Modal para asignar cursos */}
            <CoursesAsignStudentModal
                id={id || ""}
                assignDialogOpen={assignDialogOpen}
                setAssignDialogOpen={(open) => {
                    setAssignDialogOpen(open);
                    if (!open) {
                        setSelectedCourseIds([]);
                    }
                }}
                selectedCourseIds={selectedCourseIds}
                setSelectedCourseIds={setSelectedCourseIds}
                getErrorMessage={(e: unknown) => {
                    if (e instanceof Error) return e.message;
                    if (typeof e === "string") return e;
                    try {
                        return JSON.stringify(e);
                    } catch {
                        return "Ocurrió un error inesperado";
                    }
                }}
                setCourses={async () => {
                    // Recargar datos del estudiante después de asignar cursos
                    if (!id) return;
                    try {
                        const studentData = await StudentsAPI.getById(id);
                        setStudent(studentData);
                        if (studentData.cursos_asignados && studentData.cursos_asignados.length > 0) {
                            const modulesData = await StudentsAPI.getStudentModules(id).catch(() => ({ modulos_habilitados: {} }));
                            await loadCoursesWithDetails(studentData.cursos_asignados, modulesData.modulos_habilitados || {});
                        } else {
                            setCourses([]);
                        }
                    } catch (error) {
                        console.error("Error al recargar datos del estudiante:", error);
                    }
                }}
                showTrigger={false}
            />
        </div>
    );
};
