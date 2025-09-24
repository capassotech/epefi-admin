import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFieldArray, useFormContext } from 'react-hook-form';

const ResourceForm = ({ control, index, classIndex, moduleIndex }: any) => {
  const { remove: removeResource } = useFieldArray({
      control,
      name: `modules.${moduleIndex}.classes.${classIndex}.resources`,
    });

  return (
    <div className="space-y-2 ml-6 relative">
      {/* Botón de eliminar */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 text-red-500 hover:text-red-700"
        onClick={() => {
          if (window.confirm('¿Eliminar este recurso?')) {
            removeResource(index);
          }
        }}
      >
        ✕
      </Button>

      {/* Campos */}
      <FormField
        control={control}
        name={`modules.${moduleIndex}.classes.${classIndex}.resources.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del recurso</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`modules.${moduleIndex}.classes.${classIndex}.resources.${index}.type`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`modules.${moduleIndex}.classes.${classIndex}.resources.${index}.url`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ResourceForm;