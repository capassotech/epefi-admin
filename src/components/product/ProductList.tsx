// components/product/ProductList.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ToastNotification from '../ui/ToastNotification';
import { Edit2, Trash2, Loader2 } from 'lucide-react';

import { type Course } from '@/types/types';

interface ProductListProps {
  products: Course[];
  onDelete: (id: string) => Promise<void>;
}

export const ProductList = ({ products, onDelete }: ProductListProps) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const closeToast = () => setToast(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await onDelete(id);
    setSelectedId(id);
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      {/* Lista */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul role="list" className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500">
              No hay cursos registrados.
            </li>
          ) : (
            products.map((f) => (
              <li
                key={f.id}
                className="flex items-start px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150 space-x-4"
              >
                {/* Imagen */}
                <img
                  src={f.image || (f as any).imagen || '/placeholder.svg'}
                  className="w-24 h-24 object-cover rounded-md border"
                  alt={f.titulo}
                  onError={(e) => {
                    // Si la imagen falla al cargar, usar placeholder
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />

                {/* Contenido */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/products/${encodeURIComponent(f.id)}`}
                      className="text-lg font-semibold text-gray-900 hover:text-[#7a1a3a] hover:underline transition-colors duration-200 line-clamp-2"
                    >
                      {f.titulo}
                    </Link>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${f.estado === 'activo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {f.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                    <p>📚 {f.materias.length} materias</p>
                    <p>🎯 {f.estado}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-600 line-clamp-2">{f.descripcion}</p>
                    <p className="text-sm font-semibold text-gray-800">
                      ${f.precio.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const id = f.id;

                      if (!id || typeof id !== 'string' || id.trim().length === 0) {
                        console.error("Curso sin ID válido:", f);
                        setToast({ message: "Error: Este curso no tiene un ID válido.", type: 'error' });
                        return;
                      }

                      navigate(`/products/${encodeURIComponent(id)}/edit`);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(f.id);
                    }}
                    disabled={isDeleting && selectedId === f.id}
                  >
                    {isDeleting && selectedId === f.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Eliminar
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default ProductList;