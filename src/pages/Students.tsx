// src/pages/admin/Students.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { StudentList } from "@/components/students/StudentsList";
import {
  SearchAndFilter,
  type FilterOptions,
} from "@/components/admin/SearchAndFilter";
import { useNavigate } from "react-router-dom";
import { StudentsAPI } from "@/service/students";
import { CoursesAPI } from "@/service/courses";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";
import { type StudentDB, type FirestoreTimestamp } from "@/types/types";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { TourButton } from "@/components/tour/TourButton";
import { studentsTourSteps } from "@/config/tourSteps";
import { PaginationControls } from "@/components/common/PaginationControls";
import { normalizePaginatedResponse } from "@/utils/pagination";
import type { PaginationMeta } from "@/types/types";
import { Loader } from "lucide-react";

const DEFAULT_STUDENT_FILTERS: FilterOptions = {
  sortBy: "date",
  sortDirection: "desc",
};

function getFechaRegistroSeconds(student: StudentDB): number {
  const r = student.fechaRegistro as FirestoreTimestamp | string | undefined;
  if (r && typeof r === "object" && "_seconds" in r) {
    const s = (r as FirestoreTimestamp)._seconds;
    return typeof s === "number" && Number.isFinite(s) ? s : 0;
  }
  if (typeof r === "string" && r.trim()) {
    const ms = Date.parse(r);
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
  }
  return 0;
}

/** Ordenación local: el listado respeta asc/desc aunque el backend ignore sortOrder. */
function sortStudentsList(list: StudentDB[], filters: FilterOptions): StudentDB[] {
  const key = filters.sortBy;
  if (!key || key === "none") {
    return [...list];
  }
  const defaultDir: "asc" | "desc" = key === "date" ? "desc" : "asc";
  const asc = (filters.sortDirection ?? defaultDir) === "asc";
  const dir = asc ? 1 : -1;
  const out = [...list];
  switch (key) {
    case "name":
      out.sort(
        (a, b) =>
          dir *
          (a.nombre || "").localeCompare(b.nombre || "", undefined, {
            sensitivity: "base",
          })
      );
      break;
    case "email":
      out.sort(
        (a, b) =>
          dir *
          (a.email || "").localeCompare(b.email || "", undefined, {
            sensitivity: "base",
          })
      );
      break;
    case "date":
      out.sort(
        (a, b) =>
          dir * (getFechaRegistroSeconds(a) - getFechaRegistroSeconds(b))
      );
      break;
    default:
      return [...list];
  }
  return out;
}

