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
import { FilterHeader, SortableHeader } from "../common/TableHeaders";
import {
  INACTIVE_ROW_TEXT,
  STATUS_FILTER_OPTIONS,
  inactiveRowClass,
  type ColumnSort,
  type SortDirection,
} from "@/utils/tableState";
import { type StudentDB } from "@/types/types";
import { CreateUserModal } from "./CreateUserModal";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CoursesAsignStudentModal } from "./CoursesAsignStudentModal";
import { BulkAssignCoursesModal } from "./BulkAssignCoursesModal";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { IconAction } from "../ui/icon-action";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { StudentsAPI } from "@/service/students";
import { toast } from "sonner";

interface StudentListProps {
  students: StudentDB[];
  onDelete: (id: string) => void;
  onUserUpdated?: (user?: StudentDB, meta?: { isCreate: boolean }) => void;
  onStatusChange?: () => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  /** Ciclo por columna: asc → desc → sin orden de columna (null) */
  onSortChange?: (sort: ColumnSort) => void;
  role?: string;
  /** undefined = todos los roles */
  onRoleChange?: (role: string | undefined) => void;
  status?: string;
  /** undefined = activos e inactivos */
  onStatusFilterChange?: (status: string | undefined) => void;
}

const ROLE_OPTIONS = [
  { value: "all", label: "Todos los roles" },
  { value: "student", label: "Estudiante" },
  { value: "admin", label: "Administrador" },
];

export function StudentList({
  students,
  onUserUpdated,
  onStatusChange,
  sortBy,
  sortDirection,
  onSortChange,
  role,
  onRoleChange,
  status,
  onStatusFilterChange,
}: StudentListProps) {
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
          <span className="font-medium text-blue-900 flex-1 min-w-0">
            {selectedStudents.length} usuario{selectedStudents.length !== 1 ? "s" : ""} seleccionado
            {selectedStudents.length !== 1 ? "s" : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-blue-200 text-blue-800 hover:bg-blue-100 w-full sm:w-auto"
            onClick={() => setSelectedRowIds([])}
          >
            Limpiar selección
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
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
      <div className="block md:hidden divide-y divide-gray-200 rounded-md border border-gray-200 bg-white shadow-sm overflow-hidden">
        {students.map((student, index) => (
          <div
            key={student.id || student.uid || `student-mobile-${index}`}
            className="p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            {/* Cabecera: avatar + nombre + rol */}
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => navigate(`/students/${student.id}`)}
            >
              <div
                className="flex-shrink-0 pt-1"
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
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 break-words">{getFullName(student)}</p>
                <p className="text-sm text-gray-600 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  {student.email || "Sin email"}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
            </div>

            {/* Acciones */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/students/${student.id}`)}
                className="h-9 w-full justify-center border-green-200 text-green-700 hover:bg-green-50 cursor-pointer"
                data-tour="view-student-details"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Ver
              </Button>

              <div className="w-full">
                <CreateUserModal
                  onUserCreated={onUserUpdated}
                  triggerText=""
                  isEditing={true}
                  editingUser={student}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full justify-center border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
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
                className="h-9 w-full justify-center bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
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
                className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg transition-colors min-h-9 ${
                  (student.activo ?? false)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                data-tour="toggle-student-status"
              >
                <span className={`text-sm font-medium ${
                  (student.activo ?? false) ? 'text-green-700' : 'text-red-700'
                }`}>
                  {updatingStatusId === student.id
                    ? '...'
                    : (student.activo ?? false) ? 'Activo' : 'Inactivo'}
                </span>
                {updatingStatusId === student.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500 shrink-0" />
                ) : (
                  <Switch
                    checked={student.activo ?? false}
                    onCheckedChange={() => handleStatusChange(student.id, student.activo ?? false)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={updatingStatusId !== null}
                    className="shrink-0 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500 disabled:opacity-50"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Vista desktop: tabla ── */}
      <TooltipProvider delayDuration={300}>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 pl-4 pr-1 py-2.5 text-left align-middle">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos los usuarios visibles"
                />
              </th>
              <SortableHeader
                label="Nombre"
                column="name"
                defaultLabel="fecha de creación"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              />
              <SortableHeader
                label="Email"
                column="email"
                defaultLabel="fecha de creación"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              />
              <FilterHeader
                label="Rol"
                tooltip="Filtrar por rol"
                value={role}
                options={ROLE_OPTIONS}
                onChange={onRoleChange}
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
            {students.map((student, index) => {
              const isActive = student.activo ?? false;
              return (
              <tr
                key={student.id || student.uid || `student-${index}`}
                className={`transition-colors duration-150 cursor-pointer ${inactiveRowClass(isActive)}`}
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <td
                  className="w-10 pl-4 pr-1 py-1.5 align-middle"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedRowIds.includes(student.id)}
                    onCheckedChange={() => toggleRow(student.id)}
                    aria-label={`Seleccionar ${getFullName(student)}`}
                  />
                </td>
                <td className={`px-3 py-1.5 whitespace-nowrap font-medium ${isActive ? "text-gray-900" : INACTIVE_ROW_TEXT}`}>
                  {getFullName(student)}
                </td>
                <td className={`px-3 py-1.5 whitespace-nowrap ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                  {student.email || "Sin email"}
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <div className={`flex items-center gap-1 ${isActive ? "" : "opacity-50 [&>span]:line-through [&>span]:decoration-red-500"}`}>
                    {student.role?.admin && (
                      <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-purple-50 text-purple-700">
                        Admin
                      </span>
                    )}
                    {student.role?.student && (
                      <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        Estudiante
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="pl-3 pr-4 py-1.5 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-0.5">
                    <IconAction
                      label="Ver detalles"
                      onClick={() => navigate(`/students/${student.id}`)}
                      data-tour="view-student-details"
                    >
                      <Eye />
                    </IconAction>
                    <CreateUserModal
                      onUserCreated={onUserUpdated}
                      triggerText=""
                      isEditing={true}
                      editingUser={student}
                    >
                      <IconAction label="Editar usuario" data-tour="edit-student">
                        <Edit2 />
                      </IconAction>
                    </CreateUserModal>
                    <IconAction
                      label={
                        disableIndividualCursos
                          ? "Con usuarios seleccionados, usá «Asignar cursos al grupo»"
                          : "Asignar cursos"
                      }
                      disabled={disableIndividualCursos}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setSelectedCourseIds([]);
                        setAssignDialogOpen(true);
                      }}
                      data-tour="assign-courses"
                    >
                      <Calendar />
                    </IconAction>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="grid place-items-center w-10 h-8" data-tour="toggle-student-status">
                          {updatingStatusId === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleStatusChange(student.id, isActive)}
                              disabled={updatingStatusId !== null}
                              aria-label={isActive ? "Deshabilitar usuario" : "Habilitar usuario"}
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
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </TooltipProvider>
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
