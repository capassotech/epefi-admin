// src/service/courses.ts
import { auth } from "@/firebase";
import axios from "axios";
import type { Subject } from "@/types/types";

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


export const CoursesAPI = {
  // Cursos CRUD
  getAll: async () => {
    const res = await api.get('/cursos');
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/cursos/${id}`);
    return res.data;
  },

  create: async (data: Record<string, unknown>) => {
    const res = await api.post('/cursos', data);
    return res.data;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put(`/cursos/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/cursos/${id}`);
    return { success: true };
  },

  // Materias CRUD
  getMateriaById: async (id: string) => {
    const res = await api.get(`/materias/${id}`);
    return res.data;
  },

  getMateriasByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    const materias: Subject[] = [];

    try {
      for (const id of ids) {
        const res = await api.get(`/materias/${id}`);
        materias.push(res.data);
      }
      return materias;

    } catch (error) {
      console.error("Error al cargar materias:", error);
      throw new Error("Error al cargar materias");
    }
  },

  getMaterias: async () => {
    const res = await api.get('/materias');
    return res.data;
  },

  createMateria: async (data: Omit<Subject, 'id'>) => {
    try {
      const res = await api.post('/materias', data);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.error || axiosError.message || "Error al crear materia";
      throw new Error(errorMessage);
    }
  },

  updateMateria: async (id: string, data: Subject) => {
    try {
      const res = await api.put(`/materias/${id}`, data);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.message || axiosError.message || "Error al actualizar materia";
      throw new Error(errorMessage);
    }
  },

  deleteMateria: async (id: string) => {
    await api.delete(`/materias/${id}`);
    return { success: true };
  },

  // Módulos CRUD
  getModuleById: async (id: string) => {
    try {
      const res = await api.get(`/modulos/${id}`);
      return res.data;
    } catch {
      throw new Error(`Módulo no encontrado (ID: ${id})`);
    }
  },

  getModulesByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];

    const promises = ids.map(id =>
      CoursesAPI.getModuleById(id).catch(err => {
        console.warn(`⚠️ Módulo con ID ${id} no pudo cargarse:`, err.message);
        return null; 
      })
    );

    const modules = await Promise.all(promises);
    return modules.filter((modulo): modulo is NonNullable<typeof modulo> => modulo !== null);
  },

  createModule: async (data: Record<string, unknown>) => {
    try {
      const res = await api.post('/modulos', data);
      console.log(res.data);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.message || axiosError.message || "Error al crear módulo";
      throw new Error(errorMessage);
    }
  },

  updateModule: async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await api.put(`/modulos/${id}`, data);
      return res.data;
    } catch {
      throw new Error("Error al actualizar módulo");
    }
  },

  deleteModule: async (id: string) => {
    try {
      await api.delete(`/modulos/${id}`);
      return { success: true };
    } catch {
      throw new Error("Error al eliminar módulo");
    }
  },
};