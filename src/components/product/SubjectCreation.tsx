// components/product/edit/FeaturesForm.tsx
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import type { Control } from "react-hook-form";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import CreateSubjectModal from "../subject/CreateSubjectModal";
import { useState } from "react";
import { type Subject } from "@/types/types";
import { CoursesAPI } from "@/service/courses";
import { toast } from "sonner";


export default function SubjectCreation({ courseId }: SubjectCreationProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

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
                        Agregar Materia
                    </Button>
                </CardContent>
            </Card>

            <CreateSubjectModal
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