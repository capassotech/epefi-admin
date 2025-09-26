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

const GeneralInfoForm = ({ control }: any) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título de la Formación *</FormLabel>
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
        name="description"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="imagen"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/imagen-curso.jpg"
                  {...field}
                  value={field.value || ""}
                  required={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="price"
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
      </div>
    </div>
  );
};

export default GeneralInfoForm;
