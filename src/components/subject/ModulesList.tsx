import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ToastNotification from '../ui/ToastNotification';
import { CoursesAPI } from '@/service/courses';
import { type Module } from '@/types/types';

interface ModulesListProps {
  modules: Module[];
  onDelete?: (id: string) => void;
  onEdit?: (module: Module) => void;
}

export const ModulesList = ({ modules, onDelete, onEdit }: ModulesListProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const closeToast = () => setToast(null);

  const handleDelete = async (id: string) => {
    if (onDelete) {
      onDelete(id);
      await confirmDelete();
    } else {
      setSelectedId(id);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId || isDeleting) return;

    setIsDeleting(true);

    try {
      if (onDelete) {
        await onDelete(selectedId); 
      } else {
        await CoursesAPI.deleteModule(selectedId);
      }

      setToast({ message: 'Módulo eliminado con éxito', type: 'success' });

      setSelectedId(null);
    } catch (err) {
      setToast({ message: 'Error al eliminar el módulo', type: 'error' });
      console.error('Error al eliminar:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul role="list" className="divide-y divide-gray-200">
          {modules.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500">
              No hay módulos registrados.
            </li>
          ) : (
            modules.map((m) => (
              <li
                key={m.id}
                className="flex items-start px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150 space-x-4"
              >
                <img
                  src={'/placeholder.svg'}
                  className="w-24 h-24 object-cover rounded-md border"
                  alt={m.titulo}
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className="text-lg font-semibold text-gray-900 transition-colors duration-200 line-clamp-2"
                    >
                      {m.titulo}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className='cursor-pointer'
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(m);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className='cursor-pointer'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(m.id);
                    }}
                    disabled={isDeleting && selectedId === m.id}
                  >
                    {isDeleting && selectedId === m.id ? "Eliminando..." : "Eliminar"}
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

export default ModulesList;
