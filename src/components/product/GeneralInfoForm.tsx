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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Dispatch, SetStateAction } from "react";

interface GeneralInfoFormProps {
  control: Control<{ titulo: string; descripcion: string; precio: number; estado: "activo" | "inactivo"; materias: string[]; imagen?: File | undefined; }>;
  setImagePreviewUrl: Dispatch<SetStateAction<string | null>>;
  imagePreviewUrl: string | null;
  setIsDialogOpen: Dispatch<SetStateAction<boolean>>;
  isDialogOpen: boolean;
  currentImageUrl?: string | null;
}

const GeneralInfoForm = ({ control, setImagePreviewUrl, imagePreviewUrl, setIsDialogOpen, isDialogOpen, currentImageUrl }: GeneralInfoFormProps) => {
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
                placeholder="Describe el contenido y objetivos de la formación..."
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
                type="number"
                step="0.01"
                placeholder="299.99"
                {...field}
                value={field.value || 0}
                onChange={(e) =>
                  field.onChange(parseFloat(e.target.value) || 0)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="estado"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Estado Activo</FormLabel>
              <div className="text-sm text-muted-foreground">
                Determina si el curso está disponible para los estudiantes
              </div>
            </div>
            <FormControl>
              <input
                type="checkbox"
                checked={field.value === "activo"}
                onChange={(e) => field.onChange(e.target.checked ? "activo" : "inactivo")}
                className="h-4 w-4 rounded border-gray-300"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="imagen"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Imagen * (Tamaño recomendado: 1920x1080px | 16:9)</FormLabel>
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
