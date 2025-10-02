// components/product/edit/FeaturesForm.tsx

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import SubjectModal from "../subject/SubjectModal";
import { useEffect, useMemo, useState } from "react";
import { type Subject } from "@/types/types";
import { CoursesAPI } from "@/service/courses";
import { toast } from "sonner";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Badge } from "../ui/badge";
import { X } from "lucide-react";


export default function SubjectCreation({ courseId, setNewSubjects }: { courseId?: string | null, setNewSubjects: (newSubjects: boolean) => void }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSubject] = useState<Subject | null>(null);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const list = await CoursesAPI.getMaterias();
                setAllSubjects(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error(e);
                toast.error("No se pudieron cargar las materias");
            }
        };
        load();
    }, []);

    const subjectsAlreadyInCourse = useMemo(() => {
        if (!courseId) return new Set<string>();
        return new Set(
            allSubjects
                .filter((s) => Array.isArray(s.id_cursos) && s.id_cursos.includes(String(courseId)))
                .map((s) => s.id)
        );
    }, [allSubjects, courseId]);

    const selectableSubjects = useMemo(() => {
        return allSubjects.filter((s) => !subjectsAlreadyInCourse.has(s.id));
    }, [allSubjects, subjectsAlreadyInCourse]);

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreateSubject = async (subjectData: { nombre: string, id_cursos: string[], modulos: string[] }): Promise<Subject> => {
        try {
            const payload = {
                nombre: subjectData.nombre,
                id_cursos: subjectData.id_cursos,
                modulos: subjectData.modulos,
            };

            const response = await CoursesAPI.createMateria({
                nombre: payload.nombre,
                id_cursos: payload.id_cursos,
                modulos: payload.modulos,
            });
            
            toast.success("Materia creada exitosamente");
            return response;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            toast.error("Error al crear materia: " + errorMessage);
            throw err;
        }
    };

    const handleUpdateSubject = async (subjectData: { id: string; nombre: string; id_cursos: string[]; modulos: string[] }): Promise<void> => {
        try {
            await CoursesAPI.updateMateria(subjectData.id, {
                id: subjectData.id,
                nombre: subjectData.nombre,
                id_cursos: subjectData.id_cursos,
                modulos: subjectData.modulos,
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            toast.error("Error al actualizar materia: " + errorMessage);
            throw err;
        }
    };

    const handleSelectSubject = (subjectId: string) => {
        const found = selectableSubjects.find((s) => s.id === subjectId);
        if (!found) return;
        if (selectedSubjects.some((s) => s.id === found.id)) return;
        setSelectedSubjects((prev) => [...prev, found]);
    };

    const handleRemoveSelected = (subjectId: string) => {
        setSelectedSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    };

    const handleConfirmAssociation = async () => {
        if (!courseId) {
            toast.error("Primero debes crear/guardar el curso");
            return;
        }
        if (selectedSubjects.length === 0) {
            toast.error("Selecciona al menos una materia");
            return;
        }
        setLoading(true);
        try {
            const courseIdStr = String(courseId);
            await Promise.all(
                selectedSubjects.map(async (s) => {
                    const currentCourses = Array.isArray(s.id_cursos) ? s.id_cursos : [];
                    const updatedCourses = currentCourses.includes(courseIdStr)
                        ? currentCourses
                        : [...currentCourses, courseIdStr];
                    await CoursesAPI.updateMateria(s.id, {
                        ...s,
                        id_cursos: updatedCourses,
                    });
                })
            );
            toast.success("Materias asociadas al curso");
            setNewSubjects(true);
            // Refresh lists
            const refreshed = await CoursesAPI.getMaterias();
            setAllSubjects(Array.isArray(refreshed) ? refreshed : []);
            setSelectedSubjects([]);
            setNewSubjects(false);
        } catch (e) {
            console.error(e);
            toast.error("Error al asociar materias");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-base">Materias</h1>
                        <div className="text-sm text-muted-foreground">
                            Agrega las materias que se enseñarán en el curso
                        </div>
                    </div>
                    <Button type="button" className="cursor-pointer" onClick={() => setIsCreateModalOpen(true)}>
                        Crear nueva materia
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Agregar materias existentes</div>
                        <Select onValueChange={handleSelectSubject}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar materia..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectableSubjects.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedSubjects.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Seleccionadas:</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedSubjects.map((s) => (
                                    <Badge key={s.id} variant="secondary" className="flex items-center gap-2">
                                        {s.nombre}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSelected(s.id)}
                                            className="rounded-full hover:bg-gray-300 p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            className="cursor-pointer"
                            onClick={handleConfirmAssociation}
                            disabled={loading || !courseId || selectedSubjects.length === 0}
                        >
                            {loading ? "Asociando..." : "Asociar seleccionadas al curso"}
                        </Button>
                    </div>

                    {subjectsAlreadyInCourse.size > 0 && (
                        <div className="mt-4 text-xs text-gray-600">
                            Ya asociadas a este curso: {allSubjects.filter(s => subjectsAlreadyInCourse.has(s.id)).map(s => s.nombre).join(', ')}
                        </div>
                    )}
                </CardContent>
            </Card>

            <SubjectModal
                isOpen={isCreateModalOpen}
                onCancel={handleCancelCreate}
                onSubjectCreated={handleCreateSubject}
                courseId={courseId}
                editingSubject={editingSubject}
                onSubjectUpdated={handleUpdateSubject}
            />
        </div>
    );
}