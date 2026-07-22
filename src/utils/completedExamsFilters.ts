export type CompletedExamsFilters = {
  formacion: string;
  examen: string;
  alumno: string;
};

export const COMPLETED_EXAMS_LIST_PATH = "/exams/completed";

export function readCompletedExamsFilters(
  searchParams: URLSearchParams
): CompletedExamsFilters {
  return {
    formacion: searchParams.get("formacion") ?? "",
    examen: searchParams.get("examen") ?? "",
    alumno: searchParams.get("alumno") ?? "",
  };
}

export function buildCompletedExamsSearchParams(
  filters: CompletedExamsFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.formacion) params.set("formacion", filters.formacion);
  if (filters.examen) params.set("examen", filters.examen);
  if (filters.alumno.trim()) params.set("alumno", filters.alumno.trim());
  return params;
}

export function buildCompletedExamsListPath(
  searchParams?: URLSearchParams | CompletedExamsFilters
): string {
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : buildCompletedExamsSearchParams(searchParams ?? { formacion: "", examen: "", alumno: "" });
  const query = params.toString();
  return query ? `${COMPLETED_EXAMS_LIST_PATH}?${query}` : COMPLETED_EXAMS_LIST_PATH;
}

export type CompletedExamDetailLocationState = {
  returnTo?: string;
};
