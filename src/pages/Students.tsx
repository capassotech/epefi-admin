// src/pages/admin/Students.tsx
import { useState, useEffect } from "react";
import { StudentList } from "@/components/students/StudentsList";
import {
  SearchAndFilter,
  type FilterOptions,
} from "@/components/admin/SearchAndFilter";
import { useNavigate } from "react-router-dom";
import { StudentsAPI } from "@/service/students";
import ConfirmDeleteModal from "@/components/product/ConfirmDeleteModal";
import { type StudentDB } from "@/types/types";
import { Loader2 } from "lucide-react";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentDB[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDB[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await StudentsAPI.getAll();
        const data = Array.isArray(res) ? res : res?.data || [];
        setStudents(data);
        setFilteredStudents(data);
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

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleteLoading(true);

    try {
      await StudentsAPI.delete(confirmDeleteId);

      setStudents((prev) => prev.filter((s) => s.id !== confirmDeleteId));
      setFilteredStudents((prev) =>
        prev.filter((s) => s.id !== confirmDeleteId)
      );
    } catch (err) {
      console.error("Error al eliminar estudiante:", err);
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
      setFilteredStudents(data);
    } catch (err) {
      console.error("Error al actualizar lista de estudiantes:", err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, filters);
  };

  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFilters(searchQuery, newFilters);
  };

  const applyFilters = (query: string, filterOptions: FilterOptions) => {
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
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="animate-spin w-10 h-10 text-gray-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-600 py-6">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estudiantes</h1>
        <p className="text-gray-600 mt-2">
          Gestiona todos los estudiantes registrados en la plataforma.
        </p>
      </div>

      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onCreateNew={() => navigate("/students")}
        createButtonText="Crear estudiante"
        filterOptions={filterOptions}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredStudents.length} de {students.length} estudiantes
        </p>
      </div>

      {filteredStudents.length > 0 ? (
        <StudentList students={filteredStudents} onDelete={handleDeleteClick} onUserUpdated={handleUserUpdated} />
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👨‍🎓</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron estudiantes
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
      />
    </div>
  );
}
