import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoursesAPI } from '@/service/courses';
import { type Subject } from '@/types/types';
import { Edit2, Eye, Loader2, Unlink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { IconAction } from '@/components/ui/icon-action';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterHeader, PlainHeader, SortableHeader } from '@/components/common/TableHeaders';
import { CourseTags } from '@/components/common/CourseTags';
import {
    INACTIVE_ROW_TEXT,
    STATUS_FILTER_OPTIONS,
    inactiveRowClass,
    type ColumnSort,
    type SortDirection,
} from '@/utils/tableState';
import { toast } from 'sonner';

interface SubjectListProps {
  subjects: Subject[];
  onDelete?: (id: string) => void;
  onEdit?: (subject: Subject) => void;
  onUnassign?: (id: string) => void; // Nueva función para desasignar materia del curso
  showUnassign?: boolean; // Flag para mostrar el botón de desasignar
  showTitle?: boolean; // Flag para mostrar/ocultar el título
  onStatusChange?: () => void;
  onSubjectStatusUpdated?: (id: string, newEstado: "activo" | "inactivo") => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSortChange?: (sort: ColumnSort) => void;
  status?: string;
  /** undefined = habilitadas y deshabilitadas */
  onStatusFilterChange?: (status: string | undefined) => void;
  /** Si se pasa, se muestra la columna "Cursos" con los cursos de cada materia */
  coursesById?: Record<string, { titulo: string }>;
}


