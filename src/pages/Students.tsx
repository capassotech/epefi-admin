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
  const [courses, setCourses] = useState<{ id: string; titulo: string }[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDB[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "date",
    sortDirection: "desc",
  });
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

  const applyFilters = useCallback((query: string, filterOptions: FilterOptions) => {
    let filtered = [...students];

    if (query) {
      filtered = filtered.filter(
        (s) =>
          s.nombre?.toLowerCase().includes(query.toLowerCase()) ||
          s.apellido?.toLowerCase().includes(query.toLowerCase()) ||
          s.email?.toLowerCase().includes(query.toLowerCase()) ||
          s.dni?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filterOptions.status && filterOptions.status !== "all") {
      const isActive = filterOptions.status === "active";
      filtered = filtered.filter((s) => s.activo === isActive);
    }

    // Filtrar por rol
    if (filterOptions.role && filterOptions.role !== "all") {
      switch (filterOptions.role) {
        case "student":
          filtered = filtered.filter((s) => s.role?.student === true);
          break;
        case "admin":
          filtered = filtered.filter((s) => s.role?.admin === true);
          break;
        case "both":
          filtered = filtered.filter(
            (s) => s.role?.student === true && s.role?.admin === true
          );
          break;
      }
    }

    // Filtrar por curso asignado
    if (filterOptions.courseId && filterOptions.courseId !== "all") {
      if (filterOptions.courseId === "none") {
        filtered = filtered.filter((s) => !(s.cursos_asignados || []).length);
      } else {
        filtered = filtered.filter((s) =>
          (s.cursos_asignados || []).includes(filterOptions.courseId!)
        );
      }
    }

    if (filterOptions.sortBy) {
      const sortDirection = filterOptions.sortDirection || "desc";
      switch (filterOptions.sortBy) {
        case "name":
          filtered.sort((a, b) => {
            const value = (a.nombre || "").localeCompare(b.nombre || "");
            return sortDirection === "asc" ? value : -value;
          });
          break;
        case "email":
          filtered.sort((a, b) => {
            const value = (a.email || "").localeCompare(b.email || "");
            return sortDirection === "asc" ? value : -value;
          });
          break;
        case "date":
          filtered.sort((a, b) => {
            const getTimestamp = (student: StudentDB) =>
              student.fechaUltimaEdicion?._seconds ||
              student.fechaRegistro?._seconds ||
              0;
            const dateA = getTimestamp(a);
            const dateB = getTimestamp(b);
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          });
          break;
      }
    }

    setFilteredStudents(filtered);
  }, [students]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setPaginationLoading(true)
        const res = await StudentsAPI.getAll({
          page: pagination.page,
          limit: pagination.limit,
        });
        const paginated = normalizePaginatedResponse<StudentDB>(res, pagination.page, pagination.limit);
        setStudents(paginated.data);
        setPagination(paginated.pagination);
        setPaginationLoading(false)
      } catch (err) {
        console.error("Error al cargar estudiantes:", err);
        setError("No se pudieron cargar los estudiantes");
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await CoursesAPI.getAllList();
        setCourses(data.map((c: { id: string; titulo: string }) => ({ id: c.id, titulo: c.titulo })));
      } catch (err) {
        console.error("Error al cargar cursos:", err);
        setCourses([]);
      }
    };
    fetchCourses();
  }, []);

  // Aplicar filtros cuando cambien los estudiantes, la búsqueda o los filtros
  useEffect(() => {
    applyFilters(searchQuery, filters);
  }, [applyFilters, filters, searchQuery]);

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
      setFilteredStudents((prev) =>
        prev.filter((s) => s.id !== id)
      );
      
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
      const res = await StudentsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      const paginated = normalizePaginatedResponse<StudentDB>(res, pagination.page, pagination.limit);
      setStudents(paginated.data);
      setPagination(paginated.pagination);
      // Los filtros se aplicarán automáticamente mediante el useEffect
    } catch (err) {
      console.error("Error al actualizar lista de estudiantes:", err);
    }
  };

  const handleUserSaved = (savedUser?: StudentDB) => {
    if (!savedUser?.id) {
      handleUserUpdated();
      return;
    }

    const existsInCurrentList = students.some(
      (student) => student.id === savedUser.id
    );
    const timestampNow = Math.floor(Date.now() / 1000);
    const normalizedSavedUser: StudentDB = {
      ...savedUser,
      fechaUltimaEdicion:
        savedUser.fechaUltimaEdicion ||
        {
          _seconds: timestampNow,
          _nanoseconds: 0,
        },
      fechaRegistro:
        savedUser.fechaRegistro ||
        {
          _seconds: timestampNow,
          _nanoseconds: 0,
        },
    };

    setStudents((prev) => {
      const exists = prev.some((student) => student.id === normalizedSavedUser.id);
      if (exists) {
        return prev.map((student) =>
          student.id === normalizedSavedUser.id
            ? { ...student, ...normalizedSavedUser }
            : student
        );
      }
      return [normalizedSavedUser, ...prev];
    });

    setPagination((prev) => ({
      ...prev,
      total: prev.total + (existsInCurrentList ? 0 : 1),
    }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const filterOptions = {
    types: [],
    sortOptions: [
      { value: "name", label: "Nombre" },
      { value: "email", label: "Email" },
      { value: "date", label: "Fecha de registro" },
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
          onCreateNew={handleUserSaved}
          createButtonText="Crear usuario"
          filterOptions={filterOptions}
          currentFilters={filters}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredStudents.length} de {pagination.total} usuarios
        </p>
      </div>

      <div ref={listTopRef}>
        {paginationLoading ? (
          <div className="flex justify-center gap-3 h-full">
            <Loader className="animate-spin"/> 
            <h1 className="text-zinc-700">Cargando siguiente pagina</h1>
          </div>
        ) : (
          filteredStudents.length > 0 ? (
            <div data-tour="students-list">
              <StudentList 
              students={filteredStudents} 
              onDelete={handleDeleteClick} 
              onUserUpdated={handleUserSaved}
              onStatusChange={async () => {
                // Recargar estudiantes después de cambiar estado
                try {
                  const res = await StudentsAPI.getAll({
                    page: pagination.page,
                    limit: pagination.limit,
                  });
                  const paginated = normalizePaginatedResponse<StudentDB>(res, pagination.page, pagination.limit);
                  setStudents(paginated.data);
                  setPagination(paginated.pagination);
                  applyFilters(searchQuery, filters);
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
