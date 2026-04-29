// src/service/students.ts
import { auth } from "@/firebase";
import type { CreateUserFormData } from "@/types/types";
import { extractAxiosResponseDataMessage } from "@/utils/errorMessages";
import axios from "axios";


const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com").trim();

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
        "Error al obtener usuario";
      throw new Error(errorMessage);
    }
  },

  createStudent: async (user: CreateUserFormData) => {
    try {
      const res = await api.post("/usuarios", user);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
        message?: string;
      };
      const bodyMsg = extractAxiosResponseDataMessage(axiosError.response?.data);
      const errorMessage =
        bodyMsg || axiosError.message || "Error al crear usuario";
      const err = new Error(errorMessage) as Error & { httpStatus?: number };
      err.httpStatus = axiosError.response?.status;
      throw err;
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

  updateStudent: async (id: string, userData: Partial<CreateUserFormData & { uid?: string }>) => {
    try {
      // Limpiar el ID de espacios en blanco
      const cleanId = id?.trim();
      
      // Usar el uid del userData si está disponible y es diferente, ya que puede ser más preciso
      // Pero priorizar el ID pasado como parámetro si el uid no está presente
      const finalId = (userData?.uid && userData.uid.trim() !== '') ? userData.uid.trim() : cleanId;
      
      console.log('🔄 Actualizando estudiante:', { 
        originalId: id,
        cleanId,
        finalId,
        userDataUid: userData?.uid,
        idType: typeof finalId,
        idLength: finalId?.length,
        userDataKeys: Object.keys(userData),
        cursosAsignados: userData.cursos_asignados?.length || 0,
        fullUrl: `/usuarios/${encodeURIComponent(finalId)}`
      });
      
      if (!finalId || finalId === '') {
        throw new Error('El ID del estudiante es requerido');
      }

      // Codificar el ID para la URL por si tiene caracteres especiales
      const encodedId = encodeURIComponent(finalId);
      const res = await api.put(`/usuarios/${encodedId}`, userData);
      console.log('✅ Estudiante actualizado exitosamente:', res.data);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { 
          data?: { error?: string; message?: string; tipo?: string; cursoId?: string }; 
          status?: number;
          config?: {
            url?: string;
            baseURL?: string;
          };
        };
        config?: {
          url?: string;
          baseURL?: string;
        };
        message?: string;
      };
      
      // Manejar errores específicos
      if (axiosError.response?.status === 404) {
        const errorMsg = axiosError.response?.data?.error || 'Usuario no encontrado';
        const finalId = (userData?.uid && userData.uid.trim() !== '') ? userData.uid.trim() : id?.trim();
        const config = axiosError.config || axiosError.response?.config;
        console.error('❌ Usuario no encontrado:', { 
          originalId: id,
          finalId,
          userDataUid: userData?.uid,
          error: errorMsg,
          url: config?.url,
          fullUrl: config?.baseURL ? `${config.baseURL}${config.url || ''}` : undefined
        });
        throw new Error(`El estudiante no fue encontrado en el sistema. ID usado: ${finalId}. Por favor, verifica que el usuario existe. (${errorMsg})`);
      }
      
      // Manejar errores de validación (400) - como curso no encontrado
      if (axiosError.response?.status === 400) {
        const errorData = axiosError.response?.data;
        const errorMsg = errorData?.error || 'Error de validación';
        const errorType = errorData?.tipo;
        const cursoId = errorData?.cursoId;
        
        console.error('❌ Error de validación:', { 
          error: errorMsg,
          tipo: errorType,
          cursoId: cursoId,
          errorData: errorData
        });
        
        if (errorType === 'curso_no_encontrado') {
          throw new Error(`No se pudo asignar el curso. El curso con ID "${cursoId}" no existe en el sistema. Por favor, verifica que todos los cursos seleccionados existen.`);
        }
        
        throw new Error(errorMsg);
      }
      
      if (axiosError.response?.status === 403) {
        throw new Error('No tienes permisos para actualizar este estudiante');
      }

      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Error al actualizar estudiante";
      
      console.error('❌ Error al actualizar estudiante:', { id, error: errorMessage });
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

  // Obtener el estado de habilitación de módulos para un estudiante
  getStudentModules: async (id: string) => {
    try {
      const res = await api.get(`/usuarios/${id}/modulos`);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al obtener módulos del estudiante";
      throw new Error(errorMessage);
    }
  },

  // Actualizar el estado de habilitación de un módulo para un estudiante
  updateStudentModule: async (studentId: string, moduleId: string, enabled: boolean) => {
    try {
      const res = await api.patch(`/usuarios/${studentId}/modulos/${moduleId}`, { enabled });
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al actualizar módulo del estudiante";
      throw new Error(errorMessage);
    }
  },

  // Obtener el progreso del estudiante
  getStudentProgress: async (id: string) => {
    try {
      const res = await api.get(`/usuarios/${id}/progreso`);
      return res.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Error al obtener progreso del estudiante";
      throw new Error(errorMessage);
    }
  },
};
