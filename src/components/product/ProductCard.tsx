import { type Course } from '@/types/types';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/currency';

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
    <div className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 h-full flex flex-col">
      {/* Image */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
        <img
          src={product.image || (product as any).imagen || '/placeholder.svg'}
          alt={product.titulo}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            // Si la imagen falla al cargar, usar placeholder
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${getStatusColor(product.estado)} border ${product.estado === 'activo' ? 'border-green-300/50' : 'border-red-300/50'}`}>
            {getStatusLabel(product.estado)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Header Info */}
        <div className="flex items-center gap-2 mb-3 text-gray-500">
          <BookOpen className="w-4 h-4" strokeWidth={2} />
          <span className="text-xs font-medium">{product.materias.length} {product.materias.length === 1 ? 'materia' : 'materias'}</span>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors">
          {product.titulo}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">
          {product.descripcion}
        </p>

        {/* Price & Status */}
        <div className="flex items-center justify-between mb-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {product.precio === 0 ? (
              <span className="text-lg font-bold text-green-600">Gratuito</span>
            ) : (
              <span className="text-lg font-bold text-gray-900">{formatCurrency(product.precio)}</span>
            )}
          </div>
          <div className={`w-2 h-2 rounded-full ${product.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link to={`/products/${product.id}`} className="flex-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full cursor-pointer border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Ver Detalles
            </Button>
          </Link>
          <Link to={`/products/${product.id}/edit`} className="flex-1">
            <Button
              variant="default"
              size="sm"
              className="w-full cursor-pointer"
            >
              Editar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
