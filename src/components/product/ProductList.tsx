// components/product/ProductList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CoursesAPI } from "@/service/courses";
import { StudentsAPI } from "@/service/students";
import { Link } from "react-router-dom";
import ToastNotification from "../ui/ToastNotification";
import { formatCurrency } from '@/utils/currency';
import { Pencil, Loader2, AlertTriangle } from 'lucide-react';
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

// Componente para manejar imágenes con placeholder
const ImageWithPlaceholder = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300`}>
        <p className="text-gray-400 text-[10px] sm:text-xs font-medium text-center px-1">Sin imagen</p>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      onError={() => setHasError(true)}
      className={className}
      alt={alt}
    />
  );
};

interface ProductListProps {
  products: Course[];
  onProductUpdated?: (id: string, newEstado: "activo" | "inactivo") => void;
}

export const ProductList = ({ products, onProductUpdated }: ProductListProps) => {
  const navigate = useNavigate();
  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingCourse, setPendingCourse] = useState<{ course: Course; newState: boolean } | null>(null);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [loadingStudentsCount, setLoadingStudentsCount] = useState(false);

  const closeToast = () => setToastState(null);

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

  return (
    <div className="space-y-4">
      {/* Lista */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul role="list" className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500">
              No hay cursos registrados.
            </li>
          ) : (
            products.map((f) => (
              <li
                key={f.id}
                className="px-6 py-5 bg-white hover:bg-gray-50 border-b border-gray-200 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  {/* Imagen */}
                  <div className="flex-shrink-0">
                    <ImageWithPlaceholder
                      src={f.image || (f as any).imagen}
                      alt={f.titulo}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                    />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <Link
                            to={`/products/${encodeURIComponent(f.id)}`}
                            className="text-base sm:text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
                          >
                            {f.titulo}
                          </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 mb-2">
                          <span className="font-medium">📚 {f.materias?.length || 0} materias</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-1 flex-1 sm:mr-4">
                            {f.descripcion}
                          </p>
                          <p className="text-base sm:text-lg font-bold text-gray-900 flex-shrink-0">
                            {formatCurrency(f.precio)}
                          </p>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const id = f.id;

                            if (
                              !id ||
                              typeof id !== "string" ||
                              id.trim().length === 0
                            ) {
                              console.error("Curso sin ID válido:", f);
                              setToastState({
                                message:
                                  "Error: Este curso no tiene un ID válido.",
                                type: "error",
                              });
                              return;
                            }

                            navigate(`/products/${encodeURIComponent(id)}/edit`);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1.5" />
                          Editar
                        </Button>
                        
                        <div 
                          data-tour="switch-toggle"
                          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                            (f.estado === "activo")
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <span className={`text-xs whitespace-nowrap font-medium ${
                            (f.estado === "activo")
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {updatingStatusId === f.id ? 'Actualizando...' : ((f.estado === "activo") ? 'Habilitado' : 'Deshabilitado')}
                          </span>
                          {updatingStatusId === f.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : (
                            <Switch
                              checked={f.estado === "activo"}
                              onCheckedChange={(checked) => {
                                handleToggleActive(f, checked);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              disabled={updatingStatusId !== null}
                              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500 disabled:opacity-50"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      {/* Toast de notificación */}
      {toastState && (
        <ToastNotification
          message={toastState.message}
          type={toastState.type}
          onClose={closeToast}
        />
      )}

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
  );
};

export default ProductList;
