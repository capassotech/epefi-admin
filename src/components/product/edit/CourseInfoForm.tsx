import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const CourseInfoForm = ({ control, watchedType }: any) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="profesor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profesor</FormLabel>
            <FormControl>
              <Input placeholder="Nombre del profesor" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="duration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duración (horas)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="10"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {(watchedType === 'ASYNC' || watchedType === 'VIVO') && (
        <FormField
          control={control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del Curso</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default CourseInfoForm;