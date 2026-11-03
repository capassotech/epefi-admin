// src/pages/StudentDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/context/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    BookOpen,
    Mail,
    IdCard,
    CheckCircle2,
    CalendarDays,
    Trash2,
    Loader2,
    ChevronRight,
    Play,
    FileText,
    Edit2,
    Plus,
    ShieldCheck,
    GraduationCap,
} from 'lucide-react';
import type { Course, StudentDB, Subject, Module } from '@/types/types';
import { StudentsAPI } from '@/service/students';
import { CoursesAPI } from '@/service/courses';
import { getFechaRegistroSeconds } from '@/utils/studentDates';
import {
    DetailLayout,
    InfoList,
    InfoRow,
    ProfileCard,
    StatGrid,
    StatusPill,
} from '@/components/common/DetailLayout';
import { toast } from 'sonner';
import { CoursesAsignStudentModal } from '@/components/students/CoursesAsignStudentModal';
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
    progress?: number;
    completedContents?: {
        documents: boolean[];
        videos: boolean[];
    };
    progressPercentage?: number;
}

type ProgressSummary = { completed: number; total: number; percentage: number };

const splitList = (value?: string | null) =>
    value ? (value.includes('|||') ? value.split('|||') : [value]) : [];

/** Barra de progreso fina con porcentaje; no se muestra si no hay contenidos */
function ProgressInline({ summary, className = 'w-24' }: { summary: ProgressSummary; className?: string }) {
    if (summary.total === 0) return null;
    return (
        <div className="flex items-center gap-2">
            <div className={`h-1.5 overflow-hidden rounded-full bg-gray-100 ${className}`}>
                <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                        summary.percentage === 100 ? 'bg-green-500' : 'bg-green-400'
                    }`}
                    style={{ width: `${summary.percentage}%` }}
                />
            </div>
            <span className="w-9 text-right text-xs tabular-nums text-gray-500">{summary.percentage}%</span>
        </div>
    );
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
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [updatingModules, setUpdatingModules] = useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [progress, setProgress] = useState<Record<string, Record<string, boolean>>>({});

    // Función para verificar si un contenido está completado
    const isContentCompleted = (moduleId: string, contentIndex: number, contentType: 'video' | 'document'): boolean => {
        const contentKey = `${moduleId}_${contentType}_${contentIndex}`;
        const moduleProgress = progress[moduleId] || {};
        return moduleProgress[contentKey] === true;
    };

    // Calcular progreso de un módulo
    const calculateModuleProgress = (module: Module): ProgressSummary => {
        let completed = 0;
        let total = 0;

        // Contar videos
        if (module.url_video) {
            const videos = Array.isArray(module.url_video) ? module.url_video : [module.url_video];
            videos.forEach((_, index) => {
                total++;
                if (isContentCompleted(module.id, index, 'video')) {
                    completed++;
                }
            });
        }

        // Contar documentos
        if (module.url_archivo) {
            const documents = module.url_archivo.includes('|||')
                ? module.url_archivo.split('|||').filter(url => url.trim())
                : [module.url_archivo];
            documents.forEach((_, index) => {
                total++;
                if (isContentCompleted(module.id, index, 'document')) {
                    completed++;
                }
            });
        }

        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    };

    /** Suma el progreso de varios módulos (para materias, cursos y el total del alumno) */
    const sumProgress = (modules: Module[]): ProgressSummary => {
        let completed = 0;
        let total = 0;
        modules.forEach((module) => {
            const p = calculateModuleProgress(module);
            completed += p.completed;
            total += p.total;
        });
        return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

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
                const [studentData, modulesData, progressData] = await Promise.all([
                    StudentsAPI.getById(id),
                    StudentsAPI.getStudentModules(id).catch(() => ({ modulos_habilitados: {} })),
                    StudentsAPI.getStudentProgress(id).catch(() => ({ progreso: {} })),
                ]);

                setStudent(studentData);
                const modulesHabilitados = modulesData.modulos_habilitados || {};
                const progressInfo = progressData.progreso || {};
                setProgress(progressInfo);

                // Cargar cursos si el estudiante tiene cursos asignados
                if (studentData.cursos_asignados && studentData.cursos_asignados.length > 0) {
                    await loadCoursesWithDetails(studentData.cursos_asignados, modulesHabilitados, progressInfo);
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

    const loadCoursesWithDetails = async (courseIds: string[], modulesHabilitados: Record<string, boolean>, progressInfo: Record<string, Record<string, boolean>>) => {
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
                                    // Calcular progreso usando progressInfo directamente
                                    let moduleCompleted = 0;
                                    let moduleTotal = 0;

                                    // Contar videos
                                    if (module.url_video) {
                                        const videos = Array.isArray(module.url_video) ? module.url_video : [module.url_video];
                                        videos.forEach((_: string, index: number) => {
                                            moduleTotal++;
                                            const contentKey = `${module.id}_video_${index}`;
                                            if (progressInfo[module.id]?.[contentKey] === true) {
                                                moduleCompleted++;
                                            }
                                        });
                                    }

                                    // Contar documentos
                                    if (module.url_archivo) {
                                        const documents = module.url_archivo.includes('|||')
                                            ? module.url_archivo.split('|||').filter((url: string) => url.trim())
                                            : [module.url_archivo];
                                        documents.forEach((_: string, index: number) => {
                                            moduleTotal++;
                                            const contentKey = `${module.id}_document_${index}`;
                                            if (progressInfo[module.id]?.[contentKey] === true) {
                                                moduleCompleted++;
                                            }
                                        });
                                    }

                                    const moduleProgressPercentage = moduleTotal > 0
                                        ? Math.round((moduleCompleted / moduleTotal) * 100)
                                        : 0;

                                    modulos.push({
                                        ...module,
                                        enabled: modulesHabilitados[module.id] === true,
                                        progress: moduleProgressPercentage,
                                        progressPercentage: moduleProgressPercentage,
                                        completedContents: {
                                            documents: module.url_archivo ? (
                                                module.url_archivo.includes('|||')
                                                    ? module.url_archivo.split('|||').filter((url: string) => url.trim()).map((_: string, index: number) => {
                                                        const contentKey = `${module.id}_document_${index}`;
                                                        return progressInfo[module.id]?.[contentKey] === true;
                                                    })
                                                    : [(() => {
                                                        const contentKey = `${module.id}_document_0`;
                                                        return progressInfo[module.id]?.[contentKey] === true;
                                                    })()]
                                            ) : [],
                                            videos: module.url_video ? (
                                                Array.isArray(module.url_video)
                                                    ? module.url_video.map((_: string, index: number) => {
                                                        const contentKey = `${module.id}_video_${index}`;
                                                        return progressInfo[module.id]?.[contentKey] === true;
                                                    })
                                                    : [(() => {
                                                        const contentKey = `${module.id}_video_0`;
                                                        return progressInfo[module.id]?.[contentKey] === true;
                                                    })()]
                                            ) : [],
                                        },
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
            // Con un solo curso no hace falta un clic extra para verlo
            if (coursesData.length === 1) {
                setExpandedCourses((prev) => (prev.size > 0 ? prev : new Set([coursesData[0].id])));
            }
        } catch (error) {
            console.error("⚠️ Error general al cargar cursos:", error);
            setCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    const toggleIn = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
        setter((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    const handleModuleToggle = async (moduleId: string, currentEnabled: boolean) => {
        if (!id) return;

        setUpdatingModules(prev => new Set(prev).add(moduleId));

        try {
            const newEnabled = !currentEnabled;
            await StudentsAPI.updateStudentModule(id, moduleId, newEnabled);

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

    const reloadStudentAndCourses = async () => {
        if (!id) return;
        try {
            const studentData = await StudentsAPI.getById(id);
            setStudent(studentData);
            if (studentData.cursos_asignados && studentData.cursos_asignados.length > 0) {
                const [modulesData, progressData] = await Promise.all([
                    StudentsAPI.getStudentModules(id).catch(() => ({ modulos_habilitados: {} })),
                    StudentsAPI.getStudentProgress(id).catch(() => ({ progreso: {} })),
                ]);
                setProgress(progressData.progreso || {});
                await loadCoursesWithDetails(studentData.cursos_asignados, modulesData.modulos_habilitados || {}, progressData.progreso || {});
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error("Error al recargar datos del estudiante:", error);
        }
    };

    const handleDelete = async () => {
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
    };

    usePageHeader({
        title: student ? `${student.nombre} ${student.apellido}` : undefined,
        breadcrumbs: [{ label: "Usuarios", to: "/students" }],
    });

    if (loading) return (
        <InteractiveLoader
            initialMessage="Cargando estudiante"
            delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
        />
    );
    if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
    if (!student) return <div className="p-6">No se encontró el estudiante</div>;

    const isAdmin = Boolean(student.role?.admin);
    const isActive = Boolean(student.activo);
    const registeredAt = getFechaRegistroSeconds(student);
    const allModules = courses.flatMap((c) => c.materias.flatMap((s) => s.modulos));
    const overall = sumProgress(allModules);
    const enabledModules = allModules.filter((m) => m.enabled).length;
    const initials = `${student.nombre?.[0] ?? ''}${student.apellido?.[0] ?? ''}`.toUpperCase();

    const profileActions = (
        <>
            <Button
                variant="outline"
                size="sm"
                className="h-8 cursor-pointer"
                onClick={() => navigate(`/students/${encodeURIComponent(student.id)}/edit`)}
            >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Editar datos
            </Button>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <button
                        type="button"
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Eliminar
                    </button>
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
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );

    const renderModule = (module: ModuleWithStatus) => {
        const moduleProgress = calculateModuleProgress(module);
        const documents = module.url_archivo ? module.url_archivo.split('|||').filter(url => url.trim()) : [];
        const videos = module.url_video ? (Array.isArray(module.url_video) ? module.url_video : [module.url_video]) : [];
        const docNames = splitList(module.nombres_archivos);
        const videoNames = splitList(module.nombres_videos);
        const hasContents = documents.length + videos.length > 0;
        const isOpen = expandedModules.has(module.id);

        return (
            <li key={module.id}>
                <div
                    className={`flex items-center gap-3 rounded-md py-1.5 pl-2 pr-1 transition-colors ${
                        hasContents ? 'cursor-pointer hover:bg-gray-50' : ''
                    }`}
                    onClick={hasContents ? () => toggleIn(setExpandedModules, module.id) : undefined}
                >
                    <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''} ${
                            hasContents ? '' : 'invisible'
                        }`}
                    />
                    <p
                        className={`min-w-0 flex-1 truncate text-sm ${
                            module.enabled ? 'text-gray-800' : 'text-gray-400 line-through decoration-red-500'
                        }`}
                    >
                        {module.titulo}
                    </p>
                    {hasContents && (
                        <span className="hidden sm:inline text-xs tabular-nums text-gray-400">
                            {moduleProgress.completed}/{moduleProgress.total}
                        </span>
                    )}
                    <ProgressInline summary={moduleProgress} className="w-16" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="grid place-items-center w-10 h-7"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {updatingModules.has(module.id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                ) : (
                                    <Switch
                                        checked={module.enabled}
                                        onCheckedChange={() => handleModuleToggle(module.id, module.enabled)}
                                        aria-label={module.enabled ? 'Deshabilitar módulo' : 'Habilitar módulo'}
                                        className="scale-90 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                                    />
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{module.enabled ? 'Habilitado para este alumno' : 'Deshabilitado para este alumno'}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {isOpen && hasContents && (
                    <ul className="mb-1.5 ml-8 space-y-1 border-l border-gray-100 pl-3 pt-0.5">
                        {documents.map((_, index) => {
                            const done = isContentCompleted(module.id, index, 'document');
                            return (
                                <li key={`doc-${index}`} className="flex items-center gap-2 text-xs">
                                    {done ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" />
                                    ) : (
                                        <FileText className="w-3.5 h-3.5 shrink-0 text-gray-300" />
                                    )}
                                    <span className={`truncate ${done ? 'text-gray-700' : 'text-gray-400'}`}>
                                        {docNames[index]?.trim() || `Documento ${index + 1}`}
                                    </span>
                                </li>
                            );
                        })}
                        {videos.map((_, index) => {
                            const done = isContentCompleted(module.id, index, 'video');
                            return (
                                <li key={`video-${index}`} className="flex items-center gap-2 text-xs">
                                    {done ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-600" />
                                    ) : (
                                        <Play className="w-3.5 h-3.5 shrink-0 text-gray-300" />
                                    )}
                                    <span className={`truncate ${done ? 'text-gray-700' : 'text-gray-400'}`}>
                                        {videoNames[index]?.trim() || `Video ${index + 1}`}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <TooltipProvider delayDuration={300}>
        <DetailLayout
            aside={
                <ProfileCard
                    media={
                        <span
                            className={`grid place-items-center w-11 h-11 shrink-0 rounded-full text-sm font-semibold ${
                                isAdmin ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {initials || '?'}
                        </span>
                    }
                    title={`${student.nombre} ${student.apellido}`}
                    subtitle={
                        <span className="flex items-center gap-1.5">
                            {isAdmin ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                            ) : (
                                <GraduationCap className="w-3.5 h-3.5" />
                            )}
                            {isAdmin
                                ? student.role?.student
                                    ? 'Administrador y estudiante'
                                    : 'Administrador'
                                : 'Estudiante'}
                        </span>
                    }
                    badge={<StatusPill active={isActive} />}
                    footer={profileActions}
                >
                    <InfoList>
                        <InfoRow icon={<Mail />} label="Email">
                            <span title={student.email}>{student.email || 'No especificado'}</span>
                        </InfoRow>
                        <InfoRow icon={<IdCard />} label="DNI">
                            {student.dni || <span className="text-gray-400">No especificado</span>}
                        </InfoRow>
                        <InfoRow icon={<CalendarDays />} label="Registro">
                            {registeredAt
                                ? new Date(registeredAt * 1000).toLocaleDateString('es-AR', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                  })
                                : <span className="text-gray-400">—</span>}
                        </InfoRow>
                    </InfoList>
                    {/* Resumen de avance */}
                    <StatGrid
                        stats={[
                            { label: 'Cursos', value: courses.length },
                            { label: 'Módulos', value: `${enabledModules}/${allModules.length}` },
                            { label: 'Avance', value: overall.total > 0 ? `${overall.percentage}%` : '—' },
                        ]}
                    />
                </ProfileCard>
            }
        >
            {/* ── Cursos, materias y módulos ── */}
            <section className="admin-card overflow-hidden min-w-0">
                <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-gray-900">Cursos asignados</h2>
                        <p className="text-xs text-gray-500">
                            Habilitá o deshabilitá módulos individualmente para este alumno
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0 cursor-pointer"
                        onClick={() => {
                            setSelectedCourseIds([]);
                            setAssignDialogOpen(true);
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Asignar cursos
                    </Button>
                </header>

                {loadingCourses ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando cursos y módulos…
                    </div>
                ) : courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <BookOpen className="w-6 h-6 text-gray-300" />
                        <p className="text-sm text-gray-500">No tiene cursos asignados.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {courses.map((course) => {
                            const courseOpen = expandedCourses.has(course.id);
                            const courseProgress = sumProgress(course.materias.flatMap((s) => s.modulos));
                            return (
                                <li key={course.id}>
                                    <button
                                        type="button"
                                        onClick={() => toggleIn(setExpandedCourses, course.id)}
                                        className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                                        aria-expanded={courseOpen}
                                    >
                                        <ChevronRight
                                            className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${courseOpen ? 'rotate-90' : ''}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-gray-900">{course.titulo}</p>
                                            <p className="text-xs text-gray-500">
                                                {course.materias.length} materia{course.materias.length !== 1 ? 's' : ''}
                                                {courseProgress.total > 0 &&
                                                    ` · ${courseProgress.completed} de ${courseProgress.total} contenidos`}
                                            </p>
                                        </div>
                                        <ProgressInline summary={courseProgress} className="w-28" />
                                    </button>

                                    {courseOpen && (
                                        <div className="pb-3 pl-10 pr-4">
                                            {course.materias.length === 0 ? (
                                                <p className="py-2 text-xs text-gray-400">Este curso no tiene materias.</p>
                                            ) : (
                                                <ul className="space-y-0.5">
                                                    {course.materias.map((subject) => {
                                                        const subjectOpen = expandedSubjects.has(subject.id);
                                                        const subjectProgress = sumProgress(subject.modulos);
                                                        return (
                                                            <li key={subject.id}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleIn(setExpandedSubjects, subject.id)}
                                                                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                                                                    aria-expanded={subjectOpen}
                                                                >
                                                                    <ChevronRight
                                                                        className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${subjectOpen ? 'rotate-90' : ''}`}
                                                                    />
                                                                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                                                                        {subject.nombre}
                                                                    </p>
                                                                    <span className="hidden sm:inline text-xs text-gray-400">
                                                                        {subject.modulos.length} módulo{subject.modulos.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                    <ProgressInline summary={subjectProgress} className="w-20" />
                                                                </button>

                                                                {subjectOpen && (
                                                                    <div className="ml-5 border-l border-gray-100 pl-2">
                                                                        {subject.modulos.length === 0 ? (
                                                                            <p className="py-2 pl-2 text-xs text-gray-400">Esta materia no tiene módulos.</p>
                                                                        ) : (
                                                                            <ul>{subject.modulos.map(renderModule)}</ul>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

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
                setCourses={reloadStudentAndCourses}
                showTrigger={false}
                onCoursesUpdated={reloadStudentAndCourses}
            />
        </DetailLayout>
        </TooltipProvider>
    );
};
