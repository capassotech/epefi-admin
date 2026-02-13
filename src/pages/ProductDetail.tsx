// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilIcon } from 'lucide-react';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { formatCurrency } from '@/utils/currency';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Tag,
  Users,
  Image as ImageIcon,
  Calendar,
  FileText,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CircleDot,
} from 'lucide-react';
import { CoursesAPI } from '@/service/courses';
import type { Course, Subject, Module } from '@/types/types';
import ModulesList from '@/components/subject/ModulesList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Course | null>(null);
  const [materias, setMaterias] = useState<Subject[]>([]); 
  const [modulosPorMateria, setModulosPorMateria] = useState<Record<string, Module[]>>({});
  const [loadingModulos, setLoadingModulos] = useState<Record<string, boolean>>({});
  const [expandedMaterias, setExpandedMaterias] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID de curso no proporcionado');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await CoursesAPI.getById(id);
        // Normalizar: mapear 'imagen' del backend a 'image' para el tipo Course
        const normalizedCourse: Course = {
          ...data,
          image: data.imagen || data.image || '',
          planDeEstudiosUrl: data.planDeEstudiosUrl || undefined,
          fechasDeExamenesUrl: data.fechasDeExamenesUrl || undefined,
          planDeEstudiosActualizado: data.planDeEstudiosActualizado || undefined,
          fechasDeExamenesActualizado: data.fechasDeExamenesActualizado || undefined,
        };
        setCurso(normalizedCourse);

        if (data.materias && data.materias.length > 0) {
          setLoadingMaterias(true);
          try {
            const materiasData = await CoursesAPI.getMateriasByIds(data.materias);
            setMaterias(materiasData);
          } catch (moduloError) {
            console.error("⚠️ Error al cargar materias:", moduloError);
          } finally {
            setLoadingMaterias(false);
          }
        }
      } catch (error: any) {
        console.error("❌ Error al cargar curso:", error);
        setError(error.message || 'Error al cargar el curso');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Función para cargar módulos de una materia
  const loadModulosForMateria = async (materiaId: string, moduloIds: string[]) => {
    if (modulosPorMateria[materiaId] || loadingModulos[materiaId] || !moduloIds.length) {
      return;
    }

    setLoadingModulos(prev => ({ ...prev, [materiaId]: true }));
    try {
      const modulosData = await CoursesAPI.getModulesByIds(moduloIds);
      setModulosPorMateria(prev => ({ ...prev, [materiaId]: modulosData }));
    } catch (error) {
      console.error(`Error al cargar módulos de materia ${materiaId}:`, error);
    } finally {
      setLoadingModulos(prev => ({ ...prev, [materiaId]: false }));
    }
  };

  // Función para toggle de expansión de materia
  const toggleMateria = (materiaId: string, moduloIds: string[] = []) => {
    setExpandedMaterias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materiaId)) {
        newSet.delete(materiaId);
      } else {
        newSet.add(materiaId);
        // Cargar módulos cuando se expande
        if (moduloIds.length > 0) {
          loadModulosForMateria(materiaId, moduloIds);
        }
      }
      return newSet;
    });
  };

  if (loading) return (
    <InteractiveLoader
      initialMessage="Cargando curso"
      delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
    />
  );

  if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
  if (!curso) return <div className="p-6">No se encontró el curso</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className='cursor-pointer'>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{curso.titulo}</h1>
        </div>
        <Button
          variant="outline"
          className='cursor-pointer'
          onClick={() => navigate(`/products/${encodeURIComponent(curso.id)}/edit`)}
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Grid Layout: Imagen y Descripción lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Imagen de portada (más pequeña) */}
        <div className="lg:col-span-1">
          {(curso.image || (curso as any).imagen) && (
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <ImageIcon className="w-4 h-4 mr-2 text-gray-600" />
                  Portada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div 
                  className="relative w-full aspect-video overflow-hidden rounded-lg border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity group"
                  onClick={() => setPreviewImageOpen(true)}
                >
                  <img
                    src={curso.image || (curso as any).imagen || '/placeholder.svg'}
                    alt={curso.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                      <ImageIcon className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Haz clic para ver en tamaño completo</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha: Descripción */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                Descripción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{curso.descripcion || "Sin descripción"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Detalles del curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Precio */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 mt-0.5">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Precio</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(curso.precio)}</p>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 mt-0.5">
                <CircleDot className={`w-5 h-5 ${
                  curso.estado === 'activo' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Estado</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  curso.estado === 'activo' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {curso.estado}
                </span>
              </div>
            </div>
            
            {/* Período de dictado */}
            {(curso.fechaInicioDictado || curso.fechaFinDictado) && (
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 mt-0.5">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-2">Período de dictado</p>
                  {curso.fechaInicioDictado && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Inicio:</span> {new Date(curso.fechaInicioDictado).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  {curso.fechaFinDictado && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Fin:</span> {new Date(curso.fechaFinDictado).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {curso.materias && curso.materias.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <CardTitle className="flex items-center mb-4 text-xl">
                <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                Materias ({curso.materias.length})
              </CardTitle>
              
              {loadingMaterias ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-2" />
                  <p className="text-gray-500">Cargando materias...</p>
                </div>
              ) : materias.length > 0 ? (
                <div className="space-y-4">
                  {materias.map((materia) => {
                    const numModulos = materia.modulos?.length || 0;
                    const modulosCargados = modulosPorMateria[materia.id];
                    const cargandoModulos = loadingModulos[materia.id];
                    const isExpanded = expandedMaterias.has(materia.id);
                    
                    return (
                      <Card key={materia.id} className="overflow-hidden">
                        <div className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-900 mb-1">{materia.nombre}</h4>
                              <p className="text-sm text-gray-500">
                                {numModulos > 0 
                                  ? `${numModulos} ${numModulos === 1 ? 'módulo' : 'módulos'}`
                                  : 'Sin módulos'
                                }
                              </p>
                            </div>
                            {numModulos > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMateria(materia.id, materia.modulos)}
                                className="ml-4"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                    Ocultar
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    Ver módulos
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                            {cargandoModulos ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-2" />
                                <p className="text-sm text-gray-500">Cargando módulos...</p>
                              </div>
                            ) : modulosCargados ? (
                              <ModulesList 
                                modules={modulosCargados} 
                                materiaId={materia.id}
                              />
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">
                                Cargando módulos...
                              </p>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500">No se pudieron cargar las materias</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {(curso.planDeEstudiosUrl || curso.fechasDeExamenesUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Documentos del Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {curso.planDeEstudiosUrl && (
                <div className="p-5 border-2 border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:border-blue-300 transition-colors">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <h4 className="font-semibold text-lg text-gray-900">Plan de Estudios</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 flex-1">
                      Documento con todos los temas que abarca el curso
                    </p>
                    {curso.planDeEstudiosActualizado && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                        <Clock className="w-3 h-3" />
                        Actualizado: {new Date(curso.planDeEstudiosActualizado).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="cursor-pointer w-full mt-auto"
                    >
                      <a
                        href={curso.planDeEstudiosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver documento
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {curso.fechasDeExamenesUrl && (
                <div className="p-5 border-2 border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:border-blue-300 transition-colors">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <h4 className="font-semibold text-lg text-gray-900">Fechas de Exámenes</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 flex-1">
                      Documento con fechas y temas a evaluar
                    </p>
                    {curso.fechasDeExamenesActualizado && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                        <Clock className="w-3 h-3" />
                        Actualizado: {new Date(curso.fechasDeExamenesActualizado).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="cursor-pointer w-full mt-auto"
                    >
                      <a
                        href={curso.fechasDeExamenesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver documento
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de vista previa de portada */}
      <Dialog open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Vista previa de la portada</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            <img
              src={curso.image || (curso as any).imagen || '/placeholder.svg'}
              alt={curso.titulo}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;