// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PencilIcon } from 'lucide-react';
import {
    ArrowLeft,
    Clock,
    BookOpen,
    DollarSign,
    Tag,
    Building,
    Users,
    Image as ImageIcon,
} from 'lucide-react';
import { CoursesAPI } from '@/service/courses';
import type { Module, Subject } from '@/types/types';
import ModulesList from '@/components/subject/ModulesList';


export const SubjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [materia, setMateria] = useState<Subject | null>(null);
    const [modulos, setModulos] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingModulos, setLoadingModulos] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('ID de formación no proporcionado');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const data = await CoursesAPI.getMateriaById(id);
                setMateria(data);

                if (data.modulos && data.modulos.length > 0) {
                    setLoadingModulos(true);
                    try {
                        const materiasData = await CoursesAPI.getModulesByIds(data.modulos);
                        setModulos(materiasData);
                    } catch (moduloError) {
                        console.error("⚠️ Error al cargar materias:", moduloError);
                    } finally {
                        setLoadingModulos(false);
                    }
                }
            } catch (error: any) {
                console.error("❌ Error al cargar formación:", error);
                setError(error.message || 'Error al cargar la formación');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
    if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
    if (!materia) return <div className="p-6">No se encontró la formación</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)} className='cursor-pointer'>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">{materia.nombre}</h1>
                </div>
            </div>

            {materia.imagen && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <ImageIcon className="w-5 h-5 mr-2 text-gray-600" />
                            Imagen Principal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <img
                            src={materia.imagen ?? materia.imagen ?? '/placeholder.svg'}
                            alt={materia.nombre}
                            className="max-w-full h-auto rounded-lg border"
                        />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-gray-600" />
                        Detalles de la Formación
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {materia.modulos && materia.modulos.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                            <CardTitle className="flex items-center mb-3">
                                <BookOpen className="w-5 h-5 mr-2 text-gray-600" />
                                Modulos ({materia.modulos.length})
                            </CardTitle>
                            {loadingModulos ? (
                                <p>Cargando materias...</p>
                            ) : modulos.length > 0 ? (
                                // <div className="space-y-3">
                                //     {modulos.map((modulo) => (
                                //         <div
                                //             key={modulo.id}
                                //             className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                                //         >
                                //             <h4 className="font-semibold text-lg">Nombre: {modulo.titulo}</h4>
                                //             <p>Descripcion: {modulo.descripcion}</p>
                                //         </div>
                                //     ))}
                                // </div>
                                <ModulesList modules={modulos} />
                            ) : (
                                <p className="text-gray-500">No se pudieron cargar los detalles de los modulos.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

