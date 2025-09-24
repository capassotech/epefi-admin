// components/product/edit/FeaturesForm.tsx
import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const FeaturesForm = ({ control }: any) => {
  const [tagInput, setTagInput] = React.useState("");

  return (
    <div className="space-y-4">
      {/* Tags Field */}
      <FormField
        control={control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Etiquetas/Tags</FormLabel>
            <FormControl>
              <div className="space-y-3">
                {/* Display existing tags */}
                {field.value && field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="p-0 w-4 h-4"
                          onClick={() => {
                            const newTags = field.value.filter(
                              (_: string, i: number) => i !== index
                            );
                            field.onChange(newTags);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Input for new tags */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar etiqueta (ej: liderazgo, gestión...)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (tagInput.trim()) {
                          const currentTags = field.value || [];
                          if (!currentTags.includes(tagInput.trim())) {
                            field.onChange([...currentTags, tagInput.trim()]);
                          }
                          setTagInput("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (tagInput.trim()) {
                        const currentTags = field.value || [];
                        if (!currentTags.includes(tagInput.trim())) {
                          field.onChange([...currentTags, tagInput.trim()]);
                        }
                        setTagInput("");
                      }
                    }}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Active Status */}
      <FormField
        control={control}
        name="isActive"
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
                checked={field.value}
                onChange={field.onChange}
                className="h-4 w-4 rounded border-gray-300"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export default FeaturesForm;
