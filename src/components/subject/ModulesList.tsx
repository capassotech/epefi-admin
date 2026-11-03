import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { IconAction } from '@/components/ui/icon-action';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { INACTIVE_ROW_TEXT, inactiveRowClass } from '@/utils/tableState';
import { type Module } from '@/types/types';
import { Edit2, Trash2, Loader2, UserMinus } from 'lucide-react';
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
  const [togglingModuleId, setTogglingModuleId] = useState<string | null>(null);
  const [moduleEnabledStates, setModuleEnabledStates] = useState<Record<string, boolean>>({});
  const [moduloExcepciones, setModuloExcepciones] = useState<Record<string, Array<{ id: string; nombre: string }>>>({});
  const [, setTotalStudentsWithMateria] = useState(0);
  const [loadingExcepciones, setLoadingExcepciones] = useState(true);

  useEffect(() => {
    if (defaultEnabledByModule && Object.keys(defaultEnabledByModule).length > 0) {
      setModuleEnabledStates(defaultEnabledByModule);
    }
  }, [defaultEnabledByModule]);

  const refetchExcepciones = (silent = false) => {
    if (!materiaId) return;
    if (!silent) setLoadingExcepciones(true);
    CoursesAPI.getModuloExcepciones(materiaId)
      .then(({ excepciones, totalStudentsWithMateria: total }) => {
        setModuloExcepciones(excepciones);
        setTotalStudentsWithMateria(total);
      })
      .catch(() => {
        setModuloExcepciones({});
        setTotalStudentsWithMateria(0);
        if (!silent) {
          toast.error("No se pudo cargar la lista de excepciones por módulo");
        }
      })
      .finally(() => { if (!silent) setLoadingExcepciones(false); });
  };

  useEffect(() => {
    if (!materiaId) {
      setModuloExcepciones({});
      setTotalStudentsWithMateria(0);
      setLoadingExcepciones(false);
      return;
    }
    refetchExcepciones();
  }, [materiaId, modules.length]);

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
    } finally {
      setTogglingModuleId(null);
    }
  };

  const isModuleEnabled = (id: string) =>
    moduleEnabledStates[id] !== undefined ? moduleEnabledStates[id] : (defaultEnabledByModule?.[id] ?? false);

  return (
    <TooltipProvider delayDuration={300}>
    <div className="admin-card overflow-hidden">
      {modules.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">No hay módulos registrados.</p>
      ) : (
        <ul role="list" className="divide-y divide-gray-100 bg-white">
          {modules.map((m) => {
            const isEnabled = isModuleEnabled(m.id);
            const excepciones = moduloExcepciones[m.id] ?? [];
            return (
              <li
                key={m.id}
                className={`flex items-center gap-3 px-4 py-2 transition-colors duration-150 ${inactiveRowClass(isEnabled || loadingExcepciones)}`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      isEnabled || loadingExcepciones ? "text-gray-900" : INACTIVE_ROW_TEXT
                    }`}
                  >
                    {m.titulo}
                  </p>
                  {m.descripcion && (
                    <p className="truncate text-xs text-gray-500">{m.descripcion}</p>
                  )}
                </div>

                {!loadingExcepciones && excepciones.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <UserMinus className="w-3 h-3" />
                        {excepciones.length} no habilitado{excepciones.length !== 1 ? 's' : ''}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-2rem)] max-w-80 sm:w-80" align="end">
                      <p className="font-medium text-amber-800 mb-2">Estudiantes sin este módulo habilitado</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Los siguientes tienen este módulo deshabilitado individualmente:
                      </p>
                      <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                        {excepciones.map((s) => (
                          <li key={s.id} className="flex items-center gap-2 py-1 px-2 rounded bg-amber-50">
                            <UserMinus className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            {s.nombre}
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                )}

                <div className="flex shrink-0 items-center gap-0.5">
                  <IconAction label="Editar módulo" onClick={() => onEdit?.(m)}>
                    <Edit2 />
                  </IconAction>
                  <IconAction
                    label="Eliminar módulo"
                    onClick={() => onDelete?.(m.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 />
                  </IconAction>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="grid place-items-center w-10 h-8">
                        {loadingExcepciones || togglingModuleId === m.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleToggleModuleForAll(m.id, checked)}
                            disabled={togglingModuleId !== null}
                            aria-label={isEnabled ? "Deshabilitar módulo para todos" : "Habilitar módulo para todos"}
                            className="scale-90 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 disabled:opacity-50"
                          />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{isEnabled ? "Habilitado por defecto para los alumnos" : "Deshabilitado por defecto"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </TooltipProvider>
  );
};

export default ModulesList;
