import { Dialog, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type Course, type StudentDB } from "@/types/types";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { CoursesAPI } from "@/service/courses";
import { StudentsAPI } from "@/service/students";


interface CoursesAsignStudentModalProps {
    id: string | null;
    assignDialogOpen: boolean;
    setAssignDialogOpen: (open: boolean) => void;
    selectedCourseId: string | null;
    setSelectedCourseId: (courseId: string | null) => void;
    getErrorMessage: (e: unknown) => string;
    setCourses: Dispatch<SetStateAction<Course[]>>;
    showTrigger?: boolean;
}

export const CoursesAsignStudentModal = ({
    id,
    assignDialogOpen,
    setAssignDialogOpen,
    selectedCourseId,
    setSelectedCourseId,
    getErrorMessage,
    setCourses,
    showTrigger = true,
}: CoursesAsignStudentModalProps) => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [student, setStudent] = useState<StudentDB | null>(null);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);


    const assignCourse = async () => {
        if (!selectedCourseId || !student || !id) return;
        try {
            setAssigning(true);
            const updatedCursos = [
                ...(student.cursos_asignados || []),
                selectedCourseId,
            ];
            await StudentsAPI.updateStudent(id, { cursos_asignados: updatedCursos });
            const assigned = allCourses.find(c => c.id === selectedCourseId);
            if (assigned) {
                setCourses((prev) => [...prev, assigned]);
            }
            setStudent((prev) => prev ? ({
                ...prev,
                cursos_asignados: [...(prev.cursos_asignados || []), selectedCourseId]
            }) : prev);
            toast.success('Formación asignada correctamente');
            setAssignDialogOpen(false);
            setSelectedCourseId(null);
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
            await StudentsAPI.updateStudent(id, { cursos_asignados: updatedCursos });
            setStudent((prev) => prev ? ({
                ...prev,
                cursos_asignados: updatedCursos,
            }) : prev);
            setCourses((prev) => prev.filter((c) => c.id !== courseId));
            toast.success('Formación removida correctamente');
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
                setStudent(found);
                setAllCourses(coursesData);
            } catch (e) {
                toast.error(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, getErrorMessage]);


    return (
        <Dialog open={assignDialogOpen} onOpenChange={(open) => { setAssignDialogOpen(open); if (!open) setSelectedCourseId(null); }}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button className="text-zinc-200" variant="outline" onClick={() => setAssignDialogOpen(true)}>Asignar Cursos</Button>
                </DialogTrigger>
            )}
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>Asignar Formación</DialogTitle>
                    <DialogDescription>
                        Selecciona la formación que deseas asignar al estudiante.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {loading 
                        ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin cursor-pointer" /> 
                            </div>
                        ) : allCourses.map((curso) => {
                            const alreadyAssigned = student?.cursos_asignados?.includes(curso.id);
                            const isSelected = selectedCourseId === curso.id;
                            return (
                                <button
                                    key={curso.id}
                                    type="button"
                                    onClick={() => {
                                        if (alreadyAssigned) return;
                                        setSelectedCourseId(curso.id);
                                    }}
                                    className={`w-full text-left border rounded-lg p-4 transition-colors ${alreadyAssigned ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:bg-blue-50 cursor-pointer'} ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="pr-4">
                                            <h3 className="font-semibold text-gray-900">{curso.titulo}</h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">{curso.descripcion}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">{curso.estado}</span>
                                            {alreadyAssigned && (
                                                <div className="mt-2 flex items-center gap-2 justify-end">
                                                    <span className="text-xs text-green-700 font-medium">Ya asignado</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); unassignCourse(curso.id); }}
                                                        disabled={assigning}
                                                        className="text-xs text-red-700 hover:text-red-800 hover:underline disabled:opacity-50 cursor-pointer"
                                                        title="Quitar curso"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            )}
                                            {isSelected && !alreadyAssigned && (
                                                <div className="mt-2 text-xs text-blue-700 font-medium">Seleccionado</div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                    })}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        disabled={!selectedCourseId || assigning || !student}
                        onClick={assignCourse}
                    >
                        {assigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin cursor-pointer" /> : null}
                        Asignar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}