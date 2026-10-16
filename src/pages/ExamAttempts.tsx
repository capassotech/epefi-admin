import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader, RotateCcw, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import {
  ExamsAPI,
  type AlumnoIntentosRow,
  type ExamenIntentosResponse,
} from "@/service/exams";
import { toast } from "sonner";

type DraftMap = Record<string, string>;
type SavingMap = Record<string, boolean>;

export default function ExamAttempts() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ExamenIntentosResponse | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [saving, setSaving] = useState<SavingMap>({});

  const examenId = id ? decodeURIComponent(id) : "";

  const fetchData = useCallback(async () => {
    if (!examenId) {
      setError("Examen no válido");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await ExamsAPI.getAlumnosIntentos(
        examenId,
        searchQuery || undefined
      );
      setData(res);
      const nextDrafts: DraftMap = {};
      for (const row of res.alumnos) {
        nextDrafts[row.idAlumno] = String(row.intentosMaximos);
      }
      setDrafts(nextDrafts);
      setError("");
    } catch (err) {
      console.error("Error al cargar intentos:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los intentos"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [examenId, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const intentosDefault = data?.intentosDefault ?? 3;

  const alumnos = useMemo(() => data?.alumnos ?? [], [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const setRowSaving = (idAlumno: string, value: boolean) => {
    setSaving((prev) => ({ ...prev, [idAlumno]: value }));
  };

  const handleSave = async (row: AlumnoIntentosRow) => {
    const raw = drafts[row.idAlumno];
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) {
      toast.error("Ingresá un entero mayor o igual a 1");
      return;
    }
    if (value < row.intentosUsados) {
      toast.error(
        `No podés asignar menos de ${row.intentosUsados}: el alumno ya usó esos intentos`
      );
      return;
    }
    if (value === row.intentosMaximos && row.esOverride) {
      toast.message("Sin cambios");
      return;
    }
    if (value === intentosDefault && !row.esOverride) {
      toast.message("Ya tiene el límite por defecto");
      return;
    }

    try {
      setRowSaving(row.idAlumno, true);
      if (value === intentosDefault && row.esOverride) {
        if (row.intentosUsados > intentosDefault) {
          toast.error(
            `No se puede restablecer al default (${intentosDefault}): el alumno ya usó ${row.intentosUsados} intentos`
          );
          return;
        }
        await ExamsAPI.resetIntentosAlumno(examenId, row.idAlumno);
        toast.success("Se restableció el límite por defecto");
      } else {
        await ExamsAPI.upsertIntentosAlumno(examenId, row.idAlumno, value);
        toast.success("Intentos actualizados");
      }
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al guardar intentos"
      );
    } finally {
      setRowSaving(row.idAlumno, false);
    }
  };

  const handleReset = async (row: AlumnoIntentosRow) => {
    if (!row.esOverride) {
      toast.message("Ya usa el límite por defecto");
      return;
    }
    if (row.intentosUsados > intentosDefault) {
      toast.error(
        `No se puede restablecer al default (${intentosDefault}): el alumno ya usó ${row.intentosUsados} intentos`
      );
      return;
    }
    try {
      setRowSaving(row.idAlumno, true);
      await ExamsAPI.resetIntentosAlumno(examenId, row.idAlumno);
      toast.success("Se restableció el límite por defecto");
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al restablecer intentos"
      );
    } finally {
      setRowSaving(row.idAlumno, false);
    }
  };

  if (loading && !data) {
    return (
      <InteractiveLoader
        initialMessage="Cargando intentos"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/exams")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a exámenes
        </Button>
        <p className="text-center text-red-600 py-6">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mb-2"
            onClick={() => navigate("/exams")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
            {data?.examen.titulo || "Examen"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 break-words">
            Intentos por alumno
            {data?.examen.tituloFormacion || data?.examen.idFormacion
              ? ` · ${data?.examen.tituloFormacion || data?.examen.idFormacion}`
              : ""}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-2 sm:items-center"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o email"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" className="shrink-0">
          Buscar
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center gap-3 py-12">
          <Loader className="animate-spin" />
          <span className="text-zinc-700">Actualizando listado…</span>
        </div>
      ) : alumnos.length === 0 ? (
        <div className="text-center py-12 rounded-md border bg-white">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin alumnos
          </h3>
          <p className="text-gray-600">
            No hay alumnos asignados a la formación de este examen
            {searchQuery ? " con ese criterio de búsqueda" : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="block md:hidden divide-y divide-gray-200 rounded-md border bg-white">
            {alumnos.map((row) => {
              const isSaving = !!saving[row.idAlumno];
              return (
                <div key={row.idAlumno} className="p-4 space-y-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-gray-900 break-words">
                      {row.nombreAlumno}
                    </p>
                    <p className="text-sm text-gray-600 break-words">
                      {row.emailAlumno || "—"}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                      <span>
                        Usados: <strong>{row.intentosUsados}</strong>
                      </span>
                      {row.esOverride && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                          Personalizado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Máximo</label>
                      <Input
                        type="number"
                        min={Math.max(1, row.intentosUsados)}
                        step={1}
                        className="w-24"
                        value={drafts[row.idAlumno] ?? ""}
                        disabled={isSaving}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [row.idAlumno]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer"
                      disabled={isSaving}
                      onClick={() => handleSave(row)}
                    >
                      {isSaving ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Guardar
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      disabled={isSaving || !row.esOverride}
                      onClick={() => handleReset(row)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Default
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block rounded-md border bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Usados</TableHead>
                  <TableHead className="text-right w-32">Máximo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnos.map((row) => {
                  const isSaving = !!saving[row.idAlumno];
                  return (
                    <TableRow key={row.idAlumno}>
                      <TableCell className="font-medium">
                        {row.nombreAlumno}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {row.emailAlumno || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.intentosUsados}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={Math.max(1, row.intentosUsados)}
                          step={1}
                          className="w-20 ml-auto text-right"
                          value={drafts[row.idAlumno] ?? ""}
                          disabled={isSaving}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [row.idAlumno]: e.target.value,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {row.esOverride ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                            Personalizado
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Default ({intentosDefault})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="cursor-pointer"
                            disabled={isSaving}
                            onClick={() => handleSave(row)}
                          >
                            {isSaving ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                Guardar
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            disabled={isSaving || !row.esOverride}
                            onClick={() => handleReset(row)}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Default
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
