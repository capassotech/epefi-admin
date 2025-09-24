import React from 'react';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Control } from 'react-hook-form';

interface Props {
  control: Control<any>;
}

const StatusForm = ({ control }: Props) => {
  return (
    <FormField
      control={control}
      name="isActive"
      render={({ field }) => (
        <FormItem className="flex items-center space-x-2">
          <FormControl>
            <input
              type="checkbox"
              checked={field.value}
              onChange={field.onChange}
              className="w-4 h-4"
            />
          </FormControl>
          <FormLabel className="text-sm font-normal">Formación activa</FormLabel>
        </FormItem>
      )}
    />
  );
};

export default StatusForm;