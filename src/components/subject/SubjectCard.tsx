import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { type Subject } from '@/types/types';

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <div className="admin-card overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
      {/* Header Icon */}
      <div className="aspect-video bg-gray-200 overflow-hidden">
        <img
          src={subject.image ?? subject.image ?? '/placeholder.svg'}
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
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {subject.modulos.length} modulos
        </p>

        {/* Course Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {subject.id_cursos && (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Curso: {subject.id_cursos.join(', ')}
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
          <Link to={`/subjects/${subject.id}/edit`} className="flex-1">
            <Button
              variant="default"
              size="sm"
              className="w-full"
            >
              Editar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
