// src/lib/api.ts
import { getAuthHeader } from "@/utils/auth";

// ✅ URLs CORREGIDAS — SIN ESPACIOS
const API_URL = "https://inee-backend.onrender.com/api/formaciones";
const MODULES_API_URL = "https://inee-backend.onrender.com/api/modulos";

// const API_URL = "http://localhost:3000/api/formaciones";
// const MODULES_API_URL = "http://localhost:3000/api/modulos";

export const FormacionesAPI = {
  getAll: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al cargar formaciones");
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Formación no encontrada");
    return res.json();
  },

  create: async (data: Record<string, any>) => {
    const headers = {
      "Content-Type": "application/json",
      ...(await getAuthHeader()),
    };
    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear formación");
    return res.json();
  },

  update: async (id: string, data: Record<string, any>) => {
    const headers = {
      "Content-Type": "application/json",
      ...(await getAuthHeader()),
    };
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar formación");
    return res.json();
  },

  delete: async (id: string) => {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Error al eliminar formación");
    return { success: true };
  },

  // OBTENER MÓDULO POR ID
  getModuleById: async (id: string) => {
    const url = `${MODULES_API_URL}/${id}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Módulo no encontrado (ID: ${id})`);
    }
    const data = await res.json();
    return data;
  },

  // OBTENER MÚLTIPLES MÓDULOS POR SUS IDs
  getModulesByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];

    const promises = ids.map(id =>
      FormacionesAPI.getModuleById(id).catch(err => {
        console.warn(`⚠️ Módulo con ID ${id} no pudo cargarse:`, err.message);
        return null; // Devuelve null si falla, luego lo filtramos
      })
    );

    const modules = await Promise.all(promises);
    return modules.filter((modulo): modulo is NonNullable<typeof modulo> => modulo !== null);
  },

  // CREAR MÓDULO
  createModule: async (data: Record<string, any>) => {
    const headers = {
      "Content-Type": "application/json",
      ...(await getAuthHeader()),
    };
    const res = await fetch(MODULES_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { status: res.status, statusText: res.statusText };
      }
      throw new Error(
        errorData.message || errorData.statusText || "Error al crear módulo"
      );
    }

    const result = await res.json();
    return result;
  },

  // ACTUALIZAR MÓDULO
  updateModule: async (id: string, data: Record<string, any>) => {
    const headers = {
      "Content-Type": "application/json",
      ...(await getAuthHeader()),
    };
    const url = `${MODULES_API_URL}/${id}`;
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error("Error al actualizar módulo");
    }
    const result = await res.json();
    return result;
  },

  // ELIMINAR MÓDULO
  deleteModule: async (id: string) => {
    const headers = await getAuthHeader();
    const url = `${MODULES_API_URL}/${id}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error("Error al eliminar módulo");
    }
    return { success: true };
  },
};