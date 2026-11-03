// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/context/PageHeaderContext';
import { Button } from '@/components/ui/button';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { IconAction } from '@/components/ui/icon-action';
import { TooltipProvider } from '@/components/ui/tooltip';
import { formatCurrency } from '@/utils/currency';
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Pencil,
} from 'lucide-react';
import { CoursesAPI } from '@/service/courses';
import type { Course, Subject, Module } from '@/types/types';
import { formatDictadoDateForDisplay } from '@/utils/courseDates';
import ModulesList from '@/components/subject/ModulesList';
import ModulesModal from '@/components/subject/ModulesModal';
import ConfirmDeleteModal from '@/components/product/ConfirmDeleteModal';
import {
  DetailLayout,
  InfoList,
  InfoRow,
  ProfileCard,
  SectionCard,
  SectionEmpty,
  StatGrid,
  StatusPill,
} from '@/components/common/DetailLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Componente para mostrar la vista previa cuadrada
const SquareImagePreview = ({ src }: { src: string }) => {
  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
      <img
        src={src}
        alt="Vista previa"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const formatUpdatedAt = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Course | null>(null);
  const [materias, setMaterias] = useState<Subject[]>([]);
  const [modulosPorMateria, setModulosPorMateria] = useState<Record<string, Module[]>>({});
  const [modulosHabilitadosEstadoPorMateria, setModulosHabilitadosEstadoPorMateria] = useState<Record<string, Record<string, boolean>>>({});
  const [loadingModulos, setLoadingModulos] = useState<Record<string, boolean>>({});
  const [expandedMaterias, setExpandedMaterias] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingModuleMateriaId, setEditingModuleMateriaId] = useState<string | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null);
  const [confirmDeleteMateriaId, setConfirmDeleteMateriaId] = useState<string | null>(null);
  const [isDeleteModuleModalOpen, setIsDeleteModuleModalOpen] = useState(false);
  const [deleteModuleLoading, setDeleteModuleLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID de curso no proporcionado');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await CoursesAPI.getById(id);
        // Normalizar: mapear 'imagen' del backend a 'image' para el tipo Course
        const normalizedCourse: Course = {
          ...data,
          image: data.imagen || data.image || '',
          planDeEstudiosUrl: data.planDeEstudiosUrl || undefined,
          fechasDeExamenesUrl: data.fechasDeExamenesUrl || undefined,
          planDeEstudiosActualizado: data.planDeEstudiosActualizado || undefined,
          fechasDeExamenesActualizado: data.fechasDeExamenesActualizado || undefined,
        };
        setCurso(normalizedCourse);

        if (data.materias && data.materias.length > 0) {
          setLoadingMaterias(true);
          try {
            const materiasData = await CoursesAPI.getMateriasByIds(data.materias);
            setMaterias(materiasData);
          } catch (moduloError) {
            console.error("⚠️ Error al cargar materias:", moduloError);
          } finally {
            setLoadingMaterias(false);
          }
        }
      } catch (error: any) {
        console.error("❌ Error al cargar curso:", error);
        setError(error.message || 'Error al cargar el curso');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Función para cargar módulos de una materia
  const loadModulosForMateria = async (materiaId: string, moduloIds: string[]) => {
    if (modulosPorMateria[materiaId] || loadingModulos[materiaId] || !moduloIds.length) {
      return;
    }

    setLoadingModulos(prev => ({ ...prev, [materiaId]: true }));
    try {
      const [modulosData, estado] = await Promise.all([
        CoursesAPI.getModulesByIds(moduloIds),
        CoursesAPI.getModulosHabilitadosEstado(materiaId),
      ]);
      setModulosPorMateria(prev => ({ ...prev, [materiaId]: modulosData }));
      setModulosHabilitadosEstadoPorMateria(prev => ({ ...prev, [materiaId]: estado }));
    } catch (error) {
      console.error(`Error al cargar módulos de materia ${materiaId}:`, error);
    } finally {
      setLoadingModulos(prev => ({ ...prev, [materiaId]: false }));
    }
  };

  // Función para toggle de expansión de materia
  const toggleMateria = (materiaId: string, moduloIds: string[] = []) => {
    setExpandedMaterias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materiaId)) {
        newSet.delete(materiaId);
      } else {
        newSet.add(materiaId);
        // Cargar módulos cuando se expande
        if (moduloIds.length > 0) {
          loadModulosForMateria(materiaId, moduloIds);
        }
      }
      return newSet;
    });
  };

  const handleEditModule = (module: Module, materiaId: string) => {
    setEditingModule(module);
    setEditingModuleMateriaId(materiaId);
    setIsModuleModalOpen(true);
  };

  const handleDeleteModuleClick = (moduleId: string, materiaId: string) => {
    setConfirmDeleteModuleId(moduleId);
    setConfirmDeleteMateriaId(materiaId);
    setIsDeleteModuleModalOpen(true);
  };

  const handleCancelDeleteModule = () => {
    setIsDeleteModuleModalOpen(false);
    setConfirmDeleteModuleId(null);
    setConfirmDeleteMateriaId(null);
  };

  const handleConfirmDeleteModule = async (selectedId: string) => {
    if (!selectedId || !confirmDeleteMateriaId) return;
    setDeleteModuleLoading(true);
    try {
      await CoursesAPI.deleteModule(selectedId, confirmDeleteMateriaId);
      setModulosPorMateria(prev => ({
        ...prev,
        [confirmDeleteMateriaId]: (prev[confirmDeleteMateriaId] || []).filter(m => m.id !== selectedId),
      }));
      setMaterias(prev =>
        prev.map(m =>
          m.id === confirmDeleteMateriaId
            ? { ...m, modulos: (m.modulos || []).filter(idModulo => idModulo !== selectedId) }
            : m
        )
      );
      toast.success('Módulo eliminado con éxito');
      setConfirmDeleteModuleId(null);
      setConfirmDeleteMateriaId(null);
    } catch (err) {
      toast.error('Error al eliminar el módulo');
      console.error('Error al eliminar módulo:', err);
    } finally {
      setDeleteModuleLoading(false);
      setIsDeleteModuleModalOpen(false);
    }
  };

  const handleCancelModuleModal = () => {
    setIsModuleModalOpen(false);
    setEditingModule(null);
    setEditingModuleMateriaId(null);
  };

  const handleModuleUpdated = async (moduleData: Module): Promise<void> => {
    try {
      await CoursesAPI.updateModule(moduleData.id, {
        id: moduleData.id,
        titulo: moduleData.titulo,
        descripcion: moduleData.descripcion,
        id_materia: moduleData.id_materia,
        tipo_contenido: moduleData.tipo_contenido,
        bibliografia: moduleData.bibliografia,
        url_miniatura: moduleData.url_miniatura,
        url_archivo: moduleData.url_archivo,
        url_video: moduleData.url_video,
        nombres_archivos: moduleData.nombres_archivos || "",
        nombres_videos: moduleData.nombres_videos || "",
      });

      const materiaId = editingModuleMateriaId || moduleData.id_materia;
      if (materiaId) {
        setModulosPorMateria(prev => ({
          ...prev,
          [materiaId]: (prev[materiaId] || []).map(m =>
            m.id === moduleData.id ? { ...m, ...moduleData } : m
          ),
        }));
      }

      toast.success('Módulo actualizado con éxito');
      setEditingModule(null);
      setEditingModuleMateriaId(null);
      setIsModuleModalOpen(false);
    } catch (e) {
      console.error('Error al actualizar módulo:', e);
      throw e as Error;
    }
  };

  usePageHeader({ title: curso?.titulo, breadcrumbs: [{ label: "Cursos", to: "/products" }] });

  if (loading) return (
    <InteractiveLoader
      initialMessage="Cargando curso"
      delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
    />
  );

  if (error) return <div className="p-6 text-red-500">❌ {error}</div>;
  if (!curso) return <div className="p-6">No se encontró el curso</div>;

  const coverSrc = curso.image || (curso as Course & { imagen?: string }).imagen;
  const isActive = curso.estado === 'activo';
  const totalModules = materias.reduce((sum, m) => sum + (m.modulos?.length ?? 0), 0);
  const documents = [
    { label: 'Plan de estudios', url: curso.planDeEstudiosUrl, updated: curso.planDeEstudiosActualizado },
    { label: 'Fechas de exámenes', url: curso.fechasDeExamenesUrl, updated: curso.fechasDeExamenesActualizado },
  ].filter((doc) => doc.url);

  const aside = (
    <ProfileCard
      cover={
        coverSrc && (
          <button
            type="button"
            onClick={() => setPreviewImageOpen(true)}
            className="group relative block aspect-[16/10] w-full overflow-hidden bg-gray-100 cursor-pointer"
            aria-label="Ver portada en tamaño completo"
          >
            <img src={coverSrc} alt={curso.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          </button>
        )
      }
      title={curso.titulo}
      subtitle="Curso"
      badge={<StatusPill active={isActive} />}
      footer={
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer"
          onClick={() => navigate(`/products/${encodeURIComponent(curso.id)}/edit`)}
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Editar curso
        </Button>
      }
    >
      <InfoList>
        <InfoRow icon={<DollarSign />} label="Precio">
          <span className="tabular-nums">{formatCurrency(curso.precio)}</span>
        </InfoRow>
        {(curso.fechaInicioDictado || curso.fechaFinDictado) && (
          <InfoRow icon={<CalendarDays />} label="Dictado">
            {curso.fechaInicioDictado ? formatDictadoDateForDisplay(curso.fechaInicioDictado) : '—'}
            {' → '}
            {curso.fechaFinDictado ? formatDictadoDateForDisplay(curso.fechaFinDictado) : '—'}
          </InfoRow>
        )}
        {documents.map((doc) => (
          <InfoRow key={doc.label} icon={<FileText />} label={doc.label}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-900 hover:text-blue-600 hover:underline"
            >
              Ver documento
              <ExternalLink className="w-3 h-3" />
            </a>
            {doc.updated && (
              <span className="ml-1.5 text-xs text-gray-400">· {formatUpdatedAt(doc.updated)}</span>
            )}
          </InfoRow>
        ))}
      </InfoList>
      <StatGrid
        stats={[
          { label: 'Materias', value: curso.materias?.length ?? 0 },
          { label: 'Módulos', value: loadingMaterias ? '…' : totalModules },
        ]}
      />
    </ProfileCard>
  );

  return (
    <TooltipProvider delayDuration={300}>
    <DetailLayout aside={aside}>
      <SectionCard title="Descripción">
        <p className="whitespace-pre-line px-5 py-4 text-sm leading-relaxed text-gray-700">
          {curso.descripcion || <span className="text-gray-400">Sin descripción</span>}
        </p>
      </SectionCard>

      <SectionCard
        title="Materias"
        description="Desplegá una materia para ver y gestionar sus módulos"
      >
        {loadingMaterias ? (
          <SectionEmpty icon={<Loader2 className="animate-spin" />}>Cargando materias…</SectionEmpty>
        ) : !curso.materias?.length ? (
          <SectionEmpty icon={<BookOpen />}>Este curso todavía no tiene materias.</SectionEmpty>
        ) : materias.length === 0 ? (
          <SectionEmpty icon={<BookOpen />}>No se pudieron cargar las materias.</SectionEmpty>
        ) : (
          <ul className="divide-y divide-gray-100">
            {materias.map((materia) => {
              const numModulos = materia.modulos?.length || 0;
              const modulosCargados = modulosPorMateria[materia.id];
              const isExpanded = expandedMaterias.has(materia.id);

              return (
                <li key={materia.id}>
                  <div
                    className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${
                      numModulos > 0 ? 'cursor-pointer hover:bg-gray-50' : ''
                    }`}
                    onClick={numModulos > 0 ? () => toggleMateria(materia.id, materia.modulos) : undefined}
                    aria-expanded={numModulos > 0 ? isExpanded : undefined}
                  >
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                        numModulos > 0 ? '' : 'invisible'
                      }`}
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{materia.nombre}</p>
                    <span className="text-xs text-gray-400">
                      {numModulos > 0 ? `${numModulos} ${numModulos === 1 ? 'módulo' : 'módulos'}` : 'Sin módulos'}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <IconAction
                        label="Ver materia"
                        onClick={() => navigate(`/subjects/${encodeURIComponent(materia.id)}`)}
                      >
                        <Eye />
                      </IconAction>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 pl-12">
                      {loadingModulos[materia.id] || !modulosCargados ? (
                        <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Cargando módulos…
                        </div>
                      ) : (
                        <ModulesList
                          modules={modulosCargados}
                          materiaId={materia.id}
                          defaultEnabledByModule={modulosHabilitadosEstadoPorMateria[materia.id] ?? {}}
                          onEdit={(module) => handleEditModule(module, materia.id)}
                          onDelete={(moduleId) => handleDeleteModuleClick(moduleId, materia.id)}
                          onToggleSuccess={async () => {
                            const estado = await CoursesAPI.getModulosHabilitadosEstado(materia.id);
                            setModulosHabilitadosEstadoPorMateria(prev => ({ ...prev, [materia.id]: estado }));
                          }}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* Modal de vista previa de portada */}
      <Dialog open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-x-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Vista previa de la portada</DialogTitle>
          </DialogHeader>
          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-4">
              <div className="w-full max-w-[700px] aspect-square max-h-[calc(90vh-140px)]">
                <SquareImagePreview src={coverSrc || '/placeholder.svg'} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModulesModal
        isOpen={isModuleModalOpen}
        onCancel={handleCancelModuleModal}
        onModuleCreated={async () => ({ id: '' })}
        courseId={editingModuleMateriaId}
        editingModule={editingModule}
        onModuleUpdated={handleModuleUpdated}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModuleModalOpen}
        onCancel={handleCancelDeleteModule}
        onConfirm={handleConfirmDeleteModule}
        deleteLoading={deleteModuleLoading}
        itemName={
          (confirmDeleteMateriaId &&
            confirmDeleteModuleId &&
            modulosPorMateria[confirmDeleteMateriaId]?.find(m => m.id === confirmDeleteModuleId)?.titulo) ||
          'este módulo'
        }
        id={confirmDeleteModuleId || ''}
      />
    </DetailLayout>
    </TooltipProvider>
  );
};

export default ProductDetail;
