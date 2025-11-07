import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ToastNotification from '../ui/ToastNotification';
import { type Module } from '@/types/types';
import { Edit2, Trash2, Loader2 } from 'lucide-react';

interface ModulesListProps {
  modules: Module[];
  onDelete?: (id: string) => void;
  onEdit?: (module: Module) => void;
}

export const ModulesList = ({ modules, onDelete, onEdit }: ModulesListProps) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const closeToast = () => setToast(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    if (onDelete) {
      await onDelete(id);
    }
    setTimeout(() => setDeletingId(null), 1000);
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
                className="flex items-center justify-between px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-gray-900 transition-colors duration-200">
                        {m.titulo}
                      </p>
                      {m.descripcion && (
                        <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                          {m.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(m);
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
                      handleDelete(m.id);
                    }}
                    disabled={deletingId === m.id}
                  >
                    {deletingId === m.id ? (
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

export default ModulesList;
