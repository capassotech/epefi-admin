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
}

export const SubjectList = ({ subjects, onDelete, onEdit }: SubjectListProps) => {
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Materias</h2>
      </div>

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
                    </Link>
                    {/* <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.id_cursos.length > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {m.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span> */}
                  </div>

                  {/* <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                    <p>📚 Materia</p>
                    <p>🎯 {m.id_cursos.length > 0 ? 'Activo' : 'Inactivo'}</p>
                    {m.id_cursos && <p>🎓 Curso: {m.id_cursos.join(', ')}</p>}
                  </div> */}

                  {/* <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-gray-600 line-clamp-2">{m.modulos.length} modulos</p>
                  </div> */}
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

export default SubjectList;
