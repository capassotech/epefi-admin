// src/service/courses.ts
import { auth } from "@/firebase";
import axios from "axios";
import { type Subject, type Module } from "@/types/types";
import { storage } from "../../config/firebase-client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API_URL =
  (import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com").trim();

// Debug: Log de la configuración
console.log('🔧 Configuración API:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_URL_FINAL: API_URL,
  baseURL: `${API_URL}/api`
});

// Validar que la URL base no esté vacía
if (!API_URL || API_URL.trim() === '') {
  console.error('❌ VITE_API_BASE_URL está vacío o no está definido');
  throw new Error('La URL base de la API no está configurada correctamente');
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

// Interceptor de respuesta para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No loguear errores 404 (recursos no encontrados) ya que se manejan en el código
    if (error.response?.status === 404) {
      // Solo loguear como debug, no como error
      return Promise.reject(error);
    }
    
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('❌ Error de respuesta:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url
      });
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('❌ Error de red - No se recibió respuesta:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url
      });
    } else {
      // Algo pasó al configurar la petición
      console.error('❌ Error al configurar la petición:', error.message);
    }
    return Promise.reject(error);
  }
);

export const CoursesAPI = {
  // Cursos CRUD
  getAll: async () => {
    const res = await api.get("/cursos");
    return res.data;
  },

  getById: async (id: string) => {
    try {
      const res = await api.get(`/cursos/${id}`);
      return res.data;
    } catch (error: unknown) {
      // Manejar errores 404 silenciosamente (recursos no encontrados)
      const axiosError = error as { response?: { status?: number }; request?: any };
      if (axiosError.response?.status === 404) {
        // Retornar null en lugar de lanzar error para evitar logs en consola
        // El código que llama puede verificar si el resultado es null
        return null;
      }
      // Para otros errores, loguear y re-lanzar
      console.error('Error al obtener curso:', error);
      throw error;
    }
  },

  create: async (data: Record<string, unknown>) => {
    const res = await api.post("/cursos", data);
    return res.data;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put(`/cursos/${id}`, data);
    return res.data;
  },

  toggleStatus: async (id: string) => {
    try {
      const res = await api.patch(`/cursos/${id}/toggle-status`);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { 
          data?: { message?: string; error?: string }; 
          status?: number;
        };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al alternar el estado del curso";
      throw new Error(errorMessage);
    }
  },

  delete: async (id: string) => {
    try {
      console.log("Eliminando curso con ID:", id);
      const response = await api.delete(`/cursos/${id}`);
      console.log("Respuesta de eliminación exitosa:", response.status);
      return { success: true };
    } catch (error: unknown) {
      console.error("Error en delete curso:", error);
      const axiosError = error as {
        response?: { 
          data?: { message?: string; error?: string }; 
          status?: number;
        };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al eliminar el curso";
      throw new Error(errorMessage);
    }
  },

  uploadImage: async (
    image: File,
    opts?: { directory?: string; filename?: string; contentType?: string }
  ) => {
    if (!image || !(image instanceof File)) {
      throw new Error("El archivo de imagen es requerido");
    }

    const directory = (opts?.directory ?? "Imagenes/Formaciones").replace(/\/+$/g, "");
    const filename = opts?.filename ?? image.name;
    const objectPath = `${directory}/${filename}`;

    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, image, { contentType: image.type || "image/jpeg" });
    const url = await getDownloadURL(storageRef);
    return { url, path: objectPath };
  },

  uploadPDF: async (
    pdf: File,
    opts?: { directory?: string; filename?: string }
  ) => {
    if (!pdf || !(pdf instanceof File)) {
      throw new Error("El archivo PDF es requerido");
    }

    // Validar tipo de archivo
    if (pdf.type !== "application/pdf") {
      throw new Error("El archivo debe ser un PDF");
    }

    // Validar tamaño (10 MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (pdf.size > maxSize) {
      throw new Error("El archivo PDF no puede exceder 10 MB");
    }

    const directory = (opts?.directory ?? "Documentos/Cursos").replace(/\/+$/g, "");
    const filename = opts?.filename ?? pdf.name;
    const objectPath = `${directory}/${filename}`;

    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, pdf, { contentType: "application/pdf" });
    const url = await getDownloadURL(storageRef);
    return { url, path: objectPath };
  },

  // Materias CRUD
  getMateriaById: async (id: string, options?: { skipCache?: boolean }) => {
    const res = await api.get(`/materias/${id}`, {
      params: options?.skipCache ? { _: Date.now() } : undefined,
    });
    return res.data;
  },

  /**
   * Estado GLOBAL habilitado de cada módulo por materia.
   * Requiere autenticación como admin.
   */
  getModulosHabilitadosEstado: async (materiaId: string): Promise<Record<string, boolean>> => {
    const res = await api.get<{ modulos_habilitados_estado?: Record<string, boolean> }>(
      `/materias/${materiaId}/modulos-habilitados-estado`
    );
    const estado = res.data?.modulos_habilitados_estado;
    if (estado !== null && typeof estado === "object" && !Array.isArray(estado)) {
      return estado;
    }
    throw new Error("La API devolvió un formato inválido para el estado de módulos");
  },

  /**
   * Obtiene los estudiantes que NO tienen un módulo habilitado.
   */
  getModuloExcepciones: async (
    materiaId: string
  ): Promise<{ excepciones: Record<string, Array<{ id: string; nombre: string }>>; totalStudentsWithMateria: number }> => {
    const res = await api.get<{
      excepciones?: Record<string, Array<{ id: string; nombre: string }>>;
      totalStudentsWithMateria?: number;
    }>(`/materias/${materiaId}/modulos-excepciones`);
    return {
      excepciones: res.data?.excepciones ?? {},
      totalStudentsWithMateria: res.data?.totalStudentsWithMateria ?? 0,
    };
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
    const res = await api.get("/materias");
    return res.data;
  },

  createMateria: async (data: Omit<Subject, "id">) => {
    try {
      const res = await api.post("/materias", data);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al crear materia";
      throw new Error(errorMessage);
    }
  },

  updateMateria: async (id: string, data: Subject) => {
    try {
      const res = await api.put(`/materias/${id}`, data);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Error al actualizar materia";
      throw new Error(errorMessage);
    }
  },

  toggleMateriaStatus: async (id: string) => {
    try {
      const res = await api.patch(`/materias/${id}/toggle-status`);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { 
          data?: { message?: string; error?: string }; 
          status?: number;
        };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al alternar el estado de la materia";
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

    const promises = ids.map((id) =>
      CoursesAPI.getModuleById(id).catch((err) => {
        console.warn(`⚠️ Módulo con ID ${id} no pudo cargarse:`, err.message);
        return null;
      })
    );

    const modules = await Promise.all(promises);
    return modules.filter(
      (modulo): modulo is NonNullable<typeof modulo> => modulo !== null
    );
  },

  createModule: async (data: Omit<Module, "id">) => {
    try {
      // Preparar datos: asegurar que tipo_contenido sea "pdf" en minúsculas (el backend lo requiere así)
      // y que todos los campos tengan valores válidos
      const cleanedData: any = {
        titulo: data.titulo?.trim() || "",
        descripcion: data.descripcion?.trim() || "",
        id_materia: data.id_materia?.trim() || "",
        tipo_contenido: "pdf", // El backend espera minúsculas: "pdf", "video", etc.
        bibliografia: data.bibliografia?.trim() || "",
        url_miniatura: data.url_miniatura?.trim() || "",
        url_archivo: data.url_archivo?.trim() || "",
        url_video: Array.isArray(data.url_video) ? data.url_video : [],
      };
      
      // Eliminar campos vacíos que podrían causar problemas
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === "" && key !== "titulo" && key !== "descripcion" && key !== "id_materia" && key !== "tipo_contenido" && key !== "url_archivo") {
          delete cleanedData[key];
        }
      });
      
      console.log("Enviando datos al backend:", JSON.stringify(cleanedData, null, 2));
      const res = await api.post("/modulos", cleanedData);
      console.log("Respuesta del backend:", res.data);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { 
          data?: { 
            message?: string;
            error?: string;
            errors?: any;
          };
          status?: number;
        };
        message?: string;
      };
      
      console.error("Error completo al crear módulo:", axiosError);
      console.error("Datos enviados:", JSON.stringify(data, null, 2));
      console.error("Respuesta del servidor:", JSON.stringify(axiosError.response?.data, null, 2));
      console.error("Status code:", axiosError.response?.status);
      
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        JSON.stringify(axiosError.response?.data?.errors) ||
        axiosError.message ||
        "Error al crear módulo";
      throw new Error(errorMessage);
    }
  },

  updateModule: async (id: string, data: Module) => {
    try {
      const res = await api.put(`/modulos/${id}`, data);
      return res.data;
    } catch {
      throw new Error("Error al actualizar módulo");
    }
  },

  deleteModule: async (id: string, id_materia: string) => {
    try {
      await api.delete(`/modulos/${id}`, { data: { id_materia } });
      return { success: true };
    } catch {
      throw new Error("Error al eliminar módulo");
    }
  },

  /**
   * Habilita o deshabilita un módulo GLOBALMENTE para una materia.
   * Solo debe actualizar el estado global. NO debe crear registros individuales por usuario.
   * Los usuarios nuevos heredan este estado automáticamente.
   * Ver docs/BACKEND_ESPEC_MODULOS_HABILITACION.md
   */
  toggleModuleForAllStudents: async (materiaId: string, moduleId: string, enabled: boolean) => {
    try {
      const res = await api.patch(`/materias/${materiaId}/modulos/toggle`, {
        moduleId,
        enabled,
      });
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { 
          data?: { message?: string; error?: string }; 
          status?: number;
        };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al actualizar módulos de manera grupal";
      throw new Error(errorMessage);
    }
  },
};
