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
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Dispatch, SetStateAction } from "react";
import { useState, useEffect } from "react";
import type { ProductFormData } from "@/schemas/product-schema";

interface GeneralInfoFormProps {
  control: Control<ProductFormData>;
  setImagePreviewUrl: Dispatch<SetStateAction<string | null>>;
  imagePreviewUrl: string | null;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
  isDialogOpen: boolean;
  currentImageUrl?: string | null;
}

const GeneralInfoForm = ({ control, setImagePreviewUrl, imagePreviewUrl, setIsDialogOpen, isDialogOpen, currentImageUrl }: GeneralInfoFormProps) => {
  const precioValue = useWatch({ control, name: "precio" });
  const [precioInput, setPrecioInput] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

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
    </div>
  );
};

export default GeneralInfoForm;
