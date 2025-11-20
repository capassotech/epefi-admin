// src/schemas/product-schema.ts
import { z } from "zod";

export const productFormSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  precio: z.number().min(0, "El precio debe ser positivo"),
  estado: z.enum(["activo", "inactivo"]),
  imagen: z.instanceof(File, { message: "La imagen es obligatoria" }).optional(),
  materias: z.array(z.string()),
  planDeEstudios: z.instanceof(File).optional(),
  fechasDeExamenes: z.instanceof(File).optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
