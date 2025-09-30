import { useState, useEffect } from 'react';
import { SubjectCard } from '../components/subject/SubjectCard';
import { SubjectList } from '../components/subject/SubjectList';
import CreateSubjectModal from '../components/subject/CreateSubjectModal';
import { SearchAndFilter, type FilterOptions } from '@/components/admin/SearchAndFilter';
import { CoursesAPI } from "@/service/courses";
import ConfirmDeleteModal from '@/components/product/ConfirmDeleteModal';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Subject } from '@/types/types';

export default function Subjects() {
    const [materias, setMaterias] = useState<Subject[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterOptions>({});
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    useEffect(() => {
        const fetchMaterias = async () => {
            try {
                const res = await CoursesAPI.getMaterias();
                const data = Array.isArray(res) ? res : res?.data || [];
                setMaterias(data);
                setFilteredSubjects(data);
            } catch (err) {
                console.error("Error al cargar materias:", err);
                setError('No se pudieron cargar las materias');
                setMaterias([]);
                setFilteredSubjects([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterias();
    }, []);

    const handleDeleteClick = (id: string) => {
        setConfirmDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return;

        setDeleteLoading(true);

        try {
            await CoursesAPI.deleteMateria(confirmDeleteId);

            setMaterias(prev => prev.filter(m => m.id !== confirmDeleteId));
            setFilteredSubjects(prev => prev.filter(m => m.id !== confirmDeleteId));
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

    const handleCreateSubject = async (subjectData: { nombre: string, id_cursos: string[], modulos: string[] }): Promise<Subject> => {
        try {
            const payload = {
                nombre: subjectData.nombre,
                id_cursos: subjectData.id_cursos,
                modulos: subjectData.modulos,
            };

            const response = await CoursesAPI.createMateria({
                nombre: payload.nombre,
                id_cursos: payload.id_cursos,
                modulos: payload.modulos,
            });

            const newSubject: Subject = {
                id: response.id,
                nombre: payload.nombre,
                id_cursos: payload.id_cursos,
                modulos: payload.modulos,
            };

            setMaterias(prev => [newSubject, ...prev]);
            setFilteredSubjects(prev => [newSubject, ...prev]);

            toast.success("Materia creada exitosamente");
            return newSubject;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            toast.error("Error al crear materia: " + errorMessage);
            throw err;
        }
    };

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
        setEditingSubject(null);
    };

    const handleEditClick = (subject: Subject) => {
        setEditingSubject(subject);
        setIsCreateModalOpen(true);
    };

    const handleUpdateSubject = async (subjectData: { id: string; nombre: string; id_cursos: string[]; modulos: string[] }): Promise<void> => {
        try {
            await CoursesAPI.updateMateria(subjectData.id, {
                id: subjectData.id,
                nombre: subjectData.nombre,
                id_cursos: subjectData.id_cursos,
                modulos: subjectData.modulos,
            });

            // Actualizar el estado local
            setMaterias(prev => prev.map(m => 
                m.id === subjectData.id 
                    ? { ...m, nombre: subjectData.nombre, id_cursos: subjectData.id_cursos, modulos: subjectData.modulos }
                    : m
            ));
            setFilteredSubjects(prev => prev.map(m => 
                m.id === subjectData.id 
                    ? { ...m, nombre: subjectData.nombre, id_cursos: subjectData.id_cursos, modulos: subjectData.modulos }
                    : m
            ));

            toast.success("Materia actualizada exitosamente");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            toast.error("Error al actualizar materia: " + errorMessage);
            throw err;
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
        let filtered = [...materias];

        if (query) {
            filtered = filtered.filter(m =>
                m.nombre.toLowerCase().includes(query.toLowerCase())
            );
        }

        if (filterOptions.sortBy) {
            switch (filterOptions.sortBy) {
                case 'title':
                    filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
                    break;
                case 'status':
                    filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
                    break;
                case 'date':
                    filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
                    break;
            }
        }

        setFilteredSubjects(filtered);
    };

    const filterOptions = {
        types: [
            { value: 'TEORICA', label: 'Teórica' },
            { value: 'PRACTICA', label: 'Práctica' },
            { value: 'MIXTA', label: 'Mixta' },
        ],
        sortOptions: [
            { value: 'title', label: 'Título' },
            { value: 'status', label: 'Estado' },
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
                <h1 className="text-3xl font-bold text-gray-900">Materias</h1>
                <p className="text-gray-600 mt-2">
                    Gestiona todas las materias de tus cursos y programas educativos.
                </p>
            </div>

            <SearchAndFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                onCreateNew={() => setIsCreateModalOpen(true)}
                createButtonText="Crear materia"
                filterOptions={filterOptions}
            />

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Mostrando {filteredSubjects.length} de {materias.length} materias
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

            {filteredSubjects.length > 0 ? (
                <>
                    {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSubjects.map((m, index) => (
                                <div
                                    key={m.id}
                                    className="animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <SubjectCard
                                        subject={m}
                                        onEdit={handleEditClick}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <SubjectList subjects={filteredSubjects} onDelete={handleDeleteClick} onEdit={handleEditClick} />
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📖</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron materias</h3>
                    <p className="text-gray-600 mb-4">Intenta ajustar los filtros o crear una nueva materia.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="admin-button cursor-pointer"
                    >
                        Crear primera materia
                    </button>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                deleteLoading={deleteLoading}
                itemName={materias.find(m => m.id === confirmDeleteId)?.nombre || "esta materia"}
            />

            <CreateSubjectModal
                isOpen={isCreateModalOpen}
                onCancel={handleCancelCreate}
                onSubjectCreated={handleCreateSubject}
                courseId={null} 
                editingSubject={editingSubject}
                onSubjectUpdated={handleUpdateSubject}
            />
        </div>
    );
}
