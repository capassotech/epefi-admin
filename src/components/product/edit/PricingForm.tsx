import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface Props {
  control: Control<any>;
}

const PricingForm = ({ control }: Props) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Precio Actual</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>Usa 0 para formaciones gratuitas</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="originalPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Precio Original (opcional)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="0"
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </FormControl>
            <FormDescription>Para mostrar descuentos</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PricingForm;