export default function Students() {
  const navigate = useNavigate();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentDB[]>([]);
  const [courses, setCourses] = useState<{ id: string; titulo: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_STUDENT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const pageLimitRef = useRef(pagination.limit);
  pageLimitRef.current = pagination.limit;

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = useCallback(async (forcedPage?: number) => {
    const page = forcedPage !== undefined ? forcedPage : pagination.page;
    try {
      setPaginationLoading(true);
      const sortByMap: Record<
        string,
        "nombre" | "email" | "fechaRegistro"
      > = {
        name: "nombre",
        email: "email",
        date: "fechaRegistro",
      };
      const statusMap: Record<string, "activo" | "inactivo"> = {
        active: "activo",
        inactive: "inactivo",
      };

      const sortByKey = filters.sortBy;
      const sortBy = sortByKey ? sortByMap[sortByKey] : undefined;
      const sortOrder =
        sortBy && filters.sortDirection
          ? filters.sortDirection
          : sortBy === "fechaRegistro"
            ? "desc"
            : sortBy
              ? "asc"
              : undefined;

      const status =
        filters.status && filters.status !== "all"
          ? statusMap[filters.status]
          : undefined;
      const role =
        filters.role && filters.role !== "all"
          ? (filters.role as "admin" | "student")
          : undefined;

      let cursoId: string | undefined;
      let sinCurso: boolean | undefined;
      if (filters.courseId === "none") {
        sinCurso = true;
      } else if (filters.courseId && filters.courseId !== "all") {
        cursoId = filters.courseId;
      }

      const res = await StudentsAPI.getAll({
        page,
        limit: pagination.limit,
        search: searchQuery.trim() || undefined,
        status,
        role,
        sortBy,
        sortOrder,
        cursoId,
        sinCurso,
      });
      const paginated = normalizePaginatedResponse<StudentDB>(
        res,
        page,
        pagination.limit
      );
      setStudents(sortStudentsList(paginated.data, filters));
      setPagination((prev) => ({
        ...paginated.pagination,
        ...(forcedPage !== undefined ? { page: forcedPage } : {}),
      }));
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
      setError("No se pudieron cargar los estudiantes");
      setStudents([]);
    } finally {
      setPaginationLoading(false);
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.page, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const list = await CoursesAPI.getAllList();
        setCourses(
          list.map((c) => ({ id: String(c.id), titulo: c.titulo }))
        );
      } catch (e) {
        console.error("Error al cargar cursos para filtros:", e);
        setCourses([]);
      }
    };
    loadCourses();
  }, []);

  const handleDeleteClick = (id: string) => {
    // Verificar si el usuario intenta eliminar su propia cuenta
    if (user?.uid === id) {
      toast.error("No puedes eliminar tu propia cuenta", {
        description: "No está permitido eliminar tu propio usuario por razones de seguridad",
        duration: 4000,
      });
      return;
    }
    
    setConfirmDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    if (!id) return;
    
    // Verificar nuevamente antes de eliminar (por seguridad)
    if (user?.uid === id) {
      toast.error("No puedes eliminar tu propia cuenta", {
        description: "No está permitido eliminar tu propio usuario por razones de seguridad",
        duration: 4000,
      });
      setIsDeleteModalOpen(false);
      setConfirmDeleteId(null);
      return;
    }
    
    setDeleteLoading(true);

    try {
      await StudentsAPI.delete(id);
      toast.success("Usuario eliminado exitosamente");
      await fetchStudents();
    } catch (err) {
      console.error("Error al eliminar estudiante:", err);
      toast.error("Error al eliminar el usuario");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setConfirmDeleteId(null);
  };

  const handleUserUpdated = async (
    saved?: StudentDB,
    meta?: { isCreate: boolean }
  ) => {
    const goFirstPage = Boolean(meta?.isCreate || saved?.id);
    if (goFirstPage) {
      setPagination((p) => ({ ...p, page: 1 }));
    }
    try {
      await fetchStudents(goFirstPage ? 1 : undefined);
    } catch (err) {
      console.error("Error al actualizar lista de estudiantes:", err);
      return;
    }

    if (!saved?.id) {
      return;
    }

    setStudents((prev) => {
      const fromApi = prev.find((s) => s.id === saved.id);
      const row: StudentDB = fromApi ? { ...fromApi, ...saved } : { ...saved };
      const rest = prev.filter((s) => s.id !== row.id);
      const limit = pageLimitRef.current;
      return [row, ...sortStudentsList(rest, filtersRef.current)].slice(0, limit);
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const filterOptions = {
    types: [],
    sortOptions: [
      { value: "name", label: "Nombre" },
      { value: "email", label: "Email" },
      { value: "date", label: "Fecha de creación" },
    ],
    courses,
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando usuarios"
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
        <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
        <TourButton steps={studentsTourSteps} />
      </div>

      <div data-tour="search-filter">
        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          isStudentPage={true}
          onCreateNew={handleUserUpdated}
          createButtonText="Crear usuario"
          filterOptions={filterOptions}
          currentFilters={filters}
          resetFiltersTo={DEFAULT_STUDENT_FILTERS}
          showClearFilters
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {students.length} de {pagination.total} usuarios
        </p>
      </div>

      <div ref={listTopRef}>
        {paginationLoading ? (
          <div className="flex justify-center gap-3 h-full">
            <Loader className="animate-spin"/> 
            <h1 className="text-zinc-700">Cargando siguiente pagina</h1>
          </div>
        ) : (
          students.length > 0 ? (
            <div data-tour="students-list">
              <StudentList 
              students={students} 
              onDelete={handleDeleteClick} 
              onUserUpdated={handleUserUpdated}
              onStatusChange={async () => {
                // Recargar estudiantes después de cambiar estado
                try {
                  await fetchStudents();
                } catch (err) {
                  console.error("Error al recargar estudiantes:", err);
                }
              }}
              />
            </div>
          ) : (
            <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👨‍🎓</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar los filtros o crear un nuevo estudiante.
            </p>
            <button
              onClick={() => navigate("/students/create")}
              className="admin-button"
            >
              Crear primer estudiante
            </button>
            </div>
          )
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
        isOpen={isDeleteModalOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={
          `${students.find((s) => s.id === confirmDeleteId)?.nombre || ""} ${
            students.find((s) => s.id === confirmDeleteId)?.apellido || ""
          }`.trim() || "este estudiante"
        }
        deleteLoading={deleteLoading}
        id={confirmDeleteId || ""}
      />
    </div>
  );
}
