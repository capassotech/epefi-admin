"use client";

import type React from "react";
import { useFieldArray, useFormContext, type Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  Video,
  FileText,
  HelpCircle,
  ImageIcon,
  File,
  Clock,
  CheckCircle,
  Circle,
} from "lucide-react";
import type { ProductFormData } from "@/schemas/product-schema";

interface ContentFormProps {
  control: Control<ProductFormData>;
  watchedType: string | null;
}

const ContentForm: React.FC<ContentFormProps> = ({ control }) => {
  const { watch } = useFormContext<ProductFormData>();
  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control,
    name: "modules",
  });

  const getContentIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="w-4 h-4 text-blue-500" />;
      case "PDF":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "QUIZ":
        return <HelpCircle className="w-4 h-4 text-yellow-500" />;
      case "IMAGE":
        return <ImageIcon className="w-4 h-4 text-green-500" />;
      case "DOCX":
        return <File className="w-4 h-4 text-purple-500" />;
      default:
        return <Video className="w-4 h-4 text-blue-500" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "Video";
      case "PDF":
        return "PDF";
      case "QUIZ":
        return "Quiz";
      case "IMAGE":
        return "Imagen";
      case "DOCX":
        return "Documento";
      default:
        return "Video";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Contenido del Curso</h2>
        <p className="text-gray-600">
          Organiza el contenido del curso en módulos y lecciones. Cada módulo
          puede contener videos, PDFs, quizzes, documentos e imágenes.
        </p>
      </div>

      {moduleFields.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay módulos creados
          </h3>
          <p className="text-gray-500 mb-4">
            Comienza creando tu primer módulo de contenido
          </p>
        </div>
      )}

      {moduleFields.map((module, moduleIndex) => (
        <ModuleCard
          key={module.id}
          moduleIndex={moduleIndex}
          control={control}
          watch={watch}
          removeModule={removeModule}
          getContentIcon={getContentIcon}
          getContentTypeLabel={getContentTypeLabel}
        />
      ))}

      <Button
        type="button"
        onClick={() =>
          appendModule({
            id: `module-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            title: "",
            description: "",
            contents: [],
          })
        }
        className="w-full mt-6"
        size="lg"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Añadir Módulo
      </Button>
    </div>
  );
};

// Componente separado para cada módulo para evitar problemas con hooks
interface ModuleCardProps {
  moduleIndex: number;
  control: Control<ProductFormData>;
  watch: any;
  removeModule: (index: number) => void;
  getContentIcon: (type: string) => React.ReactNode;
  getContentTypeLabel: (type: string) => string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  moduleIndex,
  control,
  watch,
  removeModule,
  getContentIcon,
  getContentTypeLabel,
}) => {
  // Ahora cada módulo tiene su propio useFieldArray de forma estática
  const {
    fields: contentFields,
    append: appendContent,
    remove: removeContent,
  } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.contents`,
  });

  const moduleTitle = watch(`modules.${moduleIndex}.title`) || "Nuevo Módulo";
  const totalContents = contentFields.length;
  const completedContents = contentFields.filter((_, index) =>
    watch(`modules.${moduleIndex}.contents.${index}.completed`)
  ).length;

  return (
    <Card className="relative border-2 border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                Módulo {moduleIndex + 1}
              </span>
              {moduleTitle}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="text-xs">
                {totalContents} contenido{totalContents !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {completedContents}/{totalContents} completado
                {completedContents !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeModule(moduleIndex)}
            className="shrink-0"
          >
            <Minus className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Información del Módulo */}
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={control}
            name={`modules.${moduleIndex}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del Módulo *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Introducción a la Moldería"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`modules.${moduleIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción del Módulo *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: En este módulo aprenderás los fundamentos..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contenidos del Módulo */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contenidos del Módulo</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendContent({
                  id: `content-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 9)}`,
                  type: "VIDEO",
                  title: "",
                  description: "",
                  url: "",
                  order: contentFields.length + 1,
                  thumbnail: "",
                  duration: "",
                  completed: false,
                  topics: "",
                })
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Contenido
            </Button>
          </div>

          {contentFields.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50">
              <div className="mx-auto w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                Este módulo no tiene contenidos. ¡Añade el primero!
              </p>
            </div>
          )}

          {contentFields.map((content, contentIndex) => {
            const contentType =
              watch(`modules.${moduleIndex}.contents.${contentIndex}.type`) ||
              "VIDEO";
            const contentTitle =
              watch(`modules.${moduleIndex}.contents.${contentIndex}.title`) ||
              "Nuevo Contenido";
            const contentDuration =
              watch(
                `modules.${moduleIndex}.contents.${contentIndex}.duration`
              ) || "";
            const isCompleted =
              watch(
                `modules.${moduleIndex}.contents.${contentIndex}.completed`
              ) || false;

            return (
              <Card
                key={content.id}
                className="relative bg-white border border-gray-200 shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getContentIcon(contentType)}
                      <div>
                        <CardTitle className="text-base font-medium">
                          {contentTitle}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getContentTypeLabel(contentType)}
                          </Badge>
                          {contentDuration && (
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1"
                            >
                              <Clock className="w-3 h-3" />
                              {contentDuration}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-500">
                              {isCompleted ? "Completado" : "Pendiente"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContent(contentIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name={`modules.${moduleIndex}.contents.${contentIndex}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título del Contenido *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Clase 1: Introducción"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`modules.${moduleIndex}.contents.${contentIndex}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Contenido *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "VIDEO"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VIDEO">
                                <div className="flex items-center gap-2">
                                  <Video className="w-4 h-4 text-blue-500" />
                                  Video
                                </div>
                              </SelectItem>
                              <SelectItem value="PDF">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-red-500" />
                                  PDF
                                </div>
                              </SelectItem>
                              <SelectItem value="QUIZ">
                                <div className="flex items-center gap-2">
                                  <HelpCircle className="w-4 h-4 text-yellow-500" />
                                  Quiz
                                </div>
                              </SelectItem>
                              <SelectItem value="DOCX">
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4 text-purple-500" />
                                  Documento (DOCX)
                                </div>
                              </SelectItem>
                              <SelectItem value="IMAGE">
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4 text-green-500" />
                                  Imagen
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={control}
                    name={`modules.${moduleIndex}.contents.${contentIndex}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción del Contenido *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: En esta clase veremos..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name={`modules.${moduleIndex}.contents.${contentIndex}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del Contenido *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: https://youtube.com/video123"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`modules.${moduleIndex}.contents.${contentIndex}.duration`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 15 min" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={control}
                    name={`modules.${moduleIndex}.contents.${contentIndex}.thumbnail`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Miniatura (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: https://ejemplo.com/thumb.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`modules.${moduleIndex}.contents.${contentIndex}.topics`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temas (separados por comas)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: moldería, confección, patronaje"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          Separa los temas con comas para organizarlos mejor
                        </p>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentForm;
