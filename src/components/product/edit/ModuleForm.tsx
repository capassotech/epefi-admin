import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ClassForm from './ClassForm';

const ModuleForm = ({ control, index }: any) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  // const { remove: removeModule } = useFormContext();
  const { fields, append, remove: removeClass } = useFieldArray({
    control,
    name: `modules.${index}.classes`,
  });

  return (
    <div className="border rounded p-4 mb-4 bg-white shadow-sm">
      {/* Encabezado del módulo */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h3 className="font-semibold text-lg">Módulo {index + 1}</h3>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? '▼' : '▶'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('¿Estás seguro de eliminar este módulo?')) {
                // removeModule(`modules.${index}`); 
              }
            }}
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Contenido colapsable */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-4 space-y-4">
          {/* Campo: Título */}
          <FormField
            control={control}
            name={`modules.${index}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del módulo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo: Descripción */}
          <FormField
            control={control}
            name={`modules.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Clases */}
          <div>
            <h4 className="font-semibold mt-4">Clases</h4>
            {fields.map((_, classIndex) => (
              <div key={classIndex} className="ml-4 border-l pl-4 my-2">
                <ClassForm control={control} index={classIndex} moduleIndex={index} />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => append({ resources: [] })}
            >
              + Añadir clase
            </Button>

            <Button
              type="button"
              variant="outline"
              className="mt-2 text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('¿Eliminar última clase?')) {
                  removeClass(fields.length - 1); // Elimina la última clase
                }
              }}
            >
              - Eliminar última clase
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleForm;