// src/components/student/StudentList.tsx
import {
  Edit2,
  Loader2,
  Calendar,
  Eye,
  Users,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { FilterHeader, FilterMenuButton, PlainHeader, SortableHeader } from "../common/TableHeaders";
import { getFechaRegistroSeconds } from "@/utils/studentDates";
import {
  INACTIVE_ROW_TEXT,
  STATUS_FILTER_OPTIONS,
  inactiveRowClass,
  type ColumnSort,
  type SortDirection,
} from "@/utils/tableState";
import { type StudentDB } from "@/types/types";
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
  /** Para nombrar los cursos asignados (tooltip) e ignorar cursos eliminados */
  coursesById?: Record<string, { titulo: string }>;
}

/** Cantidad de cursos; al pasar el mouse lista sus nombres */
function CourseCount({ titles }: { titles: string[] }) {
  const named = titles.filter(Boolean);
  if (named.length === 0) return <span>{titles.length}</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default underline decoration-dotted decoration-gray-300 underline-offset-4">
          {titles.length}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="space-y-0.5">
          {named.map((title) => (
            <p key={title}>{title}</p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** Fecha de registro en formato DD/MM/AA */
function formatRegistrationDate(student: StudentDB): string {
  const sec = getFechaRegistroSeconds(student);
  if (!sec) return "—";
  const date = new Date(sec * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
}

const ROLE_OPTIONS = [
  { value: "all", label: "Todos los roles" },
  { value: "student", label: "Estudiante" },
  { value: "admin", label: "Administrador" },
];

/** Ícono de rol antes del nombre: escudo para administradores, birrete para estudiantes */
function RoleIcon({ student, muted }: { student: StudentDB; muted: boolean }) {
  const isAdmin = Boolean(student.role?.admin);
  const isStudent = Boolean(student.role?.student);
  const label =
    isAdmin && isStudent ? "Administrador y estudiante" : isAdmin ? "Administrador" : "Estudiante";
  const Icon = isAdmin ? ShieldCheck : GraduationCap;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`grid place-items-center shrink-0 ${
            muted ? "text-gray-300" : isAdmin ? "text-violet-600" : "text-gray-400"
          }`}
          aria-label={label}
        >
          <Icon className="w-4 h-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

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
  coursesById,
}: StudentListProps) {
  // Con la lista de cursos cargada se ignoran ids de cursos eliminados;
  // mientras tanto se usan los ids tal cual (sin nombre) para no mostrar 0
  const courseTitles = (student: StudentDB): string[] => {
    const ids = student.cursos_asignados ?? [];
    if (!coursesById || Object.keys(coursesById).length === 0) return ids.map(() => "");
    return ids
      .map((id) => coursesById[id]?.titulo)
      .filter((title): title is string => !!title);
  };

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

      <TooltipProvider delayDuration={300}>
      {/* ── Vista mobile: filas compactas, igual que el resto de los listados ── */}
      <ul role="list" className="block md:hidden divide-y divide-gray-100 bg-white">
        {students.map((student, index) => {
          const isActive = student.activo ?? false;
          return (
            <li
              key={student.id || student.uid || `student-mobile-${index}`}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${inactiveRowClass(isActive)}`}
              onClick={() => navigate(`/students/${student.id}`)}
            >
              <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedRowIds.includes(student.id)}
                  onCheckedChange={() => toggleRow(student.id)}
                  aria-label={`Seleccionar ${getFullName(student)}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-1.5">
                  <RoleIcon student={student} muted={!isActive} />
                  <span className={`truncate text-sm font-medium ${isActive ? "text-gray-900" : INACTIVE_ROW_TEXT}`}>
                    {getFullName(student)}
                  </span>
                </p>
                <p className={`truncate text-xs ${isActive ? "text-gray-500" : INACTIVE_ROW_TEXT}`}>
                  {student.email || "Sin email"} · {courseTitles(student).length} curso
                  {courseTitles(student).length !== 1 ? "s" : ""}
                </p>
              </div>
              <div
                className="flex shrink-0 items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <IconAction
                  label="Editar usuario"
                  onClick={() => navigate(`/students/${encodeURIComponent(student.id)}/edit`)}
                  data-tour="edit-student"
                >
                  <Edit2 />
                </IconAction>
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
                <div className="grid place-items-center w-11 h-8" data-tour="toggle-student-status">
                  {updatingStatusId === student.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleStatusChange(student.id, isActive)}
                      disabled={updatingStatusId !== null}
                      aria-label={isActive ? "Deshabilitar usuario" : "Habilitar usuario"}
                      className="data-[state=checked]:bg-green-600 disabled:opacity-50"
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ── Vista desktop: tabla ── */}
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
                trailing={
                  onRoleChange && (
                    <FilterMenuButton
                      tooltip="Filtrar por rol"
                      value={role}
                      options={ROLE_OPTIONS}
                      onChange={onRoleChange}
                    />
                  )
                }
              />
              <SortableHeader
                label="Email"
                column="email"
                defaultLabel="fecha de creación"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              />
              <SortableHeader
                label="Inicio"
                column="date"
                firstDirection="desc"
                ascHint="más antiguos primero"
                descHint="más recientes primero"
                defaultLabel="más recientes primero"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={onSortChange}
              />
              <PlainHeader>Cursos</PlainHeader>
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
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <RoleIcon student={student} muted={!isActive} />
                    <span className={`font-medium ${isActive ? "text-gray-900" : INACTIVE_ROW_TEXT}`}>
                      {getFullName(student)}
                    </span>
                  </div>
                </td>
                <td className={`px-3 py-1.5 whitespace-nowrap ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                  {student.email || "Sin email"}
                </td>
                <td className={`px-3 py-1.5 whitespace-nowrap tabular-nums ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                  {formatRegistrationDate(student)}
                </td>
                <td className={`px-3 py-1.5 whitespace-nowrap tabular-nums ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                  <CourseCount titles={courseTitles(student)} />
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
                    <IconAction
                      label="Editar usuario"
                      onClick={() => navigate(`/students/${encodeURIComponent(student.id)}/edit`)}
                      data-tour="edit-student"
                    >
                      <Edit2 />
                    </IconAction>
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
