import { useState, useEffect, useRef } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductList } from '@/components/product/ProductList';
import { SearchAndFilter, type FilterOptions } from '@/components/admin/SearchAndFilter';
import { useNavigate } from 'react-router-dom';
import { CoursesAPI } from "@/service/courses";
import ConfirmDeleteModal from '@/components/product/ConfirmDeleteModal'; 
import { type Course } from '@/types/types';
import { toast } from 'sonner';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { TourButton } from '@/components/tour/TourButton';
import { productsTourSteps } from '@/config/tourSteps';
import { PaginationControls } from '@/components/common/PaginationControls';
import { normalizePaginatedResponse } from '@/utils/pagination';
import type { PaginationMeta } from '@/types/types';
import { Loader } from 'lucide-react';

export default function Products() {
  const navigate = useNavigate();
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const [cursos, setCursos] = useState<Course[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        setPaginationLoading(true);
        const res = await CoursesAPI.getAll({
          page: pagination.page,
          limit: pagination.limit,
        });
        const paginated = normalizePaginatedResponse<Course>(res, pagination.page, pagination.limit);
        const data = paginated.data;
        
        const normalizedData = data.map((c) => ({
          ...c,
          id: String(c.id),
          image: (c as Course & { imagen?: string }).imagen || c.image || '', 
        } as Course));
        
        setCursos(normalizedData);
        setFilteredProducts(normalizedData);
        setPagination(paginated.pagination);
      } catch (err) {
        console.error("Error al cargar cursos:", err);
        setError('No se pudieron cargar los cursos');
        setCursos([]);
        setFilteredProducts([]); 
      } finally {
        setPaginationLoading(false);
        setLoading(false);
      }
    };
    fetchCursos();
  }, [pagination.page, pagination.limit]);


  const handleConfirmDelete = async (id: string) => {
    if (!id) {
      console.error("handleConfirmDelete: ID no proporcionado");
      return;
    }

    const normalizedId = String(id);

    setDeleteLoading(true);
    try {
      const result = await CoursesAPI.delete(normalizedId);
      console.log("Resultado de CoursesAPI.delete:", result);
      
      const res = await CoursesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      const paginated = normalizePaginatedResponse<Course>(res, pagination.page, pagination.limit);
      const data = paginated.data;
      console.log("Cursos recargados del servidor:", data.length, "cursos");
      console.log("IDs de cursos recargados:", data.map((c: Course) => c.id));
      
      // Convertir todos los IDs a string y mapear imagen a image para consistencia
      const normalizedData = data.map((c) => ({
        ...c,
        id: String(c.id),
        image: (c as Course & { imagen?: string }).imagen || c.image || '',
      } as Course));
      
      console.log("Cursos normalizados:", normalizedData.map((c: Course) => ({ id: c.id, titulo: c.titulo })));
      console.log("Verificando que el curso eliminado no esté en la lista:", normalizedData.find((c: Course) => c.id === normalizedId));
      
      // Verificar que el curso realmente fue eliminado
      const cursoEliminadoAunPresente = normalizedData.find((c: Course) => c.id === normalizedId);
      if (cursoEliminadoAunPresente) {
        console.warn("⚠️ El curso eliminado todavía aparece en la respuesta del servidor");
      } else {
        console.log("✅ El curso fue eliminado correctamente del servidor");
      }
      
      // Actualizar el estado con los datos del servidor (crear nuevo array para que React detecte el cambio)
      setCursos([...normalizedData]);
      setPagination(paginated.pagination);
      
      // Aplicar los filtros actuales a los nuevos datos
      let filtered = [...normalizedData];
      
      if (searchQuery) {
        filtered = filtered.filter(f =>
          f.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filters.status && filters.status !== 'all') {
        const isActive = filters.status === 'active';
        filtered = filtered.filter(f => f.estado === (isActive ? 'activo' : 'inactivo'));
      }
      
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'title':
            filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
            break;
          case 'price':
            filtered.sort((a, b) => b.precio - a.precio);
            break;
          case 'students':
            filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
            break;
          case 'date':
            filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
            break;
        }
      }
      
      console.log("Cursos filtrados después de eliminar:", filtered.length);
      console.log("IDs de cursos filtrados:", filtered.map(c => c.id));
      
      // Actualizar el estado filtrado (crear nuevo array)
      setFilteredProducts([...filtered]);
      
      toast.success("Curso eliminado exitosamente");
      
      // Cerrar el modal solo si fue exitoso
      setIsDeleteModalOpen(false);
      setConfirmDeleteId(null);
      
      console.log("=== ELIMINACIÓN COMPLETADA ===");
    } catch (err) {
      console.error("=== ERROR AL ELIMINAR ===");
      console.error("Error completo:", err);
      console.error("Tipo de error:", typeof err);
      console.error("Error como objeto:", JSON.stringify(err, null, 2));
      
      // Obtener mensaje de error más descriptivo
      const axiosErr = err as { 
        response?: { 
          status?: number;
          data?: { message?: string; error?: string };
          statusText?: string;
        };
        message?: string;
        code?: string;
      };
      
      console.error("Error parseado:", {
        hasResponse: !!axiosErr.response,
        status: axiosErr.response?.status,
        statusText: axiosErr.response?.statusText,
        data: axiosErr.response?.data,
        message: axiosErr.message,
        code: axiosErr.code
      });
      
      let errorMessage = "Error al eliminar el curso. Por favor, intenta nuevamente.";
      
      if (axiosErr.response) {
        console.error("Error de respuesta HTTP:", axiosErr.response.status);
        if (axiosErr.response.status === 404) {
          errorMessage = "El curso no fue encontrado. Puede que ya haya sido eliminado.";
        } else if (axiosErr.response.status === 403) {
          errorMessage = "No tienes permisos para eliminar este curso.";
        } else if (axiosErr.response.status === 400) {
          errorMessage = axiosErr.response.data?.message || axiosErr.response.data?.error || "Solicitud inválida. El curso puede estar asociado a otras entidades.";
        } else if (axiosErr.response.status === 500) {
          errorMessage = "Error interno del servidor. Por favor, intenta más tarde.";
        } else {
          errorMessage = axiosErr.response.data?.message || axiosErr.response.data?.error || `Error ${axiosErr.response.status}: ${axiosErr.response.statusText}`;
        }
      } else if (axiosErr.message) {
        console.error("Error de mensaje:", axiosErr.message);
        errorMessage = axiosErr.message;
      }
      
      console.error("Mostrando error al usuario:", errorMessage);
      toast.error(errorMessage);
      
      // Cerrar el modal incluso si hay error (el usuario ya vio el mensaje)
      setIsDeleteModalOpen(false);
      setConfirmDeleteId(null);
    } finally {
      setDeleteLoading(false);
      console.log("=== FINALIZANDO ELIMINACIÓN ===");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setConfirmDeleteId(null);
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
    let filtered = [...cursos];

    if (query) {
      filtered = filtered.filter(f =>
        f.titulo.toLowerCase().includes(query.toLowerCase()) ||
        f.descripcion.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filterOptions.status && filterOptions.status !== 'all') {
      const isActive = filterOptions.status === 'active';
      filtered = filtered.filter(f => f.estado === (isActive ? 'activo' : 'inactivo'));
    }

    if (filterOptions.sortBy) {
      switch (filterOptions.sortBy) {
        case 'title':
          filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
          break;
        case 'price':
          filtered.sort((a, b) => b.precio - a.precio);
          break;
        case 'students':
          filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
          break;
        case 'date':
          filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
          break;
      }
    }

    setFilteredProducts(filtered);
  };

  const filterOptions = {
    types: [
      { value: 'ON_DEMAND', label: 'On Demand' },
      { value: 'ASYNC', label: 'Asincrónica' },
      { value: 'VIVO', label: 'En Vivo' },
      { value: 'EBOOK', label: 'E-book' },
    ],
    sortOptions: [
      { value: 'title', label: 'Título' },
      { value: 'price', label: 'Precio' },
      { value: 'students', label: 'Estudiantes' },
      { value: 'date', label: 'Fecha de creación' },
    ],
  };

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando cursos"
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
        <h1 className="text-3xl font-bold text-gray-900">Cursos</h1>
        <TourButton steps={productsTourSteps} />
      </div>

      <div data-tour="search-filter">
        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          onCreateNew={() => navigate('/products/create')}
          createButtonText="Crear curso"
          filterOptions={filterOptions}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {pagination.total} cursos
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-600" data-tour="view-toggle">
          <span>Vista:</span>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-md ${viewMode === 'cards' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            Lista
          </button>
        </div>
      </div>

      <div ref={listTopRef}>
        {paginationLoading ? (
          <div className="flex justify-center gap-3 h-full">
            <Loader className="animate-spin" />
            <h1 className="text-zinc-700">Cargando siguiente pagina</h1>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="courses-list">
              {filteredProducts.map((f, index) => (
                <div
                  key={f.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard
                    product={f}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div data-tour="courses-list">
              <ProductList 
                products={filteredProducts}
                onProductUpdated={(id, newEstado) => {
                  // Actualizar el estado local sin recargar todo
                  console.log('Actualizando estado local del curso:', { id, newEstado });
                  const normalizedId = String(id);
                  
                  // Forzar actualización creando nuevos arrays para que React detecte el cambio
                  setCursos(prev => {
                    const updated = prev.map(c => {
                      const cId = String(c.id);
                      if (cId === normalizedId) {
                        console.log('Actualizando curso en cursos:', { idAnterior: c.id, estadoAnterior: c.estado, estadoNuevo: newEstado });
                        // Crear un nuevo objeto para garantizar que React detecte el cambio
                        return { ...c, estado: newEstado };
                      }
                      return c;
                    });
                    // Verificar que realmente se actualizó
                    const found = updated.find(c => String(c.id) === normalizedId);
                    console.log('Curso actualizado en cursos:', found);
                    return updated;
                  });
                  
                  setFilteredProducts(prev => {
                    const updated = prev.map(c => {
                      const cId = String(c.id);
                      if (cId === normalizedId) {
                        console.log('Actualizando curso en filteredProducts:', { idAnterior: c.id, estadoAnterior: c.estado, estadoNuevo: newEstado });
                        // Crear un nuevo objeto para garantizar que React detecte el cambio
                        return { ...c, estado: newEstado };
                      }
                      return c;
                    });
                    // Verificar que realmente se actualizó
                    const found = updated.find(c => String(c.id) === normalizedId);
                    console.log('Curso actualizado en filteredProducts:', found);
                    return updated;
                  });
                }}
              />
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
          <p className="text-gray-600 mb-4">Intenta ajustar los filtros o crear un nuevo curso.</p>
          <button
            onClick={() => navigate('/products/create')}
            className="admin-button"
          >
            Crear primer curso
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
        id={confirmDeleteId || ''}
        isOpen={isDeleteModalOpen}
        onCancel={handleCancelDelete}  
        onConfirm={handleConfirmDelete}
        itemName={cursos.find(f => f.id === confirmDeleteId)?.titulo || "este curso"}
        deleteLoading={deleteLoading}
      />
    </div>
  );
}