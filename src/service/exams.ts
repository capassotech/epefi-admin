import { auth } from "@/firebase";
import type { Examen, ExamenCreatePayload } from "@/types/types";
import axios from "axios";

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

export const ExamsAPI = {
  getAll: async (): Promise<Examen[]> => {
    try {
      const res = await api.get<Examen[]>("/examenes");
      return res.data;
    } catch (error: unknown) {
      throw new Error(getAxiosErrorMessage(error, "Error al obtener exámenes"));
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
};
