import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageHeader } from "@/context/PageHeaderContext";
import { ClipboardCheck, Download, Eye, FileSpreadsheet, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconAction } from "@/components/ui/icon-action";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { PaginationControls } from "@/components/common/PaginationControls";
import { FilterHeader, PlainHeader } from "@/components/common/TableHeaders";
import { FilterChips, type FilterChip } from "@/components/common/FilterChips";
import { ListLoadingPill } from "@/components/common/ListLoading";
import { CompletedExamsAPI } from "@/service/completedExams";
import { ExamsAPI } from "@/service/exams";
import { CoursesAPI } from "@/service/courses";
import type { Course, Examen, ExamenRealizado, PaginationMeta } from "@/types/types";
import { formatTimestamp } from "@/utils/formatTimestamp";
import { downloadCsvExport, downloadExcelExport } from "@/utils/exportData";
import { listLoadingClass } from "@/utils/tableState";
import {
  buildCompletedExamsListPath,
  buildCompletedExamsSearchParams,
  readCompletedExamsFilters,
} from "@/utils/completedExamsFilters";
import { toast } from "sonner";

const EXPORT_HEADERS = [
  "Alumno",
  "Formación",
  "Examen",
  "Nota",
  "Estado",
  "Fecha de realización",
];
const EXPORT_KEYS = [
  "alumno",
  "formacion",
  "examen",
  "nota",
  "estado",
  "fecha",
];

function toExportRows(
  items: ExamenRealizado[],
  coursesById: Record<string, Course>,
  examsById: Record<string, Examen>
) {
  return items.map((row) => ({
    alumno: row.nombreAlumno || "—",
    formacion:
      row.tituloFormacion ||
      coursesById[row.idFormacion]?.titulo ||
      row.idFormacion ||
      "—",
    examen:
      row.tituloExamen || examsById[row.idExamen]?.titulo || row.idExamen || "—",
    nota: typeof row.nota === "number" ? row.nota : "—",
    estado:
      row.estado === "pendiente_correccion"
        ? "Pendiente de corrección"
        : row.aprobado
          ? "Aprobado"
          : "No aprobado",
    fecha: formatTimestamp(row.fechaRealizacion),
  }));
}

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

/** Nota y estado en una sola píldora: ámbar si falta corregir, verde/rojo según aprobación */
function ResultPill({ row }: { row: ExamenRealizado }) {
  if (row.estado === "pendiente_correccion") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        Por corregir
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
        row.aprobado ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      <span className="font-semibold">{typeof row.nota === "number" ? row.nota : "—"}</span>
      <span className="opacity-80">· {row.aprobado ? "Aprobado" : "No aprobado"}</span>
    </span>
  );
}

