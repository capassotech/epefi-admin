import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CoursesAPI } from '@/service/courses';
import { type Course } from '@/types/types';


interface CreateSubjectModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onSubjectCreated: (subjectData: { nombre: string; id_cursos: string[], modulos: string[] }) => Promise<{ id: string }>;
    courseId?: string | null;
}


const CreateSubjectModal = ({
    isOpen,
    onCancel,
    courseId,
    onSubjectCreated
}: CreateSubjectModalProps) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [subjectForm, setSubjectForm] = useState({
        nombre: "",
        id_cursos: Array.isArray(courseId) ? courseId : courseId ? [courseId] : [],
        modulos: [],
    });

    useEffect(() => {
        if (isOpen) {
            const initialCourses = Array.isArray(courseId) ? courseId : courseId ? [courseId] : [];
            setSubjectForm({
                nombre: "",
                id_cursos: initialCourses,
                modulos: [],
            });
            setSelectedCourses(initialCourses);

            loadExistingCourses();
        }
    }, [isOpen, courseId]);

    const loadExistingCourses = async () => {
        const courses = await CoursesAPI.getAll();
        console.log(courses)
        setCourses(courses);
    };

    const handleCourseSelect = (courseId: string) => {
        if (!selectedCourses.includes(courseId)) {
            const newSelectedCourses = [...selectedCourses, courseId];
            setSelectedCourses(newSelectedCourses);
            setSubjectForm(prev => ({
                ...prev,
                id_cursos: newSelectedCourses
            }));
        }
    };

    const handleCourseRemove = (courseId: string) => {
        const newSelectedCourses = selectedCourses.filter(id => id !== courseId);
        setSelectedCourses(newSelectedCourses);
        setSubjectForm(prev => ({
            ...prev,
            id_cursos: newSelectedCourses
        }));
    };

    const getCourseName = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.titulo : courseId;
    };

    const validateForm = () => {
        if (!subjectForm.nombre.trim()) {
            return "El título de la materia es obligatorio";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            alert(error);
            return;
        }

        const subjectDataToSend = {
            nombre: subjectForm.nombre,
            id_cursos: selectedCourses,
            modulos: subjectForm.modulos,
        };

        const res = await onSubjectCreated(subjectDataToSend);
        
        const subjectData = {
            id: res.id,
            nombre: subjectForm.nombre,
            id_cursos: selectedCourses,
            modulos: subjectForm.modulos,
        };
        
        localStorage.setItem('pendingSubjectData', JSON.stringify(subjectData));
        
        onCancel();
        navigate('/modules/create');
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogTrigger></DialogTrigger>
            <DialogContent>
                <div
                    className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Materia</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Materia *
                            </label>
                            <input
                                type="text"
                                value={subjectForm.nombre}
                                onChange={(e) =>
                                    setSubjectForm((prev) => ({
                                        ...prev,
                                        nombre: e.target.value,
                                    }))
                                }
                                placeholder="Ej: Fundamentos del Liderazgo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Curso/s asociado/s
                            </label>
                            <Select onValueChange={handleCourseSelect}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar cursos..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses
                                        .filter(course => !selectedCourses.includes(course.id))
                                        .map((course) => (
                                            <SelectItem key={course.id} value={course.id}>
                                                {course.titulo}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            
                            {/* Mostrar cursos seleccionados */}
                            {selectedCourses.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-2">Cursos seleccionados:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCourses.map((courseId) => (
                                            <Badge key={courseId} variant="secondary" className="flex items-center gap-1">
                                                {getCourseName(courseId)}
                                                <button
                                                    type="button"
                                                    onClick={() => handleCourseRemove(courseId)}
                                                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedCourses.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            Esta materia se asociará a {selectedCourses.length} curso{selectedCourses.length > 1 ? 's' : ''} seleccionado{selectedCourses.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                            >
                                Continuar con Módulos
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSubjectModal;
