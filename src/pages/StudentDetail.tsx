// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import {
    ArrowLeft,
    Clock,
    BookOpen,
    Mail,
    IdCard,
    User,
    CheckCircle,
    XCircle,
    Calendar,
} from 'lucide-react';
import type { Course, StudentDB } from '@/types/types';
import { StudentsAPI } from '@/service/students';
import { CoursesAPI } from '@/service/courses';


export const StudentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<StudentDB | null>(null);
    const [cursos, setCursos] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCursos, setLoadingCursos] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('ID de curso no proporcionado');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const data = await StudentsAPI.getById(id);
                setStudent(data);

                if (data.cursos_asignados && data.cursos_asignados.length > 0) {
                    setLoadingCursos(true);
                    try {
                        // Cargar cursos individualmente y manejar errores 404 silenciosamente
                        const cursosPromises = data.cursos_asignados.map(async (cursoId: string) => {
                            try {
                                return await CoursesAPI.getById(cursoId);
                            } catch (error: any) {
                                // Si el curso no existe (404) u otro error, retornar null silenciosamente
                                // Los cursos eliminados simplemente no se mostrarán
                                return null;
                            }
                        });
                        
                        const cursosResults = await Promise.all(cursosPromises);
                        // Filtrar los cursos que existen (eliminar nulls)
                        const cursosExistentes = cursosResults.filter((curso): curso is Course => curso !== null);
                        setCursos(cursosExistentes);
                    } catch (moduloError) {
                        console.error("⚠️ Error general al cargar cursos:", moduloError);
                        setCursos([]);
                    } finally {
                        setLoadingCursos(false);
                    }
                }
            } catch (error: unknown) {
                console.error("❌ Error al cargar curso:", error);
                setError(error instanceof Error ? error.message : 'Error al cargar el curso');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return (
        <InteractiveLoader
            initialMessage="Cargando usuario"
            delayedMessage="Por favor aguarde, conectándose con el servidor"
        />
    );
    if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
    if (!student) return <div className="p-6">No se encontró el curso</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} className='cursor-pointer'>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">{student.nombre} {student.apellido}</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-gray-600" />
                        Detalles del usuario
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                            
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900">{student.email || 'No especificado'}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <IdCard className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="text-sm text-gray-500">DNI</p>
                                    <p className="font-medium text-gray-900">{student.dni || 'No especificado'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Cuenta</h3>
                        
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <User className="w-5 h-5 text-purple-500" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Rol</p>
                                    <div className="mt-1">
                                        {student.role?.admin ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Estudiante
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                {student.activo ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Estado</p>
                                    <div className="mt-1">
                                        {student.activo ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {student.fechaRegistro && (
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Fecha de Registro</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(student.fechaRegistro._seconds * 1000).toLocaleDateString('es-AR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {student.cursos_asignados && student.cursos_asignados.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                            <CardTitle className="flex items-center mb-3">
                                <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                                Cursos ({student.cursos_asignados.length})
                            </CardTitle>
                            {loadingCursos ? (
                                <p>Cargando cursos...</p>
                            ) : cursos.length > 0 ? (
                                <div className="space-y-3">
                                    {cursos.map((curso) => (
                                        <div
                                            key={curso.id}
                                            className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                                        >
                                            <h4 className="font-semibold text-lg">Nombre: {curso.titulo}</h4>
                                            <p>Descripcion: {curso.descripcion}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No se pudieron cargar los detalles de los cursos.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

