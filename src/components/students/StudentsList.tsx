// src/components/student/StudentList.tsx
import {
  Mail,
  // Calendar,
  Edit2,
  Loader2,
  Calendar,
  Eye,
  Users,
} from "lucide-react";
import { type StudentDB } from "@/types/types";
import { CreateUserModal } from "./CreateUserModal";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CoursesAsignStudentModal } from "./CoursesAsignStudentModal";
import { BulkAssignCoursesModal } from "./BulkAssignCoursesModal";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { StudentsAPI } from "@/service/students";
import { toast } from "sonner";

interface StudentListProps {
  students: StudentDB[];
  onDelete: (id: string) => void;
  onUserUpdated?: (user?: StudentDB, meta?: { isCreate: boolean }) => void;
  onStatusChange?: () => void;
}

export function StudentList({ students, onUserUpdated, onStatusChange }: StudentListProps) {
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkSelectedCourseIds, setBulkSelectedCourseIds] = useState<string[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRowIds((prev) => prev.filter((id) => students.some((s) => s.id === id)));
  }, [students]);

  const selectedStudents = students.filter((s) => selectedRowIds.includes(s.id));
  const disableIndividualCursos = selectedRowIds.length > 0;
  const allRowIds = students.map((s) => s.id);
  const selectedInViewCount = students.filter((s) => selectedRowIds.includes(s.id)).length;
  const allSelected = students.length > 0 && selectedInViewCount === students.length;
  const someSelected = selectedInViewCount > 0 && selectedInViewCount < students.length;

  const toggleRow = (id: string) => {
    setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRowIds((prev) => prev.filter((id) => !allRowIds.includes(id)));
    } else {
      setSelectedRowIds((prev) => Array.from(new Set([...prev, ...allRowIds])));
    }
  };

  const handleStatusChange = async (id: string, currentStatus: boolean) => {
    setUpdatingStatusId(id);
    try {
      const student = students.find(s => s.id === id);
      if (!student) return;
      
      await StudentsAPI.updateStudent(id, {
        activo: !currentStatus,
      });
      toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error al actualizar estado del usuario:', error);
      toast.error('Error al actualizar el estado del usuario');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getErrorMessage = (e: unknown) => {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    try {
      return JSON.stringify(e);
    } catch {
      return "Ocurrió un error inesperado";
    }
  };
  // const formatDate = (
  //   timestamp: { _seconds: number; _nanoseconds: number } | undefined
  // ) => {
  //   if (!timestamp || !timestamp._seconds) return "N/A";
  //   return new Date(timestamp._seconds * 1000).toLocaleDateString("es-AR", {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //   });
  // };

  const getFullName = (student: StudentDB) => {
    return (
      `${student.nombre || ""} ${student.apellido || ""}`.trim() || "Sin nombre"
    );
  };

  return (
    <div className="admin-card overflow-hidden">
      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100 text-sm">
          <Users className="w-4 h-4 text-blue-700 shrink-0" />
          <span className="font-medium text-blue-900">
            {selectedStudents.length} usuario{selectedStudents.length !== 1 ? "s" : ""} seleccionado
            {selectedStudents.length !== 1 ? "s" : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-blue-200 text-blue-800 hover:bg-blue-100"
            onClick={() => setSelectedRowIds([])}
          >
            Limpiar selección
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              setBulkSelectedCourseIds([]);
              setBulkAssignOpen(true);
            }}
            data-tour="bulk-assign-courses"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Asignar cursos al grupo
          </Button>
        </div>
      )}

      {/* ── Vista mobile: tarjetas ── */}
      <div className="block md:hidden divide-y divide-gray-100">
        {students.map((student, index) => (
          <div
            key={student.id || student.uid || `student-mobile-${index}`}
            className="p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            {/* Cabecera: avatar + nombre + rol */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/students/${student.id}`)}
            >
              <div
                className="flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedRowIds.includes(student.id)}
                  onCheckedChange={() => toggleRow(student.id)}
                  aria-label={`Seleccionar ${getFullName(student)}`}
                />
              </div>
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {student.nombre?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{getFullName(student)}</p>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  {student.email || "Sin email"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                {student.role?.admin && (
                  <span className="px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-purple-100 text-purple-800">
                    Admin
                  </span>
                )}
                {student.role?.student && (
                  <span className="px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-blue-100 text-blue-800">
                    Alumno
                  </span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/students/${student.id}`)}
                className="h-8 flex-1 min-w-[100px] border-green-200 text-green-700 hover:bg-green-50 cursor-pointer"
                data-tour="view-student-details"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Ver Detalles
              </Button>

              <div className="flex-1 min-w-[80px]">
                <CreateUserModal
                  onUserCreated={onUserUpdated}
                  triggerText=""
                  isEditing={true}
                  editingUser={student}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
                    data-tour="edit-student"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>
                </CreateUserModal>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={disableIndividualCursos}
                onClick={() => {
                  setSelectedStudentId(student.id);
                  setSelectedCourseIds([]);
                  setAssignDialogOpen(true);
                }}
                className="h-8 flex-1 min-w-[80px] bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                title={
                  disableIndividualCursos
                    ? "Con la selección activa, usa «Asignar cursos al grupo» arriba."
                    : "Asignar cursos a este usuario"
                }
                data-tour="assign-courses"
              >
                <Calendar className="w-3.5 h-3.5 mr-1 text-white" />
                Cursos
              </Button>

              {/* Toggle estado */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors flex-1 min-w-[110px] ${
                  (student.activo ?? false)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                data-tour="toggle-student-status"
              >
                <span className={`text-xs font-medium whitespace-nowrap ${
                  (student.activo ?? false) ? 'text-green-700' : 'text-red-700'
                }`}>
                  {updatingStatusId === student.id
                    ? 'Actualizando...'
                    : (student.activo ?? false) ? 'Habilitado' : 'Deshabilitado'}
                </span>
                {updatingStatusId === student.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500 ml-auto" />
                ) : (
                  <Switch
                    checked={student.activo ?? false}
                    onCheckedChange={() => handleStatusChange(student.id, student.activo ?? false)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={updatingStatusId !== null}
                    className="ml-auto data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500 disabled:opacity-50"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Vista desktop: tabla ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 pl-4 pr-2 py-3 text-left align-middle">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos los usuarios visibles"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student, index) => (
              <tr
                key={student.id || student.uid || `student-${index}`}
                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <td
                  className="w-12 pl-4 pr-2 py-4 align-middle"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedRowIds.includes(student.id)}
                    onCheckedChange={() => toggleRow(student.id)}
                    aria-label={`Seleccionar ${getFullName(student)}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {student.nombre?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">
                        {getFullName(student)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-gray-900">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {student.email || "Sin email"}
                  </div>
                </td>
                <td className="px-1 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {student.role?.admin && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    )}
                    {student.role?.student && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Estudiante
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/students/${student.id}`);
                      }}
                      className="h-9 w-[140px] px-3 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 hover:text-green-800 transition-all duration-200 shadow-sm cursor-pointer"
                      title="Ver detalles del estudiante"
                      data-tour="view-student-details"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Ver Detalles
                    </Button>
                    <div onClick={(e) => e.stopPropagation()}>
                      <CreateUserModal
                        onUserCreated={onUserUpdated}
                        triggerText=""
                        isEditing={true}
                        editingUser={student}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-[140px] px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm cursor-pointer"
                          title="Editar usuario"
                          data-tour="edit-student"
                        >
                          <Edit2 className="w-4 h-4 mr-1.5" />
                          Editar
                        </Button>
                      </CreateUserModal>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={disableIndividualCursos}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentId(student.id);
                        setSelectedCourseIds([]);
                        setAssignDialogOpen(true);
                      }}
                      className=" bg-blue-600 w-[140px] text-white hover:bg-blue-700 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                      title={
                        disableIndividualCursos
                          ? "Con la selección activa, usa «Asignar cursos al grupo» arriba."
                          : "Asignar cursos"
                      }
                      data-tour="assign-courses"
                    >
                      <Calendar className="w-4 h-4 mr-1.5 text-white" />
                      Cursos
                    </Button>
                    <div 
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors w-[140px] ${
                        (student.activo ?? false)
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      data-tour="toggle-student-status"
                    >
                      <span className={`text-xs whitespace-nowrap font-medium ${
                        (student.activo ?? false)
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {updatingStatusId === student.id ? 'Actualizando...' : ((student.activo ?? false) ? 'Habilitado' : 'Deshabilitado')}
                      </span>
                      {updatingStatusId === student.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      ) : (
                        <Switch
                          checked={student.activo ?? false}
                          onCheckedChange={() => handleStatusChange(student.id, student.activo ?? false)}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          disabled={updatingStatusId !== null}
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500 disabled:opacity-50"
                        />
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CoursesAsignStudentModal
        id={selectedStudentId}
        assignDialogOpen={assignDialogOpen}
        setAssignDialogOpen={(open) => {
          setAssignDialogOpen(open);
          if (!open) {
            setSelectedCourseIds([]);
            setSelectedStudentId(null);
          }
        }}
        selectedCourseIds={selectedCourseIds}
        setSelectedCourseIds={setSelectedCourseIds}
        getErrorMessage={getErrorMessage}
        setCourses={() => {}}
        showTrigger={false}
        onCoursesUpdated={onUserUpdated}
      />
      <BulkAssignCoursesModal
        open={bulkAssignOpen}
        onOpenChange={(open) => {
          setBulkAssignOpen(open);
          if (!open) setBulkSelectedCourseIds([]);
        }}
        students={selectedStudents}
        selectedCourseIds={bulkSelectedCourseIds}
        setSelectedCourseIds={setBulkSelectedCourseIds}
        getErrorMessage={getErrorMessage}
        onSuccess={async () => {
          setSelectedRowIds([]);
          await onUserUpdated?.();
        }}
      />
    </div>
  );
}
