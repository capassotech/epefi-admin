// components/product/edit/FeaturesForm.tsx
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import type { Control } from "react-hook-form";

interface FeaturesFormProps {
  control: Control<{ titulo: string; descripcion: string; precio: number; estado: "activo" | "inactivo"; materias: string[]; imagen?: string | undefined; }>;
}

const FeaturesForm = ({ control }: FeaturesFormProps) => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default FeaturesForm;
