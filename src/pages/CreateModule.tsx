import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Plus } from "lucide-react";
import type { Module, Subject } from "@/types/types";
import { CoursesAPI } from "@/service/courses";
import { toast } from "sonner";
import ModulesList from "@/components/subject/ModulesList";
import ModulesModal from "@/components/subject/ModulesModal";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";

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

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const subjectId = params.get('subjectId');

        if (subjectId) {
            (async () => {
                try {
                    const subject = await CoursesAPI.getMateriaById(subjectId);
                    setSubjectFromQuery(subject);
                    if (Array.isArray(subject.modulos) && subject.modulos.length > 0) {
                        const fetched = await CoursesAPI.getModulesByIds(subject.modulos);
                        setModules(fetched);
                    } else {
                        setModules([]);
                    }
                } catch (e) {
                    console.error('Error al cargar materia/modulos:', e);
                    toast.error('No se pudieron cargar los datos de la materia');
                }
            })();
            return;
        }

        const savedSubjectData = localStorage.getItem('pendingSubjectData');
        if (savedSubjectData) {
            try {
                const subjectData = JSON.parse(savedSubjectData);
                setPendingSubject(subjectData);
            } catch (error) {
                console.error('Error al parsear datos de materia:', error);
                toast.error('Error al cargar datos de la materia');
            }
        }
    }, [location.search]);

    const createModule = async (moduleData: { titulo: string; descripcion: string; id_materia: string; tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra"; bibliografia: string; url_miniatura: string; url_contenido: string }): Promise<{ id: string }> => {
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
                setModules((prev) => [...prev, { id: created.id, ...moduleData } as Module]);
                toast.success('Módulo agregado correctamente');
                return { id: created.id };
            } else if (pendingSubject) {
                const tempId = `temp-${Date.now()}`;
                setModules((prev) => [...prev, { id: tempId, ...moduleData } as Module]);
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
                localStorage.removeItem('pendingSubjectData');
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
                const createdModule = await CoursesAPI.createModule({
                    ...moduleData,
                    id_materia: pendingSubject.id
                });
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

    const handleModuleCreated = async (moduleData: { titulo: string; descripcion: string; id_materia: string; tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra"; bibliografia: string; url_miniatura: string; url_contenido: string }): Promise<{ id: string }> => {
        const res = await createModule(moduleData);
        setIsCreateModalOpen(false);
        return res;
    };

    const handleModuleUpdated = async (moduleData: { id: string; titulo: string; descripcion: string; id_materia: string; tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra"; bibliografia: string; url_miniatura: string; url_contenido: string }) => {
        if (moduleData.id.startsWith('temp-')) {
            // Solo actualiza local si es temporal
            setModules((prev) => prev.map(m => m.id === moduleData.id ? ({ ...m, ...moduleData }) as Module : m));
        } else {
            await CoursesAPI.updateModule(moduleData.id, {
                titulo: moduleData.titulo,
                descripcion: moduleData.descripcion,
                id_materia: moduleData.id_materia,
                tipo_contenido: moduleData.tipo_contenido,
                bibliografia: moduleData.bibliografia,
                url_miniatura: moduleData.url_miniatura,
                url_contenido: moduleData.url_contenido,
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

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;
        setDeleteLoading(true);
        try {
            if (!confirmDeleteId.startsWith('temp-')) {
                await CoursesAPI.deleteModule(confirmDeleteId);
                if (subjectFromQuery) {
                    const updatedSubject: Subject = {
                        ...subjectFromQuery,
                        modulos: (subjectFromQuery.modulos || []).filter(mid => mid !== confirmDeleteId),
                    };
                    await CoursesAPI.updateMateria(subjectFromQuery.id, updatedSubject);
                    setSubjectFromQuery(updatedSubject);
                }
            }
            setModules(prev => prev.filter(m => m.id !== confirmDeleteId));
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
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            No hay materia pendiente
                        </CardTitle>
                        <CardDescription>
                            No se encontró materia para gestionar módulos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate('/subjects')} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Materias
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {subjectFromQuery ? (
                                <>Gestionando módulos de: {subjectFromQuery.nombre}</>
                            ) : (
                                <>Creando módulos para: {pendingSubject?.nombre}</>
                            )}
                        </span>
                        <Button onClick={handleBackToSubjects} variant="outline" size="sm" className="cursor-pointer" disabled={loading}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Cancelar'}
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        {subjectFromQuery ? (
                            <>Agrega o actualiza los módulos de esta materia.</>
                        ) : (
                            <>Crea los módulos que formarán parte de esta materia. Puedes agregar tantos módulos como necesites.</>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Módulos creados: <span className="font-semibold">{modules.length}</span>
                        </div>
                        {modules.length > 0 && !subjectFromQuery && (
                            <Button 
                                onClick={handleFinishSubjectCreation}
                                disabled={isCreatingSubject}
                                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                            >
                                {isCreatingSubject ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creando materia...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Finalizar y Crear Materia
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Módulos existentes</CardTitle>
                        <CardDescription>
                            {modules.length === 0
                                ? 'Aún no hay módulos para esta materia.'
                                : 'Visualiza los módulos ya creados para esta materia.'}
                        </CardDescription>
                    </div>
                    <div>
                        <Button onClick={() => setIsCreateModalOpen(true)} className="cursor-pointer">
                            <Plus className="h-4 w-4 mr-2" />
                            Crear módulo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {modules.length === 0 ? (
                        <div className="text-sm text-gray-500">Sin módulos</div>
                    ) : (
                        <div className="space-y-3">
                            <ModulesList modules={modules} onDelete={handleDeleteClick} onEdit={handleEditClick} />
                        </div>
                    )}
                </CardContent>
            </Card>
            
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
            />
        </div>
    );
}