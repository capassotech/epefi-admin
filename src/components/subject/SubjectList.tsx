import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ToastNotification from '../ui/ToastNotification';
import { CoursesAPI } from '@/service/courses';
import { type Subject } from '@/types/types';

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
                className="flex items-start px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150 space-x-4"
              >
                <img
                  src={'/placeholder.svg'}
                  className="w-24 h-24 object-cover rounded-md border"
                  alt={m.nombre}
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/subjects/${encodeURIComponent(m.id)}`}
                      className="text-lg font-semibold text-gray-900 hover:text-[#7a1a3a] hover:underline transition-colors duration-200 line-clamp-2"
                    >
                      {m.nombre}
                      <p className='text-sm text-gray-500'>{m.modulos ? m.modulos.length : 0} {m.modulos && m.modulos.length !== 1 ? 'modulos' : 'modulo'}</p>
                    </Link>
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
                  {showUnassign && onUnassign && (
                    <Button
                      size="sm"
                      variant="outline"
                      className='cursor-pointer border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400'
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
                      {isUnassigning && unassigningId === m.id ? "Desasignando..." : "Desasignar"}
                    </Button>
                  )}
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

export default SubjectList;
