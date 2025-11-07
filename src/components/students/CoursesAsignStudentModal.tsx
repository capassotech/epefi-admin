import { Dialog, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2, CheckCircle2, PlusCircle, BookOpen, CircleMinus } from "lucide-react";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { type Course, type StudentDB } from "@/types/types";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { CoursesAPI } from "@/service/courses";
import { StudentsAPI } from "@/service/students";


interface CoursesAsignStudentModalProps {
    id: string | null;
    assignDialogOpen: boolean;
    setAssignDialogOpen: (open: boolean) => void;
    selectedCourseIds: string[];
    setSelectedCourseIds: (courseIds: string[]) => void;
    getErrorMessage: (e: unknown) => string;
    setCourses: Dispatch<SetStateAction<Course[]>>;
    showTrigger?: boolean;
}

export const CoursesAsignStudentModal = ({
    id,
    assignDialogOpen,
    setAssignDialogOpen,
    selectedCourseIds,
    setSelectedCourseIds,
    getErrorMessage,
    setCourses,
    showTrigger = true,
}: CoursesAsignStudentModalProps) => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [student, setStudent] = useState<StudentDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    const buildUpdatePayload = (cursosAsignados: string[]) => {
        if (!student) return null;

        return {
            nombre: student.nombre ?? "",
            apellido: student.apellido ?? "",
            email: student.email ?? "",
            dni: student.dni ?? "",
            role: student.role ?? { admin: false, student: true },
            emailVerificado: student.emailVerificado ?? false,
            activo: student.activo ?? true,
            cursos_asignados: cursosAsignados,
            uid: student.uid ?? student.id ?? id ?? "",
        };
    };

    const assignCourse = async () => {
        if (!student || !id || selectedCourseIds.length === 0) return;
        try {
            setAssigning(true);
            const currentAssigned = student.cursos_asignados || [];
            const newAssignments = selectedCourseIds.filter((courseId) => !currentAssigned.includes(courseId));

            if (newAssignments.length === 0) {
                toast.info('No hay cursos nuevos para asignar');
                setAssigning(false);
                return;
            }

            const updatedCursos = Array.from(new Set([...currentAssigned, ...newAssignments]));

            const payload = buildUpdatePayload(updatedCursos);
            if (!payload || !payload.uid) {
                toast.error("No se pudo preparar la información del estudiante");
                setAssigning(false);
                return;
            }

            await StudentsAPI.updateStudent(payload.uid, payload);

            const newlyAssignedCourses = allCourses.filter((c) => newAssignments.includes(c.id));
            if (newlyAssignedCourses.length > 0) {
                setCourses((prev) => {
                    const existingIds = new Set(prev.map((c) => c.id));
                    const merged = [...prev];
                    newlyAssignedCourses.forEach((course) => {
                        if (!existingIds.has(course.id)) {
                            merged.push(course);
                        }
                    });
                    return merged;
                });
            }

            setStudent((prev) => prev ? ({
                ...prev,
                cursos_asignados: updatedCursos
            }) : prev);

            setAssignedCourses((prev) => {
                const currentIds = new Set(prev.map((c) => c.id));
                const merged = [...prev];
                newlyAssignedCourses.forEach((course) => {
                    if (!currentIds.has(course.id)) {
                        merged.push(course);
                    }
                });
                return merged;
            });

            setAvailableCourses((prev) => prev.filter((course) => !updatedCursos.includes(course.id)));

            toast.success(newAssignments.length > 1 ? 'Cursos asignados correctamente' : 'Curso asignado correctamente');
            setAssignDialogOpen(false);
            setSelectedCourseIds([]);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setAssigning(false);
        }
    }

    const unassignCourse = async (courseId: string) => {
        if (!student || !id) return;
        try {
            setAssigning(true);
            const updatedCursos = (student.cursos_asignados || []).filter((cid) => cid !== courseId);
            const payload = buildUpdatePayload(updatedCursos);
            if (!payload || !payload.uid) {
                toast.error("No se pudo preparar la información del estudiante");
                setAssigning(false);
                return;
            }

            await StudentsAPI.updateStudent(payload.uid, payload);

            setStudent((prev) => prev ? ({
                ...prev,
                cursos_asignados: updatedCursos,
            }) : prev);

            setAssignedCourses((prev) => prev.filter((course) => course.id !== courseId));
            const removedCourse = assignedCourses.find((course) => course.id === courseId);
            if (removedCourse) {
                setAvailableCourses((prev) => [...prev, removedCourse]);
            }
            setSelectedCourseIds((prev) => prev.filter((cid) => cid !== courseId));

            toast.success('Curso removido correctamente');
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setAssigning(false);
        }
    }

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const [found, coursesData] = await Promise.all([
                    StudentsAPI.getById(id),
                    CoursesAPI.getAll(),
                ]);
                const normalizedStudent: StudentDB = {
                    ...found,
                    uid: (found as StudentDB).uid ?? found.id ?? id,
                };
                setStudent(normalizedStudent);

                setAllCourses(coursesData);

                const assignedIds = new Set(normalizedStudent?.cursos_asignados || []);
                setAssignedCourses(coursesData.filter((course) => assignedIds.has(course.id)));
                setAvailableCourses(coursesData.filter((course) => !assignedIds.has(course.id)));
            } catch (e) {
                toast.error(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, getErrorMessage]);


    return (
        <Dialog open={assignDialogOpen} onOpenChange={(open) => { setAssignDialogOpen(open); if (!open) setSelectedCourseIds([]); }}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button className="text-zinc-200" variant="outline" onClick={() => setAssignDialogOpen(true)}>Asignar Cursos</Button>
                </DialogTrigger>
            )}
            <DialogContent className='max-w-3xl max-h-[90vh] overflow-hidden flex flex-col'>
                <DialogHeader>
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl font-semibold text-gray-900">Asignar cursos</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Gestiona los cursos asociados al estudiante. Puedes quitar los existentes o sumar nuevos.
                        </DialogDescription>
                        {student && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                    {student.nombre} {student.apellido}
                                </Badge>
                                <span className="text-gray-400">•</span>
                                <span>{student.email}</span>
                            </div>
                        )}
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-500">Cargando cursos...</span>
                        </div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2 lg:divide-x lg:divide-gray-100 h-full">
                            <div className="pr-0 lg:pr-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Cursos asignados</h3>
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                        {assignedCourses.length}
                                    </Badge>
                                </div>
                                <ScrollArea className="h-[320px] pr-4">
                                    {assignedCourses.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
                                            <BookOpen className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm text-gray-500">El estudiante aún no tiene cursos asignados.</p>
                                            <p className="text-xs text-gray-400 mt-1">Selecciona cursos desde la columna de la derecha.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {assignedCourses.map((curso) => (
                                                <div
                                                    key={`assigned-${curso.id}`}
                                                    className="group border border-gray-200 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                {curso.titulo}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                {curso.descripcion || 'Sin descripción'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => unassignCourse(curso.id)}
                                                            disabled={assigning}
                                                            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <CircleMinus className="w-3.5 h-3.5" />
                                                            Quitar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                            <div className="pl-0 lg:pl-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <PlusCircle className="w-4 h-4 text-blue-600" />
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Agregar cursos</h3>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {availableCourses.length}
                                    </Badge>
                                </div>
                                <ScrollArea className="h-[320px] pr-4">
                                    {availableCourses.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
                                            <BookOpen className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm text-gray-500">No hay cursos disponibles para asignar.</p>
                                            <p className="text-xs text-gray-400 mt-1">Todos los cursos ya están asociados a este estudiante.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {availableCourses.map((curso) => {
                                                const isSelected = selectedCourseIds.includes(curso.id);
                                                return (
                                                    <button
                                                        key={`available-${curso.id}`}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCourseIds((prev) =>
                                                                prev.includes(curso.id)
                                                                    ? prev.filter((idCurso) => idCurso !== curso.id)
                                                                    : [...prev, curso.id]
                                                            );
                                                        }}
                                                        className={`w-full text-left border rounded-lg p-4 transition-all duration-200 flex items-start justify-between gap-4 ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/60'}`}
                                                    >
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                {curso.titulo}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                {curso.descripcion || 'Sin descripción'}
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <Badge variant="outline" className="text-[0.7rem] border-gray-200 text-gray-600">
                                                                    {curso.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[0.7rem] border-gray-200 text-gray-600">
                                                                    {curso.precio === 0 ? 'Gratuito' : `$${curso.precio.toLocaleString()}`}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Badge className={`transition-colors text-xs ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>
                                                                {isSelected ? 'Seleccionado' : 'Asignar'}
                                                            </Badge>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="border-t border-gray-100 pt-4 mt-4">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-500">
                            {selectedCourseIds.length === 0 ? (
                                <span>No has seleccionado cursos nuevos.</span>
                            ) : (
                                <span>
                                    {selectedCourseIds.length} curso{selectedCourseIds.length > 1 ? 's' : ''} seleccionado{selectedCourseIds.length > 1 ? 's' : ''} para asignar
                                </span>
                            )}
                        </div>
                        <Button
                            type="button"
                            disabled={selectedCourseIds.length === 0 || assigning || !student}
                            onClick={assignCourse}
                        >
                            {assigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin cursor-pointer" /> : null}
                            {selectedCourseIds.length > 1 ? 'Asignar cursos seleccionados' : 'Asignar curso seleccionado'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}