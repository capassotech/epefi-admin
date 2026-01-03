import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { type Subject } from '@/types/types';

interface SubjectCardProps {
  subject: Subject;
  onEdit?: (subject: Subject) => void;
}

export function SubjectCard({ subject, onEdit }: SubjectCardProps) {
  return (
    <div className="admin-card overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
      {/* Header Icon */}
      <div className="aspect-video bg-gray-200 overflow-hidden">
        <img
          src={'/placeholder.svg'}
          alt={subject.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-1">
            <GraduationCap className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Materia</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {subject.nombre}
        </h3>

        {/* Course Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {subject.id_cursos && subject.id_cursos.length > 0 ? (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {subject.id_cursos.length} curso{subject.id_cursos.length !== 1 ? 's' : ''} asociado{subject.id_cursos.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                Sin cursos asociados
              </span>
            )}
          </div>
          {/* <div className={`w-2 h-2 rounded-full ${subject.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'}`} /> */}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link to={`/subjects/${subject.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Ver Detalles
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            className="w-full flex-1"
            onClick={() => onEdit?.(subject)}
          >
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}
