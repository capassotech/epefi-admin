// components/product/edit/GeneralInfoForm.tsx
import React, { useState, useEffect } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Professor {
  id: string;
  nombre: string;
  apellido: string;
  photo_url: string;
}

const GeneralInfoForm = ({ control }: any) => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfessors = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://inee-backend.onrender.com/api/profesores"
        );
        if (response.ok) {
          const data = await response.json();
          setProfessors(data);
        }
      } catch (error) {
        console.error("Error cargando profesores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfessors();
  }, []);
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
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración (minutos) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1440"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nivel *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "intermedio"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el nivel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="principiante">Principiante</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="modality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modalidad *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "virtual"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la modalidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="on-demand">On-demand</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="pilar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilar *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "liderazgo"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el pilar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="liderazgo">Liderazgo</SelectItem>
                  <SelectItem value="consultoria-estrategica">
                    Consultoría Estratégica
                  </SelectItem>
                  <SelectItem value="emprendimiento">Emprendimiento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="id_profesor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profesor *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
              disabled={loading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loading
                        ? "Cargando profesores..."
                        : "Selecciona un profesor"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {professors.map((professor) => (
                  <SelectItem key={professor.id} value={professor.id}>
                    <div className="flex items-center space-x-2">
                      <span>
                        {professor.nombre} {professor.apellido}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

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
    </div>
  );
};

export default GeneralInfoForm;
