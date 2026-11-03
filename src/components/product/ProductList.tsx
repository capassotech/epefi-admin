// components/product/ProductList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { IconAction } from "@/components/ui/icon-action";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterHeader, PlainHeader, SortableHeader } from "@/components/common/TableHeaders";
import {
  INACTIVE_ROW_TEXT,
  STATUS_FILTER_OPTIONS,
  inactiveRowClass,
  type ColumnSort,
  type SortDirection,
} from "@/utils/tableState";
import { CoursesAPI } from "@/service/courses";
import { StudentsAPI } from "@/service/students";
import { formatCurrency } from '@/utils/currency';
import { Pencil, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { toast } from "sonner";
import type { Course, StudentDB } from "@/types/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductListProps {
  products: Course[];
  onProductUpdated?: (id: string, newEstado: "activo" | "inactivo") => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSortChange?: (sort: ColumnSort) => void;
  status?: string;
  /** undefined = habilitados y deshabilitados */
  onStatusFilterChange?: (status: string | undefined) => void;
}

export const ProductList = ({
  products,
  onProductUpdated,
  sortBy,
  sortDirection,
  onSortChange,
  status,
  onStatusFilterChange,
}: ProductListProps) => {
  const navigate = useNavigate();
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingCourse, setPendingCourse] = useState<{ course: Course; newState: boolean } | null>(null);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [loadingStudentsCount, setLoadingStudentsCount] = useState(false);

  const handleToggleActive = async (formacion: Course, newActiveState: boolean) => {
    // Si se va a deshabilitar, mostrar advertencia primero
    if (!newActiveState) {
      setLoadingStudentsCount(true);
      try {
        // Obtener todos los estudiantes y contar cuántos tienen este curso asignado
        const allStudents = await StudentsAPI.getAll();
        const studentsWithCourse = allStudents.filter((student: StudentDB) => 
          student.cursos_asignados?.includes(formacion.id)
        );
        setStudentsCount(studentsWithCourse.length);
        setPendingCourse({ course: formacion, newState: newActiveState });
        setShowDisableConfirm(true);
      } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        // Si hay error, continuar de todas formas pero sin mostrar el conteo
        setStudentsCount(0);
        setPendingCourse({ course: formacion, newState: newActiveState });
        setShowDisableConfirm(true);
      } finally {
        setLoadingStudentsCount(false);
      }
      return;
    }

    // Si se va a habilitar, proceder directamente
    await executeToggleActive(formacion, newActiveState);
  };

  const executeToggleActive = async (formacion: Course, newActiveState: boolean) => {
    setUpdatingStatusId(formacion.id);
    try {
      // Usar el endpoint específico para alternar el estado
      const updatedCourse = await CoursesAPI.toggleStatus(formacion.id);
      // Intentar leer el estado de diferentes formas posibles
      let newEstado: "activo" | "inactivo";
      if (updatedCourse.estado) {
        newEstado = updatedCourse.estado === "activo" ? "activo" : "inactivo";
      } else if (updatedCourse.estado_curso) {
        newEstado = updatedCourse.estado_curso === "activo" ? "activo" : "inactivo";
      } else if (updatedCourse.activo !== undefined) {
        newEstado = updatedCourse.activo ? "activo" : "inactivo";
      } else {
        // Si el backend no retorna el estado, usar el estado esperado basado en el switch
        newEstado = newActiveState ? "activo" : "inactivo";
      }
      
      console.log('Estado actualizado del curso:', {
        id: formacion.id,
        estadoAnterior: formacion.estado,
        estadoNuevo: newEstado,
        newActiveState,
        updatedCourse
      });
      
      // Si se deshabilita el curso, desasignarlo de todos los estudiantes
      if (newEstado === "inactivo") {
        try {
          const allStudents = await StudentsAPI.getAll();
          const studentsWithCourse = allStudents.filter((student: StudentDB) => 
            student.cursos_asignados?.includes(formacion.id)
          );
          
          // Desasignar de todos los estudiantes que la tengan
          for (const student of studentsWithCourse) {
            try {
              const updatedCursos = (student.cursos_asignados || []).filter((cid: string) => cid !== formacion.id);
              await StudentsAPI.updateStudent(student.id, {
                ...student,
                cursos_asignados: updatedCursos,
              });
            } catch (error) {
              console.error(`Error al desasignar curso del estudiante ${student.id}:`, error);
            }
          }
          
          if (studentsWithCourse.length > 0) {
            toast.success(
              `Curso deshabilitado y desasignado de ${studentsWithCourse.length} estudiante${studentsWithCourse.length > 1 ? 's' : ''}`
            );
          } else {
            toast.success(
              `Curso ${updatedCourse.titulo || formacion.titulo} deshabilitado correctamente`
            );
          }
        } catch (error) {
          console.error('Error al obtener estudiantes:', error);
          toast.success(`Curso ${updatedCourse.titulo || formacion.titulo} deshabilitado correctamente`);
        }
      } else {
        toast.success(
          `Curso ${updatedCourse.titulo || formacion.titulo} habilitado correctamente`
        );
      }
      
      if (onProductUpdated) {
        // Actualizamos el estado local en el padre para que el switch
        // refleje inmediatamente el nuevo estado sin depender solo del refetch
        console.log('Llamando a onProductUpdated con:', { id: formacion.id, newEstado });
        onProductUpdated(formacion.id, newEstado);
      }
    } catch (error) {
      console.error('Error al cambiar estado del curso:', error);
      toast.error('Error al cambiar el estado del curso');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const goToEdit = (f: Course) => {
    const id = f.id;
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      console.error("Curso sin ID válido:", f);
      toast.error("Este curso no tiene un ID válido.");
      return;
    }
    navigate(`/products/${encodeURIComponent(id)}/edit`);
  };

  const renderActions = (f: Course, tour: boolean) => {
    const isActive = f.estado === "activo";
    return (
      <div
        className="flex items-center justify-end gap-0.5"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <IconAction label="Ver curso" onClick={() => navigate(`/products/${encodeURIComponent(f.id)}`)}>
          <Eye />
        </IconAction>
        <IconAction label="Editar curso" onClick={() => goToEdit(f)}>
          <Pencil />
        </IconAction>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="grid place-items-center w-10 h-8" data-tour={tour ? "switch-toggle" : undefined}>
              {updatingStatusId === f.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => handleToggleActive(f, checked)}
                  disabled={updatingStatusId !== null || loadingStudentsCount}
                  aria-label={isActive ? "Deshabilitar curso" : "Habilitar curso"}
                  className="scale-90 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 disabled:opacity-50"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isActive ? "Habilitado" : "Deshabilitado"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
    <div className="admin-card overflow-hidden">
      {/* ── Vista mobile: filas compactas ── */}
      <ul role="list" className="block md:hidden divide-y divide-gray-100 bg-white">
        {products.map((f, index) => {
          const isActive = f.estado === "activo";
          return (
            <li
              key={f.id}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${inactiveRowClass(isActive)}`}
              onClick={() => navigate(`/products/${encodeURIComponent(f.id)}`)}
            >
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isActive ? "text-gray-900" : INACTIVE_ROW_TEXT}`}>
                  {f.titulo}
                </p>
                <p className={`text-xs ${isActive ? "text-gray-500" : INACTIVE_ROW_TEXT}`}>
                  {formatCurrency(f.precio)} · {f.materias?.length || 0} materias
                </p>
              </div>
              {renderActions(f, index === 0)}
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
                label="Título"
                column="title"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
                className="pl-4 pr-3"
              />
              <PlainHeader>Materias</PlainHeader>
              <SortableHeader
                label="Precio"
                column="price"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
                ascHint="menor a mayor"
                descHint="mayor a menor"
              />
              <FilterHeader
                label="Acciones"
                tooltip="Filtrar por estado (habilitados / deshabilitados)"
                value={status}
                options={STATUS_FILTER_OPTIONS}
                onChange={onStatusFilterChange}
                align="right"
                className="pl-3 pr-4"
              />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {products.map((f, index) => {
              const isActive = f.estado === "activo";
              return (
                <tr
                  key={f.id}
                  className={`transition-colors duration-150 cursor-pointer ${inactiveRowClass(isActive)}`}
                  onClick={() => navigate(`/products/${encodeURIComponent(f.id)}`)}
                >
                  <td className={`pl-4 pr-3 py-1.5 font-medium ${isActive ? "text-gray-900" : INACTIVE_ROW_TEXT}`}>
                    <span className="line-clamp-1">{f.titulo}</span>
                  </td>
                  <td className={`px-3 py-1.5 whitespace-nowrap ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                    {f.materias?.length || 0}
                  </td>
                  <td className={`px-3 py-1.5 whitespace-nowrap tabular-nums ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                    {formatCurrency(f.precio)}
                  </td>
                  <td className="pl-3 pr-4 py-1.5 whitespace-nowrap">{renderActions(f, index === 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Modal de confirmación para deshabilitar curso */}
      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Advertencia: Deshabilitar Curso
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left pt-2 space-y-3">
              <p>
                ¿Estás seguro de que deseas deshabilitar el curso <strong>"{pendingCourse?.course.titulo}"</strong>?
              </p>
              {loadingStudentsCount ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando estudiantes asignados...</span>
                </div>
              ) : studentsCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    ⚠️ Este curso está asignado a {studentsCount} estudiante{studentsCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-amber-700">
                    Al deshabilitar el curso, se desasignará automáticamente de todos los estudiantes que lo tengan actualmente.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Este curso no tiene estudiantes asignados actualmente.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDisableConfirm(false);
                setPendingCourse(null);
                setStudentsCount(0);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowDisableConfirm(false);
                if (pendingCourse) {
                  await executeToggleActive(pendingCourse.course, pendingCourse.newState);
                  setPendingCourse(null);
                  setStudentsCount(0);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Sí, deshabilitar curso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
};

export default ProductList;
