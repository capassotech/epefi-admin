import { auth } from "@/firebase";
import type { Examen, ExamenCreatePayload } from "@/types/types";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase-client";

const API_URL =
  (import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com").trim();

if (!API_URL || API_URL.trim() === "") {
  throw new Error("La URL base de la API no está configurada correctamente");
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
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

export type ExamsListQuery = {
  search?: string;
  sortBy?: "date" | "title" | "fechaCreacion" | "titulo";
  sortOrder?: "asc" | "desc";
  idFormacion?: string;
  page?: number;
  limit?: number;
};

function cleanQueryParams(
  input?: Record<string, string | number | undefined>
): Record<string, string | number> | undefined {
  if (!input) return undefined;
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== "") out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const MAX_QUESTION_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export const ExamsAPI = {
  getAll: async (params?: ExamsListQuery) => {
    try {
      const query = cleanQueryParams({
        search: params?.search?.trim() || undefined,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        idFormacion: params?.idFormacion,
        page: params?.page,
        limit: params?.limit,
      });
      const res = await api.get("/examenes", { params: query });
      return res.data;
    } catch (error: unknown) {
      throw new Error(getAxiosErrorMessage(error, "Error al obtener exámenes"));
    }
  },

  getById: async (id: string): Promise<Examen> => {
    try {
      const res = await api.get<Examen>(`/examenes/${encodeURIComponent(id)}`);
      return res.data;
    } catch (error: unknown) {
      throw new Error(getAxiosErrorMessage(error, "Error al obtener examen"));
    }
  },

  create: async (payload: ExamenCreatePayload): Promise<Examen> => {
    try {
      const res = await api.post<Examen>("/examenes", payload);
      return res.data;
    } catch (error: unknown) {
      throw new Error(getAxiosErrorMessage(error, "Error al crear examen"));
    }
  },

  update: async (id: string, payload: ExamenCreatePayload): Promise<Examen> => {
    try {
      const res = await api.put<Examen>(
        `/examenes/${encodeURIComponent(id)}`,
        payload
      );
      return res.data;
    } catch (error: unknown) {
      throw new Error(getAxiosErrorMessage(error, "Error al actualizar examen"));
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/examenes/${encodeURIComponent(id)}`);
    } catch (error: unknown) {
      throw new Error(getAxiosErrorMessage(error, "Error al eliminar examen"));
    }
  },

  /**
   * Sube la imagen de una pregunta a Storage bajo
   * Imagenes/Examenes/{examenId}/{preguntaId}.ext
   */
  uploadQuestionImage: async (
    examenId: string,
    preguntaId: string,
    image: File
  ): Promise<{ url: string; path: string }> => {
    if (!examenId?.trim() || !preguntaId?.trim()) {
      throw new Error("Examen y pregunta son obligatorios para subir la imagen");
    }
    if (!image || !(image instanceof File)) {
      throw new Error("El archivo de imagen es requerido");
    }
    if (image.type && !ALLOWED_IMAGE_TYPES.has(image.type)) {
      throw new Error("Formato de imagen no permitido (JPG, PNG, WEBP o GIF)");
    }
    if (image.size > MAX_QUESTION_IMAGE_BYTES) {
      throw new Error("La imagen no puede superar 5 MB");
    }

    const safeExamen = examenId.replace(/[^\w-]/g, "_");
    const safePregunta = preguntaId.replace(/[^\w-]/g, "_");
    const ext = extensionFromFile(image);
    const objectPath = `Imagenes/Examenes/${safeExamen}/${safePregunta}.${ext}`;
    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, image, {
      contentType: image.type || "image/jpeg",
      customMetadata: {
        examenId,
        preguntaId,
        uploadedAt: new Date().toISOString(),
      },
    });
    const url = await getDownloadURL(storageRef);
    return { url, path: objectPath };
  },
};
