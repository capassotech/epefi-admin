// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PencilIcon } from 'lucide-react';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  DollarSign,
  Tag,
  Building,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { CoursesAPI } from '@/service/courses';

interface Formacion {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  duracion: number;
  nivel: string;
  modalidad: string;
  pilar: string;
  estado: 'activo' | 'inactivo';
  imagen: string;
  id_profesor: string;
  tags: string[];
  id_modulos: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Modulo {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion?: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formacion, setFormacion] = useState<Formacion | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]); 
  const [loading, setLoading] = useState(true);
  const [loadingModulos, setLoadingModulos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('ID de formación no proporcionado');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await CoursesAPI.getById(id);
        setFormacion(data);

        if (data.id_modulos && data.id_modulos.length > 0) {
          setLoadingModulos(true);
          try {
            const modulosData = await CoursesAPI.getModulesByIds(data.id_modulos);
            setModulos(modulosData);
          } catch (moduloError) {
            console.error("⚠️ Error al cargar módulos:", moduloError);
          } finally {
            setLoadingModulos(false);
          }
        }
      } catch (error: any) {
        console.error("❌ Error al cargar formación:", error);
        setError(error.message || 'Error al cargar la formación');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
  if (!formacion) return <div className="p-6">No se encontró la formación</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{formacion.titulo}</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/formaciones/editar/${encodeURIComponent(formacion.id)}`)}
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Imagen */}
      {formacion.imagen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-gray-600" />
              Imagen Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={formacion.imagen}
              alt={formacion.titulo}
              className="max-w-full h-auto rounded-lg border"
            />
          </CardContent>
        </Card>
      )}

      {/* Descripción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
            Descripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-line">{formacion.descripcion || "Sin descripción"}</p>
        </CardContent>
      </Card>

      {/* Detalles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Detalles de la Formación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Duración:</strong> {formacion.duracion} horas
              </p>
              <p className="flex items-center mt-2">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Nivel:</strong> {formacion.nivel || "N/A"}
              </p>
              <p className="flex items-center mt-2">
                <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Precio:</strong> ${formacion.precio.toFixed(2)}
              </p>
              <p className="flex items-center mt-2">
                <Building className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Modalidad:</strong> {formacion.modalidad || "N/A"}
              </p>
            </div>
            <div>
              <p className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Pilar:</strong> {formacion.pilar || "N/A"}
              </p>
              <p className="flex items-center mt-2">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <strong>ID Profesor:</strong> {formacion.id_profesor || "N/A"}
              </p>
              <p className="flex items-center mt-2">
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Estado:</strong>{" "}
                <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                  formacion.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {formacion.estado}
                </span>
              </p>
            </div>
          </div>

          {/* ➕ Sección de Módulos */}
          {formacion.id_modulos && formacion.id_modulos.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <CardTitle className="flex items-center mb-3">
                <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                Módulos ({formacion.id_modulos.length})
              </CardTitle>
              {loadingModulos ? (
                <p>Cargando módulos...</p>
              ) : modulos.length > 0 ? (
                <div className="space-y-3">
                  {modulos.map((modulo) => (
                    <div
                      key={modulo.id}
                      className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <h4 className="font-semibold text-lg">{modulo.nombre}</h4>
                      {modulo.descripcion && (
                        <p className="text-gray-700 mt-1 text-sm">{modulo.descripcion}</p>
                      )}
                      {modulo.duracion && (
                        <p className="text-gray-500 text-xs mt-1">
                          Duración: {modulo.duracion} horas
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No se pudieron cargar los detalles de los módulos.</p>
              )}
            </div>
          )}

          {/* Etiquetas */}
          {formacion.tags && formacion.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                <strong>Etiquetas:</strong>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {formacion.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fechas */}
          {(formacion.createdAt || formacion.updatedAt) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                {formacion.createdAt && (
                  <>Creado: {new Date(formacion.createdAt).toLocaleString()} </>
                )}
                {formacion.updatedAt && (
                  <> • Actualizado: {new Date(formacion.updatedAt).toLocaleString()}</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetail;