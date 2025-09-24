
import { Course } from '@/types/types';
import { Calendar, Users, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Course;
}

export function ProductCard({ product }: ProductCardProps) {
  const getStatusColor = (estado: string) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-red-100 text-red-800',
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (estado: string) => {
    const labels = {
      'activo': 'Activo',
      'inactivo': 'Inactivo',
    };
    return labels[estado as keyof typeof labels] || estado;
  };

  return (
    <div className="admin-card overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
      {/* Image */}
      <div className="aspect-video bg-gray-200 overflow-hidden">
        <img
          src={product.image}
          alt={product.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.estado)}`}>
            {getStatusLabel(product.estado)}
          </span>
          <div className="flex items-center space-x-1">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{product.materias.length} materias</span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.titulo}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {product.descripcion}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {product.precio === 0 ? (
              <span className="text-lg font-bold text-green-600">Gratuito</span>
            ) : (
              <span className="text-lg font-bold text-gray-900">${product.precio.toLocaleString()}</span>
            )}
          </div>
          <div className={`w-2 h-2 rounded-full ${product.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link to={`/products/${product.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Ver Detalles
            </Button>
          </Link>
          <Link to={`/products/${product.id}/edit`} className="flex-1">
            <Button
              variant="default"
              size="sm"
              onClick={() => {

              }}
            >
              Editar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
