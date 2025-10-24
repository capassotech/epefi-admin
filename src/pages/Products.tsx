import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductList } from '@/components/product/ProductList';
import { SearchAndFilter, type FilterOptions } from '@/components/admin/SearchAndFilter';
import { useNavigate } from 'react-router-dom';
import { CoursesAPI } from "@/service/courses";
import ConfirmDeleteModal from '@/components/product/ConfirmDeleteModal'; 
import { mockProducts } from '@/data/mockData';
import { type Course } from '@/types/types';
import { Loader2 } from 'lucide-react';

export default function Products() {
  const navigate = useNavigate();
  const [formaciones, setFormaciones] = useState<Course[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setFormaciones(mockProducts);
    const fetchFormaciones = async () => {
      try {
        const res = await CoursesAPI.getAll();
        const data = Array.isArray(res) ? res : res?.data || [];
        setFormaciones(data);
        setFilteredProducts(data);
      } catch (err) {
        console.error("Error al cargar formaciones:", err);
        setError('No se pudieron cargar las formaciones');
        setFormaciones([]);
        setFilteredProducts([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchFormaciones();
  }, []);

  const handleDeleteClick = async (id: string) => {
    setConfirmDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    if (!id) return;

    try {
      setDeleteLoading(true);
      await CoursesAPI.delete(id);

      setFormaciones(prev => prev.filter(f => f.id !== id));
      setFilteredProducts(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error("Error al eliminar formación:", err);
    } finally {
      setIsDeleteModalOpen(false);
      setConfirmDeleteId(null);
      setDeleteLoading(false);
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
    let filtered = [...formaciones];

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
      <div className='h-screen flex justify-center items-center'>
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
        <h1 className="text-3xl font-bold text-gray-900">Cursos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona todos tus cursos, membresías, e-books y contenido gratuito.
        </p>
      </div>

      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onCreateNew={() => navigate('/products/create')}
        createButtonText="Crear curso"
        filterOptions={filterOptions}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {formaciones.length} cursos
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
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

      {filteredProducts.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <ProductList products={filteredProducts} onDelete={handleDeleteClick} />
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
          <p className="text-gray-600 mb-4">Intenta ajustar los filtros o crear una nueva formación.</p>
          <button
            onClick={() => navigate('/products/create')}
            className="admin-button"
          >
            Crear primer curso
          </button>
        </div>
      )}

      <ConfirmDeleteModal
        id={confirmDeleteId || ''}
        isOpen={isDeleteModalOpen}
        onCancel={handleCancelDelete}  
        onConfirm={handleConfirmDelete}
        itemName={formaciones.find(f => f.id === confirmDeleteId)?.titulo || "este curso"}
        deleteLoading={deleteLoading}
      />
    </div>
  );
}