// components/product/edit/FeaturesForm.tsx
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";

const DegreesForm = ({ control }: any) => {
    return (
        <div className="space-y-4">
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

export default DegreesForm;
