import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchAndFilter, type FilterOptions } from "@/components/admin/SearchAndFilter";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExamsAPI } from "@/service/exams";
import { CoursesAPI } from "@/service/courses";
import type { Course, Examen } from "@/types/types";
import { toast } from "sonner";

export default function Exams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Examen[]>([]);
  const [coursesById, setCoursesById] = useState<Record<string, Course>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "date",
    sortDirection: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const backendSortBy =
        filters.sortBy === "title"
          ? "titulo"
          : filters.sortBy === "date"
            ? "fechaCreacion"
            : undefined;
      const data = await ExamsAPI.getAll({
        search: searchQuery.trim() || undefined,
        sortBy: backendSortBy,
        sortOrder: filters.sortDirection,
      });
      setExams(data);
      setError("");
    } catch (err) {
      console.error("Error al cargar exámenes:", err);
      setError("No se pudieron cargar los exámenes");
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters.sortBy, filters.sortDirection, filters.courseId]);

  const fetchCourses = useCallback(async () => {
    try {
      const list = await CoursesAPI.getAllList();
      const mapped = list.reduce<Record<string, Course>>((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});
      setCoursesById(mapped);
    } catch (err) {
      console.error("Error al cargar formaciones:", err);
      toast.error("No se pudieron cargar las formaciones para filtros");
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const filterOptions = {
    sortOptions: [
      { value: "date", label: "Fecha de creación" },
      { value: "title", label: "Título" },
    ],
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando exámenes"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }

  if (error) {
    return <p className="text-center text-red-600 py-6">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Exámenes</h1>
      </div>

      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onCreateNew={() => navigate("/exams/create")}
        createButtonText="Crear examen"
        filterOptions={filterOptions}
        showClearFilters
        resetFiltersTo={{
          sortBy: "date",
          sortDirection: "desc",
        }}
        hideUnsortedOption
        currentFilters={filters}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {exams.length} exámenes
        </p>
      </div>

      {exams.length > 0 ? (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>ID Formación</TableHead>
                <TableHead className="text-right">Preguntas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam, index) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.titulo || `Examen ${index + 1}`}</TableCell>
                  <TableCell>
                    {coursesById[exam.idFormacion]?.titulo || exam.idFormacion}
                  </TableCell>
                  <TableCell className="text-right">{exam.preguntas.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron exámenes
          </h3>
          <p className="text-gray-600 mb-4">
            Aún no hay exámenes cargados para mostrar.
          </p>
          <button
            onClick={() => navigate("/exams/create")}
            className="admin-button"
          >
            Crear primer examen
          </button>
        </div>
      )}
    </div>
  );
}
