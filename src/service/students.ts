// src/service/students.ts
import { auth } from "@/firebase";
import type { CreateUserFormData } from "@/types/types";
import axios from "axios";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

export const StudentsAPI = {
  getAll: async () => {
    try {
      const res = await api.get("/usuarios");
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al obtener estudiantes";
      throw new Error(errorMessage);
    }
  },

  getById: async (id: string) => {
    try {
      const res = await api.get(`/usuarios/${id}`);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al obtener estudiante";
      throw new Error(errorMessage);
    }
  },

  createStudent: async (user: CreateUserFormData) => {
    try {
      const res = await api.post("/usuarios", user);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.error || axiosError.message || "Error al crear estudiante";
      throw new Error(errorMessage);
    }
  },

  getCount: async () => {
    try {
      const res = await api.get("/usuarios");
      return res.data.length || 0;
    } catch (error) {
      console.error("Error getting students count:", error);
      return 0;
    }
  },

  updateStudent: async (id: string, userData: Partial<CreateUserFormData>) => {
    try {
      const res = await api.put(`/usuarios/${id}`, userData);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al actualizar estudiante";
      throw new Error(errorMessage);
    }
  },

  delete: async (id: string) => {
    try {
      await api.delete(`/usuarios/${id}`);
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al eliminar estudiante";
      throw new Error(errorMessage);
    }
  },
};
