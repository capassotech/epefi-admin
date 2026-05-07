// src/pages/admin/Students.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { StudentList } from "@/components/students/StudentsList";
import {
  SearchAndFilter,
  type FilterOptions,
} from "@/components/admin/SearchAndFilter";
import { useNavigate } from "react-router-dom";
import { StudentsAPI } from "@/service/students";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";
import { type StudentDB } from "@/types/types";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { TourButton } from "@/components/tour/TourButton";
import { studentsTourSteps } from "@/config/tourSteps";
import { PaginationControls } from "@/components/common/PaginationControls";
import { normalizePaginatedResponse } from "@/utils/pagination";
import type { PaginationMeta } from "@/types/types";
import { Loader } from "lucide-react";

export default function Students() {
  const navigate = useNavigate();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentDB[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setPaginationLoading(true);
      const sortByMap: Record<string, "nombre" | "email" | "fechaRegistro"> = {
        name: "nombre",
        email: "email",
        date: "fechaRegistro",
      };
      const statusMap: Record<string, "activo" | "inactivo"> = {
        active: "activo",
        inactive: "inactivo",
      };

      const sortBy = filters.sortBy ? sortByMap[filters.sortBy] : undefined;
      const sortOrder = filters.sortBy
        ? filters.sortBy === "date"
          ? "desc"
          : "asc"
        : undefined;
      const status =
        filters.status && filters.status !== "all"
          ? statusMap[filters.status]
          : undefined;
      const role =
        filters.role && filters.role !== "all"
          ? (filters.role as "admin" | "student")
          : undefined;

      const res = await StudentsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery.trim() || undefined,
        status,
        role,
        sortBy,
        sortOrder,
      });
      const paginated = normalizePaginatedResponse<StudentDB>(
        res,
        pagination.page,
        pagination.limit
      );
      setStudents(paginated.data);
      setPagination(paginated.pagination);
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

      setStudents((prev) => prev.filter((s) => s.id !== id));

      toast.success("Usuario eliminado exitosamente");
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

  const handleUserUpdated = async () => {
    try {
      await fetchStudents();
    } catch (err) {
      console.error("Error al actualizar lista de estudiantes:", err);
    }
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
      { value: "date", label: "Fecha de registro" },
    ],
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
