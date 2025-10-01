import ModulesTab from "@/components/subject/ModulesTab";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { type ModuloForm } from "@/types/modules";
import type { Subject } from "@/types/types";
import { CoursesAPI } from "@/service/courses";
import { toast } from "sonner";

interface PendingSubjectData {
    id: string;
    nombre: string;
    id_cursos: string[];
    courseId?: string | null;
}

export default function CreateModule() {
    const navigate = useNavigate();
    const location = useLocation();
    const [modules, setModules] = useState<ModuloForm[]>([]);
    const [pendingSubject, setPendingSubject] = useState<PendingSubjectData | null>(null);
    const [subjectFromQuery, setSubjectFromQuery] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCreatingSubject, setIsCreatingSubject] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const subjectId = params.get('subjectId');

        if (subjectId) {
            (async () => {
                try {
                    const subject = await CoursesAPI.getMateriaById(subjectId);
                    setSubjectFromQuery(subject);
                    if (Array.isArray(subject.modulos) && subject.modulos.length > 0) {
                        const fetched = await CoursesAPI.getModulesByIds(subject.modulos);
                        setModules(fetched as unknown as ModuloForm[]);
                    } else {
                        setModules([]);
                    }
                } catch (e) {
                    console.error('Error al cargar materia/modulos:', e);
                    toast.error('No se pudieron cargar los datos de la materia');
                }
            })();
            return;
        }

        const savedSubjectData = localStorage.getItem('pendingSubjectData');
        if (savedSubjectData) {
            try {
                const subjectData = JSON.parse(savedSubjectData);
                setPendingSubject(subjectData);
            } catch (error) {
                console.error('Error al parsear datos de materia:', error);
                toast.error('Error al cargar datos de la materia');
            }
        }
    }, [location.search]);

    const createModule = async (moduleData: ModuloForm) => {
        setLoading(true);
        try {
            if (subjectFromQuery) {
                const created = await CoursesAPI.createModule({
                    ...moduleData,
                    id_materia: subjectFromQuery.id
                });
                const updatedSubject: Subject = {
                    ...subjectFromQuery,
                    modulos: [...(subjectFromQuery.modulos || []), created.id]
                };
                await CoursesAPI.updateMateria(subjectFromQuery.id, updatedSubject);
                setSubjectFromQuery(updatedSubject);
                setModules((prev) => [...prev, moduleData]);
                toast.success('Módulo agregado correctamente');
            } else if (pendingSubject) {
                setModules((prev) => [...prev, moduleData]);
                toast.success('Módulo agregado correctamente');
            } else {
                toast.error('No hay materia seleccionada');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error al crear módulo');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToSubjects = async () => {
        setLoading(true);
        try {
            if (pendingSubject && !subjectFromQuery) {
                await CoursesAPI.deleteMateria(pendingSubject.id);
                localStorage.removeItem('pendingSubjectData');
            }
            navigate('/subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleFinishSubjectCreation = async () => {
        if (!pendingSubject) {
            toast.error('No hay datos de materia para crear');
            return;
        }

        if (modules.length === 0) {
            toast.error('Debe crear al menos un módulo antes de finalizar');
            return;
        }

        setIsCreatingSubject(true);

        try {
            const moduleIds: string[] = [];
            
            for (const moduleData of modules) {
                const createdModule = await CoursesAPI.createModule({
                    ...moduleData,
                    id_materia: pendingSubject.id
                });
                moduleIds.push(createdModule.id);
            }

            const subjectData = {
                id: pendingSubject.id,
                nombre: pendingSubject.nombre,
                id_cursos: pendingSubject.id_cursos,
                modulos: moduleIds
            };

            await CoursesAPI.updateMateria(pendingSubject.id, subjectData);

            localStorage.removeItem('pendingSubjectData');

            toast.success('Materia y módulos creados correctamente');
            navigate('/subjects');

        } catch (error) {
            console.error('Error al crear materia:', error);
            toast.error('Error al crear la materia y módulos');
        } finally {
            setIsCreatingSubject(false);
        }
    };

    if (!pendingSubject && !subjectFromQuery) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            No hay materia pendiente
                        </CardTitle>
                        <CardDescription>
                            No se encontró materia para gestionar módulos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate('/subjects')} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Materias
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            {subjectFromQuery ? (
                                <>Gestionando módulos de: {subjectFromQuery.nombre}</>
                            ) : (
                                <>Creando módulos para: {pendingSubject?.nombre}</>
                            )}
                        </span>
                        <Button onClick={handleBackToSubjects} variant="outline" size="sm" className="cursor-pointer" disabled={loading}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Cancelar'}
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        {subjectFromQuery ? (
                            <>Agrega o actualiza los módulos de esta materia.</>
                        ) : (
                            <>Crea los módulos que formarán parte de esta materia. Puedes agregar tantos módulos como necesites.</>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Módulos creados: <span className="font-semibold">{modules.length}</span>
                        </div>
                        {modules.length > 0 && !subjectFromQuery && (
                            <Button 
                                onClick={handleFinishSubjectCreation}
                                disabled={isCreatingSubject}
                                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                            >
                                {isCreatingSubject ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creando materia...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Finalizar y Crear Materia
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Listado de módulos existentes */}
            <Card>
                <CardHeader>
                    <CardTitle>Módulos existentes</CardTitle>
                    <CardDescription>
                        {modules.length === 0
                            ? 'Aún no hay módulos para esta materia.'
                            : 'Visualiza los módulos ya creados para esta materia.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {modules.length === 0 ? (
                        <div className="text-sm text-gray-500">Sin módulos</div>
                    ) : (
                        <div className="space-y-3">
                            {modules.map((m, idx) => (
                                <div key={idx} className="p-4 border rounded-md">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">{m.titulo || 'Sin título'}</div>
                                        <div className="text-xs text-gray-500 capitalize">
                                            {m.tipo_contenido || 'contenido'}
                                        </div>
                                    </div>
                                    {m.descripcion && (
                                        <p className="text-sm text-gray-600 mt-1">{m.descripcion}</p>
                                    )}
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                                        {m.bibliografia && (
                                            <div>Bibliografía: <span className="text-gray-700">{m.bibliografia}</span></div>
                                        )}
                                        {m.url_miniatura && (
                                            <div>Miniatura: <a className="text-blue-600 underline" href={m.url_miniatura} target="_blank" rel="noreferrer">ver</a></div>
                                        )}
                                        {m.url_contenido && (
                                            <div>Contenido: <a className="text-blue-600 underline" href={m.url_contenido} target="_blank" rel="noreferrer">abrir</a></div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ModulesTab 
                subjectId={(subjectFromQuery?.id) || (pendingSubject?.id ?? null)} 
                modules={modules} 
                onCreateModule={createModule} 
                loading={false}
                setModules={setModules}
            />
        </div>
    );
}