// src/pages/SubjectDetail.tsx
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/context/PageHeaderContext';
import { subjectDetailTourSteps } from '@/config/tourSteps';
import { Button } from '@/components/ui/button';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { BookOpen, GraduationCap, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { CoursesAPI } from '@/service/courses';
import type { Course, Module, Subject } from '@/types/types';
import {
    DetailLayout,
    InfoList,
    InfoRow,
    ProfileCard,
    SectionCard,
    SectionEmpty,
    StatGrid,
    StatusPill,
} from '@/components/common/DetailLayout';
import ModulesList from '@/components/subject/ModulesList';
import ConfirmDeleteModal from '@/components/product/ConfirmDeleteModal';
import { toast } from 'sonner';
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


export const SubjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [materia, setMateria] = useState<Subject | null>(null);
    const [modulos, setModulos] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingModulos, setLoadingModulos] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isDeletingMateria, setIsDeletingMateria] = useState(false);
    const [modulosHabilitadosEstado, setModulosHabilitadosEstado] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!id) {
            setError('ID de materia no proporcionado');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const data = await CoursesAPI.getMateriaById(id, { skipCache: true });
                setMateria(data);
                setError(null);

                if (data.modulos && data.modulos.length > 0) {
                    setLoadingModulos(true);
                    try {
                        const [materiasData, estado] = await Promise.all([
                            CoursesAPI.getModulesByIds(data.modulos),
                            CoursesAPI.getModulosHabilitadosEstado(id).catch(() => ({})),
                        ]);
                        setModulos(materiasData);
                        setModulosHabilitadosEstado(estado);
                    } catch (moduloError) {
                        console.error("⚠️ Error al cargar módulos o estado:", moduloError);
                        toast.error("No se pudieron cargar los módulos. Verificá tu conexión.");
                        setModulos([]);
                        setModulosHabilitadosEstado({});
                    } finally {
                        setLoadingModulos(false);
                    }
                } else {
                    setModulos([]);
                    setModulosHabilitadosEstado({});
                }
            } catch (error) {
                const err = error as { message?: string };
                console.error("❌ Error al cargar materia:", err);
                setError(err.message || 'Error al cargar la materia');
                setMateria(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Cursos para mostrar a cuáles pertenece la materia
    const [coursesById, setCoursesById] = useState<Record<string, Course>>({});
    useEffect(() => {
        CoursesAPI.getAllList()
            .then((list) => setCoursesById(Object.fromEntries(list.map((c) => [String(c.id), c]))))
            .catch((err) => console.error("Error al cargar cursos:", err));
    }, []);

    const handleDeleteClick = (id: string) => {
        setConfirmDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    // Crear/editar módulo se hace en su propia página y vuelve acá al guardar
    const handleEditClick = (module: Module) => {
        navigate(`/subjects/${encodeURIComponent(id || '')}/modules/${encodeURIComponent(module.id)}/edit`);
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setConfirmDeleteId(null);
    };

    const handleConfirmDelete = async (selectedId: string) => {
        if (!selectedId) return;
        setDeleteLoading(true);
    
        try {
          await CoursesAPI.deleteModule(selectedId, id || '');
          setModulos(prev => prev.filter(m => m.id !== selectedId));
          setMateria(prev =>
            prev
              ? { ...prev, modulos: (prev.modulos || []).filter(mid => mid !== selectedId) }
              : prev
          );
    
          toast.success('Módulo eliminado con éxito');
    
          setConfirmDeleteId(null);
        } catch (err) {
          toast.error('Error al eliminar el módulo');
          console.error('Error al eliminar:', err);
        } finally {
          setDeleteLoading(false);
          setIsDeleteModalOpen(false);
        }
      };

    usePageHeader({
        title: materia?.nombre,
        tourSteps: subjectDetailTourSteps,
        breadcrumbs: [{ label: "Materias", to: "/subjects" }],
    });

    if (loading) return (
        <InteractiveLoader
            initialMessage="Cargando materia"
            delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
        />
    );
    if (error && !materia) return <div className="p-6 text-red-500">❌ {error}</div>;
    if (!materia) return <div className="p-6">No se encontró la materia</div>;

    const moduleCount = materia.modulos?.length ?? 0;
    const isActive = materia.activo !== undefined ? materia.activo : materia.estado !== 'inactivo';
    // Ignora ids de cursos eliminados que hayan quedado en la materia
    const materiaCourses = (materia.id_cursos ?? [])
        .map((courseId) => coursesById[courseId])
        .filter((course): course is Course => !!course);
    const openCreateModule = () => navigate(`/subjects/${encodeURIComponent(materia.id)}/modules/new`);

    const aside = (
        <ProfileCard
            cover={
                materia.imagen && (
                    <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                        <img src={materia.imagen} alt={materia.nombre} className="h-full w-full object-cover" />
                    </div>
                )
            }
            title={materia.nombre}
            subtitle="Materia"
            badge={<StatusPill active={isActive} activeLabel="Habilitada" inactiveLabel="Deshabilitada" />}
            footer={
                <>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 cursor-pointer"
                    onClick={() => navigate(`/subjects/${encodeURIComponent(materia.id)}/edit`)}
                >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Editar materia
                </Button>
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogTrigger asChild>
                        <button
                            type="button"
                            disabled={isDeletingMateria}
                            className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isDeletingMateria ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Eliminar materia
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar materia permanentemente?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción eliminará la materia "{materia?.nombre || "esta materia"}" y todos sus datos asociados de forma permanente.
                                Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={async () => {
                                    if (!id) return;
                                    setIsDeletingMateria(true);
                                    try {
                                        await CoursesAPI.deleteMateria(id);
                                        toast.success('Materia eliminada exitosamente');
                                        setDeleteConfirmOpen(false);
                                        navigate('/subjects');
                                    } catch (err) {
                                        toast.error('Error al eliminar la materia');
                                        console.error('Error al eliminar:', err);
                                    } finally {
                                        setIsDeletingMateria(false);
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Eliminar Permanentemente
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </>
            }
        >
            <InfoList>
                <InfoRow icon={<GraduationCap />} label="Cursos">
                    {materiaCourses.length === 0 ? (
                        <span className="text-gray-400">Sin curso</span>
                    ) : (
                        <div className="flex flex-col gap-0.5 whitespace-normal">
                            {materiaCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    to={`/products/${encodeURIComponent(course.id)}`}
                                    className="truncate hover:text-blue-600 hover:underline"
                                >
                                    {course.titulo}
                                </Link>
                            ))}
                        </div>
                    )}
                </InfoRow>
            </InfoList>
            <StatGrid
                stats={[
                    { label: 'Módulos', value: moduleCount },
                    { label: 'Cursos', value: materiaCourses.length },
                ]}
            />
        </ProfileCard>
    );

    return (
        <DetailLayout aside={aside}>
            <SectionCard
                title="Módulos"
                description="El interruptor define si el módulo está habilitado por defecto para los alumnos"
                action={
                    <Button size="sm" variant="outline" className="h-8 shrink-0 cursor-pointer" onClick={openCreateModule}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Crear módulo
                    </Button>
                }
            >
                {loadingModulos ? (
                    <SectionEmpty icon={<Loader2 className="animate-spin" />}>Cargando módulos…</SectionEmpty>
                ) : modulos.length > 0 ? (
                    <div className="p-3">
                        <ModulesList
                            modules={modulos}
                            materiaId={id || ''}
                            onDelete={handleDeleteClick}
                            onEdit={handleEditClick}
                            defaultEnabledByModule={modulosHabilitadosEstado}
                            onToggleSuccess={async () => {
                                if (id) {
                                    try {
                                        const estado = await CoursesAPI.getModulosHabilitadosEstado(id);
                                        setModulosHabilitadosEstado(estado);
                                    } catch {
                                        // silencioso: el listado sigue usable
                                    }
                                }
                            }}
                        />
                    </div>
                ) : (
                    <SectionEmpty icon={<BookOpen />}>
                        <p className="font-medium text-gray-600">Esta materia aún no tiene módulos</p>
                        <p className="text-xs text-gray-400">Creá el primero para empezar a cargar contenido.</p>
                    </SectionEmpty>
                )}
            </SectionCard>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                deleteLoading={deleteLoading}
                itemName={modulos.find(m => m.id === confirmDeleteId)?.titulo || "este módulo"}
                id={confirmDeleteId || ""}
            />
        </DetailLayout>
    );
};

