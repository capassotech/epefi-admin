// src/pages/admin/Students.tsx
import { useState, useEffect, useCallback } from "react";
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

export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentDB[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDB[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    if (filterOptions.sortBy) {
      switch (filterOptions.sortBy) {
        case "name":
          filtered.sort((a, b) =>
            (a.nombre || "").localeCompare(b.nombre || "")
          );
          break;
        case "email":
          filtered.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
          break;
        case "date":
          filtered.sort((a, b) => {
            const dateA = a.fechaRegistro?._seconds || 0;
            const dateB = b.fechaRegistro?._seconds || 0;
            return dateB - dateA;
          });
          break;
      }
    }

    setFilteredStudents(filtered);
  }, [students]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await StudentsAPI.getAll();
        const data = Array.isArray(res) ? res : res?.data || [];
        setStudents(data);
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
      const res = await StudentsAPI.getAll();
      const data = Array.isArray(res) ? res : res?.data || [];
      setStudents(data);
      // Los filtros se aplicarán automáticamente mediante el useEffect
    } catch (err) {
      console.error("Error al actualizar lista de estudiantes:", err);
    }
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
          Mostrando {filteredStudents.length} de {students.length} usuarios
        </p>
      </div>

      {filteredStudents.length > 0 ? (
        <div data-tour="students-list">
          <StudentList 
            students={filteredStudents} 
            onDelete={handleDeleteClick} 
            onUserUpdated={handleUserUpdated}
            onStatusChange={async () => {
              // Recargar estudiantes después de cambiar estado
              try {
                const res = await StudentsAPI.getAll();
                const data = Array.isArray(res) ? res : res?.data || [];
                setStudents(data);
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
