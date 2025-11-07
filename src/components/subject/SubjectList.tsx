import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ToastNotification from '../ui/ToastNotification';
import { CoursesAPI } from '@/service/courses';
import { type Subject } from '@/types/types';
import { Edit2, Trash2, X, Loader2 } from 'lucide-react';

interface SubjectListProps {
  subjects: Subject[];
  onDelete?: (id: string) => void;
  onEdit?: (subject: Subject) => void;
  onUnassign?: (id: string) => void; // Nueva función para desasignar materia del curso
  showUnassign?: boolean; // Flag para mostrar el botón de desasignar
  showTitle?: boolean; // Flag para mostrar/ocultar el título
}

export const SubjectList = ({ subjects, onDelete, onEdit, onUnassign, showUnassign = false, showTitle = true }: SubjectListProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

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
        await CoursesAPI.deleteMateria(selectedId);
      }

      setToast({ message: 'Materia eliminada con éxito', type: 'success' });

      setSelectedId(null);
    } catch (err) {
      setToast({ message: 'Error al eliminar la materia', type: 'error' });
      console.error('Error al eliminar:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Materias asociadas</h2>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul role="list" className="divide-y divide-gray-200">
          {subjects.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500">
              No hay materias registradas.
            </li>
          ) : (
            subjects.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/subjects/${encodeURIComponent(m.id)}`}
                        className="text-lg font-semibold text-gray-900 hover:text-[#7a1a3a] hover:underline transition-colors duration-200 block"
                      >
                        {m.nombre}
                      </Link>
                      <p className='text-sm text-gray-500 mt-1'>
                        {m.modulos ? m.modulos.length : 0} {m.modulos && m.modulos.length !== 1 ? 'módulos' : 'módulo'}
                      </p>
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
                  {showUnassign && onUnassign && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-3 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setUnassigningId(m.id);
                        setIsUnassigning(true);
                        try {
                          await onUnassign(m.id);
                        } catch (err) {
                          console.error('Error al desasignar:', err);
                        } finally {
                          setIsUnassigning(false);
                          setUnassigningId(null);
                        }
                      }}
                      disabled={isUnassigning && unassigningId === m.id}
                    >
                      {isUnassigning && unassigningId === m.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Desasignando...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1.5" />
                          Desasignar
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(m.id);
                    }}
                    disabled={isDeleting && selectedId === m.id}
                  >
                    {isDeleting && selectedId === m.id ? (
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

export default SubjectList;
