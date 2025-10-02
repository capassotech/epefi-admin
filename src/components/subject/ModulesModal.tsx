import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
// import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { type Module } from '@/types/types';


interface ModulesModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onModuleCreated: (subjectData: { titulo: string; descripcion: string; id_materia: string; tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra"; bibliografia: string; url_miniatura: string; url_contenido: string }) => Promise<{ id: string }>;
    courseId?: string | null;
    editingModule?: Module | null;
    onModuleUpdated?: (subjectData: { id: string; titulo: string; descripcion: string; id_materia: string; tipo_contenido: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra"; bibliografia: string; url_miniatura: string; url_contenido: string }) => Promise<void>;
}


const ModulesModal = ({
    isOpen,
    onCancel,
    courseId,
    onModuleCreated,
    editingModule,
    onModuleUpdated,
}: ModulesModalProps) => {
    const [loading, setLoading] = useState(false);
    const [moduleForm, setModuleForm] = useState<Module>({
        id: "",
        titulo: "",
        descripcion: "",
        bibliografia: "",
        url_miniatura: "",
        url_contenido: "",
        tipo_contenido: "video",
        id_materia: "",
    });

    useEffect(() => {
        if (isOpen) {
            if (editingModule) {
                setModuleForm({
                    id: editingModule.id,
                    titulo: editingModule.titulo,
                    descripcion: editingModule.descripcion || "",
                    id_materia: editingModule.id_materia || "",
                    tipo_contenido: editingModule.tipo_contenido || "VIDEO",
                    bibliografia: editingModule.bibliografia || "",
                    url_miniatura: editingModule.url_miniatura || "",
                    url_contenido: editingModule.url_contenido || "",
                });
            } else {
                setModuleForm({
                    id: "",
                    titulo: "",
                    descripcion: "",
                    id_materia: (Array.isArray(courseId) ? courseId[0] : courseId) || "",
                    tipo_contenido: "video",
                    bibliografia: "",
                    url_miniatura: "",
                    url_contenido: "",
                }); 
            }
        }
    }, [isOpen, courseId, editingModule]);

    const validateForm = () => {
        if (!moduleForm.titulo.trim()) {
            return "El título del módulo es obligatorio";
        }
        if (!moduleForm.id_materia.trim()) {
            return "El ID de la materia es obligatorio";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        const error = validateForm();
        if (error) {
            alert(error);
            setLoading(false);
            return;
        }

        try {
            const subjectDataToSend = {
                titulo: moduleForm.titulo,
                descripcion: moduleForm.descripcion,
                id_materia: moduleForm.id_materia,
                tipo_contenido: moduleForm.tipo_contenido,
                bibliografia: moduleForm.bibliografia,
                url_miniatura: moduleForm.url_miniatura,
                url_contenido: moduleForm.url_contenido,
            };


            if (editingModule && onModuleUpdated) {
                await onModuleUpdated({
                    id: editingModule.id,
                    ...subjectDataToSend
                });
                onCancel();
            } else {
                await onModuleCreated(subjectDataToSend);
                onCancel();
            }
        } catch (error) {
            console.error('Error al procesar módulo:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogTrigger></DialogTrigger>
            <DialogContent className='max-w-5xl'>
                <div
                    className="max-w-5xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingModule ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className='flex gap-4 w-full'>
                            <div className='w-1/2'>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Título del Módulo *
                                </label>
                                <input
                                    type="text"
                                    value={moduleForm.titulo}
                                    onChange={(e) =>
                                        setModuleForm((prev) => ({
                                            ...prev,
                                            titulo: e.target.value,
                                        }))
                                    }
                                    placeholder="Ej: Introducción al tema"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className='w-1/2'>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID de la Materia
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={moduleForm.id_materia}
                                    onChange={(e) =>
                                        setModuleForm((prev) => ({
                                            ...prev,
                                            id_materia: e.target.value,
                                        }))
                                    }
                                    placeholder="ID de la materia a la que pertenece"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={moduleForm.descripcion}
                                onChange={(e) =>
                                    setModuleForm((prev) => ({
                                        ...prev,
                                        descripcion: e.target.value,
                                    }))
                                }
                                placeholder="Describe brevemente el contenido del módulo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                            />
                        </div>

                        <div className='flex gap-4 w-full'>
                            <div className='w-1/2'>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Contenido
                                </label>
                                <Select
                                    onValueChange={(value: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra") =>
                                        setModuleForm((prev) => ({ ...prev, tipo_contenido: value }))
                                    }
                                    value={moduleForm.tipo_contenido}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar tipo de contenido" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">VIDEO</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="evaluacion">EVALUACION</SelectItem>
                                        <SelectItem value="imagen">IMAGEN</SelectItem>
                                        <SelectItem value="contenido_extra">CONTENIDO_EXTRA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='w-1/2'>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bibliografía / Referencias
                                </label>
                                <textarea
                                    value={moduleForm.bibliografia}
                                    onChange={(e) =>
                                        setModuleForm((prev) => ({
                                            ...prev,
                                            bibliografia: e.target.value,
                                        }))
                                    }
                                    placeholder="Opcional: referencias para el módulo"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                />
                            </div>
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL de Miniatura
                            </label>
                            <input
                                type="text"
                                value={moduleForm.url_miniatura}
                                onChange={(e) =>
                                    setModuleForm((prev) => ({
                                        ...prev,
                                        url_miniatura: e.target.value,
                                    }))
                                }
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL de Contenido
                            </label>
                            <input
                                type="text"
                                value={moduleForm.url_contenido}
                                onChange={(e) =>
                                    setModuleForm((prev) => ({
                                        ...prev,
                                        url_contenido: e.target.value,
                                    }))
                                }
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                className='cursor-pointer'
                                onClick={onCancel}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className='cursor-pointer w-fit'
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className='h-4 w-fit animate-spin' />
                                ) : editingModule ? (
                                    'Guardar Cambios'
                                ) : (
                                    'Crear Módulo'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ModulesModal;
