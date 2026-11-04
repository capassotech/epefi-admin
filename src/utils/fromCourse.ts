/**
 * Curso desde el que se llegó a una materia (al editarla desde la edición del curso).
 * Viaja en el `state` de la navegación entre la materia, su edición y sus módulos
 * para que la ruta de navegación muestre "Cursos › curso" y se pueda volver.
 */
export type FromCourse = { to: string; label: string };

export function readFromCourse(state: unknown): FromCourse | null {
  const value = (state as { fromCourse?: Partial<FromCourse> } | null)?.fromCourse;
  return value?.to ? { to: value.to, label: value.label || "Curso" } : null;
}

/** State para pasarle a navigate() y conservar el curso de origen */
export const fromCourseState = (fromCourse: FromCourse | null) =>
  fromCourse ? { fromCourse } : undefined;

export const courseBreadcrumbs = (fromCourse: FromCourse) => [
  { label: "Cursos", to: "/products" },
  { label: fromCourse.label, to: fromCourse.to },
];