export default function CompletedExams() {
  const navigate = useNavigate();
  usePageHeader({ title: "Realizados", breadcrumbs: [{ label: "Exámenes", to: "/exams" }] });
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = readCompletedExamsFilters(searchParams);
  const [pendientes, setPendientes] = useState<ExamenRealizado[]>([]);
  const [generales, setGenerales] = useState<ExamenRealizado[]>([]);
  const [pendingPagination, setPendingPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const [generalPagination, setGeneralPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const pendingListRef = useRef<HTMLElement | null>(null);
  const generalListRef = useRef<HTMLElement | null>(null);

  const [filterFormacion, setFilterFormacion] = useState(initialFilters.formacion);
  const [filterExamen, setFilterExamen] = useState(initialFilters.examen);
  const [filterAlumno, setFilterAlumno] = useState(initialFilters.alumno);

  const coursesById = useMemo(
    () =>
      courses.reduce<Record<string, Course>>((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {}),
    [courses]
  );

  const examsById = useMemo(
    () =>
      exams.reduce<Record<string, Examen>>((acc, e) => {
        acc[e.id] = e;
        return acc;
      }, {}),
    [exams]
  );

  const examsForFilter = useMemo(() => {
    if (!filterFormacion) return exams;
    return exams.filter((e) => e.idFormacion === filterFormacion);
  }, [exams, filterFormacion]);

  const goToDetalle = (rowId: string) => {
    navigate(`/exams/completed/${encodeURIComponent(rowId)}`, {
      state: {
        returnTo: buildCompletedExamsListPath(searchParams),
      },
    });
  };

  const listQuery = useMemo(
    () => ({
      idFormacion: filterFormacion || undefined,
      idExamen: filterExamen || undefined,
      search: filterAlumno.trim() || undefined,
    }),
    [filterFormacion, filterExamen, filterAlumno]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [pendingPage, generalPage] = await Promise.all([
        CompletedExamsAPI.getAll({
          ...listQuery,
          estado: "pendiente_correccion",
          page: pendingPagination.page,
          limit: pendingPagination.limit,
        }),
        CompletedExamsAPI.getAll({
          ...listQuery,
          estado: "completado",
          page: generalPagination.page,
          limit: generalPagination.limit,
        }),
      ]);
      setPendientes(pendingPage.data);
      setPendingPagination(pendingPage.pagination);
      setGenerales(generalPage.data);
      setGeneralPagination(generalPage.pagination);
    } catch (err) {
      console.error("Error al cargar exámenes realizados:", err);
      const message =
        err instanceof Error ? err.message : "No se pudieron cargar los registros";
      setError(message);
      setPendientes([]);
      setGenerales([]);
      setPendingPagination(EMPTY_PAGINATION);
      setGeneralPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [
    listQuery,
    pendingPagination.page,
    pendingPagination.limit,
    generalPagination.page,
    generalPagination.limit,
  ]);

  useEffect(() => {
    const params = buildCompletedExamsSearchParams({
      formacion: filterFormacion,
      examen: filterExamen,
      alumno: filterAlumno,
    });
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterFormacion, filterExamen, filterAlumno]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [courseList, examList] = await Promise.all([
          CoursesAPI.getAllList(),
          ExamsAPI.getAll(),
        ]);
        setCourses(courseList);
        setExams(examList);
      } catch (err) {
        console.error("Error al cargar filtros:", err);
        toast.error("No se pudieron cargar formaciones o exámenes para filtros");
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const resetPages = () => {
    setPendingPagination((prev) => ({ ...prev, page: 1 }));
    setGeneralPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilterFormacion("");
    setFilterExamen("");
    setFilterAlumno("");
    resetPages();
  };

  const changeFormacion = (value: string | undefined) => {
    setFilterFormacion(value ?? "");
    // El examen elegido puede no pertenecer a la nueva formación
    setFilterExamen("");
    resetPages();
  };

  const changeExamen = (value: string | undefined) => {
    setFilterExamen(value ?? "");
    resetPages();
  };

  const changeAlumno = (value: string) => {
    setFilterAlumno(value);
    resetPages();
  };

  const fetchAllMatching = async () => {
    const loadEstado = async (
      estado: "completado" | "pendiente_correccion"
    ) => {
      const limit = 100;
      const first = await CompletedExamsAPI.getAll({
        ...listQuery,
        estado,
        page: 1,
        limit,
      });
      const rows = [...first.data];
      for (let page = 2; page <= first.pagination.totalPages; page += 1) {
        const next = await CompletedExamsAPI.getAll({
          ...listQuery,
          estado,
          page,
          limit,
        });
        rows.push(...next.data);
      }
      return rows;
    };

    const [pendingRows, generalRows] = await Promise.all([
      loadEstado("pendiente_correccion"),
      loadEstado("completado"),
    ]);
    return [...pendingRows, ...generalRows];
  };

  const handleExport = async (format: "csv" | "excel") => {
    setExporting(true);
    try {
      const rowsSource = await fetchAllMatching();
      if (rowsSource.length === 0) {
        toast.error("No hay datos para exportar con los filtros actuales");
        return;
      }
      const rows = toExportRows(rowsSource, coursesById, examsById);
      const stamp = new Date().toISOString().slice(0, 10);
      const baseName = `examenes-realizados-${stamp}`;
      if (format === "csv") {
        downloadCsvExport(baseName, EXPORT_HEADERS, rows, EXPORT_KEYS);
      } else {
        downloadExcelExport(baseName, EXPORT_HEADERS, rows, EXPORT_KEYS);
      }
      toast.success("Exportación generada");
    } catch (err) {
      console.error("Error al exportar exámenes realizados:", err);
      toast.error("No se pudo exportar el listado");
    } finally {
      setExporting(false);
    }
  };

  const courseTitle = (row: ExamenRealizado) =>
    row.tituloFormacion || coursesById[row.idFormacion]?.titulo || row.idFormacion;
  const examTitle = (row: ExamenRealizado) =>
    row.tituloExamen || examsById[row.idExamen]?.titulo || row.idExamen;

  const courseOptions = [
    { value: "all", label: "Todas las formaciones" },
    ...courses.map((c) => ({ value: c.id, label: c.titulo })),
  ];
  const examOptions = [
    { value: "all", label: "Todos los exámenes" },
    ...examsForFilter.map((e) => ({ value: e.id, label: e.titulo || e.id })),
  ];

  const chips: FilterChip[] = [];
  if (filterAlumno.trim()) {
    chips.push({ key: "alumno", label: `“${filterAlumno.trim()}”`, onRemove: () => changeAlumno("") });
  }
  if (filterFormacion) {
    chips.push({
      key: "formacion",
      label: `Formación: ${coursesById[filterFormacion]?.titulo ?? "…"}`,
      onRemove: () => changeFormacion(undefined),
    });
  }
  if (filterExamen) {
    chips.push({
      key: "examen",
      label: `Examen: ${examsById[filterExamen]?.titulo ?? "…"}`,
      onRemove: () => changeExamen(undefined),
    });
  }

  const renderTable = (rows: ExamenRealizado[], pending: boolean) => (
    <div className="admin-card overflow-hidden">
      {/* ── Vista mobile: filas compactas ── */}
      <ul role="list" className="block md:hidden divide-y divide-gray-100 bg-white">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50"
            onClick={() => goToDetalle(row.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{row.nombreAlumno || "—"}</p>
              <p className="truncate text-xs text-gray-500">
                {examTitle(row)} · {formatTimestamp(row.fechaRealizacion)}
              </p>
            </div>
            <ResultPill row={row} />
          </li>
        ))}
      </ul>

      {/* ── Vista desktop: tabla ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <PlainHeader className="pl-4 pr-3">Alumno</PlainHeader>
              <FilterHeader
                label="Formación"
                tooltip="Filtrar por formación"
                value={filterFormacion || undefined}
                options={courseOptions}
                onChange={changeFormacion}
              />
              <FilterHeader
                label="Examen"
                tooltip="Filtrar por examen"
                value={filterExamen || undefined}
                options={examOptions}
                onChange={changeExamen}
              />
              <PlainHeader>Nota</PlainHeader>
              <PlainHeader>Fecha</PlainHeader>
              <PlainHeader align="right" className="pl-3 pr-4">
                Acciones
              </PlainHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors duration-150 cursor-pointer hover:bg-gray-50"
                onClick={() => goToDetalle(row.id)}
              >
                <td className="pl-4 pr-3 py-1.5 font-medium text-gray-900 whitespace-nowrap">
                  {row.nombreAlumno || "—"}
                </td>
                <td className="px-3 py-1.5 text-gray-600">
                  <span className="line-clamp-1">{courseTitle(row)}</span>
                </td>
                <td className="px-3 py-1.5 text-gray-600">
                  <span className="line-clamp-1">{examTitle(row)}</span>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <ResultPill row={row} />
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap text-gray-500">
                  {formatTimestamp(row.fechaRealizacion)}
                </td>
                <td
                  className="pl-3 pr-4 py-1.5 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-end">
                    {pending ? (
                      <IconAction
                        label="Corregir examen"
                        onClick={() => goToDetalle(row.id)}
                        className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <ClipboardCheck />
                      </IconAction>
                    ) : (
                      <IconAction label="Ver detalle" onClick={() => goToDetalle(row.id)}>
                        <Eye />
                      </IconAction>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading && pendientes.length === 0 && generales.length === 0 && !error) {
    return (
      <InteractiveLoader
        initialMessage="Cargando exámenes realizados"
        delayedMessage="Obteniendo resultados de alumnos"
      />
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-6">
      <div className="w-full space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <Input
              value={filterAlumno}
              onChange={(e) => changeAlumno(e.target.value)}
              placeholder="Buscar alumno..."
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? "Exportando…" : "Exportar"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => void handleExport("csv")}>
                <FileText className="w-4 h-4" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleExport("excel")}>
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <FilterChips chips={chips} onClearAll={handleClearFilters} />
      </div>

      <p className="text-sm text-gray-600">
        {pendingPagination.total > 0 && (
          <>
            <span className="font-medium text-amber-700">{pendingPagination.total} por corregir</span>
            {" · "}
          </>
        )}
        {generalPagination.total} corregidos
      </p>

      {error ? (
        <p className="text-center text-red-600 py-6">{error}</p>
      ) : pendingPagination.total > 0 || generalPagination.total > 0 ? (
        <div className={listLoadingClass(loading, "space-y-8")} aria-busy={loading}>
          <ListLoadingPill loading={loading} label="Cargando exámenes…" />

          {pendingPagination.total > 0 && (
            <section ref={pendingListRef} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                Por corregir
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {pendingPagination.total}
                </span>
              </h2>
              {renderTable(pendientes, true)}
              <PaginationControls
                pagination={pendingPagination}
                idPrefix="pending-exams-limit"
                scrollTargetRef={pendingListRef}
                onPageChange={(page) =>
                  setPendingPagination((prev) => ({ ...prev, page }))
                }
                onLimitChange={(limit) =>
                  setPendingPagination((prev) => ({ ...prev, limit, page: 1 }))
                }
              />
            </section>
          )}

          <section ref={generalListRef} className="space-y-3">
            {pendingPagination.total > 0 && (
              <h2 className="text-sm font-semibold text-gray-900">Corregidos</h2>
            )}
            {generalPagination.total === 0 && pendingPagination.total > 0 ? (
              <p className="text-sm text-gray-500 py-2">
                No hay otros exámenes realizados con los filtros actuales.
              </p>
            ) : generales.length > 0 ? (
              renderTable(generales, false)
            ) : null}
            {generalPagination.total > 0 && (
              <PaginationControls
                pagination={generalPagination}
                idPrefix="completed-exams-limit"
                scrollTargetRef={generalListRef}
                onPageChange={(page) =>
                  setGeneralPagination((prev) => ({ ...prev, page }))
                }
                onLimitChange={(limit) =>
                  setGeneralPagination((prev) => ({ ...prev, limit, page: 1 }))
                }
              />
            )}
          </section>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          No hay exámenes realizados con los filtros seleccionados.
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
