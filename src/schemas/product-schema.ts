// src/schemas/product-schema.ts
import { z } from "zod";

export const productFormSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  precio: z.number().min(0, "El precio debe ser positivo"),
  estado: z.enum(["activo", "inactivo"]),
  imagen: z.instanceof(File, { message: "La imagen es obligatoria" }).optional(),
  materias: z.array(z.string()),
  fechaInicioDictado: z.string().min(1, "La fecha de inicio del dictado es obligatoria").refine(
    (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: "Formato de fecha inválido. Use YYYY-MM-DD" }
  ),
  fechaFinDictado: z.string().min(1, "La fecha de fin del dictado es obligatoria").refine(
    (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: "Formato de fecha inválido. Use YYYY-MM-DD" }
  ),
  planDeEstudios: z.instanceof(File).optional(),
  fechasDeExamenes: z.instanceof(File).optional(),
}).refine(
  (data) => {
    // La fecha de fin debe ser posterior o igual a la fecha de inicio
    return new Date(data.fechaFinDictado) >= new Date(data.fechaInicioDictado);
  },
  {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["fechaFinDictado"],
  }
);

export type ProductFormData = z.infer<typeof productFormSchema>;
