// components/product/edit/GeneralInfoForm.tsx

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Dispatch, SetStateAction } from "react";
import { useState, useEffect, useRef } from "react";
import type { ProductFormData } from "@/schemas/product-schema";
import { FileText, X, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface GeneralInfoFormProps {
  control: Control<ProductFormData>;
  setImagePreviewUrl: Dispatch<SetStateAction<string | null>>;
  imagePreviewUrl: string | null;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
  isDialogOpen: boolean;
  currentImageUrl?: string | null;
  currentPlanDeEstudiosUrl?: string | null;
  currentFechasDeExamenesUrl?: string | null;
  onDeletePlanDeEstudios?: () => void;
  onDeleteFechasDeExamenes?: () => void;
  planDeEstudiosDeleted?: boolean;
  fechasDeExamenesDeleted?: boolean;
}

const GeneralInfoForm = ({ 
  control, 
  setImagePreviewUrl, 
  imagePreviewUrl, 
  setIsDialogOpen, 
  isDialogOpen, 
  currentImageUrl,
  currentPlanDeEstudiosUrl,
  currentFechasDeExamenesUrl,
  onDeletePlanDeEstudios,
  onDeleteFechasDeExamenes,
  planDeEstudiosDeleted = false,
  fechasDeExamenesDeleted = false
}: GeneralInfoFormProps) => {
  const precioValue = useWatch({ control, name: "precio" });
  const [precioInput, setPrecioInput] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const planDeEstudiosValue = useWatch({ control, name: "planDeEstudios" });
  const fechasDeExamenesValue = useWatch({ control, name: "fechasDeExamenes" });
  const planDeEstudiosInputRef = useRef<HTMLInputElement>(null);
  const fechasDeExamenesInputRef = useRef<HTMLInputElement>(null);

  // Limpiar input cuando se elimina el PDF
  useEffect(() => {
    if (planDeEstudiosDeleted && planDeEstudiosInputRef.current) {
      planDeEstudiosInputRef.current.value = "";
    }
  }, [planDeEstudiosDeleted]);

  useEffect(() => {
    if (fechasDeExamenesDeleted && fechasDeExamenesInputRef.current) {
      fechasDeExamenesInputRef.current.value = "";
    }
  }, [fechasDeExamenesDeleted]);


  // Inicializar el valor del input cuando se carga el formulario
  useEffect(() => {
    if (!isEditing) {
      if (precioValue === 0) {
        setPrecioInput("");
      } else {
        setPrecioInput(String(precioValue));
      }
    }
  }, [precioValue, isEditing]);

  const hasValidImage = (url: string | null | undefined): boolean => {
    return url != null && url.trim() !== "";
  };

  const getImageSrc = (): string => {
    if (imagePreviewUrl) return imagePreviewUrl;
    if (hasValidImage(currentImageUrl)) return currentImageUrl!;
    return "";
  };

  const shouldShowImage = (): boolean => {
    return imagePreviewUrl != null || hasValidImage(currentImageUrl);
  };

  const validatePDF = (file: File): boolean => {
    // Validar tipo
    if (file.type !== "application/pdf") {
      toast.error("El archivo debe ser un PDF");
      return false;
    }

    // Validar tamaño (10 MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("El archivo PDF no puede exceder 10 MB");
      return false;
    }

    return true;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="titulo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título del Curso *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ej: Curso de Liderazgo Empresarial"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="descripcion"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe el contenido y objetivos del curso..."
                rows={4}
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="precio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Precio *</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="299.99"
                value={precioInput}
                onFocus={() => {
                  setIsEditing(true);
                  // Cuando se enfoca, mostrar el valor actual o campo vacío si es 0
                  if (precioValue === 0) {
                    setPrecioInput("");
                  } else {
                    setPrecioInput(String(precioValue));
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir solo números, punto decimal y campo vacío
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setPrecioInput(value);
                  }
                }}
                onBlur={(e) => {
                  setIsEditing(false);
                  // Al perder el foco, normalizar y actualizar el formulario
                  const value = e.target.value.trim();
                  
                  if (value === "" || value === ".") {
                    // Campo vacío o solo punto -> establecer a 0
                    setPrecioInput("");
                    field.onChange(0);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      // Valor válido -> actualizar formulario y mostrar formato limpio
                      setPrecioInput(String(numValue));
                      field.onChange(numValue);
                    } else {
                      // Valor inválido -> establecer a 0
                      setPrecioInput("");
                      field.onChange(0);
                    }
                  }
                  field.onBlur();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="imagen"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Imagen de portada * (Tamaño recomendado: 1920x1080px | 16:9)</FormLabel>
            <FormControl>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const objectUrl = URL.createObjectURL(file);
                      setImagePreviewUrl((prev) => {
                        if (prev && prev !== objectUrl) URL.revokeObjectURL(prev);
                        return objectUrl;
                      });
                      field.onChange(file);
                    } else {
                      setImagePreviewUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return null;
                      });
                      field.onChange(undefined);
                    }
                  }}
                  required={false}
                />

                {shouldShowImage() && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageSrc()}
                        alt={imagePreviewUrl ? "Vista previa de la imagen seleccionada" : "Imagen actual"}
                        className="h-16 w-16 rounded object-cover border"
                      />
                      <button
                        type="button"
                        className="text-sm text-primary underline"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Ver grande
                      </button>
                      {imagePreviewUrl && (
                        <button
                          type="button"
                          className="text-sm text-muted-foreground underline"
                          onClick={() => {
                            setImagePreviewUrl((prev) => {
                              if (prev) URL.revokeObjectURL(prev);
                              return null;
                            });
                            field.onChange(undefined);
                          }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Vista previa</DialogTitle>
                          <DialogDescription>
                            Vista previa de la imagen que se mostrará en el curso
                          </DialogDescription>
                        </DialogHeader>
                        <div className="w-full">
                          <img
                            src={getImageSrc()}
                            alt="Vista previa"
                            className="w-full h-auto rounded"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Documentos del Curso</h3>
        
        <FormField
          control={control}
          name="planDeEstudios"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan de Estudios (PDF)</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Input
                    ref={planDeEstudiosInputRef}
                    type="file"
                    accept="application/pdf"
                    className="cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (validatePDF(file)) {
                          field.onChange(file);
                        } else {
                          e.target.value = "";
                        }
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                  />
                  
                  {(planDeEstudiosValue || (currentPlanDeEstudiosUrl && !planDeEstudiosDeleted)) && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {planDeEstudiosValue?.name || "Plan de Estudios.pdf"}
                        </p>
                        {planDeEstudiosValue && (
                          <p className="text-xs text-gray-500">
                            {formatFileSize(planDeEstudiosValue.size)}
                          </p>
                        )}
                        {currentPlanDeEstudiosUrl && !planDeEstudiosValue && (
                          <p className="text-xs text-gray-500">Archivo actual</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {planDeEstudiosValue ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              field.onChange(undefined);
                              if (planDeEstudiosInputRef.current) {
                                planDeEstudiosInputRef.current.value = "";
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="Quitar archivo seleccionado"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : currentPlanDeEstudiosUrl ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-blue-600 hover:text-blue-700"
                              title="Descargar"
                            >
                              <a
                                href={currentPlanDeEstudiosUrl}
                                download
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                            {onDeletePlanDeEstudios && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onDeletePlanDeEstudios}
                                className="text-red-600 hover:text-red-700"
                                title="Eliminar archivo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500">Tamaño máximo: 10 MB</p>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="fechasDeExamenes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fechas de Exámenes (PDF)</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Input
                    ref={fechasDeExamenesInputRef}
                    type="file"
                    accept="application/pdf"
                    className="cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (validatePDF(file)) {
                          field.onChange(file);
                        } else {
                          e.target.value = "";
                        }
                      } else {
                        field.onChange(undefined);
                      }
                    }}
                  />
                  
                  {(fechasDeExamenesValue || (currentFechasDeExamenesUrl && !fechasDeExamenesDeleted)) && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fechasDeExamenesValue?.name || "Fechas de Exámenes.pdf"}
                        </p>
                        {fechasDeExamenesValue && (
                          <p className="text-xs text-gray-500">
                            {formatFileSize(fechasDeExamenesValue.size)}
                          </p>
                        )}
                        {currentFechasDeExamenesUrl && !fechasDeExamenesValue && (
                          <p className="text-xs text-gray-500">Archivo actual</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fechasDeExamenesValue ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              field.onChange(undefined);
                              if (fechasDeExamenesInputRef.current) {
                                fechasDeExamenesInputRef.current.value = "";
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="Quitar archivo seleccionado"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : currentFechasDeExamenesUrl ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-blue-600 hover:text-blue-700"
                              title="Descargar"
                            >
                              <a
                                href={currentFechasDeExamenesUrl}
                                download
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                            {onDeleteFechasDeExamenes && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onDeleteFechasDeExamenes}
                                className="text-red-600 hover:text-red-700"
                                title="Eliminar archivo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500">Tamaño máximo: 10 MB</p>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default GeneralInfoForm;
