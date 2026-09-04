import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { CompletedExamsAPI } from "@/service/completedExams";
import { ExamsAPI } from "@/service/exams";
import { CoursesAPI } from "@/service/courses";
import type { Course, Examen, ExamenRealizado } from "@/types/types";
import { formatTimestamp } from "@/utils/formatTimestamp";
import { downloadCsvExport, downloadExcelExport } from "@/utils/exportData";
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

export default function CompletedExams() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = readCompletedExamsFilters(searchParams);
  const [items, setItems] = useState<ExamenRealizado[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Examen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await CompletedExamsAPI.getAll({
        idFormacion: filterFormacion || undefined,
        idExamen: filterExamen || undefined,
        search: filterAlumno.trim() || undefined,
      });
      setItems(data);
    } catch (err) {
      console.error("Error al cargar exámenes realizados:", err);
      const message =
        err instanceof Error ? err.message : "No se pudieron cargar los registros";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterFormacion, filterExamen, filterAlumno]);

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

  const handleClearFilters = () => {
    setFilterFormacion("");
    setFilterExamen("");
    setFilterAlumno("");
  };

  const handleExport = (format: "csv" | "excel") => {
    if (items.length === 0) {
      toast.error("No hay datos para exportar con los filtros actuales");
      return;
    }
    setExporting(true);
    try {
      const rows = toExportRows(items, coursesById, examsById);
      const stamp = new Date().toISOString().slice(0, 10);
      const baseName = `examenes-realizados-${stamp}`;
      if (format === "csv") {
        downloadCsvExport(baseName, EXPORT_HEADERS, rows, EXPORT_KEYS);
      } else {
        downloadExcelExport(baseName, EXPORT_HEADERS, rows, EXPORT_KEYS);
      }
      toast.success("Exportación generada");
    } finally {
      setExporting(false);
    }
  };

  if (loading && items.length === 0 && !error) {
    return (
      <InteractiveLoader
        initialMessage="Cargando exámenes realizados"
        delayedMessage="Obteniendo resultados de alumnos"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center min-w-0">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto shrink-0"
            onClick={() => navigate("/exams")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Exámenes
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
            Exámenes realizados
          </h1>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={exporting || items.length === 0}
            onClick={() => handleExport("csv")}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={exporting || items.length === 0}
            onClick={() => handleExport("excel")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 flex flex-wrap gap-x-4 gap-y-4 items-end">
        <div className="space-y-2 w-full sm:w-auto sm:min-w-[12rem] sm:flex-1">
          <Label>Formación</Label>
          <Select
            value={filterFormacion || "__all__"}
            onValueChange={(v) => {
              setFilterFormacion(v === "__all__" ? "" : v);
              setFilterExamen("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las formaciones</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 w-full sm:w-auto sm:min-w-[12rem] sm:flex-1">
          <Label>Examen</Label>
          <Select
            value={filterExamen || "__all__"}
            onValueChange={(v) => setFilterExamen(v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los exámenes</SelectItem>
              {examsForFilter.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.titulo || e.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 w-full sm:w-auto sm:min-w-[14rem] sm:flex-[1.5]">
          <Label>Alumno (nombre)</Label>
          <Input
            value={filterAlumno}
            onChange={(e) => setFilterAlumno(e.target.value)}
            placeholder="Buscar por nombre o apellido"
          />
        </div>
        <div className="space-y-2 shrink-0">
          <Label className="invisible select-none" aria-hidden>
            Limpiar
          </Label>
          <Button
            type="button"
            variant="ghost"
            className="h-10 px-3"
            onClick={handleClearFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Mostrando {items.length} registro{items.length !== 1 ? "s" : ""}
        {loading ? " (actualizando…)" : ""}
      </p>

      {error ? (
        <p className="text-center text-red-600 py-6">{error}</p>
      ) : items.length > 0 ? (
        <>
          <div className="block md:hidden divide-y divide-gray-200 rounded-md border border-gray-200 bg-white shadow-sm">
            {items.map((row) => (
              <div key={row.id} className="p-4 space-y-3 bg-white">
                <div className="min-w-0 space-y-1.5">
                  <p className="font-semibold text-gray-900 break-words text-base">
                    {row.nombreAlumno || "—"}
                  </p>
                  <p className="text-sm text-gray-700 break-words">
                    {row.tituloFormacion ||
                      coursesById[row.idFormacion]?.titulo ||
                      row.idFormacion}
                  </p>
                  <p className="text-sm text-gray-600 break-words">
                    {row.tituloExamen ||
                      examsById[row.idExamen]?.titulo ||
                      row.idExamen}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-sm font-semibold text-gray-900">
                      Nota: {typeof row.nota === "number" ? row.nota : "—"}
                    </span>
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        row.estado === "pendiente_correccion"
                          ? "bg-amber-100 text-amber-800"
                          : row.aprobado
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.estado === "pendiente_correccion"
                        ? "Pendiente de corrección"
                        : row.aprobado
                          ? "Aprobado"
                          : "No aprobado"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(row.fechaRealizacion)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    navigate(`/exams/completed/${encodeURIComponent(row.id)}`, {
                      state: {
                        returnTo: buildCompletedExamsListPath(searchParams),
                      },
                    })
                  }
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver detalle
                </Button>
              </div>
            ))}
          </div>
          <div className="hidden md:block rounded-md border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Formación</TableHead>
                  <TableHead>Examen</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.nombreAlumno || "—"}
                    </TableCell>
                    <TableCell>
                      {row.tituloFormacion ||
                        coursesById[row.idFormacion]?.titulo ||
                        row.idFormacion}
                    </TableCell>
                    <TableCell>
                      {row.tituloExamen ||
                        examsById[row.idExamen]?.titulo ||
                        row.idExamen}
                    </TableCell>
                    <TableCell className="text-right">
                      {typeof row.nota === "number" ? row.nota : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          row.estado === "pendiente_correccion"
                            ? "bg-amber-100 text-amber-800"
                            : row.aprobado
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.estado === "pendiente_correccion"
                          ? "Pendiente de corrección"
                          : row.aprobado
                            ? "Aprobado"
                            : "No aprobado"}
                      </span>
                    </TableCell>
                    <TableCell>{formatTimestamp(row.fechaRealizacion)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/exams/completed/${encodeURIComponent(row.id)}`,
                            {
                              state: {
                                returnTo: buildCompletedExamsListPath(searchParams),
                              },
                            }
                          )
                        }
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-600">
          No hay exámenes realizados con los filtros seleccionados.
        </div>
      )}
    </div>
  );
}
