import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Edit2, Loader, Trash2 } from "lucide-react";
import { SearchAndFilter, type FilterOptions } from "@/components/admin/SearchAndFilter";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";
import { PaginationControls } from "@/components/common/PaginationControls";
import { ExamsAPI } from "@/service/exams";
import { CoursesAPI } from "@/service/courses";
import { normalizePaginatedResponse } from "@/utils/pagination";
import type { Course, Examen, PaginationMeta } from "@/types/types";
import { toast } from "sonner";

export default function Exams() {
  const navigate = useNavigate();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const [exams, setExams] = useState<Examen[]>([]);
  const [coursesById, setCoursesById] = useState<Record<string, Course>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "date",
    sortDirection: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      setPaginationLoading(true);
      const backendSortBy =
        filters.sortBy === "title"
          ? "titulo"
          : filters.sortBy === "date"
            ? "fechaCreacion"
            : undefined;
      const res = await ExamsAPI.getAll({
        search: searchQuery.trim() || undefined,
        sortBy: backendSortBy,
        sortOrder: filters.sortDirection,
        page: pagination.page,
        limit: pagination.limit,
      });
      const paginated = normalizePaginatedResponse<Examen>(
        res,
        pagination.page,
        pagination.limit
      );
      setExams(paginated.data);
      setPagination(paginated.pagination);
      setError("");
    } catch (err) {
      console.error("Error al cargar exámenes:", err);
      setError("No se pudieron cargar los exámenes");
      setExams([]);
    } finally {
      setPaginationLoading(false);
      setLoading(false);
    }
  }, [searchQuery, filters.sortBy, filters.sortDirection, pagination.limit, pagination.page]);

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
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = async (id: string) => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await ExamsAPI.delete(id);
      toast.success("Examen eliminado exitosamente");
      setIsDeleteModalOpen(false);
      setConfirmDeleteId(null);
      await fetchExams();
    } catch (err) {
      console.error("Error al eliminar examen:", err);
      const message =
        err instanceof Error ? err.message : "Error al eliminar el examen";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
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
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Exámenes</h1>

      <SearchAndFilter
        onSearch={handleSearch}
        showStateFilter={false}
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
        extraActions={
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => navigate("/exams/completed")}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Ver realizados
          </Button>
        }
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {exams.length} de {pagination.total} exámenes
        </p>
      </div>

      <div ref={listTopRef}>
        {paginationLoading ? (
          <div className="flex justify-center gap-3 h-full py-12">
            <Loader className="animate-spin" />
            <h1 className="text-zinc-700">Cargando siguiente página</h1>
          </div>
        ) : exams.length > 0 ? (
          <>
            <div className="block md:hidden divide-y divide-gray-200 rounded-md border bg-white">
              {exams.map((exam, index) => (
                <div key={exam.id} className="p-4 space-y-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-semibold text-gray-900 break-words text-base">
                      {exam.titulo || `Examen ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-600 break-words">
                      {coursesById[exam.idFormacion]?.titulo || exam.idFormacion}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
                      {exam.preguntas?.length ?? 0} pregunta
                      {(exam.preguntas?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer flex-1 min-w-[7rem] justify-center"
                      onClick={() =>
                        navigate(`/exams/${encodeURIComponent(exam.id)}/edit`)
                      }
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer flex-1 min-w-[7rem] justify-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteClick(exam.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block rounded-md border bg-white overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Formación</TableHead>
                    <TableHead className="text-right">Preguntas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam, index) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">
                        {exam.titulo || `Examen ${index + 1}`}
                      </TableCell>
                      <TableCell>
                        {coursesById[exam.idFormacion]?.titulo || exam.idFormacion}
                      </TableCell>
                      <TableCell className="text-right">
                        {exam.preguntas?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() =>
                              navigate(`/exams/${encodeURIComponent(exam.id)}/edit`)
                            }
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteClick(exam.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
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

      {!paginationLoading && (
        <PaginationControls
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) =>
            setPagination((prev) => ({ ...prev, limit, page: 1 }))
          }
          scrollTargetRef={listTopRef}
        />
      )}

      <ConfirmDeleteModal
        id={confirmDeleteId || ""}
        isOpen={isDeleteModalOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={
          exams.find((e) => e.id === confirmDeleteId)?.titulo || "este examen"
        }
        deleteLoading={deleteLoading}
      />
    </div>
  );
}
