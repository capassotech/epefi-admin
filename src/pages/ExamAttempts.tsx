import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageHeader } from "@/context/PageHeaderContext";
import {
  ArrowLeft,
  ClipboardCheck,
  Eye,
  EyeOff,
  Loader,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconAction } from "@/components/ui/icon-action";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InteractiveLoader } from "@/components/ui/InteractiveLoader";
import { PlainHeader } from "@/components/common/TableHeaders";
import { ListLoadingPill } from "@/components/common/ListLoading";
import {
  DetailLayout,
  ProfileCard,
  SectionCard,
  SectionEmpty,
  StatGrid,
} from "@/components/common/DetailLayout";
import { listLoadingClass } from "@/utils/tableState";
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
  const [defaultDraft, setDefaultDraft] = useState("");
  const [savingDefault, setSavingDefault] = useState(false);

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
      setDefaultDraft(String(res.intentosDefault));
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

  const intentosDefault = data?.intentosDefault ?? 1;
  const permitirRevision = data?.permitirRevision !== false;

  const alumnos = useMemo(() => data?.alumnos ?? [], [data]);

  // Búsqueda en vivo, con una pequeña demora para no pedir en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSaveDefault = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(defaultDraft);
    if (!Number.isInteger(value) || value < 1) {
      toast.error("Ingresá un entero mayor o igual a 1");
      return;
    }
    if (value === intentosDefault) {
      toast.message("Sin cambios");
      return;
    }
    try {
      setSavingDefault(true);
      await ExamsAPI.setIntentosDefault(examenId, value);
      toast.success("Límite general de intentos actualizado");
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al guardar el límite general"
      );
    } finally {
      setSavingDefault(false);
    }
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

  const handleToggleRevision = async (row: AlumnoIntentosRow) => {
    const habilitada = !row.revisionHabilitada;
    try {
      setRowSaving(row.idAlumno, true);
      await ExamsAPI.setRevisionAlumno(examenId, row.idAlumno, habilitada);
      toast.success(
        habilitada
          ? "Revisión habilitada para el alumno"
          : "Se quitó la habilitación manual de revisión"
      );
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar la revisión"
      );
    } finally {
      setRowSaving(row.idAlumno, false);
    }
  };

  usePageHeader({
    title: "Intentos",
    breadcrumbs: [
      { label: "Exámenes", to: "/exams" },
      ...(data?.examen.titulo && id
        ? [{ label: data.examen.titulo, to: `/exams/${encodeURIComponent(id)}/edit` }]
        : []),
    ],
  });

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

  const withAttempts = alumnos.filter((row) => row.intentosUsados > 0).length;
  const customized = alumnos.filter((row) => row.esOverride).length;
  const defaultDirty = defaultDraft !== String(intentosDefault);

  const setDraft = (idAlumno: string, value: string) =>
    setDrafts((prev) => ({ ...prev, [idAlumno]: value }));

  const isRowDirty = (row: AlumnoIntentosRow) =>
    (drafts[row.idAlumno] ?? "") !== String(row.intentosMaximos);

  /** "1 de 3" con barra fina; ámbar cuando agotó los intentos */
  const renderUsage = (row: AlumnoIntentosRow) => {
    const max = Math.max(1, row.intentosMaximos);
    const ratio = Math.min(1, row.intentosUsados / max);
    const exhausted = row.intentosUsados >= row.intentosMaximos;
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${exhausted ? "bg-amber-400" : "bg-gray-400"}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <span className={`text-xs tabular-nums ${exhausted ? "text-amber-700" : "text-gray-500"}`}>
          {row.intentosUsados} de {row.intentosMaximos}
        </span>
      </div>
    );
  };

  const renderMaxEditor = (row: AlumnoIntentosRow) => {
    const isSaving = !!saving[row.idAlumno];
    return (
      <div className="flex items-center justify-end gap-0.5">
        <Input
          type="number"
          min={Math.max(1, row.intentosUsados)}
          step={1}
          aria-label={`Intentos máximos de ${row.nombreAlumno}`}
          className="h-8 w-16 text-right tabular-nums"
          value={drafts[row.idAlumno] ?? ""}
          disabled={isSaving}
          onChange={(e) => setDraft(row.idAlumno, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave(row);
          }}
        />
        <IconAction
          label={isRowDirty(row) ? "Guardar límite" : "Sin cambios para guardar"}
          disabled={isSaving || !isRowDirty(row)}
          onClick={() => handleSave(row)}
          className={isRowDirty(row) ? "text-gray-900" : undefined}
        >
          {isSaving ? <Loader className="animate-spin" /> : <Save />}
        </IconAction>
        <IconAction
          label={
            row.esOverride
              ? `Volver al límite general (${intentosDefault})`
              : "Ya usa el límite general"
          }
          disabled={isSaving || !row.esOverride}
          onClick={() => handleReset(row)}
        >
          <RotateCcw />
        </IconAction>
      </div>
    );
  };

  const renderRevisionToggle = (row: AlumnoIntentosRow) => (
    <IconAction
      label={
        row.revisionHabilitada
          ? "Quitar revisión habilitada manualmente"
          : "Habilitar revisión a este alumno aunque le queden intentos"
      }
      disabled={!!saving[row.idAlumno]}
      onClick={() => handleToggleRevision(row)}
      className={row.revisionHabilitada ? "text-emerald-600" : undefined}
    >
      {row.revisionHabilitada ? <Eye /> : <EyeOff />}
    </IconAction>
  );

  const aside = (
    <ProfileCard
      media={
        <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-orange-50 text-orange-600">
          <ClipboardCheck className="w-5 h-5" />
        </span>
      }
      title={data?.examen.titulo || "Examen"}
      subtitle={data?.examen.tituloFormacion || data?.examen.idFormacion || "Examen"}
      footer={
        <Button
          variant="outline"
          size="sm"
          className="h-8 cursor-pointer"
          onClick={() => navigate(`/exams/${encodeURIComponent(examenId)}/edit`)}
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Editar examen
        </Button>
      }
    >
      <form onSubmit={handleSaveDefault} className="space-y-2 border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Intentos para todos</p>
          <p className="text-xs text-gray-500">
            Se aplica a los alumnos sin un límite personalizado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            step={1}
            aria-label="Intentos para todos los alumnos"
            className="h-8 w-20 tabular-nums"
            value={defaultDraft}
            disabled={savingDefault}
            onChange={(e) => setDefaultDraft(e.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 cursor-pointer"
            disabled={savingDefault || !defaultDirty}
          >
            {savingDefault ? <Loader className="w-3.5 h-3.5 animate-spin" /> : "Guardar"}
          </Button>
        </div>
      </form>
      <div className="space-y-0.5 border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-medium text-gray-900">
          Revisión {permitirRevision ? "permitida" : "desactivada"}
        </p>
        <p className="text-xs text-gray-500">
          {permitirRevision
            ? "Quien aprueba o usa todos sus intentos puede revisar el examen."
            : "Solo pueden revisar los alumnos habilitados manualmente."}{" "}
          Se cambia desde "Editar examen".
        </p>
      </div>
      <StatGrid
        stats={[
          { label: "Alumnos", value: alumnos.length },
          { label: "Rindieron", value: withAttempts },
          { label: "Personalizados", value: customized },
        ]}
      />
    </ProfileCard>
  );

  return (
    <TooltipProvider delayDuration={300}>
    <DetailLayout aside={aside}>
      <SectionCard
        title="Intentos por alumno"
        description="Ajustá el máximo de un alumno en particular; el resto usa el límite general"
        action={
          <div className="relative w-44 sm:w-60">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar alumno..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        }
      >
        <div className={listLoadingClass(loading)} aria-busy={loading}>
          <ListLoadingPill loading={loading} label="Actualizando alumnos…" />
          {alumnos.length === 0 ? (
            <SectionEmpty icon={<Users />}>
              No hay alumnos asignados a la formación de este examen
              {searchQuery ? " con ese criterio de búsqueda" : ""}.
            </SectionEmpty>
          ) : (
            <>
              {/* ── Vista mobile: filas compactas ── */}
              <ul role="list" className="block md:hidden divide-y divide-gray-100">
                {alumnos.map((row) => (
                  <li key={row.idAlumno} className="space-y-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{row.nombreAlumno}</p>
                        <p className="truncate text-xs text-gray-500">{row.emailAlumno || "—"}</p>
                      </div>
                      {row.esOverride && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {renderUsage(row)}
                      <div className="flex items-center gap-0.5">
                        {renderRevisionToggle(row)}
                        {renderMaxEditor(row)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* ── Vista desktop: tabla ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <PlainHeader className="pl-5 pr-3">Alumno</PlainHeader>
                      <PlainHeader>Email</PlainHeader>
                      <PlainHeader>Intentos</PlainHeader>
                      <PlainHeader>Límite</PlainHeader>
                      <PlainHeader>Revisión</PlainHeader>
                      <PlainHeader align="right" className="pl-3 pr-5">
                        Máximo
                      </PlainHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alumnos.map((row) => (
                      <tr key={row.idAlumno} className="hover:bg-gray-50 transition-colors">
                        <td className="pl-5 pr-3 py-1.5 font-medium text-gray-900 whitespace-nowrap">
                          {row.nombreAlumno}
                        </td>
                        <td className="px-3 py-1.5 text-gray-600">
                          <span className="line-clamp-1">{row.emailAlumno || "—"}</span>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{renderUsage(row)}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          {row.esOverride ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Personalizado
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">General ({intentosDefault})</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {renderRevisionToggle(row)}
                            <span
                              className={`text-xs ${row.revisionHabilitada ? "text-emerald-700" : "text-gray-400"}`}
                            >
                              {row.revisionHabilitada ? "Habilitada" : "Automática"}
                            </span>
                          </div>
                        </td>
                        <td className="pl-3 pr-5 py-1.5 whitespace-nowrap">{renderMaxEditor(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </DetailLayout>
    </TooltipProvider>
  );
}
