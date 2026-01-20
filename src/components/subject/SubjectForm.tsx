
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, BookOpen, Edit, Trash2 } from "lucide-react";
import { Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CoursesAPI } from "@/service/courses";

interface SubjectData {
  id: string;
  titulo: string;
  descripcion: string;
  estado: "activo" | "inactivo";
}

interface SubjectFormProps {
  control?: unknown;
  onSubjectCreated?: (subjectData: { nombre: string; estado: string }) => Promise<void>;
  courseId?: string | null;
}

const SubjectForm = ({ onSubjectCreated, courseId }: SubjectFormProps) => {
    const [showForm, setShowForm] = useState(false);
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [existingSubjects, setExistingSubjects] = useState<SubjectData[]>([]);
    const [subjectForm, setSubjectForm] = useState<SubjectData>({
        id: "",
        titulo: "",
        descripcion: "",
        estado: "activo",
    });


    const loadExistingSubjects = useCallback(async () => {
        if (!courseId) return;
        
        setLoading(true);
        try {
            const courseData = await CoursesAPI.getById(courseId);
            if (courseData.materias && Array.isArray(courseData.materias)) {
                const subjectPromises = courseData.materias.map(async (subjectId: string) => {
                    try {
                        return await CoursesAPI.getMateriaById(subjectId);
                    } catch {
                        console.warn(`No se pudo cargar la materia con ID: ${subjectId}`);
                        return null;
                    }
                });
                
                const subjects = await Promise.all(subjectPromises);
                const validSubjects = subjects.filter(subject => subject !== null);
                setExistingSubjects(validSubjects);
            }
        } catch (error) {
            console.error("Error al cargar materias existentes:", error);
            toast.error("Error al cargar materias existentes");
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) {
            loadExistingSubjects();
        }
    }, [courseId, loadExistingSubjects]);

    const resetForm = () => {
        setSubjectForm({
            id: "",
            titulo: "",
            descripcion: "",
            estado: "activo",
        });
        setEditingSubjectId(null);
        setShowForm(false);
    };

    const validateForm = () => {
        if (!subjectForm.titulo.trim()) {
            toast.error("El título de la materia es obligatorio");
            return false;
        }
        if (!subjectForm.descripcion.trim()) {
            toast.error("La descripción de la materia es obligatoria");
            return false;
        }
        if (!courseId) {
            toast.error("Primero debes crear el curso");
            return false;
        }
        return true;
    };

    const handleSubmitSubject = async () => {
        if (!validateForm()) return;

        setLoading(true);
        
        try {
            if (onSubjectCreated) {
                await onSubjectCreated({
                    nombre: subjectForm.titulo,
                    estado: subjectForm.estado
                });
                resetForm();
                await loadExistingSubjects();
            } else {
                toast.error("No se pudo crear la materia: función no disponible");
            }
        } catch (error) {
            console.error("Error al guardar materia:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Materias del Curso</h3>
                <Button type="button" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Materia
                </Button>
            </div>

            {showForm && (
                <Card className="border-2 border-blue-200">
                    <CardContent className="p-4 space-y-4">
                        <h4 className="font-medium">
                            {editingSubjectId ? "Editar Materia" : "Nueva Materia"}
                        </h4>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={subjectForm.titulo}
                                    onChange={(e) =>
                                        setSubjectForm((prev) => ({
                                            ...prev,
                                            titulo: e.target.value,
                                        }))
                                    }
                                    placeholder="Ej: Fundamentos del Liderazgo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Descripción *
                                </label>
                                <textarea
                                    className="w-full p-2 border rounded h-20"
                                    value={subjectForm.descripcion}
                                    onChange={(e) =>
                                        setSubjectForm((prev) => ({
                                            ...prev,
                                            descripcion: e.target.value,
                                        }))
                                    }
                                    placeholder="Describe el contenido de la materia..."
                                />
                            </div>

                            <div>
                                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <h2 className="text-base">Estado Activo</h2>
                                        <div className="text-sm text-muted-foreground">
                                            Determina si el curso está disponible para los estudiantes
                                        </div>
                                    </div>
                                    <div>
                                        <input
                                            type="checkbox"
                                            checked={subjectForm.estado === "activo"}
                                            onChange={(e) =>
                                                setSubjectForm((prev) => ({
                                                    ...prev,
                                                    estado: e.target.checked ? "activo" : "inactivo",
                                                }))
                                            }
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-2 pt-4">
                            <Button
                                type="button"
                                onClick={handleSubmitSubject}
                                disabled={loading}
                                size="sm"
                            >
                                {(loading) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : editingSubjectId ? (
                                    "Guardar Cambios"
                                ) : (
                                    "Crear Materia"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                size="sm"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                <h4 className="text-lg font-semibold">Materias Existentes</h4>
                {existingSubjects.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No hay materias creadas aún</p>
                            <p className="text-sm">
                                Haz clic en "Agregar Materia" para comenzar
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    existingSubjects.map((subject, index) => (
                        <Card key={subject.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-medium flex items-center space-x-2">
                                            <Badge variant="outline">Materia {index + 1}</Badge>
                                            <span>{subject.titulo}</span>
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {subject.descripcion}
                                        </p>
                                        <Badge 
                                            variant={subject.estado === "activo" ? "default" : "secondary"}
                                            className="mt-2"
                                        >
                                            {subject.estado}
                                        </Badge>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {}}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {}}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default SubjectForm;
