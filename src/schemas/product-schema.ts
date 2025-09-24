// src/schemas/product-schema.ts
import { z } from "zod";

export const productFormSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  price: z.number().min(0, "El precio debe ser positivo"),
  duration: z.string().min(1, "La duración es obligatoria"),
  level: z.enum(["principiante", "intermedio", "avanzado"], {
    message: "Selecciona un nivel válido",
  }),
  pilar: z.enum(["liderazgo", "consultoria-estrategica", "emprendimiento"], {
    message: "Selecciona un pilar válido",
  }),
  modality: z.enum(["presencial", "virtual", "on-demand"], {
    message: "Selecciona una modalidad válida",
  }),
  id_profesor: z.string().min(1, "Selecciona un profesor"),
  imagen: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
