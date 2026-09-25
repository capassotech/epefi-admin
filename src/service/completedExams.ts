import { auth } from "@/firebase";
import type {
  ExamenRealizado,
  ExamenRealizadoDetalle,
  PaginatedResponse,
} from "@/types/types";
import { normalizeAnswerIds } from "@/utils/completedExamDetail";
import { normalizePaginatedResponse } from "@/utils/pagination";
import axios from "axios";

const API_URL =
  (import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com").trim();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      config.headers.Authorization = `Bearer ${idToken}`;
    }
  } catch (error) {
    console.error("Error getting ID token:", error);
  }
  return config;
});

function getAxiosErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return (
    axiosError.response?.data?.error ||
    axiosError.response?.data?.message ||
    axiosError.message ||
    fallback
  );
}

function cleanQueryParams(
  input?: Record<string, string | undefined>
): Record<string, string> | undefined {
  if (!input) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== "") out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeListItem(raw: Record<string, unknown>): ExamenRealizado {
  const nombre = String(raw.nombreAlumno ?? raw.nombre ?? "").trim();
  const apellido = String(raw.apellido ?? raw.apellidoAlumno ?? "").trim();
  const nombreCompleto =
    nombre && apellido
      ? `${nombre} ${apellido}`.trim()
      : nombre || apellido || String(raw.nombreCompleto ?? "").trim();

  return {
    id: String(raw.id ?? ""),
    idUsuario: raw.idUsuario != null ? String(raw.idUsuario) : undefined,
    idAlumno: raw.idAlumno != null ? String(raw.idAlumno) : undefined,
    idExamen: String(raw.idExamen ?? ""),
    idFormacion: String(raw.idFormacion ?? ""),
    nota: Number(raw.nota ?? raw.puntuacion ?? 0),
    aprobado: Boolean(raw.aprobado ?? raw.approved ?? false),
    estado:
      raw.estado === "pendiente_correccion" ||
      raw.estadoCorreccion === "pendiente_correccion"
        ? "pendiente_correccion"
        : raw.estado === "completado" ||
            raw.estadoCorreccion === "completado"
          ? "completado"
          : undefined,
    fechaRealizacion: raw.fechaRealizacion as ExamenRealizado["fechaRealizacion"],
    nombreAlumno: nombreCompleto || undefined,
    nombre: nombre || undefined,
    apellido: apellido || undefined,
    tituloExamen: raw.tituloExamen != null ? String(raw.tituloExamen) : undefined,
    tituloFormacion:
      raw.tituloFormacion != null ? String(raw.tituloFormacion) : undefined,
  };
}

export type CompletedExamsListQuery = {
  idFormacion?: string;
  idExamen?: string;
  idAlumno?: string;
  search?: string;
  estado?: "completado" | "pendiente_correccion";
  page?: number;
  limit?: number;
};

export type CorregirExamenPayload = {
  correcciones: Array<{
    idPregunta: string;
    puntosObtenidos: number;
    comentario?: string;
  }>;
};

