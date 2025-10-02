import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Video,
  FileText,
  HelpCircle,
  ImageIcon,
  File,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { type ModuloForm } from "@/types/modules";
// import ContenidoFormRow from "./ContenidoFormRow";

interface ModulesTabProps {
  subjectId: string | null;
  modules: ModuloForm[];
  onCreateModule: (moduleData: ModuloForm) => Promise<void>;
  loading: boolean;
  setModules?: React.Dispatch<React.SetStateAction<ModuloForm[]>>;
  onEditModule?: (moduleId: string, moduleData: ModuloForm) => Promise<void>;
  mode?: "create" | "edit";
}

export default function ModulesTab({
  subjectId,
  modules,
  onCreateModule,
  loading: externalLoading,
  setModules,
  onEditModule,
  mode = "create",
}: ModulesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuloForm>({
    titulo: "",
    descripcion: "",
    bibliografia: "",
    url_miniatura: "",
    url_contenido: "",
    tipo_contenido: "video",
  });

  const validateModule = (): boolean => {
    if (!moduleForm.titulo.trim()) {
      toast.error("El título del módulo es obligatorio");
      return false;
    }
    if (!moduleForm.descripcion.trim()) {
      toast.error("La descripción del módulo es obligatoria");
      return false;
    }
    if (!moduleForm.bibliografia.trim()) {
      toast.error("La bibliografía del módulo es obligatoria");
      return false;
    }
    if (!moduleForm.url_miniatura.trim()) {
      toast.error("La URL de la miniatura del módulo es obligatoria");
      return false;
    }
    if (!moduleForm.url_contenido.trim()) {
      toast.error("La URL del contenido del módulo es obligatoria");
      return false;
    }
    if (!moduleForm.tipo_contenido.trim()) {
      toast.error("El tipo de contenido del módulo es obligatorio");
      return false;
    }

    return true;
  };

  const handleSubmitModule = async () => {
    if (!validateModule()) return;
    setLoading(true);

    const moduleData: ModuloForm = {
      titulo: moduleForm.titulo,
      descripcion: moduleForm.descripcion,
      bibliografia: moduleForm.bibliografia,
      url_miniatura: moduleForm.url_miniatura,
      url_contenido: moduleForm.url_contenido,
      tipo_contenido: moduleForm.tipo_contenido,
    };

    try {
      if (editingModuleId && onEditModule) {
        await onEditModule(editingModuleId, moduleData);
        toast.success("Módulo actualizado correctamente");
      } else {
        await onCreateModule(moduleData);
        toast.success("Módulo creado correctamente");
      }

      resetForm();
    } catch (error) {
      console.error("Error al guardar módulo:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setModuleForm({
      titulo: "",
      descripcion: "",
      bibliografia: "",
      url_miniatura: "",
      url_contenido: "",
      tipo_contenido: "video",
    });
    setEditingModuleId(null);
    setShowForm(false);
  };

  // setEditingModuleId(module.titulo);
  // setModuleForm({
  //   titulo: module.titulo || "",
  //   descripcion: module.descripcion || "",
  //   bibliografia: module.bibliografia || "",
  //   url_miniatura: module.url_miniatura || "",
  //   url_contenido: module.url_contenido || "",
  //   tipo_contenido: module.tipo_contenido || "video",
  // });

  const getContentIcon = (tipo: string) => {
    switch (tipo) {
      case "video":
        return <Video className="w-4 h-4 text-blue-500" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "evaluacion":
        return <HelpCircle className="w-4 h-4 text-yellow-500" />;
      case "imagen":
        return <ImageIcon className="w-4 h-4 text-green-500" />;
      case "contenido_extra":
        return <File className="w-4 h-4 text-purple-500" />;
      default:
        return <Video className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!subjectId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          {mode === "create"
            ? "Primero debes crear el grado para poder agregar módulos"
            : "Primero debes cargar el grado para poder gestionar módulos"
          }
        </p>
        <Button disabled variant="outline">
          {mode === "create" ? "Crear Grado Primero" : "Cargar Grado Primero"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Módulos del Curso</h3>
        <Button type="button" className="cursor-pointer" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Módulo
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium">
              {editingModuleId ? "Editar Módulo" : "Nuevo Módulo"}
            </h4>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={moduleForm.titulo}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
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
                  value={moduleForm.descripcion}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Describe el contenido del módulo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Bibliografía *
                </label>
                <textarea
                  className="w-full p-2 border rounded h-20"
                  value={moduleForm.bibliografia}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      bibliografia: e.target.value,
                    }))
                  }
                  placeholder="Menciona la bibliografía del módulo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  URL de la miniatura *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={moduleForm.url_miniatura}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      url_miniatura: e.target.value,
                    }))
                  }
                  placeholder="Ej: https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  URL del contenido *
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={moduleForm.url_contenido}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      url_contenido: e.target.value,
                    }))
                  }
                  placeholder="Ej: https://www.youtube.com/embed/k6GFz1kw1bY?si=lEf81Qfu7UpPEP58"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo de contenido *
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={moduleForm.tipo_contenido}
                  onChange={(e) =>
                    setModuleForm((prev) => ({
                      ...prev,
                      tipo_contenido: e.target.value as "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra",
                    }))
                  }
                >
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="evaluacion">Evaluación</option>
                  <option value="imagen">Imagen</option>
                  <option value="contenido_extra">Contenido Extra</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                onClick={handleSubmitModule}
                disabled={loading || externalLoading}
                className="cursor-pointer"
                size="sm"
              >
                {(loading || externalLoading) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingModuleId ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Módulo"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                className="cursor-pointer"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* <div className="space-y-3">
      {modules.length === 0 ? (
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
        modules.map((module: ModuleData, index: number) => (
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
                {mode === "edit" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditModule(module)}
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

              {Array.isArray(module.temas) && module.temas.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">
                    Temas:
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {module.temas.map((tema: string, idx: number) => (
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
                  Contenidos ({module.contenido?.length || 0}):
                </h5>
                <div className="space-y-2">
                  {Array.isArray(module.contenido) &&
                    module.contenido.length > 0 ? (
                    module.contenido.map((content, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded border"
                      >
                        <div className="mt-1">
                          {getContentIcon(content.tipo_contenido)}
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
}