import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle, Loader2, Plus } from "lucide-react";
import {
    DetailLayout,
    ProfileCard,
    SectionCard,
    SectionEmpty,
    StatGrid,
} from "@/components/common/DetailLayout";
import type { Module, Subject } from "@/types/types";
import { CoursesAPI } from "@/service/courses";
import { toast } from "sonner";
import ModulesList from "@/components/subject/ModulesList";
import ModulesModal from "@/components/subject/ModulesModal";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";
import { safeGetItem, safeRemoveItem } from "@/utils/storage";
import { usePageHeader } from "@/context/PageHeaderContext";

interface PendingSubjectData {
    id: string;
    nombre: string;
    id_cursos: string[];
    courseId?: string | null;
}

export default function CreateModule() {
    const navigate = useNavigate();
    const location = useLocation();
    const [modules, setModules] = useState<Module[]>([]);
    const [pendingSubject, setPendingSubject] = useState<PendingSubjectData | null>(null);
    const [subjectFromQuery, setSubjectFromQuery] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCreatingSubject, setIsCreatingSubject] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Module | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [modulosHabilitadosEstado, setModulosHabilitadosEstado] = useState<Record<string, boolean>>({});

    const currentSubject = subjectFromQuery ?? pendingSubject;
    usePageHeader({
        title: "Módulos",
        breadcrumbs: [
            { label: "Materias", to: "/subjects" },
            ...(currentSubject?.nombre && subjectFromQuery
                ? [{ label: currentSubject.nombre, to: `/subjects/${encodeURIComponent(subjectFromQuery.id)}` }]
                : []),
        ],
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const subjectId = params.get('subjectId');

        if (subjectId) {
            (async () => {
                try {
                    const subject = await CoursesAPI.getMateriaById(subjectId);
                    setSubjectFromQuery(subject);
                    if (Array.isArray(subject.modulos) && subject.modulos.length > 0) {
                        const [fetched, estado] = await Promise.all([
                            CoursesAPI.getModulesByIds(subject.modulos),
                            CoursesAPI.getModulosHabilitadosEstado(subjectId),
                        ]);
                        setModules(fetched);
                        setModulosHabilitadosEstado(estado);
                    } else {
                        setModules([]);
                        setModulosHabilitadosEstado({});
                    }
                } catch (e) {
                    console.error('Error al cargar materia/modulos:', e);
                    toast.error('No se pudieron cargar los datos de la materia');
                }
            })();
            return;
        }

        const savedSubjectData = safeGetItem<PendingSubjectData>('pendingSubjectData');
        if (savedSubjectData) {
            setPendingSubject(savedSubjectData);
        }
    }, [location.search]);

    const createModule = async (moduleData: Module): Promise<{ id: string }> => {
        setLoading(true);
        try {
            if (subjectFromQuery) {
                const created = await CoursesAPI.createModule(moduleData);
                const updatedSubject: Subject = {
                    ...subjectFromQuery,
                    modulos: [...(subjectFromQuery.modulos || []), created.id]
                };
                await CoursesAPI.updateMateria(subjectFromQuery.id, updatedSubject);
                setSubjectFromQuery(updatedSubject);
                setModules((prev) => [...prev, { ...moduleData, id: created.id } as Module]);
                try {
                    const estado = await CoursesAPI.getModulosHabilitadosEstado(subjectFromQuery.id);
                    setModulosHabilitadosEstado(estado);
                } catch {
                    // Si falla, el usuario puede recargar
                }
                toast.success('Módulo agregado correctamente');
                return { id: created.id };
            } else if (pendingSubject) {
                const tempId = `temp-${Date.now()}`;
                setModules((prev) => [...prev, { ...moduleData, id: tempId } as Module]);
                toast.success('Módulo agregado correctamente');
                return { id: tempId };
            } else {
                toast.error('No hay materia seleccionada');
                return { id: '' };
            }
        } catch (e) {
            console.error(e);
            toast.error('Error al crear módulo');
            throw e as Error;
        } finally {
            setLoading(false);
        }
    };

    const handleBackToSubjects = async () => {
        setLoading(true);
        try {
            if (pendingSubject && !subjectFromQuery) {
                await CoursesAPI.deleteMateria(pendingSubject.id);
                safeRemoveItem('pendingSubjectData');
            }
            navigate('/subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleFinishSubjectCreation = async () => {
        if (!pendingSubject) {
            toast.error('No hay datos de materia para crear');
            return;
        }

        if (modules.length === 0) {
            toast.error('Debe crear al menos un módulo antes de finalizar');
            return;
        }

        setIsCreatingSubject(true);

        try {
            const moduleIds: string[] = [];
            
            for (const moduleData of modules) {
                // Remover el campo 'id' al crear un nuevo módulo
                // El backend espera tipo_contenido en minúsculas: "pdf", "video", etc.
                // Siempre usar "pdf" (minúsculas) ya que es el único tipo permitido ahora
                const { id, ...moduleDataWithoutId } = moduleData;
                
                const modulePayload = {
                    ...moduleDataWithoutId,
                    id_materia: pendingSubject.id,
                    tipo_contenido: "pdf" as any, // Siempre "pdf" en minúsculas
                } as Omit<Module, "id">;
                
                console.log("Payload en CreateModule:", modulePayload);
                const createdModule = await CoursesAPI.createModule(modulePayload);
                moduleIds.push(createdModule.id);
            }

            const subjectData = {
                id: pendingSubject.id,
                nombre: pendingSubject.nombre,
                id_cursos: pendingSubject.id_cursos,
                modulos: moduleIds
            };

            await CoursesAPI.updateMateria(pendingSubject.id, subjectData);

            localStorage.removeItem('pendingSubjectData');

            toast.success('Materia y módulos creados correctamente');
            navigate('/subjects');

        } catch (error) {
            console.error('Error al crear materia:', error);
            toast.error('Error al crear la materia y módulos');
        } finally {
            setIsCreatingSubject(false);
        }
    };

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
        setEditingSubject(null);
    };

    const handleModuleCreated = async (moduleData: Module): Promise<{ id: string }> => {
        const res = await createModule(moduleData);
        setIsCreateModalOpen(false);
        return res;
    };

    const handleModuleUpdated = async (moduleData: Module) => {
        if (moduleData.id.startsWith('temp-')) {
            setModules((prev) => prev.map(m => m.id === moduleData.id ? ({ ...m, ...moduleData }) as Module : m));
        } else {
            await CoursesAPI.updateModule(moduleData.id, {
                id: moduleData.id,
                titulo: moduleData.titulo,
                descripcion: moduleData.descripcion,
                id_materia: moduleData.id_materia,
                tipo_contenido: moduleData.tipo_contenido,
                bibliografia: moduleData.bibliografia,
                url_miniatura: moduleData.url_miniatura,
                url_archivo: moduleData.url_archivo,
                url_video: moduleData.url_video,
                nombres_archivos: moduleData.nombres_archivos || "",
                nombres_videos: moduleData.nombres_videos || "",
            });
            setModules((prev) => prev.map(m => m.id === moduleData.id ? ({ ...m, ...moduleData }) as Module : m));
        }
        setEditingSubject(null);
        setIsCreateModalOpen(false);
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (module: Module) => {
        setEditingSubject(module);
        setIsCreateModalOpen(true);
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setConfirmDeleteId(null);
    };

    const handleConfirmDelete = async (id: string) => {
        if (!id) return;
        setDeleteLoading(true);
        try {
            if (!id.startsWith('temp-')) {
                if (!subjectFromQuery) {
                    throw new Error('No se encontró la materia asociada al módulo');
                }
                await CoursesAPI.deleteModule(id, subjectFromQuery.id);
                if (subjectFromQuery) {
                    const updatedSubject: Subject = {
                        ...subjectFromQuery,
                        modulos: (subjectFromQuery.modulos || []).filter(mid => mid !== id),
                    };
                    await CoursesAPI.updateMateria(subjectFromQuery.id, updatedSubject);
                    setSubjectFromQuery(updatedSubject);
                }
            }
            setModules(prev => prev.filter(m => m.id !== id));
        } catch (e) {
            console.error('Error al eliminar módulo:', e);
            toast.error('No se pudo eliminar el módulo');
        } finally {
            setDeleteLoading(false);
            setIsDeleteModalOpen(false);
            setConfirmDeleteId(null);
        }
    };

    if (!pendingSubject && !subjectFromQuery) {
        return (
            <div className="admin-card mx-auto max-w-md">
                <SectionEmpty icon={<AlertCircle />}>
                    <p className="font-medium text-gray-700">No hay materia pendiente</p>
                    <p className="text-xs text-gray-500">No se encontró una materia para gestionar módulos.</p>
                    <Button onClick={() => navigate('/subjects')} variant="outline" size="sm" className="mt-2 h-8 cursor-pointer">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        Volver a Materias
                    </Button>
                </SectionEmpty>
            </div>
        );
    }

    const isNewSubject = !subjectFromQuery;

    const aside = (
        <ProfileCard
            media={
                <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-violet-50 text-violet-600">
                    <BookOpen className="w-5 h-5" />
                </span>
            }
            title={currentSubject?.nombre || "Materia"}
            subtitle={isNewSubject ? "Materia nueva" : "Gestión de módulos"}
            footer={
                <>
                    {isNewSubject && (
                        <Button
                            onClick={handleFinishSubjectCreation}
                            disabled={isCreatingSubject || modules.length === 0}
                            size="sm"
                            className="h-8 cursor-pointer"
                        >
                            {isCreatingSubject ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {isCreatingSubject ? "Creando materia…" : "Finalizar y crear materia"}
                        </Button>
                    )}
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        variant={isNewSubject ? "outline" : "default"}
                        size="sm"
                        className="h-8 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Crear módulo
                    </Button>
                    <Button
                        onClick={handleBackToSubjects}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-gray-500 cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isNewSubject ? "Cancelar" : "Volver a materias"}
                    </Button>
                </>
            }
        >
            <StatGrid stats={[{ label: "Módulos", value: modules.length }]} />
            <p className="px-5 py-3 text-xs text-gray-500">
                {isNewSubject
                    ? "Creá los módulos que formarán parte de esta materia y finalizá para guardarla."
                    : "Agregá o actualizá los módulos de esta materia."}
            </p>
        </ProfileCard>
    );

    return (
        <DetailLayout aside={aside}>
            <SectionCard
                title="Módulos"
                description={
                    modules.length === 0
                        ? "Aún no hay módulos para esta materia"
                        : "El interruptor define si el módulo está habilitado por defecto para los alumnos"
                }
            >
                {modules.length === 0 ? (
                    <SectionEmpty icon={<BookOpen />}>
                        <p className="font-medium text-gray-600">Sin módulos todavía</p>
                        <p className="text-xs text-gray-400">Usá "Crear módulo" para agregar el primero.</p>
                    </SectionEmpty>
                ) : (
                    <div className="p-3">
                        <ModulesList
                            modules={modules}
                            materiaId={subjectFromQuery?.id || pendingSubject?.id || ''}
                            onDelete={handleDeleteClick}
                            onEdit={handleEditClick}
                            defaultEnabledByModule={modulosHabilitadosEstado}
                            onToggleSuccess={async () => {
                              if (subjectFromQuery?.id) {
                                const estado = await CoursesAPI.getModulosHabilitadosEstado(subjectFromQuery.id);
                                setModulosHabilitadosEstado(estado);
                              }
                            }}
                        />
                    </div>
                )}
            </SectionCard>

            <ModulesModal
                isOpen={isCreateModalOpen}
                onCancel={handleCancelCreate}
                onModuleCreated={handleModuleCreated}
                courseId={subjectFromQuery?.id || pendingSubject?.id}
                editingModule={editingSubject}
                onModuleUpdated={handleModuleUpdated}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                deleteLoading={deleteLoading}
                itemName={modules.find(m => m.id === confirmDeleteId)?.titulo || "este módulo"}
                id={confirmDeleteId || ""}
            />
        </DetailLayout>
    );
}