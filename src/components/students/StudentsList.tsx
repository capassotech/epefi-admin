// src/components/student/StudentList.tsx
import {
  Trash2,
  Mail,
  // Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { type StudentDB } from "@/types/types";
import { CreateUserModal } from "./CreateUserModal";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CoursesAsignStudentModal } from "./CoursesAsignStudentModal";
import { Button } from "../ui/button";

interface StudentListProps {
  students: StudentDB[];
  onDelete: (id: string) => void;
  onUserUpdated?: () => void;
}

export function StudentList({ students, onDelete, onUserUpdated }: StudentListProps) {
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DNI
              </th> */}
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registro
              </th> */}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr
                key={student.dni}
                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
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
                      <div className=" font-medium text-gray-900">
                        {getFullName(student)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {student.id.substring(0, 8)}...
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
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.dni || "N/A"}
                </td> */}
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
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {student.activo ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-700">Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">Inactivo</span>
                      </>
                    )}
                  </div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(student.fechaRegistro)}
                  </div>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex flex-col items-end justify-end">
                    <div className="flex items-center space-x-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <CreateUserModal
                          onUserCreated={onUserUpdated}
                          triggerText="Editar"
                          isEditing={true}
                          editingUser={student}
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(student.id);
                        }}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar estudiante"
                      >
                        <Trash2 className="w-4 h-4 cursor-pointer" />
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentId(student.id);
                        setAssignDialogOpen(true);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Asignar cursos"
                    >
                      Asignar cursos
                    </Button>
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
            setSelectedCourseId(null);
            setSelectedStudentId(null);
          }
        }}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        getErrorMessage={getErrorMessage}
        setCourses={(/* _courses */) => { }}
        showTrigger={false}
      />
    </div>
  );
}
