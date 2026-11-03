import { Dialog, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2, CheckCircle2, PlusCircle, BookOpen, CircleMinus, Circle, Search } from "lucide-react";
import { Input } from "../ui/input";
import { IconAction } from "../ui/icon-action";
import { TooltipProvider } from "../ui/tooltip";
import { toast } from "sonner";
import { type Course, type StudentDB } from "@/types/types";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { CoursesAPI } from "@/service/courses";
import { StudentsAPI } from "@/service/students";
import { formatCurrency } from "@/utils/currency";


interface CoursesAsignStudentModalProps {
    id: string | null;
    assignDialogOpen: boolean;
    setAssignDialogOpen: (open: boolean) => void;
    selectedCourseIds: string[];
    setSelectedCourseIds: Dispatch<SetStateAction<string[]>>;
    getErrorMessage: (e: unknown) => string;
    setCourses: Dispatch<SetStateAction<Course[]>>;
    showTrigger?: boolean;
    /** Llamado tras asignar o desasignar cursos, para que el padre actualice la lista */
    onCoursesUpdated?: () => void | Promise<void>;
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
    onCoursesUpdated,
}: CoursesAsignStudentModalProps) => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [student, setStudent] = useState<StudentDB | null>(null);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const buildUpdatePayload = (cursosAsignados: string[]) => {
        if (!student) return null;

        // El ID del documento en Firestore debe ser el mismo que el uid
        // Priorizar: student.id (ID del documento) > student.uid > id (parámetro)
        const studentId = student.id || student.uid || id;
        if (!studentId) {
            console.error('❌ No se pudo obtener el ID del estudiante:', { student, id });
            return null;
        }

        console.log('📝 Construyendo payload de actualización:', {
            studentId,
            studentIdType: typeof studentId,
            studentIdLength: studentId.length,
            cursosAsignados: cursosAsignados.length,
            student: {
                id: student.id,
                uid: student.uid,
                nombre: student.nombre,
                apellido: student.apellido
            }
        });

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

            // Obtener el ID del usuario primero
            const userIdToUpdate = student.id || student.uid || id;
            if (!userIdToUpdate || userIdToUpdate.trim() === '') {
                toast.error("No se pudo identificar al estudiante. Por favor, recarga la página.");
                setAssigning(false);
                return;
            }

            const updatedCursos = Array.from(new Set([...currentAssigned, ...newAssignments]));

            // Validar que todos los cursos seleccionados existan en la lista de cursos disponibles
            const invalidCourses = newAssignments.filter((courseId) => {
                return !allCourses.some((course: Course) => course.id === courseId);
            });

            if (invalidCourses.length > 0) {
                console.error('❌ Cursos inválidos detectados:', {
                    invalidCourses,
                    allCourseIds: allCourses.map((c: Course) => c.id),
                    selectedCourseIds: selectedCourseIds
                });
                toast.error(`Uno o más cursos seleccionados no son válidos. Por favor, recarga la página e intenta nuevamente.`);
                setAssigning(false);
                return;
            }

            // Validar también los cursos ya asignados
            const invalidExistingCourses = currentAssigned.filter((courseId) => {
                return !allCourses.some((course: Course) => course.id === courseId);
            });

            if (invalidExistingCourses.length > 0) {
                console.warn('⚠️ Cursos asignados previamente que ya no existen:', {
                    invalidExistingCourses,
                    totalCursosAsignados: currentAssigned.length
                });
                // Filtrar los cursos inválidos de la lista actual
                const validCurrentAssigned = currentAssigned.filter((courseId) => {
                    return allCourses.some((course: Course) => course.id === courseId);
                });
                // Actualizar la lista de cursos asignados para excluir los inválidos
                const validUpdatedCursos = Array.from(new Set([...validCurrentAssigned, ...newAssignments]));
                console.log('🔧 Limpiando cursos inválidos:', {
                    removed: invalidExistingCourses,
                    validUpdatedCursos: validUpdatedCursos.length
                });
                // Actualizar el estado del estudiante para reflejar solo cursos válidos
                setStudent((prev) => prev ? ({
                    ...prev,
                    cursos_asignados: validCurrentAssigned
                }) : prev);
                // Usar la lista limpia
                const cleanedPayload = buildUpdatePayload(validUpdatedCursos);
                if (!cleanedPayload || !cleanedPayload.uid) {
                    toast.error("No se pudo preparar la información del estudiante");
                    setAssigning(false);
                    return;
                }
                const finalCleanedPayload = {
                    ...cleanedPayload,
                    uid: userIdToUpdate
                };
                console.log('🔄 Actualizando estudiante (con limpieza de cursos inválidos):', {
                    userId: userIdToUpdate,
                    cursos: validUpdatedCursos
                });
                await StudentsAPI.updateStudent(userIdToUpdate, finalCleanedPayload);
                // Continuar con el flujo normal pero con cursos válidos
                const newlyAssignedCourses = allCourses.filter((c: Course) => newAssignments.includes(c.id));
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
                    cursos_asignados: validUpdatedCursos
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
                setAvailableCourses((prev) => prev.filter((course) => !validUpdatedCursos.includes(course.id)));
                toast.success(newAssignments.length > 1 ? 'Cursos asignados correctamente (algunos cursos inválidos fueron removidos)' : 'Curso asignado correctamente');
                setAssignDialogOpen(false);
                setSelectedCourseIds([]);
                await onCoursesUpdated?.();
                setAssigning(false);
                return;
            }

            console.log('📋 Cursos a asignar:', {
                currentAssigned: currentAssigned.length,
                newAssignments: newAssignments.length,
                newAssignmentIds: newAssignments,
                updatedCursos: updatedCursos.length,
                updatedCursosIds: updatedCursos,
                allCoursesAvailable: allCourses.length
            });

            const payload = buildUpdatePayload(updatedCursos);
            if (!payload || !payload.uid) {
                toast.error("No se pudo preparar la información del estudiante");
                setAssigning(false);
                return;
            }

            // Asegurar que el payload tenga el uid correcto (userIdToUpdate ya está definido arriba)
            const finalPayload = {
                ...payload,
                uid: userIdToUpdate
            };

            console.log('🔄 Actualizando estudiante:', {
                userId: userIdToUpdate,
                studentId: student.id,
                studentUid: student.uid,
                payloadUid: payload.uid,
                cursos: updatedCursos,
                payload: finalPayload
            });

            await StudentsAPI.updateStudent(userIdToUpdate, finalPayload);

            const newlyAssignedCourses = allCourses.filter((c: Course) => newAssignments.includes(c.id));
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
            await onCoursesUpdated?.();
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

            // Validar que el UID no esté vacío
            // Usar el ID del documento (student.id) como prioridad, ya que es el ID real en Firestore
            const userIdToUpdate = student.id || student.uid || payload.uid || id;
            if (!userIdToUpdate || userIdToUpdate.trim() === '') {
                toast.error("No se pudo identificar al estudiante. Por favor, recarga la página.");
                setAssigning(false);
                return;
            }

            // Asegurar que el payload tenga el uid correcto
            const finalPayload = {
                ...payload,
                uid: userIdToUpdate
            };

            console.log('🔄 Removiendo curso del estudiante:', {
                userId: userIdToUpdate,
                studentId: student.id,
                studentUid: student.uid,
                payloadUid: payload.uid,
                courseId,
                cursos: updatedCursos
            });

            await StudentsAPI.updateStudent(userIdToUpdate, finalPayload);

            setStudent((prev) => prev ? ({
                ...prev,
                cursos_asignados: updatedCursos,
            }) : prev);

            setAssignedCourses((prev) => prev.filter((course) => course.id !== courseId));
            const removedCourse = assignedCourses.find((course) => course.id === courseId);
            if (removedCourse) {
                setAvailableCourses((prev) => [...prev, removedCourse]);
            }
            setSelectedCourseIds((prev) => prev.filter((cid: string) => cid !== courseId));

            toast.success('Curso removido correctamente');
            await onCoursesUpdated?.();
        } catch (e: unknown) {
            toast.error(getErrorMessage(e));
        } finally {
            setAssigning(false);
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            if (!id) return;
            try {
                console.log('📥 Cargando datos del estudiante con ID:', id);
                const [found, coursesData] = await Promise.all([
                    StudentsAPI.getById(id),
                    CoursesAPI.getAllList(),
                ]);
                
                console.log('📦 Datos recibidos del backend:', {
                    found,
                    foundId: found?.id,
                    foundUid: found?.uid,
                    paramId: id
                });
                
                // El ID del documento en Firestore debe ser el mismo que el uid
                // Priorizar: found.id (ID del documento) > found.uid > id (parámetro)
                const documentId = found?.id || found?.uid || id;
                
                const normalizedStudent: StudentDB = {
                    ...found,
                    id: documentId,
                    uid: documentId,
                };
                
                console.log('✅ Estudiante normalizado:', {
                    id: normalizedStudent.id,
                    uid: normalizedStudent.uid,
                    nombre: normalizedStudent.nombre,
                    apellido: normalizedStudent.apellido
                });
                
                setStudent(normalizedStudent);

                setAllCourses(coursesData);

                const assignedIds = new Set(normalizedStudent?.cursos_asignados || []);
                setAssignedCourses(coursesData.filter((course: Course) => assignedIds.has(course.id)));
                setAvailableCourses(coursesData.filter((course: Course) => !assignedIds.has(course.id)));
            } catch (e) {
                toast.error(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, getErrorMessage]);

    const [courseSearch, setCourseSearch] = useState("");

    const toggleSelected = (courseId: string) =>
        setSelectedCourseIds((prev) =>
            prev.includes(courseId) ? prev.filter((idCurso: string) => idCurso !== courseId) : [...prev, courseId]
        );

    const normalizedSearch = courseSearch.trim().toLowerCase();
    const filteredAvailable = normalizedSearch
        ? availableCourses.filter((curso) => curso.titulo?.toLowerCase().includes(normalizedSearch))
        : availableCourses;

    const initials = student ? `${student.nombre?.[0] ?? ""}${student.apellido?.[0] ?? ""}`.toUpperCase() : "";

    /** Estado y precio del curso en una línea discreta */
    const courseMeta = (curso: Course) => (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
                className={`w-1.5 h-1.5 rounded-full ${curso.estado === "activo" ? "bg-green-500" : "bg-gray-300"}`}
                aria-hidden="true"
            />
            {curso.estado === "activo" ? "Habilitado" : "Deshabilitado"}
            <span className="text-gray-300">·</span>
            <span className="tabular-nums">{formatCurrency(curso.precio)}</span>
        </p>
    );

    const panel = (title: string, count: number, children: React.ReactNode, action?: React.ReactNode) => (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200/70 bg-white">
            <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    {title}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 tabular-nums">
                        {count}
                    </span>
                </h3>
                {action}
            </header>
            {children}
        </section>
    );

    const emptyState = (title: string, hint: string) => (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-10 text-center">
            <BookOpen className="mb-1 w-6 h-6 text-gray-300" />
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xs text-gray-400">{hint}</p>
        </div>
    );

    return (
        <Dialog
            open={assignDialogOpen}
            onOpenChange={(open) => {
                setAssignDialogOpen(open);
                if (!open) {
                    setSelectedCourseIds([]);
                    setCourseSearch("");
                }
            }}
        >
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button className="text-zinc-200" variant="outline" onClick={() => setAssignDialogOpen(true)}>Asignar Cursos</Button>
                </DialogTrigger>
            )}
            <DialogContent className="flex h-[min(88vh,760px)] w-[calc(100vw-2rem)] max-w-5xl sm:max-w-5xl flex-col gap-0 overflow-hidden p-0">
                <TooltipProvider delayDuration={300}>
                <DialogHeader className="shrink-0 border-b border-gray-100 px-5 py-4 text-left sm:px-6">
                    <DialogTitle className="text-lg font-semibold text-gray-900">Asignar cursos</DialogTitle>
                    <DialogDescription className="sr-only">
                        Gestioná los cursos del estudiante: quitá los que ya tiene o sumá nuevos.
                    </DialogDescription>
                    {student && (
                        <div className="mt-1 flex min-w-0 items-center gap-2.5">
                            <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                                {initials || "?"}
                            </span>
                            <p className="min-w-0 truncate text-sm text-gray-600">
                                <span className="font-medium text-gray-900">{student.nombre} {student.apellido}</span>
                                <span className="text-gray-400"> · {student.email}</span>
                            </p>
                        </div>
                    )}
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/60 p-4 sm:p-5 lg:overflow-hidden">
                    {loading ? (
                        <div className="flex h-full items-center justify-center gap-2 py-10 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cargando cursos…
                        </div>
                    ) : (
                        <div className="grid min-h-0 gap-4 lg:h-full lg:grid-cols-2">
                            {/* ── Cursos ya asignados ── */}
                            {panel(
                                "Asignados",
                                assignedCourses.length,
                                assignedCourses.length === 0 ? (
                                    emptyState("Todavía no tiene cursos asignados.", "Elegí cursos de la lista de disponibles.")
                                ) : (
                                    <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                                        {assignedCourses.map((curso) => (
                                            <li key={`assigned-${curso.id}`} className="flex items-center gap-3 px-4 py-2.5">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-gray-900" title={curso.titulo}>
                                                        {curso.titulo}
                                                    </p>
                                                    {courseMeta(curso)}
                                                </div>
                                                <IconAction
                                                    label="Quitar curso"
                                                    onClick={() => unassignCourse(curso.id)}
                                                    disabled={assigning}
                                                    className="hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <CircleMinus />
                                                </IconAction>
                                            </li>
                                        ))}
                                    </ul>
                                )
                            )}

                            {/* ── Cursos disponibles para sumar ── */}
                            {panel(
                                "Disponibles",
                                availableCourses.length,
                                <>
                                    {availableCourses.length > 0 && (
                                        <div className="border-b border-gray-100 px-4 py-2.5">
                                            <div className="relative">
                                                <Search className="pointer-events-none absolute left-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-gray-400" />
                                                <Input
                                                    value={courseSearch}
                                                    onChange={(e) => setCourseSearch(e.target.value)}
                                                    placeholder="Buscar curso..."
                                                    className="h-8 pl-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {availableCourses.length === 0 ? (
                                        emptyState("No hay cursos para sumar.", "Ya tiene asignados todos los cursos.")
                                    ) : filteredAvailable.length === 0 ? (
                                        emptyState("Ningún curso coincide con la búsqueda.", "Probá con otro nombre.")
                                    ) : (
                                        <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                                            {filteredAvailable.map((curso: Course) => {
                                                const isSelected = selectedCourseIds.includes(curso.id);
                                                return (
                                                    <li key={`available-${curso.id}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSelected(curso.id)}
                                                            aria-pressed={isSelected}
                                                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                                                isSelected ? "bg-blue-50/60" : "hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            {isSelected ? (
                                                                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                                                            ) : (
                                                                <Circle className="w-4 h-4 shrink-0 text-gray-300" />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium text-gray-900" title={curso.titulo}>
                                                                    {curso.titulo}
                                                                </p>
                                                                {courseMeta(curso)}
                                                            </div>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </>,
                                selectedCourseIds.length > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCourseIds([])}
                                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                                    >
                                        Limpiar selección
                                    </button>
                                ) : undefined
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="shrink-0 border-t border-gray-100 px-5 py-3 sm:px-6">
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">
                            {selectedCourseIds.length === 0
                                ? "Seleccioná cursos disponibles para asignarlos."
                                : `${selectedCourseIds.length} curso${selectedCourseIds.length > 1 ? "s" : ""} seleccionado${selectedCourseIds.length > 1 ? "s" : ""}`}
                        </p>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-gray-500"
                                onClick={() => setAssignDialogOpen(false)}
                                disabled={assigning}
                            >
                                Cerrar
                            </Button>
                            <Button
                                type="button"
                                disabled={selectedCourseIds.length === 0 || assigning || !student}
                                onClick={assignCourse}
                            >
                                {assigning ? (
                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                ) : (
                                    <PlusCircle className="w-4 h-4 mr-1.5" />
                                )}
                                {selectedCourseIds.length > 1
                                    ? `Asignar ${selectedCourseIds.length} cursos`
                                    : "Asignar curso"}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    )
}