export const CompletedExamsAPI = {
  getAll: async (
    params?: CompletedExamsListQuery
  ): Promise<PaginatedResponse<ExamenRealizado>> => {
    try {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      const query = cleanQueryParams({
        idFormacion: params?.idFormacion,
        idExamen: params?.idExamen,
        idAlumno: params?.idAlumno,
        search: params?.search?.trim(),
        estado: params?.estado,
        page: String(page),
        limit: String(limit),
      });
      const res = await api.get<unknown>("/examenes-realizados", { params: query });
      const paginated = normalizePaginatedResponse<Record<string, unknown>>(
        res.data,
        page,
        limit
      );
      return {
        data: paginated.data.map((item) => normalizeListItem(item)),
        pagination: paginated.pagination,
      };
    } catch (error: unknown) {
      throw new Error(
        getAxiosErrorMessage(error, "Error al obtener exámenes realizados")
      );
    }
  },

  getById: async (
    id: string
  ): Promise<ExamenRealizadoDetalle & { _raw: Record<string, unknown> }> => {
    try {
      const res = await api.get<Record<string, unknown>>(
        `/examenes-realizados/${encodeURIComponent(id)}`
      );
      const raw = res.data;
      const base = normalizeListItem(raw);
      const preguntasRaw = raw.preguntas;
      const preguntas = Array.isArray(preguntasRaw)
        ? preguntasRaw.map((p) => {
            const pr = p as Record<string, unknown>;
            const respuestasRaw = pr.respuestas;
            const seleccionadas = normalizeAnswerIds(
              Array.isArray(pr.respuestasSeleccionadas)
                ? pr.respuestasSeleccionadas
                : Array.isArray(pr.idsRespuestasSeleccionadas)
                  ? pr.idsRespuestasSeleccionadas
                  : pr.idRespuesta != null
                    ? [pr.idRespuesta]
                    : []
            );
            return {
              id: String(pr.id ?? pr.idPregunta ?? ""),
              texto: String(pr.texto ?? pr.pregunta ?? ""),
              puntos: typeof pr.puntos === "number" ? pr.puntos : undefined,
              puntosObtenidos:
                typeof pr.puntosObtenidos === "number"
                  ? pr.puntosObtenidos
                  : undefined,
              acertada:
                typeof pr.acertada === "boolean"
                  ? pr.acertada
                  : typeof pr.esCorrecta === "boolean"
                    ? pr.esCorrecta
                    : undefined,
              tipoPregunta:
                pr.tipoPregunta === "desarrollo"
                  ? ("desarrollo" as const)
                  : pr.tipoPregunta === "opcion_multiple"
                    ? ("opcion_multiple" as const)
                    : undefined,
              respuestas: Array.isArray(respuestasRaw)
                ? respuestasRaw.map((r) => {
                    const rr = r as Record<string, unknown>;
                    return {
                      id: String(rr.id ?? ""),
                      texto: String(rr.texto ?? rr.text ?? ""),
                      esCorrecta: Boolean(
                        rr.esCorrecta ?? rr.correcta ?? rr.isCorrect
                      ),
                    };
                  })
                : Array.isArray(pr.opciones)
                  ? (pr.opciones as Record<string, unknown>[]).map((rr) => ({
                      id: String(rr.id ?? ""),
                      texto: String(rr.texto ?? rr.text ?? ""),
                      esCorrecta: Boolean(
                        rr.esCorrecta ?? rr.correcta ?? rr.isCorrect
                      ),
                    }))
                  : [],
              respuestasSeleccionadas: seleccionadas,
              respuestaDesarrollo:
                typeof pr.respuestaDesarrollo === "string"
                  ? pr.respuestaDesarrollo
                  : undefined,
              comentario:
                typeof pr.comentario === "string" ? pr.comentario : undefined,
            };
          })
        : undefined;
      return {
        ...base,
        preguntas,
        intentoNumero:
          raw.intentoNumero != null ? Number(raw.intentoNumero) : undefined,
        totalIntentos:
          raw.totalIntentos != null ? Number(raw.totalIntentos) : undefined,
        porcentajeAciertos:
          raw.porcentajeAciertos != null
            ? Number(raw.porcentajeAciertos)
            : undefined,
        puntosObtenidos:
          raw.puntosObtenidos != null ? Number(raw.puntosObtenidos) : undefined,
        _raw: raw,
      };
    } catch (error: unknown) {
      throw new Error(
        getAxiosErrorMessage(error, "Error al obtener detalle del examen realizado")
      );
    }
  },

  corregir: async (
    id: string,
    payload: CorregirExamenPayload
  ): Promise<ExamenRealizadoDetalle> => {
    try {
      const res = await api.post<{
        message?: string;
        resultado?: ExamenRealizadoDetalle;
      }>(`/examenes-realizados/${encodeURIComponent(id)}/corregir`, payload);
      if (res.data?.resultado) return res.data.resultado;
      throw new Error("Respuesta inválida al corregir el examen");
    } catch (error: unknown) {
      throw new Error(
        getAxiosErrorMessage(error, "Error al corregir el examen")
      );
    }
  },
};
