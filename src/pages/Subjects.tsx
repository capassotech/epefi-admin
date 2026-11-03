import { useState, useEffect, useRef, useCallback } from 'react';
import { SubjectList } from '../components/subject/SubjectList';
import { SearchAndFilter, type FilterOptions } from '@/components/admin/SearchAndFilter';
import { CoursesAPI } from "@/service/courses";
import ConfirmDeleteModal from '@/components/product/ConfirmDeleteModal';
import { type Course, type Subject } from '@/types/types';
import { useNavigate } from 'react-router-dom';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { usePageHeader } from '@/context/PageHeaderContext';
import { subjectsTourSteps } from '@/config/tourSteps';
import { PaginationControls } from '@/components/common/PaginationControls';
import { normalizePaginatedResponse } from '@/utils/pagination';
import type { PaginationMeta } from '@/types/types';
import { ListLoadingPill } from '@/components/common/ListLoading';
import { applyColumnFilter, applyColumnSort, listLoadingClass, type ColumnSort } from '@/utils/tableState';

export default function Subjects() {
    const listTopRef = useRef<HTMLDivElement | null>(null);
    const [materias, setMaterias] = useState<Subject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterOptions>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const navigate = useNavigate();
    usePageHeader({ title: 'Materias', tourSteps: subjectsTourSteps });
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [pagination, setPagination] = useState<PaginationMeta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const fetchMaterias = useCallback(async () => {
        try {
            setPaginationLoading(true);
            const sortByMap: Record<string, "titulo" | "estado"> = {
                title: "titulo",
                status: "estado",
            };
            const statusMap: Record<string, "activo" | "inactivo"> = {
                active: "activo",
                inactive: "inactivo",
            };

            const sortBy = filters.sortBy ? sortByMap[filters.sortBy] : undefined;
            const status =
                filters.status && filters.status !== "all"
                    ? statusMap[filters.status]
                    : undefined;

            const res = await CoursesAPI.getMaterias({
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery.trim() || undefined,
                status,
                sortBy,
                sortOrder: sortBy ? filters.sortDirection ?? "asc" : undefined,
            });
            const paginated = normalizePaginatedResponse<Subject>(res, pagination.page, pagination.limit);
            const data = paginated.data;

            const normalizedData = data.map((m) => ({
                ...m,
                activo: m.activo !== undefined ? m.activo : (m.estado === 'activo' || m.estado === undefined),
            }));
            setMaterias(normalizedData);
            setPagination(paginated.pagination);
        } catch (err) {
            console.error("Error al cargar materias:", err);
            setError('No se pudieron cargar las materias');
            setMaterias([]);
        } finally {
            setPaginationLoading(false);
            setLoading(false);
        }
    }, [filters, pagination.limit, pagination.page, searchQuery]);

    useEffect(() => {
        fetchMaterias();
    }, [fetchMaterias]);

    // Cursos para mostrar a cuáles pertenece cada materia
    const [coursesById, setCoursesById] = useState<Record<string, Course>>({});
    useEffect(() => {
        CoursesAPI.getAllList()
            .then((list) =>
                setCoursesById(Object.fromEntries(list.map((c) => [String(c.id), c])))
            )
            .catch((err) => console.error("Error al cargar cursos:", err));
    }, []);

    const handleDeleteClick = (id: string) => {
        setConfirmDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async (id: string) => {
        if (!id) return;

        setDeleteLoading(true);

        try {
            await CoursesAPI.deleteMateria(id);

            setMaterias(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error("Error al eliminar materia:", err);
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

    // Crear y editar materias se hace en su propia página
    const goToCreate = () => navigate('/subjects/new');
    const handleEditClick = (subject: Subject) => navigate(`/subjects/${encodeURIComponent(subject.id)}/edit`);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleFilter = (newFilters: FilterOptions) => {
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    // Orden y estado se eligen desde los encabezados de la tabla
    const handleSortChange = (sort: ColumnSort) => handleFilter(applyColumnSort(filters, sort));
    const handleStatusFilterChange = (status: string | undefined) =>
        handleFilter(applyColumnFilter(filters, 'status', status));

    if (loading) {
        return (
            <InteractiveLoader
                initialMessage="Cargando materias"
                delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
            />
        );
    }

    if (error) {
        return <p className="text-center text-red-600 py-6">{error}</p>;
    }

    return (
        <div className="space-y-6">
            <div data-tour="search-filter">
                <SearchAndFilter
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    onCreateNew={goToCreate}
                    createButtonText="Crear materia"
                    showStateFilter={false}
                    currentFilters={filters}
                    resetFiltersTo={{}}
                    showClearFilters
                />
            </div>

            <div ref={listTopRef} className={listLoadingClass(paginationLoading)} aria-busy={paginationLoading}>
                <ListLoadingPill loading={paginationLoading} label="Cargando materias…" />
                {paginationLoading && materias.length === 0 ? (
                    <div className="h-32" />
                ) : materias.length > 0 ? (
                        <div data-tour="subjects-list">
                            <SubjectList 
                                subjects={materias} 
                                onDelete={handleDeleteClick} 
                                onEdit={handleEditClick} 
                                showTitle={false}
                                coursesById={coursesById}
                                sortBy={filters.sortBy}
                                sortDirection={filters.sortDirection}
                                onSortChange={handleSortChange}
                                status={filters.status}
                                onStatusFilterChange={handleStatusFilterChange}
                                onStatusChange={async () => {
                                    try {
                                        await fetchMaterias();
                                    } catch (err) {
                                        console.error("Error al recargar materias:", err);
                                    }
                                }}
                                onSubjectStatusUpdated={(id, newEstado) => {
                                    // Actualizar el estado local inmediatamente sin recargar todo
                                    const newActivo = newEstado === 'activo';
                                    const normalizedId = String(id);
                                    console.log('Actualizando estado local de la materia:', { id, newEstado, newActivo });
                                    
                                    // Forzar actualización creando nuevos arrays para que React detecte el cambio
                                    setMaterias(prev => {
                                        const updated = prev.map(m => {
                                            const mId = String(m.id);
                                            if (mId === normalizedId) {
                                                console.log('Actualizando materia en materias:', { idAnterior: m.id, activoAnterior: m.activo, estadoAnterior: m.estado, activoNuevo: newActivo, estadoNuevo: newEstado });
                                                // Crear un nuevo objeto para garantizar que React detecte el cambio
                                                return { ...m, activo: newActivo, estado: newEstado };
                                            }
                                            return m;
                                        });
                                        // Verificar que realmente se actualizó
                                        const found = updated.find(m => String(m.id) === normalizedId);
                                        console.log('Materia actualizada en materias:', found);
                                        return updated;
                                    });
                                    
                                }}
                            />
                        </div>
                ) : (
                    <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📖</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron materias</h3>
                    <p className="text-gray-600 mb-4">Intenta ajustar los filtros o crear una nueva materia.</p>
                    <button
                        onClick={goToCreate}
                        className="admin-button cursor-pointer"
                    >
                        Crear primera materia
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
                isOpen={isDeleteModalOpen}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                deleteLoading={deleteLoading}
                itemName={materias.find(m => m.id === confirmDeleteId)?.nombre || "esta materia"}
                id={confirmDeleteId || ""}
            />
        </div>
    );
}