export const SubjectList = ({
  subjects,
  onEdit,
  onUnassign,
  showUnassign = false,
  showTitle = true,
  onStatusChange,
  onSubjectStatusUpdated,
  sortBy,
  sortDirection,
  onSortChange,
  status,
  onStatusFilterChange,
  coursesById,
}: SubjectListProps) => {
  const navigate = useNavigate();
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  /** Override local para que el Switch refleje el toggle aunque el padre no actualice aún */
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});

  // Dentro del alta/edición de un curso (modo desasignar) la fila no navega,
  // para no salir del formulario sin querer
  const rowsNavigate = !showUnassign;

  const isSubjectActive = (m: Subject) => {
    const override = statusOverrides[String(m.id)];
    if (override !== undefined) return override;
    return m.activo !== undefined ? m.activo : m.estado === 'activo';
  };

  const goToDetail = (m: Subject) => navigate(`/subjects/${encodeURIComponent(m.id)}`);

  const handleStatusChange = async (id: string) => {
    setUpdatingStatusId(id);
    try {
      // Usar el endpoint específico para alternar el estado
      const response = await CoursesAPI.toggleMateriaStatus(id);
      // El backend retorna { materia: { id, activo, ... } }
      const updatedSubject = response.materia || response;
      const newActivo = updatedSubject.activo !== undefined ? updatedSubject.activo : (updatedSubject.estado === 'activo');
      const newEstado = newActivo ? 'activo' : 'inactivo';
      const normalizedId = String(id);

      setStatusOverrides((prev) => ({ ...prev, [normalizedId]: newActivo }));

      toast.success(`Materia ${newActivo ? 'activada' : 'desactivada'} exitosamente`);

      // Actualizar el estado local inmediatamente
      if (onSubjectStatusUpdated) {
        onSubjectStatusUpdated(id, newEstado);
      } else if (onStatusChange) {
        // Solo recargar todo si no hay callback de actualización local
        onStatusChange();
      }
    } catch (error) {
      console.error('Error al actualizar estado de la materia:', error);
      toast.error('Error al actualizar el estado de la materia');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleUnassign = async (id: string) => {
    if (!onUnassign) return;
    setUnassigningId(id);
    try {
      await onUnassign(id);
    } catch (err) {
      console.error('Error al desasignar:', err);
    } finally {
      setUnassigningId(null);
    }
  };

  const moduleCount = (m: Subject) => m.modulos?.length ?? 0;
  const showCourses = !!coursesById;
  // Ignora ids de cursos eliminados que hayan quedado en la materia
  const courseTitles = (m: Subject) =>
    (m.id_cursos ?? [])
      .map((id) => coursesById?.[id]?.titulo)
      .filter((title): title is string => !!title);

  const renderActions = (m: Subject) => {
    const isActive = isSubjectActive(m);
    return (
      <div
        className="flex items-center justify-end gap-0.5"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <IconAction label="Ver materia" onClick={() => goToDetail(m)}>
          <Eye />
        </IconAction>
        <IconAction label="Editar materia" onClick={() => onEdit?.(m)}>
          <Edit2 />
        </IconAction>
        {showUnassign && onUnassign && (
          <IconAction
            label="Desasignar del curso"
            onClick={() => handleUnassign(m.id)}
            disabled={unassigningId !== null}
            className="hover:bg-orange-50 hover:text-orange-600"
          >
            {unassigningId === m.id ? <Loader2 className="animate-spin" /> : <Unlink />}
          </IconAction>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="grid place-items-center w-10 h-8">
              {updatingStatusId === m.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <Switch
                  checked={isActive}
                  onCheckedChange={() => handleStatusChange(m.id)}
                  disabled={updatingStatusId !== null}
                  aria-label={isActive ? 'Deshabilitar materia' : 'Habilitar materia'}
                  className="scale-90 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 disabled:opacity-50"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isActive ? 'Habilitada' : 'Deshabilitada'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-4">
      {showTitle && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Materias asociadas</h2>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        {subjects.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No hay materias registradas.</p>
        ) : (
          <>
            {/* ── Vista mobile: filas compactas ── */}
            <ul role="list" className="block md:hidden divide-y divide-gray-100 bg-white">
              {subjects.map((m) => {
                const isActive = isSubjectActive(m);
                return (
                  <li
                    key={m.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${rowsNavigate ? 'cursor-pointer' : ''} ${inactiveRowClass(isActive)}`}
                    onClick={rowsNavigate ? () => goToDetail(m) : undefined}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${isActive ? 'text-gray-900' : INACTIVE_ROW_TEXT}`}>
                        {m.nombre}
                      </p>
                      <p className={`truncate text-xs ${isActive ? 'text-gray-500' : INACTIVE_ROW_TEXT}`}>
                        {moduleCount(m)} {moduleCount(m) === 1 ? 'módulo' : 'módulos'}
                        {showCourses && courseTitles(m).length > 0 && ` · ${courseTitles(m).join(', ')}`}
                      </p>
                    </div>
                    {renderActions(m)}
                  </li>
                );
              })}
            </ul>

            {/* ── Vista desktop: tabla ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <SortableHeader
                      label="Nombre"
                      column="title"
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                      onSortChange={onSortChange}
                      className="pl-4 pr-3"
                    />
                    {showCourses && <PlainHeader>Cursos</PlainHeader>}
                    <PlainHeader>Módulos</PlainHeader>
                    <FilterHeader
                      label="Acciones"
                      tooltip="Filtrar por estado (habilitadas / deshabilitadas)"
                      value={status}
                      options={STATUS_FILTER_OPTIONS}
                      onChange={onStatusFilterChange}
                      align="right"
                      className="pl-3 pr-4"
                    />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {subjects.map((m) => {
                    const isActive = isSubjectActive(m);
                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors duration-150 ${rowsNavigate ? 'cursor-pointer' : ''} ${inactiveRowClass(isActive)}`}
                        onClick={rowsNavigate ? () => goToDetail(m) : undefined}
                      >
                        <td className={`pl-4 pr-3 py-1.5 font-medium ${isActive ? 'text-gray-900' : INACTIVE_ROW_TEXT}`}>
                          <span className="line-clamp-1">{m.nombre}</span>
                        </td>
                        {showCourses && (
                          <td className="px-3 py-1.5">
                            <CourseTags titles={courseTitles(m)} muted={!isActive} />
                          </td>
                        )}
                        <td className={`px-3 py-1.5 whitespace-nowrap ${isActive ? 'text-gray-600' : INACTIVE_ROW_TEXT}`}>
                          {moduleCount(m)}
                        </td>
                        <td className="pl-3 pr-4 py-1.5 whitespace-nowrap">{renderActions(m)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default SubjectList;
