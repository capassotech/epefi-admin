import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
// import { useLocation } from 'react-router-dom';
import { Loader2, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase-client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

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
import { useIsMobile } from '@/hooks/use-mobile';


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
    const [archivosFiles, setArchivosFiles] = useState<File[]>([]);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [videoRotation, setVideoRotation] = useState(0);
    const [validatingVideo, setValidatingVideo] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggedVideoIndex, setDraggedVideoIndex] = useState<number | null>(null);
    const [dragOverVideoIndex, setDragOverVideoIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const isMobileHook = useIsMobile();
    
    // Detección mejorada de móvil: combina hook con user agent
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === "undefined") return false;
        const isMobileSize = window.innerWidth <= 768;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobileSize || isMobileUA;
    });
    
    // Actualizar cuando cambia el hook o el tamaño de ventana
    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const updateMobile = () => {
            const isMobileSize = window.innerWidth <= 768;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(isMobileSize || isMobileUA || isMobileHook);
        };
        
        updateMobile();
        window.addEventListener('resize', updateMobile);
        return () => window.removeEventListener('resize', updateMobile);
    }, [isMobileHook]);
    
    const { firebaseUser } = useAuth();

    useEffect(() => {
        if (isOpen) {
            if (editingModule) {
                // Preservar url_archivo tal como viene (puede ser string simple o con delimitador |||)
                // Si viene como array, lo convertimos a string con delimitador
                let urlArchivoValue: string = "";
                if (editingModule.url_archivo) {
                    if (Array.isArray(editingModule.url_archivo)) {
                        urlArchivoValue = editingModule.url_archivo.length > 0 
                            ? (editingModule.url_archivo.length === 1 ? editingModule.url_archivo[0] : editingModule.url_archivo.join('|||'))
                            : "";
                    } else {
                        // Mantener el string tal como está (puede tener delimitadores ||| o ser una sola URL)
                        urlArchivoValue = editingModule.url_archivo;
                    }
                }
                
                setModuleForm({
                    id: editingModule.id,
                    titulo: editingModule.titulo,
                    descripcion: editingModule.descripcion || "",
                    id_materia: editingModule.id_materia || "",
                    tipo_contenido: "pdf", // Siempre PDF, incluso al editar
                    bibliografia: editingModule.bibliografia || "",
                    url_miniatura: editingModule.url_miniatura || "",
                    url_archivo: urlArchivoValue,
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
                setArchivosFiles([]);
                setIsVideoModalOpen(false);
                setSelectedVideoUrl(null);
                setValidatingVideo(false);
                setVideoError(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } else {
            // Cerrar modal de video cuando se cierra el modal principal
            setIsVideoModalOpen(false);
            setSelectedVideoUrl(null);
            setValidatingVideo(false);
            setVideoError(null);
            setIsFullscreen(false);
        }
    }, [isOpen, courseId, editingModule]);

    // Listener para detectar cambios en pantalla completa
    useEffect(() => {
        if (typeof document === "undefined") return;
        
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
            
            // Resetear rotación cuando se sale de pantalla completa
            if (!isCurrentlyFullscreen) {
                setVideoRotation(0);
            }
        };

        // Verificar estado inicial
        handleFullscreenChange();

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [isMobile, selectedVideoUrl]); // Incluir dependencias para que se actualice

    // Función para validar si una URL de video es accesible
    const validateVideoUrl = async (url: string): Promise<boolean> => {
        return new Promise((resolve) => {
            // Primero intentar con fetch para detectar errores HTTP
            fetch(url, {
                method: 'HEAD',
                mode: 'cors',
            })
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es OK (404, 403, etc.), el video no es accesible
                    resolve(false);
                    return;
                }
                // Si la respuesta es OK, verificar que sea realmente un video
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.startsWith('video/')) {
                    resolve(true);
                } else {
                    // Intentar con el elemento video como respaldo
                    validateWithVideoElement(url, resolve);
                }
            })
            .catch(() => {
                // Si falla por CORS u otro error, usar el elemento video
                validateWithVideoElement(url, resolve);
            });
        });
    };

    // Función auxiliar para validar usando un elemento video
    const validateWithVideoElement = (url: string, resolve: (value: boolean) => void) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true; // Muted para evitar problemas de autoplay
        
        const cleanup = () => {
            video.src = '';
            video.load();
        };
        
        video.onloadedmetadata = () => {
            cleanup();
            resolve(true);
        };
        
        video.onerror = () => {
            cleanup();
            resolve(false);
        };
        
        // Timeout después de 8 segundos
        const timeout = setTimeout(() => {
            cleanup();
            resolve(false);
        }, 8000);
        
        video.src = url;
        
        // Limpiar timeout si se carga correctamente
        video.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
        }, { once: true });
    };

    // Función para agregar una URL de video con validación
    const handleAddVideoUrl = async (url: string) => {
        if (!url.trim()) return;
        
        // Verificar si ya existe
        if (moduleForm.url_video.includes(url)) {
            toast.error('Esta URL de video ya está agregada');
            return;
        }

        // Verificar si es una URL válida
        try {
            new URL(url);
        } catch {
            toast.error('La URL no es válida');
            return;
        }

        setValidatingVideo(true);
        setVideoError(null);

        // Verificar si es una URL de video
        const isVideoUrl = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || 
                          url.includes('videos/') || 
                          url.includes('.mp4');

        if (isVideoUrl) {
            // Validar que el video sea accesible
            const isValid = await validateVideoUrl(url);
            
            if (!isValid) {
                setVideoError('No se pudo acceder al video. Verifica que la URL sea correcta y que el recurso esté disponible (Error 404 o similar).');
                toast.error('No se pudo acceder al video. Verifica que la URL sea correcta y que el recurso esté disponible.');
                setValidatingVideo(false);
                return;
            }
        }

        // Si todo está bien, agregar la URL
        setModuleForm((prev) => ({
            ...prev,
            url_video: [...prev.url_video, url],
        }));
        setVideoUrlInput("");
        setValidatingVideo(false);
        setVideoError(null);
        toast.success('URL de video agregada correctamente');
    };

    const validateForm = () => {
        if (!moduleForm.titulo.trim()) {
            return "El título del módulo es obligatorio";
        }
        if (!moduleForm.id_materia.trim()) {
            return "El ID de la materia es obligatorio";
        }
        // Validar que haya al menos un archivo o una URL
        const existingUrls = Array.isArray(moduleForm.url_archivo)
            ? moduleForm.url_archivo
            : (moduleForm.url_archivo ? moduleForm.url_archivo.split('|||').filter(url => url.trim()) : []);
        
        if (archivosFiles.length === 0 && existingUrls.length === 0 && !editingModule) {
            return "Debes subir al menos un archivo PDF";
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
            // Obtener URLs existentes (puede ser string con delimitador ||| o string simple)
            let existingUrls: string[] = [];
            if (moduleForm.url_archivo) {
                if (Array.isArray(moduleForm.url_archivo)) {
                    existingUrls = moduleForm.url_archivo;
                } else {
                    // Parsear el string, puede tener delimitador ||| o ser una sola URL
                    existingUrls = moduleForm.url_archivo.includes('|||')
                        ? moduleForm.url_archivo.split('|||').filter(url => url.trim() !== '')
                        : [moduleForm.url_archivo].filter(url => url.trim() !== '');
                }
            }

            // Verificar autenticación antes de subir
            if (!firebaseUser) {
                toast.error('Debes estar autenticado para subir archivos');
                setLoading(false);
                return;
            }

            // Obtener el token de autenticación explícitamente
            let idToken: string | null = null;
            try {
                idToken = await firebaseUser.getIdToken();
            } catch (tokenError) {
                console.error('Error al obtener token:', tokenError);
                toast.error('Error de autenticación. Por favor, inicia sesión nuevamente');
                setLoading(false);
                return;
            }

            // Subir archivos nuevos a Firebase
            const uploadedUrls: string[] = [];
            if (archivosFiles.length > 0) {
                const safeMateria = (moduleForm.id_materia || 'unknown').trim() || 'unknown';
                
                // Mostrar progreso si hay múltiples archivos
                if (archivosFiles.length > 1) {
                    toast.info(`Subiendo ${archivosFiles.length} archivos...`, { duration: 2000 });
                }
                
                for (let i = 0; i < archivosFiles.length; i++) {
                    const file = archivosFiles[i];
                    try {
                        // Validar que el archivo sea válido
                        if (!file || file.size === 0) {
                            toast.error(`El archivo "${file.name}" está vacío`);
                            continue;
                        }
                        
                        // Validar tamaño del archivo (máximo 10MB)
                        const maxSize = 10 * 1024 * 1024; // 10MB
                        if (file.size > maxSize) {
                            toast.error(`El archivo "${file.name}" es demasiado grande (máximo 10MB)`);
                            continue;
                        }
                        
                        // Usar timestamp + índice para asegurar nombres únicos
                        const stamp = Date.now() + i; // Agregar índice al timestamp para evitar colisiones
                        const uniqueId = `${stamp}-${i}-${Math.random().toString(36).substring(2, 9)}`;
                        // Limpiar el nombre del archivo para evitar caracteres problemáticos
                        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                        const storagePath = `subjects/${safeMateria}/modules/${uniqueId}-${safeFileName}`;
                        const storageRef = ref(storage, storagePath);
                        
                        // Esperar un poco antes de cada subida para evitar problemas de CORS
                        if (i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay entre subidas
                        }
                        
                        // Subir el archivo con metadata
                        await uploadBytes(storageRef, file, {
                            contentType: 'application/pdf',
                            customMetadata: {
                                uploadedBy: firebaseUser.uid || 'unknown',
                                uploadedAt: new Date().toISOString(),
                            },
                        });
                        const downloadUrl = await getDownloadURL(storageRef);
                        uploadedUrls.push(downloadUrl);
                        
                        // Mostrar progreso individual
                        if (archivosFiles.length > 1) {
                            toast.success(`Archivo ${i + 1}/${archivosFiles.length} subido: ${file.name}`, { duration: 2000 });
                        }
                    } catch (error: any) {
                        console.error(`Error al subir archivo ${file.name}:`, error);
                        
                        // Mensaje de error más descriptivo
                        let errorMessage = `Error al subir "${file.name}"`;
                        if (error?.code === 'storage/unauthorized') {
                            errorMessage += ': No tienes permisos para subir archivos. Verifica las reglas de Firebase Storage';
                        } else if (error?.code === 'storage/canceled') {
                            errorMessage += ': La subida fue cancelada';
                        } else if (error?.code === 'storage/unknown' || error?.serverResponse?.status === 404) {
                            errorMessage += ': El bucket de Firebase Storage no se encontró (404). Verifica que el storage bucket esté correctamente configurado en las variables de entorno.';
                            toast.error(errorMessage, { duration: 6000 });
                            toast.error(`Bucket configurado: ${storage.app.options.storageBucket || 'NO CONFIGURADO'}`, { duration: 6000 });
                            // Si es error 404, detener el proceso
                            setLoading(false);
                            return;
                        } else if (error?.message?.includes('CORS')) {
                            errorMessage += ': Error de CORS. Esto puede deberse a la configuración de Firebase Storage. Por favor, verifica las reglas de seguridad y la configuración de CORS del bucket.';
                            toast.error(errorMessage, { duration: 5000 });
                            setLoading(false);
                            return;
                        } else {
                            errorMessage += `. Error: ${error?.message || 'Error desconocido'}`;
                        }
                        
                        toast.error(errorMessage);
                        
                        // Si es un error crítico, detener el proceso
                        if (error?.code === 'storage/unauthorized' || error?.code === 'storage/unknown') {
                            setLoading(false);
                            return;
                        }
                        // Continuar con los demás archivos en otros casos
                    }
                }
                
                if (uploadedUrls.length > 0) {
                    toast.success(`${uploadedUrls.length} archivo${uploadedUrls.length > 1 ? 's' : ''} subido${uploadedUrls.length > 1 ? 's' : ''} correctamente`);
                }
            }

            // Combinar URLs existentes con las nuevas (mantener el orden: existentes primero, luego nuevos)
            const allUrls = [...existingUrls, ...uploadedUrls].filter(url => url.trim() !== '');

            // Preparar datos para enviar
            // Si es creación, no incluir el campo 'id'
            // Si es edición, incluir todos los campos incluyendo 'id'
            // El backend espera tipo_contenido en minúsculas: "pdf", "video", etc.
            // Siempre usar "pdf" (minúsculas) ya que es el único tipo permitido ahora
            const tipoContenidoNormalized = "pdf";
            
            // Para compatibilidad con el backend, si hay múltiples URLs, las combinamos con un delimitador
            // Si el backend soporta arrays, podríamos enviar allUrls directamente
            const urlArchivoValue = allUrls.length > 0 
                ? (allUrls.length === 1 ? allUrls[0] : allUrls.join('|||'))
                : "";
            
            const baseData = {
                titulo: moduleForm.titulo.trim(),
                descripcion: (moduleForm.descripcion || "").trim(),
                id_materia: moduleForm.id_materia,
                tipo_contenido: tipoContenidoNormalized as any, // Siempre "pdf" en minúsculas
                bibliografia: (moduleForm.bibliografia || "").trim(),
                url_miniatura: (moduleForm.url_miniatura || "").trim(),
                url_archivo: urlArchivoValue,
                url_video: Array.isArray(moduleForm.url_video) ? moduleForm.url_video : [],
            };
            
            const subjectDataToSend = editingModule
                ? { ...baseData, id: moduleForm.id }
                : baseData;

            if (editingModule && onModuleUpdated) {
                await onModuleUpdated(subjectDataToSend as Module);
                onCancel();
            } else {
                await onModuleCreated(subjectDataToSend as Module);
                onCancel();
            }
        } catch (error) {
            console.error('Error al procesar módulo:', error);
            toast.error('Error al procesar el módulo. Por favor, verifica que todos los archivos se hayan subido correctamente.');
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
                                <div className="space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/pdf"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setArchivosFiles((prev) => [...prev, ...files]);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {archivosFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {archivosFiles.map((file, index) => (
                                                <div 
                                                    key={`${file.name}-${index}`} 
                                                    draggable
                                                    onDragStart={(e) => {
                                                        setDraggedIndex(index);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    }}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.dataTransfer.dropEffect = 'move';
                                                        setDragOverIndex(index);
                                                    }}
                                                    onDragLeave={() => {
                                                        setDragOverIndex(null);
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        if (draggedIndex !== null && draggedIndex !== index) {
                                                            const newFiles = [...archivosFiles];
                                                            const [removed] = newFiles.splice(draggedIndex, 1);
                                                            newFiles.splice(index, 0, removed);
                                                            setArchivosFiles(newFiles);
                                                        }
                                                        setDraggedIndex(null);
                                                        setDragOverIndex(null);
                                                    }}
                                                    onDragEnd={() => {
                                                        setDraggedIndex(null);
                                                        setDragOverIndex(null);
                                                    }}
                                                    className={`flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md cursor-move transition-all ${
                                                        draggedIndex === index ? 'opacity-50' : ''
                                                    } ${
                                                        dragOverIndex === index && draggedIndex !== index ? 'border-2 border-blue-500 bg-blue-100' : ''
                                                    }`}
                                                >
                                                    <GripVertical className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                    <span className="text-sm text-blue-800 flex-1 truncate" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                        onClick={() => {
                                                            setArchivosFiles((prev) => prev.filter((_, i) => i !== index));
                                                        }}
                                                        title="Quitar archivo"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {editingModule && (() => {
                                        // Parsear archivos existentes (pueden estar en formato string o separados por delimitador)
                                        const existingUrls = moduleForm.url_archivo
                                            ? (moduleForm.url_archivo.includes('|||')
                                                ? moduleForm.url_archivo.split('|||').filter(url => url.trim())
                                                : [moduleForm.url_archivo].filter(url => url.trim()))
                                            : [];
                                        
                                        // Función para extraer el nombre del archivo de la URL
                                        const getFileNameFromUrl = (url: string): string => {
                                            try {
                                                const urlObj = new URL(url);
                                                let pathname = urlObj.pathname;
                                                
                                                // Remover parámetros de consulta y fragmentos
                                                pathname = pathname.split('?')[0].split('#')[0];
                                                
                                                // Decodificar URL encoding
                                                pathname = decodeURIComponent(pathname);
                                                
                                                // Extraer el nombre del archivo
                                                let fileName = pathname.split('/').pop() || '';
                                                
                                                // Remover timestamps y IDs al inicio (formato: "timestamp-index-random-NombreArchivo.pdf")
                                                fileName = fileName.replace(/^\d+-\d+-[a-z0-9]+-/, '');
                                                fileName = fileName.replace(/^\d+-/, ''); // Solo timestamp
                                                
                                                // Remover extensión
                                                fileName = fileName.replace(/\.(pdf|doc|docx|txt|zip|rar)$/i, '');
                                                
                                                // Si el nombre está vacío después de limpiar, usar genérico
                                                if (!fileName || fileName.trim().length === 0) {
                                                    return `Archivo ${index + 1}`;
                                                }
                                                
                                                // Limpiar y formatear el nombre
                                                fileName = fileName
                                                    .replace(/[_-]/g, ' ')
                                                    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, ' ')
                                                    .replace(/\s+/g, ' ')
                                                    .trim();
                                                
                                                // Capitalizar primera letra de cada palabra
                                                fileName = fileName
                                                    .split(' ')
                                                    .map(word => {
                                                        if (word.length === 0) return '';
                                                        if (/^\d+$/.test(word)) return word;
                                                        if (word.length >= 2 && word.length <= 4 && /^[A-Z]+$/.test(word)) return word;
                                                        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                                    })
                                                    .filter(word => word.length > 0)
                                                    .join(' ');
                                                
                                                return fileName || `Archivo ${index + 1}`;
                                            } catch {
                                                // Si no es una URL válida, intentar extraer de otra forma
                                                const parts = url.split('/');
                                                let fileName = parts[parts.length - 1] || '';
                                                
                                                try {
                                                    fileName = decodeURIComponent(fileName);
                                                } catch {
                                                    // Si falla, usar tal cual
                                                }
                                                
                                                fileName = fileName.split('?')[0].split('#')[0];
                                                fileName = fileName.replace(/^\d+-\d+-[a-z0-9]+-/, '');
                                                fileName = fileName.replace(/\.(pdf|doc|docx|txt|zip|rar)$/i, '');
                                                
                                                if (!fileName || fileName.trim().length === 0) {
                                                    return `Archivo ${index + 1}`;
                                                }
                                                
                                                return fileName;
                                            }
                                        };
                                        
                                        return existingUrls.length > 0 ? (
                                            <div className="space-y-2">
                                                {existingUrls.map((url, index) => {
                                                    const fileName = getFileNameFromUrl(url);
                                                    return (
                                                        <div 
                                                        key={`existing-${index}`} 
                                                        draggable
                                                        onDragStart={(e) => {
                                                            setDraggedIndex(index);
                                                            e.dataTransfer.effectAllowed = 'move';
                                                        }}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            e.dataTransfer.dropEffect = 'move';
                                                            setDragOverIndex(index);
                                                        }}
                                                        onDragLeave={() => {
                                                            setDragOverIndex(null);
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            if (draggedIndex !== null && draggedIndex !== index) {
                                                                const newUrls = [...existingUrls];
                                                                const [removed] = newUrls.splice(draggedIndex, 1);
                                                                newUrls.splice(index, 0, removed);
                                                                setModuleForm((prev) => ({
                                                                    ...prev,
                                                                    url_archivo: newUrls.length > 0 
                                                                        ? (newUrls.length === 1 ? newUrls[0] : newUrls.join('|||'))
                                                                        : "",
                                                                }));
                                                            }
                                                            setDraggedIndex(null);
                                                            setDragOverIndex(null);
                                                        }}
                                                        onDragEnd={() => {
                                                            setDraggedIndex(null);
                                                            setDragOverIndex(null);
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md cursor-move transition-all ${
                                                            draggedIndex === index ? 'opacity-50' : ''
                                                        } ${
                                                            dragOverIndex === index && draggedIndex !== index ? 'border-2 border-blue-500 bg-blue-100' : ''
                                                        }`}
                                                    >
                                                        <GripVertical className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                        <span className="text-sm text-blue-800 flex-1 truncate" title={url}>
                                                            {fileName}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                                                onClick={() => {
                                                                    window.open(url, '_blank');
                                                                }}
                                                                title="Ver archivo"
                                                            >
                                                                Ver
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                                onClick={() => {
                                                                    const updatedUrls = existingUrls.filter((_, i) => i !== index);
                                                                    setModuleForm((prev) => ({
                                                                        ...prev,
                                                                        url_archivo: updatedUrls.length > 0 
                                                                            ? (updatedUrls.length === 1 ? updatedUrls[0] : updatedUrls.join('|||'))
                                                                            : "",
                                                                    }));
                                                                }}
                                                                title="Quitar archivo"
                                                            >
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
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
                                    onChange={(e) => {
                                        setVideoUrlInput(e.target.value);
                                        // Limpiar error cuando el usuario empiece a escribir
                                        if (videoError) {
                                            setVideoError(null);
                                        }
                                    }}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            await handleAddVideoUrl(videoUrlInput.trim());
                                        }
                                    }}
                                    placeholder="https://... (Enter para agregar)"
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        videoError ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    disabled={validatingVideo}
                                />
                                <Button
                                    type="button"
                                    className="cursor-pointer"
                                    onClick={() => handleAddVideoUrl(videoUrlInput.trim())}
                                    disabled={validatingVideo}
                                >
                                    {validatingVideo ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Validando...
                                        </>
                                    ) : (
                                        'Agregar'
                                    )}
                                </Button>
                            </div>
                            {videoError && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-800">{videoError}</p>
                                </div>
                            )}
                            {moduleForm.url_video.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {moduleForm.url_video.map((url, index) => {
                                        // Verificar si es una URL de video (mp4, webm, etc.), YouTube o Google Drive
                                        const isVideoUrl = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || 
                                                          url.includes('videos/') || 
                                                          url.includes('.mp4');
                                        const isYouTubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
                                        const isGoogleDriveUrl = url.includes('drive.google.com');
                                        
                                        return (
                                            <div 
                                                key={`video-${url}`} 
                                                draggable
                                                onDragStart={(e) => {
                                                    setDraggedVideoIndex(index);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.dataTransfer.dropEffect = 'move';
                                                    setDragOverVideoIndex(index);
                                                }}
                                                onDragLeave={() => {
                                                    setDragOverVideoIndex(null);
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (draggedVideoIndex !== null && draggedVideoIndex !== index) {
                                                        const newVideos = [...moduleForm.url_video];
                                                        const [removed] = newVideos.splice(draggedVideoIndex, 1);
                                                        newVideos.splice(index, 0, removed);
                                                        setModuleForm((prev) => ({
                                                            ...prev,
                                                            url_video: newVideos,
                                                        }));
                                                    }
                                                    setDraggedVideoIndex(null);
                                                    setDragOverVideoIndex(null);
                                                }}
                                                onDragEnd={() => {
                                                    setDraggedVideoIndex(null);
                                                    setDragOverVideoIndex(null);
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md cursor-move transition-all ${
                                                    draggedVideoIndex === index ? 'opacity-50' : ''
                                                } ${
                                                    dragOverVideoIndex === index && draggedVideoIndex !== index ? 'border-2 border-blue-500 bg-blue-100' : ''
                                                }`}
                                            >
                                                <GripVertical className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                <span className="text-sm text-blue-800 flex-1 truncate" title={url}>
                                                    {url}
                                                </span>
                                                {(isVideoUrl || isYouTubeUrl || isGoogleDriveUrl) && (
                                                    <button
                                                        type="button"
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                                        onClick={() => {
                                                            setSelectedVideoUrl(url);
                                                            setIsVideoModalOpen(true);
                                                        }}
                                                        title="Ver video"
                                                    >
                                                        Ver
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
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
                                        );
                                    })}
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
            
            {/* Modal para ver video */}
            <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                <DialogContent className="max-w-4xl [&>button]:hidden">
                    <DialogTitle className="sr-only">
                        Vista previa del video
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Reproducción del video seleccionado
                    </DialogDescription>
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                        {selectedVideoUrl && (() => {
                            // Convertir URL de YouTube o Google Drive al formato embed si es necesario
                            const convertVideoUrlToEmbed = (url: string): string => {
                                if (!url) return url;
                                
                                try {
                                    // Google Drive
                                    if (url.includes('drive.google.com')) {
                                        // Extraer el ID del archivo de diferentes formatos de Google Drive
                                        let fileId = '';
                                        
                                        // Formato: drive.google.com/file/d/FILE_ID/view
                                        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                                        if (fileMatch && fileMatch[1]) {
                                            fileId = fileMatch[1];
                                        }
                                        // Formato: drive.google.com/open?id=FILE_ID
                                        else if (url.includes('id=')) {
                                            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                                            if (idMatch && idMatch[1]) {
                                                fileId = idMatch[1];
                                            }
                                        }
                                        // Formato: drive.google.com/drive/folders/FOLDER_ID (carpetas, no archivos)
                                        else if (url.includes('/folders/')) {
                                            // Para carpetas, no podemos hacer embed, retornar URL original
                                            return url;
                                        }
                                        
                                        if (fileId) {
                                            // Usar el formato preview de Google Drive para videos
                                            return `https://drive.google.com/file/d/${fileId}/preview`;
                                        }
                                        
                                        return url;
                                    }
                                    
                                    // YouTube
                                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                        // Si ya es una URL embed, retornarla tal cual
                                        if (url.includes('youtube.com/embed/')) {
                                            return url;
                                        }
                                        
                                        const urlObj = new URL(url);
                                        let videoId = '';
                                        
                                        // Formato: youtube.com/watch?v=VIDEO_ID
                                        if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
                                            videoId = urlObj.searchParams.get('v') || '';
                                        }
                                        // Formato: youtu.be/VIDEO_ID
                                        else if (urlObj.hostname.includes('youtu.be')) {
                                            videoId = urlObj.pathname.replace('/', '').split('?')[0];
                                        }
                                        // Formato: youtube.com/embed/VIDEO_ID (ya es embed)
                                        else if (urlObj.pathname.includes('/embed/')) {
                                            return url;
                                        }
                                        
                                        if (videoId) {
                                            return `https://www.youtube.com/embed/${videoId}`;
                                        }
                                    }
                                    
                                    // Si no es YouTube ni Google Drive, retornar la URL original
                                    return url;
                                } catch {
                                    // Si no es una URL válida, retornar tal cual
                                    return url;
                                }
                            };
                            
                            const videoUrl = convertVideoUrlToEmbed(selectedVideoUrl);
                            const isYouTube = selectedVideoUrl.includes('youtube.com') || selectedVideoUrl.includes('youtu.be');
                            const isGoogleDrive = selectedVideoUrl.includes('drive.google.com');
                            
                            // Encontrar el índice del video seleccionado
                            const videoIndex = moduleForm.url_video.findIndex(url => url === selectedVideoUrl);
                            const videoTitle = videoIndex !== -1 
                                ? (moduleForm.url_video.length > 1 ? `Video ${videoIndex + 1}` : 'Video')
                                : 'Vista previa del video';
                            
                            return (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">{videoTitle}</h3>
                                    <div className="flex items-center gap-2">
                                        {!isYouTube && !isGoogleDrive && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="cursor-pointer"
                                                onClick={async () => {
                                                    if (!videoRef.current) return;
                                                    
                                                    try {
                                                        if (!isFullscreen) {
                                                            // Entrar en pantalla completa
                                                            if (videoRef.current.requestFullscreen) {
                                                                await videoRef.current.requestFullscreen();
                                                            } else if ((videoRef.current as any).webkitRequestFullscreen) {
                                                                await (videoRef.current as any).webkitRequestFullscreen();
                                                            } else if ((videoRef.current as any).mozRequestFullScreen) {
                                                                await (videoRef.current as any).mozRequestFullScreen();
                                                            } else if ((videoRef.current as any).msRequestFullscreen) {
                                                                await (videoRef.current as any).msRequestFullscreen();
                                                            }
                                                        } else {
                                                            // Salir de pantalla completa
                                                            if (document.exitFullscreen) {
                                                                await document.exitFullscreen();
                                                            } else if ((document as any).webkitExitFullscreen) {
                                                                await (document as any).webkitExitFullscreen();
                                                            } else if ((document as any).mozCancelFullScreen) {
                                                                await (document as any).mozCancelFullScreen();
                                                            } else if ((document as any).msExitFullscreen) {
                                                                await (document as any).msExitFullscreen();
                                                            }
                                                        }
                                                    } catch (error) {
                                                        console.error('Error al cambiar pantalla completa:', error);
                                                        toast.error('No se pudo cambiar a pantalla completa');
                                                    }
                                                }}
                                                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                                            >
                                                {isFullscreen ? (
                                                    <>
                                                        <Minimize2 className="h-4 w-4 mr-2" />
                                                        Salir
                                                    </>
                                                ) : (
                                                    <>
                                                        <Maximize2 className="h-4 w-4 mr-2" />
                                                        Expandir
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="cursor-pointer"
                                            onClick={() => {
                                                setIsVideoModalOpen(false);
                                                setSelectedVideoUrl(null);
                                                setIsFullscreen(false);
                                            }}
                                        >
                                            Cerrar
                                        </Button>
                                    </div>
                                </div>
                                <div 
                                    ref={videoContainerRef}
                                    className="relative w-full video-no-download" 
                                    style={{ paddingBottom: '56.25%' }}
                                >
                                    {(isYouTube || isGoogleDrive) ? (
                                        <>
                                            <iframe
                                                src={videoUrl}
                                                title={isYouTube ? "Video de YouTube" : "Video de Google Drive"}
                                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                allowFullScreen
                                                style={{
                                                    border: 'none'
                                                }}
                                            />
                                            {isGoogleDrive && (
                                                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-xs z-10">
                                                    <p className="mb-2">Si el video no se muestra, puede requerir permisos de acceso.</p>
                                                    <button
                                                        type="button"
                                                        className="text-orange-400 hover:text-orange-300 underline"
                                                        onClick={() => {
                                                            const originalUrl = videoUrl.replace('/preview', '/view');
                                                            window.open(originalUrl, '_blank', 'noopener,noreferrer');
                                                        }}
                                                    >
                                                        Abrir en Google Drive
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <video
                                            ref={videoRef}
                                            src={videoUrl}
                                            controls
                                            controlsList="nodownload nofullscreen noremoteplayback"
                                            disablePictureInPicture
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                            style={{
                                                objectFit: 'contain',
                                                transform: `rotate(${videoRotation}deg)`,
                                                transition: 'transform 0.3s ease'
                                            }}
                                            onContextMenu={(e) => e.preventDefault()}
                                            autoPlay
                                        >
                                            Tu navegador no soporta la reproducción de video.
                                        </video>
                                    )}
                                </div>
                            </div>
                            );
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
};

export default ModulesModal;
