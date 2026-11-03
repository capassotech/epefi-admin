import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/context/PageHeaderContext";
import { ClipboardList, Edit2, Loader2, Trash2, Users } from "lucide-react";
import { ListLoadingPill } from "@/components/common/ListLoading";
import { SearchAndFilter, type FilterOptions } from "@/components/admin/SearchAndFilter";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { IconAction } from "@/components/ui/icon-action";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterHeader, PlainHeader, SortableHeader } from "@/components/common/TableHeaders";
import {
  INACTIVE_ROW_TEXT,
  applyColumnFilter,
  applyColumnSort,
  inactiveRowClass,
  listLoadingClass,
  type ColumnSort,
} from "@/utils/tableState";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";
import { PaginationControls } from "@/components/common/PaginationControls";
import { ExamsAPI } from "@/service/exams";
import { CoursesAPI } from "@/service/courses";
import { normalizePaginatedResponse } from "@/utils/pagination";
import type { Course, Examen, PaginationMeta } from "@/types/types";
import { toast } from "sonner";

const isExamEnabled = (exam: Examen) => exam.habilitado !== false;

const DEFAULT_EXAM_FILTERS: FilterOptions = { sortBy: "date", sortDirection: "desc" };

export default function Exams() {
  const navigate = useNavigate();
  usePageHeader({ title: "Exámenes" });
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const [exams, setExams] = useState<Examen[]>([]);
  const [coursesById, setCoursesById] = useState<Record<string, Course>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_EXAM_FILTERS);
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
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
        idFormacion: filters.courseId,
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
  }, [searchQuery, filters.sortBy, filters.sortDirection, filters.courseId, pagination.limit, pagination.page]);

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

  const handleToggleHabilitado = async (exam: Examen, habilitado: boolean) => {
    setTogglingId(exam.id);
    try {
      const updated = await ExamsAPI.setHabilitado(exam.id, habilitado);
      setExams((prev) =>
        prev.map((item) =>
          item.id === exam.id
            ? { ...item, habilitado: updated.habilitado ?? habilitado }
            : item
        )
      );
      toast.success(
        `Examen ${habilitado ? "habilitado" : "deshabilitado"} exitosamente`
      );
    } catch (err) {
      console.error("Error al actualizar habilitación del examen:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al actualizar el estado del examen"
      );
    } finally {
      setTogglingId(null);
    }
  };

  // Orden (título) y formación se eligen desde los encabezados de la tabla
  const handleSortChange = (sort: ColumnSort) =>
    handleFilter(applyColumnSort(filters, sort, DEFAULT_EXAM_FILTERS));

  const courseList = Object.values(coursesById);
  const courseFilterOptions = [
    { value: "all", label: "Todas las formaciones" },
    ...courseList.map((c) => ({ value: c.id, label: c.titulo })),
  ];

  const courseTitle = (exam: Examen) => coursesById[exam.idFormacion]?.titulo || exam.idFormacion;
  const questionCount = (exam: Examen) => exam.preguntas?.length ?? 0;
  const goToEdit = (exam: Examen) => navigate(`/exams/${encodeURIComponent(exam.id)}/edit`);

  const renderActions = (exam: Examen) => {
    const isActive = isExamEnabled(exam);
    return (
      <div
        className="flex items-center justify-end gap-0.5"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <IconAction label="Editar examen" onClick={() => goToEdit(exam)}>
          <Edit2 />
        </IconAction>
        <IconAction
          label="Intentos por alumno"
          onClick={() => navigate(`/exams/${encodeURIComponent(exam.id)}/intentos`)}
        >
          <Users />
        </IconAction>
        <IconAction
          label="Eliminar examen"
          onClick={() => handleDeleteClick(exam.id)}
          className="hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 />
        </IconAction>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="grid place-items-center w-10 h-8">
              {togglingId === exam.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => handleToggleHabilitado(exam, checked)}
                  disabled={togglingId !== null}
                  aria-label={isActive ? "Deshabilitar examen" : "Habilitar examen"}
                  className="scale-90 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 disabled:opacity-50"
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isActive ? "Habilitado" : "Deshabilitado"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
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
      <SearchAndFilter
        onSearch={handleSearch}
        showStateFilter={false}
        onFilter={handleFilter}
        onCreateNew={() => navigate("/exams/create")}
        createButtonText="Crear examen"
        filterOptions={{ courses: courseList }}
        showClearFilters
        resetFiltersTo={DEFAULT_EXAM_FILTERS}
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

      <div ref={listTopRef} className={listLoadingClass(paginationLoading)} aria-busy={paginationLoading}>
        <ListLoadingPill loading={paginationLoading} label="Cargando exámenes…" />
        {paginationLoading && exams.length === 0 ? (
          <div className="h-32" />
        ) : exams.length > 0 ? (
          <TooltipProvider delayDuration={300}>
          <div className="admin-card overflow-hidden">
            {/* ── Vista mobile: filas compactas ── */}
            <ul role="list" className="block md:hidden divide-y divide-gray-100 bg-white">
              {exams.map((exam, index) => {
                const isActive = isExamEnabled(exam);
                return (
                  <li
                    key={exam.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${inactiveRowClass(isActive)}`}
                    onClick={() => goToEdit(exam)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${isActive ? "text-gray-900" : INACTIVE_ROW_TEXT}`}>
                        {exam.titulo || `Examen ${index + 1}`}
                      </p>
                      <p className={`truncate text-xs ${isActive ? "text-gray-500" : INACTIVE_ROW_TEXT}`}>
                        {courseTitle(exam)} · {questionCount(exam)} preguntas
                      </p>
                    </div>
                    {renderActions(exam)}
                  </li>
                );
              })}
            </ul>

            {/* ── Vista desktop: tabla ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <SortableHeader
                      label="Título"
                      column="title"
                      defaultLabel="fecha de creación"
                      sortBy={filters.sortBy}
                      sortDirection={filters.sortDirection}
                      onSortChange={handleSortChange}
                      className="pl-4 pr-3"
                    />
                    <FilterHeader
                      label="Formación"
                      tooltip="Filtrar por formación"
                      value={filters.courseId}
                      options={courseFilterOptions}
                      onChange={(courseId) =>
                        handleFilter(applyColumnFilter(filters, "courseId", courseId))
                      }
                    />
                    <PlainHeader>Preguntas</PlainHeader>
                    <PlainHeader align="right" className="pl-3 pr-4">
                      Acciones
                    </PlainHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {exams.map((exam, index) => {
                    const isActive = isExamEnabled(exam);
                    return (
                      <tr
                        key={exam.id}
                        className={`transition-colors duration-150 cursor-pointer ${inactiveRowClass(isActive)}`}
                        onClick={() => goToEdit(exam)}
                      >
                        <td className={`pl-4 pr-3 py-1.5 font-medium ${isActive ? "text-gray-900" : INACTIVE_ROW_TEXT}`}>
                          <span className="line-clamp-1">{exam.titulo || `Examen ${index + 1}`}</span>
                        </td>
                        <td className={`px-3 py-1.5 ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                          <span className="line-clamp-1">{courseTitle(exam)}</span>
                        </td>
                        <td className={`px-3 py-1.5 whitespace-nowrap tabular-nums ${isActive ? "text-gray-600" : INACTIVE_ROW_TEXT}`}>
                          {questionCount(exam)}
                        </td>
                        <td className="pl-3 pr-4 py-1.5 whitespace-nowrap">{renderActions(exam)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </TooltipProvider>
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
