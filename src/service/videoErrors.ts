import { auth } from "@/firebase";
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
      config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
    }
  } catch (error) {
    console.error("Error getting ID token:", error);
  }
  return config;
});

/** Una vez que un alumno no pudo reproducir el video. */
export interface VideoErrorOccurrence {
  fecha: string;
  uid: string;
  email: string | null;
  /** `MediaError.code`: 2 red, 3 no se pudo decodificar, 4 formato o URL no soportados */
  codigo: number | null;
  mensaje: string | null;
  dispositivo: string | null;
  conexion: string | null;
}

/** Un video con fallas registradas (un registro por URL). */
export interface VideoError {
  id: string;
  url: string;
  idCurso: string | null;
  idModulo: string | null;
  material: string | null;
  total: number;
  ultimaFecha: string;
  ultimas: VideoErrorOccurrence[];
}

const errorMessage = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { error?: string } } };
  return e.response?.data?.error || fallback;
};

export const VideoErrorsAPI = {
  async getAll(): Promise<VideoError[]> {
    try {
      const { data } = await api.get<{ data: VideoError[] }>("/errores-video");
      return data.data ?? [];
    } catch (error) {
      throw new Error(errorMessage(error, "No se pudieron cargar los errores de video"));
    }
  },

  async resolve(id: string): Promise<void> {
    try {
      await api.delete(`/errores-video/${id}`);
    } catch (error) {
      throw new Error(errorMessage(error, "No se pudo marcar como resuelto"));
    }
  },
};
