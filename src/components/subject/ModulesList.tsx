import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import ToastNotification from '../ui/ToastNotification';
import { type Module } from '@/types/types';
import { Edit2, Trash2, Loader2, Users, UserMinus } from 'lucide-react';
import { CoursesAPI } from '@/service/courses';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ModulesListProps {
  modules: Module[];
  materiaId: string;
  onDelete?: (id: string) => void;
  onEdit?: (module: Module) => void;
  /** Estado habilitado por módulo desde la BD (usuarios con esta materia) para el Switch */
  defaultEnabledByModule?: Record<string, boolean>;
  /** Llamado tras un toggle exitoso para que el padre pueda refetch la materia y actualizar el estado */
  onToggleSuccess?: () => void | Promise<void>;
}

export const ModulesList = ({ modules, materiaId, onDelete, onEdit, defaultEnabledByModule, onToggleSuccess }: ModulesListProps) => {
  const [toastState, setToastState] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingModuleId, setTogglingModuleId] = useState<string | null>(null);
  const [moduleEnabledStates, setModuleEnabledStates] = useState<Record<string, boolean>>({});
  const [moduloExcepciones, setModuloExcepciones] = useState<Record<string, Array<{ id: string; nombre: string }>>>({});
  const [, setTotalStudentsWithMateria] = useState(0);
  const [loadingExcepciones, setLoadingExcepciones] = useState(true);

  const closeToast = () => setToastState(null);

  const refetchExcepciones = (silent = false) => {
    if (!materiaId || !modules.length) return;
    if (!silent) setLoadingExcepciones(true);
    CoursesAPI.getModuloExcepciones(materiaId, modules.map((m) => m.id))
      .then(({ excepciones, totalStudentsWithMateria: total }) => {
        setModuloExcepciones(excepciones);
        setTotalStudentsWithMateria(total);
      })
      .catch(() => {
        setModuloExcepciones({});
        setTotalStudentsWithMateria(0);
      })
      .finally(() => { if (!silent) setLoadingExcepciones(false); });
  };

  useEffect(() => {
    if (!materiaId || !modules.length) {
      setModuloExcepciones({});
      setTotalStudentsWithMateria(0);
      setLoadingExcepciones(false);
      return;
    }
    refetchExcepciones();
  }, [materiaId, modules.map((m) => m.id).join(',')]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    if (onDelete) {
      await onDelete(id);
    }
    setTimeout(() => setDeletingId(null), 1000);
  };

  const handleToggleModuleForAll = async (moduleId: string, enabled: boolean) => {
    setTogglingModuleId(moduleId);
    try {
      const response = await CoursesAPI.toggleModuleForAllStudents(materiaId, moduleId, enabled);
      setModuleEnabledStates(prev => ({ ...prev, [moduleId]: enabled }));
      toast.success(
        response.message || 
        `Módulo ${enabled ? 'habilitado' : 'deshabilitado'} para ${response.updatedUsers || 0} estudiantes`
      );
      await onToggleSuccess?.();
      refetchExcepciones(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar módulos';
      toast.error(errorMessage);
      setToastState({ message: errorMessage, type: 'error' });
    } finally {
      setTogglingModuleId(null);
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
                  <div className="flex flex-col gap-1">
                    {loadingExcepciones ? (
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 min-w-[180px]">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        <span className="text-xs text-gray-600 whitespace-nowrap">Cargando...</span>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {togglingModuleId === m.id ? 'Actualizando...' : 'Habilitado por defecto'}
                          </span>
                          {togglingModuleId === m.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : (
                            <Switch
                              checked={moduleEnabledStates[m.id] !== undefined ? moduleEnabledStates[m.id] : (defaultEnabledByModule?.[m.id] ?? false)}
                              onCheckedChange={(checked) => {
                                handleToggleModuleForAll(m.id, checked);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              disabled={togglingModuleId !== null}
                              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500 disabled:opacity-50"
                            />
                          )}
                        </div>
                        {(moduloExcepciones[m.id]?.length ?? 0) > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <UserMinus className="w-4 h-4 mr-1.5" />
                            {moduloExcepciones[m.id].length} estudiante{moduloExcepciones[m.id].length !== 1 ? 's' : ''} no habilitado{moduloExcepciones[m.id].length !== 1 ? 's' : ''}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end" onClick={(e) => e.stopPropagation()}>
                          <p className="font-medium text-amber-800 mb-2">Estudiantes sin este módulo habilitado</p>
                          <p className="text-sm text-gray-600 mb-2">
                            Los siguientes tienen este módulo deshabilitado individualmente:
                          </p>
                          <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                            {moduloExcepciones[m.id].map((s) => (
                              <li key={s.id} className="flex items-center gap-2 py-1 px-2 rounded bg-amber-50">
                                <UserMinus className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                {s.nombre}
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      {toastState && (
        <ToastNotification
          message={toastState.message}
          type={toastState.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default ModulesList;
