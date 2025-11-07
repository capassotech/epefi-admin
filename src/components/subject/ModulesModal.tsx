import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
// import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/firebase';

import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
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
    onModuleCreated: (subjectData: Module) => Promise<{ id: string }>;
    courseId?: string | null;
    editingModule?: Module | null;
    onModuleUpdated?: (subjectData: Module) => Promise<void>;
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
        url_archivo: "",
        url_video: [],
        tipo_contenido: "pdf",
        id_materia: "",
    });
    const [videoUrlInput, setVideoUrlInput] = useState<string>("");
    const [archivoFile, setArchivoFile] = useState<File | null>(null);
    const storage = getStorage(app);

    useEffect(() => {
        if (isOpen) {
            if (editingModule) {
                setModuleForm({
                    id: editingModule.id,
                    titulo: editingModule.titulo,
                    descripcion: editingModule.descripcion || "",
                    id_materia: editingModule.id_materia || "",
                    tipo_contenido: "pdf", // Siempre PDF, incluso al editar
                    bibliografia: editingModule.bibliografia || "",
                    url_miniatura: editingModule.url_miniatura || "",
                    url_archivo: editingModule.url_archivo || "",
                    url_video: editingModule.url_video || [],
                });
            } else {
                setModuleForm({
                    id: "",
                    titulo: "",
                    descripcion: "",
                    id_materia: (Array.isArray(courseId) ? courseId[0] : courseId) || "",
                    tipo_contenido: "pdf",
                    bibliografia: "",
                    url_miniatura: "",
                    url_archivo: "",
                    url_video: [],
                });
                setVideoUrlInput("");
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
        // Validar que haya un archivo o una URL
        if (!archivoFile && !moduleForm.url_archivo.trim() && !editingModule) {
            return "Debes subir un archivo PDF o proporcionar una URL";
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
            let uploadedFileUrl = moduleForm.url_archivo;

            if (archivoFile) {
                const safeMateria = (moduleForm.id_materia || 'unknown').trim() || 'unknown';
                const stamp = Date.now();
                const storagePath = `subjects/${safeMateria}/modules/${stamp}-${archivoFile.name}`;
                const storageRef = ref(storage, storagePath);
                await uploadBytes(storageRef, archivoFile);
                uploadedFileUrl = await getDownloadURL(storageRef);
            }

            // Preparar datos para enviar
            // Si es creación, no incluir el campo 'id'
            // Si es edición, incluir todos los campos incluyendo 'id'
            // El backend espera tipo_contenido en minúsculas: "pdf", "video", etc.
            // Siempre usar "pdf" (minúsculas) ya que es el único tipo permitido ahora
            const tipoContenidoNormalized = "pdf";
            
            const baseData = {
                titulo: moduleForm.titulo.trim(),
                descripcion: (moduleForm.descripcion || "").trim(),
                id_materia: moduleForm.id_materia,
                tipo_contenido: tipoContenidoNormalized as any, // Siempre "pdf" en minúsculas
                bibliografia: (moduleForm.bibliografia || "").trim(),
                url_miniatura: (moduleForm.url_miniatura || "").trim(),
                url_archivo: (uploadedFileUrl || "").trim(),
                url_video: Array.isArray(moduleForm.url_video) ? moduleForm.url_video : [],
            };
            
            console.log("Datos preparados en ModulesModal:", baseData);

            const subjectDataToSend = editingModule
                ? { ...baseData, id: moduleForm.id }
                : baseData;

            if (editingModule && onModuleUpdated) {
                console.log(subjectDataToSend);
                await onModuleUpdated(subjectDataToSend as Module);
                onCancel();
            } else {
                await onModuleCreated(subjectDataToSend as Module);
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
                <DialogTitle className="sr-only">
                    {editingModule ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    {editingModule 
                        ? 'Formulario para editar los datos del módulo' 
                        : 'Formulario para crear un nuevo módulo'}
                </DialogDescription>
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
                            <div className='w-full'>
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción *
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
                                    Tipo de Contenido *
                                </label>
                                <Select
                                    value="pdf"
                                    disabled
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='w-1/2'>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Material de lectura
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setArchivoFile(file);
                                        }}
                                        className="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                {editingModule && (
                                    <>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Si no seleccionas archivo, se usará el valor de URL (opcional).
                                        </p>
                                        <input
                                            type="text"
                                            value={moduleForm.url_archivo}
                                            onChange={(e) =>
                                                setModuleForm((prev) => ({
                                                    ...prev,
                                                    url_archivo: e.target.value,
                                                }))
                                            }
                                            placeholder="URL directa (opcional)"
                                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URLs de videos
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={videoUrlInput}
                                    onChange={(e) => setVideoUrlInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const url = videoUrlInput.trim();
                                            if (!url) return;
                                            setModuleForm((prev) => ({
                                                ...prev,
                                                url_video: prev.url_video.includes(url)
                                                    ? prev.url_video
                                                    : [...prev.url_video, url],
                                            }));
                                            setVideoUrlInput("");
                                        }
                                    }}
                                    placeholder="https://... (Enter para agregar)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Button
                                    type="button"
                                    className="cursor-pointer"
                                    onClick={() => {
                                        const url = videoUrlInput.trim();
                                        if (!url) return;
                                        setModuleForm((prev) => ({
                                            ...prev,
                                            url_video: prev.url_video.includes(url)
                                                ? prev.url_video
                                                : [...prev.url_video, url],
                                        }));
                                        setVideoUrlInput("");
                                    }}
                                >
                                    Agregar
                                </Button>
                            </div>
                            {moduleForm.url_video.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {moduleForm.url_video.map((url) => (
                                        <div
                                            key={url}
                                            className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded"
                                        >
                                            <span className="text-xs text-gray-800 max-w-[360px] truncate" title={url}>{url}</span>
                                            <button
                                                type="button"
                                                className="text-xs text-red-600 hover:text-red-800"
                                                onClick={() =>
                                                    setModuleForm((prev) => ({
                                                        ...prev,
                                                        url_video: prev.url_video.filter((u) => u !== url),
                                                    }))
                                                }
                                                title="Quitar URL"
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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
