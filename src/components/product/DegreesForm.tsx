
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2 } from "lucide-react";
import { Plus } from "lucide-react";
import { BookOpen } from "lucide-react";
import type { DegreeFormData } from "@/types/types";
import { useState } from "react";



const DegreesForm = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [degreeForm, setDegreeForm] = useState<DegreeFormData>({
        id: "",
        titulo: "",
        descripcion: "",
        estado: "activo",
    });
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Materias del Curso</h3>
                <Button type="button" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Materia
                </Button>
            </div>

            {/* Formulario de módulo */}
            {showForm && (
                <Card className="border-2 border-blue-200">
                    <CardContent className="p-4 space-y-4">
                        <h4 className="font-medium">
                            {editingModuleId ? "Editar Materia" : "Nueva Materia"}
                        </h4>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={degreeForm.titulo}
                                    onChange={(e) =>
                                        setDegreeForm((prev) => ({
                                            ...prev,
                                            titulo: e.target.value,
                                        }))
                                    }
                                    placeholder="Ej: Fundamentos del Liderazgo"
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
                                            checked={degreeForm.estado === "activo"}
                                            onChange={(e) =>
                                                setDegreeForm((prev) => ({
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
                                // onClick={handleSubmitModule}
                                disabled={loading}
                                size="sm"
                            >
                                {(loading) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : editingModuleId ? (
                                    "Guardar Cambios"
                                ) : (
                                    "Crear Materia"
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                // onClick={resetForm}
                                size="sm"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* <div className="space-y-3">
                {degreeForm.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No hay módulos creados aún</p>
                            <p className="text-sm">
                                Haz clic en "Agregar Módulo" para comenzar
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    degreeForm.map((module: DegreeFormData, index: number) => (
                        <Card key={module.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-medium flex items-center space-x-2">
                                            <Badge variant="outline">Módulo {index + 1}</Badge>
                                            <span>{module.titulo}</span>
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {module.descripcion}
                                        </p>
                                    </div>
                                    {editingModuleId === module.id && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingModuleId(module.id)}
                                            disabled={loading || externalLoading}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                        >
                                            {(loading || externalLoading) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Editar"
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {Array.isArray(module.modulos) && module.modulos.length > 0 && (
                                    <div className="mb-3">
                                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                                            Temas:
                                        </h5>
                                        <div className="flex flex-wrap gap-1">
                                            {module.modulos.map((tema: string, idx: number) => (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {tema}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                                        Contenidos ({module.modulos?.length || 0}):
                                    </h5>
                                    <div className="space-y-2">
                                        {Array.isArray(module.modulos) &&
                                            module.modulos.length > 0 ? (
                                            module.modulos.map((content, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded border"
                                                >
                                                    <div className="mt-1">
                                                        {getContentIcon(content.tipo_contenido || "video")}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h6 className="font-medium text-sm">
                                                            {content.titulo}
                                                        </h6>
                                                        <p className="text-xs text-gray-600 mb-1">
                                                            {content.descripcion}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs capitalize"
                                                            >
                                                                {content.tipo_contenido}
                                                            </Badge>
                                                            {content.duracion > 0 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {Math.floor(content.duracion / 60)}min{" "}
                                                                    {content.duracion % 60}s
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {content.url_miniatura && (
                                                        <img
                                                            src={content.url_miniatura}
                                                            alt="Miniatura"
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                Sin contenidos agregados
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div> */}
        </div>
    );
};

export default DegreesForm;
