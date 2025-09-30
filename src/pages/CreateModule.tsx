import ModulesTab from "@/components/subject/ModulesTab";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { type ModuloForm } from "@/types/modules";
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
    const [modules, setModules] = useState<ModuloForm[]>([]);
    const [pendingSubject, setPendingSubject] = useState<PendingSubjectData | null>(null);
    const [isCreatingSubject, setIsCreatingSubject] = useState(false);

    useEffect(() => {
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
    }, []);

    const createModule = async (moduleData: ModuloForm) => {
        setModules([...modules, moduleData]);
        toast.success('Módulo agregado correctamente');
    };

    const handleBackToSubjects = () => {
        localStorage.removeItem('pendingSubjectData');
        navigate('/subjects');
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

    if (!pendingSubject) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            No hay materia pendiente
                        </CardTitle>
                        <CardDescription>
                            No se encontraron datos de una materia pendiente para crear módulos.
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
                        <span>Creando módulos para: {pendingSubject.nombre}</span>
                        <Button onClick={handleBackToSubjects} variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        Crea los módulos que formarán parte de esta materia. Puedes agregar tantos módulos como necesites.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Módulos creados: <span className="font-semibold">{modules.length}</span>
                        </div>
                        {modules.length > 0 && (
                            <Button 
                                onClick={handleFinishSubjectCreation}
                                disabled={isCreatingSubject}
                                className="bg-green-600 hover:bg-green-700"
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

            <ModulesTab 
                subjectId={pendingSubject.id[0]} 
                modules={modules} 
                onCreateModule={createModule} 
                loading={false}
                setModules={setModules}
            />
        </div>
    );
}