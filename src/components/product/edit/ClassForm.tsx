import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ResourceForm from './ResourceForm';

const ClassForm = ({ control, index, moduleIndex }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const { remove: removeClass } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.classes`,
  });

  const { fields, append, remove: removeResource } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.classes.${index}.resources`,
  });

  return (
    <div className="border rounded-md p-4 my-2 bg-gray-50">
      {/* Encabezado de la clase */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h4 className="font-medium">Clase {index + 1}</h4>
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
              if (window.confirm('¿Eliminar esta clase?')) {
                removeClass(index); 
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
            name={`modules.${moduleIndex}.classes.${index}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título de la clase</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo: Duración */}
          <FormField
            control={control}
            name={`modules.${moduleIndex}.classes.${index}.duration`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo: URL del video */}
          <FormField
            control={control}
            name={`modules.${moduleIndex}.classes.${index}.videoUrl`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL del video</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Recursos */}
          <div>
            <h5 className="font-semibold mt-4">Recursos</h5>
            {fields.map((_, resourceIndex) => (
              <div key={resourceIndex} className="ml-4 border-l pl-4 my-2">
                <ResourceForm
                  control={control}
                  index={resourceIndex}
                  classIndex={index}
                  moduleIndex={moduleIndex}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="mt-2 text-sm"
              onClick={() => append({})}
            >
              + Añadir recurso
            </Button>

            <Button
              type="button"
              variant="outline"
              className="mt-2 text-sm text-red-500 ml-2"
              onClick={() => {
                if (window.confirm('¿Eliminar último recurso?')) {
                  removeResource(fields.length - 1);
                }
              }}
            >
              - Eliminar último recurso
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassForm;