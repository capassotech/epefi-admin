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
  Download,
  ExternalLink,
} from 'lucide-react';
import { CoursesAPI } from '@/service/courses';
import type { Course, Subject } from '@/types/types';


const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Course | null>(null);
  const [materias, setMaterias] = useState<Subject[]>([]); 
  const [loading, setLoading] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return (
    <InteractiveLoader
      initialMessage="Cargando curso"
      delayedMessage="Por favor aguarde, conectándose con el servidor"
    />
  );

  if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
  if (!curso) return <div className="p-6">No se encontró el curso</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
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

      {(curso.image || (curso as any).imagen) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-gray-600" />
              Portada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={curso.image || (curso as any).imagen || '/placeholder.svg'}
              alt={curso.titulo}
              className="mx-auto w-full max-h-[200px] object-contain rounded-lg border"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
            Descripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-line">{curso.descripcion || "Sin descripción"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Detalles del curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mt-2">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <p><strong>Precio del curso:</strong> <span className='text-gray-500'>{formatCurrency(curso.precio)}</span></p>
              </div>
              <p className="flex items-center mt-2">
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Estado:</strong>{" "}
                <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                  curso.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {curso.estado}
                </span>
              </p>
            </div>
            
            {(curso.fechaInicioDictado || curso.fechaFinDictado) && (
              <div>
                <div className="flex items-center mt-2">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <p className="text-sm">
                    <strong>Período de dictado:</strong>
                  </p>
                </div>
                <div className="ml-6 mt-1">
                  {curso.fechaInicioDictado && (
                    <p className="text-sm text-gray-600">
                      <strong>Fecha inicio:</strong> {new Date(curso.fechaInicioDictado).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  )}
                  {curso.fechaFinDictado && (
                    <p className="text-sm text-gray-600">
                      <strong>Fecha fin:</strong> {new Date(curso.fechaFinDictado).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {curso.materias && curso.materias.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <CardTitle className="flex items-center mb-3">
                <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                Materias ({curso.materias.length})
              </CardTitle>
              {loadingMaterias ? (
                <p>Cargando materias...</p> 
              ) : materias.length > 0 ? (
                <div className="space-y-3">
                  {materias.map((materia) => (
                    <div
                      key={materia.id}
                      className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <h4 className="font-semibold text-lg">Nombre: {materia.nombre}</h4>
                      <p>Cantidad de modulos: {materia.modulos.length}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No se pudieron cargar los detalles de las materias.</p>
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
            <div className="space-y-4">
              {curso.planDeEstudiosUrl && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-lg">Plan de Estudios</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Documento con todos los temas que abarca el curso
                      </p>
                      {curso.planDeEstudiosActualizado && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Última actualización: {new Date(curso.planDeEstudiosActualizado).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer"
                      >
                        <a
                          href={curso.planDeEstudiosUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer"
                      >
                        <a
                          href={curso.planDeEstudiosUrl}
                          download
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {curso.fechasDeExamenesUrl && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-lg">Fechas de Exámenes</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Documento con fechas y temas a evaluar
                      </p>
                      {curso.fechasDeExamenesActualizado && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Última actualización: {new Date(curso.fechasDeExamenesActualizado).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer"
                      >
                        <a
                          href={curso.fechasDeExamenesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer"
                      >
                        <a
                          href={curso.fechasDeExamenesUrl}
                          download
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductDetail;