// components/product/ProductList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { FormacionesAPI } from "@/lib/api";
import { Link } from 'react-router-dom';
import ToastNotification from '../ui/ToastNotification';

import { Course } from '@/types/types';

interface ProductListProps {
  products: Course[];
  onDelete?: (id: string) => void; // 👈 Función que el padre provee para eliminar y actualizar estado
}

export const ProductList = ({ products, onDelete }: ProductListProps) => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const closeToast = () => setToast(null);

  const handleDelete = (id: string) => {
    if (onDelete) {
      // Si el padre provee onDelete, lo usamos directamente (sin modal)
      onDelete(id);
    } else {
      // Si no, mostramos modal de confirmación
      setSelectedId(id);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId || isDeleting) return;

    setIsDeleting(true);

    try {
      if (onDelete) {
        await onDelete(selectedId); // 👈 El padre elimina de su estado → React actualiza la UI automáticamente
      } else {
        // Fallback: si no hay onDelete, llamamos a la API directamente
        // ⚠️ Pero como no podemos actualizar el estado aquí, no verás el cambio hasta recargar (evítalo en producción)
        await FormacionesAPI.delete(selectedId);
        // Opcional: podrías emitir un evento o usar un contexto global, pero lo ideal es usar onDelete
      }

      // Mostramos éxito
      setToast({ message: 'Formación eliminada con éxito', type: 'success' });

      // Cerramos modal
      setSelectedId(null);
    } catch (err) {
      setToast({ message: 'Error al eliminar la formación', type: 'error' });
      console.error('Error al eliminar:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Formaciones</h2>
      </div>

      {/* Lista */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul role="list" className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500">
              No hay formaciones registradas.
            </li>
          ) : (
            products.map((f) => (
              <li
                key={f.id}
                className="flex items-start px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150 space-x-4"
              >
                {/* Imagen */}
                <img
                  src={f.image || '/placeholder.svg'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                  className="w-24 h-24 object-cover rounded-md border"
                  alt={f.titulo}
                />

                {/* Contenido */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/admin/formaciones/${encodeURIComponent(f.id)}`}
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
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      const id = f.id;

                      if (!id || typeof id !== 'string' || id.trim().length === 0) {
                        console.error("Formación sin ID válido:", f);
                        setToast({ message: "Error: Esta formación no tiene un ID válido.", type: 'error' });
                        return;
                      }

                      navigate(`/admin/formaciones/editar/${encodeURIComponent(id)}`);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(f.id);
                    }}
                    disabled={isDeleting && selectedId === f.id}
                  >
                    {isDeleting && selectedId === f.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      {/* Toast de notificación */}
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

// Helpers
const formatPilar = (pilar: string) => {
  const map: Record<string, string> = {
    'consultoria-estrategica': 'Consultoría Estratégica',
    liderazgo: 'Liderazgo',
    emprendimiento: 'Emprendimiento',
  };
  return map[pilar] || pilar;
};

const formatNivel = (nivel: string) => {
  const map: Record<string, string> = {
    principiante: 'Inicial',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
  };
  return map[nivel] || nivel;
};

const formatModalidad = (modalidad: string) => {
  const map: Record<string, string> = {
    presencial: 'Presencial',
    virtual: 'Virtual',
    hibrida: 'Híbrida',
  };
  return map[modalidad] || modalidad;
};

export default ProductList;