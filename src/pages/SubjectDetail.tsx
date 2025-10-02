// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import {
    ArrowLeft,
    Clock,
    BookOpen,
    Image as ImageIcon,
} from 'lucide-react';
import { CoursesAPI } from '@/service/courses';
import type { Module, Subject } from '@/types/types';
import ModulesList from '@/components/subject/ModulesList';
import ConfirmDeleteModal from '@/components/product/ConfirmDeleteModal';
import ModulesModal from '@/components/subject/ModulesModal';


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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Module | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            setError('ID de formación no proporcionado');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const data = await CoursesAPI.getMateriaById(id);
                setMateria(data);

                if (data.modulos && data.modulos.length > 0) {
                    setLoadingModulos(true);
                    try {
                        const materiasData = await CoursesAPI.getModulesByIds(data.modulos);
                        setModulos(materiasData);
                    } catch (moduloError) {
                        console.error("⚠️ Error al cargar materias:", moduloError);
                    } finally {
                        setLoadingModulos(false);
                    }
                }
            } catch (error) {
                const err = error as { message?: string };
                console.error("❌ Error al cargar formación:", err);
                setError(err.message || 'Error al cargar la formación');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

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
        setIsDeleteModalOpen(false);
        setConfirmDeleteId(null);
        setDeleteLoading(false);
    };

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
        setEditingSubject(null);
    };

    const handleModuleCreated = async (subjectData: { titulo: string; descripcion: string; id_materia: string; tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra"; bibliografia: string; url_miniatura: string; url_contenido: string }): Promise<{ id: string }> => {
        try {
            const created = await CoursesAPI.createModule(subjectData);
            const newModuleId: string = created.id;

            // Actualizar la materia con el nuevo módulo
            if (materia) {
                const updatedMateria: Subject = {
                    ...materia,
                    modulos: [...(materia.modulos || []), newModuleId],
                };
                await CoursesAPI.updateMateria(materia.id, updatedMateria);
                setMateria(updatedMateria);
            }

            // Actualizar la lista local de módulos
            const newModule: Module = { id: newModuleId, ...subjectData } as Module;
            setModulos((prev) => [...prev, newModule]);

            setIsCreateModalOpen(false);
            return { id: newModuleId };
        } catch (e) {
            console.error('Error al crear módulo:', e);
            throw e as Error;
        }
    };

    const handleModuleUpdated = async (subjectData: { id: string; titulo: string; descripcion: string; id_materia: string; tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra"; bibliografia: string; url_miniatura: string; url_contenido: string }): Promise<void> => {
        try {
            await CoursesAPI.updateModule(subjectData.id, {
                titulo: subjectData.titulo,
                descripcion: subjectData.descripcion,
                id_materia: subjectData.id_materia,
                tipo_contenido: subjectData.tipo_contenido,
                bibliografia: subjectData.bibliografia,
                url_miniatura: subjectData.url_miniatura,
                url_contenido: subjectData.url_contenido,
            });

            // Refrescar el módulo en el estado local
            setModulos((prev) => prev.map((m) => (m.id === subjectData.id ? { ...m, ...subjectData } : m)));

            setEditingSubject(null);
            setIsCreateModalOpen(false);
        } catch (e) {
            console.error('Error al actualizar módulo:', e);
            throw e as Error;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
    if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
    if (!materia) return <div className="p-6">No se encontró la formación</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} className='cursor-pointer'>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">{materia.nombre}</h1>
                </div>
            </div>

            {materia.imagen && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <ImageIcon className="w-5 h-5 mr-2 text-gray-600" />
                            Imagen Principal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <img
                            src={materia.imagen ?? materia.imagen ?? '/placeholder.svg'}
                            alt={materia.nombre}
                            className="max-w-full h-auto rounded-lg border"
                        />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-gray-600" />
                        Detalles de la Formación
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {materia.modulos && materia.modulos.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                            <CardTitle className="flex items-center mb-3 justify-between">
                                <div className='flex items-center'>
                                    <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                                    Modulos ({materia.modulos.length})
                                </div>
                                <Button size="sm" className='cursor-pointer' onClick={() => setIsCreateModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear módulo
                                </Button>
                            </CardTitle>
                            {loadingModulos ? (
                                <p>Cargando materias...</p>
                            ) : modulos.length > 0 ? (
                                <ModulesList modules={modulos} onDelete={handleDeleteClick} onEdit={handleEditClick} />
                            ) : (
                                <p className="text-gray-500">No se pudieron cargar los detalles de los modulos.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>


            <ModulesModal
                isOpen={isCreateModalOpen}
                onCancel={handleCancelCreate}
                onModuleCreated={handleModuleCreated}
                courseId={materia.id}
                editingModule={editingSubject}
                onModuleUpdated={handleModuleUpdated}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                deleteLoading={deleteLoading}
                itemName={modulos.find(m => m.id === confirmDeleteId)?.titulo || "este módulo"}
            />  
        </div>
    );
};

