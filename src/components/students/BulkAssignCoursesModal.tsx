import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader2, PlusCircle, BookOpen } from "lucide-react";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { type Course, type StudentDB } from "@/types/types";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { CoursesAPI } from "@/service/courses";
import { StudentsAPI } from "@/service/students";
import { formatCurrency } from "@/utils/currency";

interface BulkAssignCoursesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentDB[];
  selectedCourseIds: string[];
  setSelectedCourseIds: Dispatch<SetStateAction<string[]>>;
  getErrorMessage: (e: unknown) => string;
  onSuccess?: () => void | Promise<void>;
}

function buildUpdatePayload(student: StudentDB, cursosAsignados: string[]) {
  const studentId = student.id || student.uid;
  if (!studentId) return null;
  return {
    nombre: student.nombre ?? "",
    apellido: student.apellido ?? "",
    email: student.email ?? "",
    dni: student.dni ?? "",
    role: student.role ?? { admin: false, student: true },
    emailVerificado: student.emailVerificado ?? false,
    activo: student.activo ?? true,
    cursos_asignados: cursosAsignados,
    uid: studentId,
  };
}

export function BulkAssignCoursesModal({
  open,
  onOpenChange,
  students,
  selectedCourseIds,
  setSelectedCourseIds,
  getErrorMessage,
  onSuccess,
}: BulkAssignCoursesModalProps) {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const coursesData = await CoursesAPI.getAllList();
        setAllCourses(coursesData);
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, getErrorMessage]);

  const assignToAll = async () => {
    if (students.length === 0 || selectedCourseIds.length === 0) return;
    const validIds = new Set(allCourses.map((c) => c.id));
    const toAssign = selectedCourseIds.filter((id) => validIds.has(id));
    if (toAssign.length === 0) {
      toast.error("No hay cursos válidos seleccionados.");
      return;
    }

    setAssigning(true);
    let ok = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      for (const student of students) {
        const userId = student.id || student.uid;
        if (!userId?.trim()) {
          errors.push(`${student.nombre ?? "?"} ${student.apellido ?? ""}: sin ID`);
          continue;
        }

        const currentAssigned = student.cursos_asignados || [];
        const validCurrent = currentAssigned.filter((cid) => validIds.has(cid));
        const newAssignments = toAssign.filter((courseId) => !validCurrent.includes(courseId));

        if (newAssignments.length === 0) {
          skipped += 1;
          continue;
        }

        const updatedCursos = Array.from(new Set([...validCurrent, ...newAssignments]));
        const payload = buildUpdatePayload(student, updatedCursos);
        if (!payload) {
          errors.push(`${student.nombre ?? "?"}: no se pudo armar el registro`);
          continue;
        }

        try {
          await StudentsAPI.updateStudent(userId, { ...payload, uid: userId });
          ok += 1;
        } catch (e) {
          errors.push(`${student.nombre ?? "?"} ${student.apellido ?? ""}: ${getErrorMessage(e)}`);
        }
      }

      if (ok > 0) {
        toast.success(
          ok === 1
            ? "Curso asignado a 1 usuario."
            : `Cursos asignados correctamente a ${ok} usuarios.`
        );
      }
      if (skipped > 0) {
        toast.info(
          skipped === 1
            ? "1 usuario ya tenía todos los cursos seleccionados."
            : `${skipped} usuarios ya tenían todos los cursos seleccionados.`
        );
      }
      if (errors.length > 0) {
        toast.error(
          errors.length === 1
            ? errors[0]
            : `${errors.length} errores al asignar. Revisa la consola para el detalle.`
        );
        console.error("Errores asignación masiva:", errors);
      }

      if (ok > 0) {
        setSelectedCourseIds([]);
        onOpenChange(false);
        await onSuccess?.();
      }
    } finally {
      setAssigning(false);
    }
  };

  const courseById = new Map(allCourses.map((c) => [c.id, c]));
  const pickableCourses = allCourses.filter((c) => {
    const notEveryoneHas = students.some((s) => !(s.cursos_asignados || []).includes(c.id));
    return notEveryoneHas;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Asignar cursos a varios usuarios
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Se añadirán los cursos elegidos a cada usuario seleccionado. Quien ya tenga un curso no
            se duplicará.
          </DialogDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              {students.length} usuario{students.length !== 1 ? "s" : ""} seleccionado
              {students.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Cargando cursos...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Cursos a agregar
                </h3>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {pickableCourses.length}
                </Badge>
              </div>
              <ScrollArea className="h-[min(360px,50vh)] pr-2">
                {pickableCourses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      Todos los usuarios seleccionados ya tienen los cursos disponibles, o no hay
                      cursos en el sistema.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pickableCourses.map((curso) => {
                      const isSelected = selectedCourseIds.includes(curso.id);
                      return (
                        <button
                          key={curso.id}
                          type="button"
                          onClick={() => {
                            setSelectedCourseIds((prev) =>
                              prev.includes(curso.id)
                                ? prev.filter((id) => id !== curso.id)
                                : [...prev, curso.id]
                            );
                          }}
                          className={`w-full text-left border rounded-lg p-4 transition-all duration-200 flex items-start justify-between gap-4 ${
                            isSelected
                              ? "border-blue-500 ring-2 ring-blue-100 bg-blue-50/50 shadow-sm"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/60"
                          }`}
                        >
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {curso.titulo}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {curso.descripcion || "Sin descripción"}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[0.7rem] border-gray-200 text-gray-600"
                              >
                                {curso.estado === "activo" ? "Activo" : "Inactivo"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[0.7rem] border-gray-200 text-gray-600"
                              >
                                {formatCurrency(curso.precio)}
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            className={`transition-colors text-xs shrink-0 ${
                              isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {isSelected ? "Seleccionado" : "Elegir"}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              {selectedCourseIds.length > 0 && (
                <p className="text-xs text-gray-500">
                  Resumen:{" "}
                  {selectedCourseIds
                    .map((id) => courseById.get(id)?.titulo ?? id)
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 pt-3 mt-2">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              {selectedCourseIds.length === 0 ? (
                <span>Selecciona al menos un curso para asignar.</span>
              ) : (
                <span>
                  {selectedCourseIds.length} curso{selectedCourseIds.length > 1 ? "s" : ""} para
                  aplicar a {students.length} usuario{students.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={
                students.length === 0 ||
                selectedCourseIds.length === 0 ||
                assigning ||
                loading
              }
              onClick={assignToAll}
            >
              {assigning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Asignar a los seleccionados
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
