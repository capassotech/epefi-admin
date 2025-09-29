import axios from "axios";
import { getAuth, GoogleAuthProvider, signInWithCustomToken, signOut, signInWithPopup, signInWithCredential, sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";
import { auth } from "../../config/firebase-client"
import { RegisterData, LoginData, AuthResponse, UserProfile } from "../types/index";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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

class AuthService {
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/register", userData);

      if (response.data.customToken) {
        await signInWithCustomToken(auth, response.data.customToken);
      }

      if (response.data.user) {
        const studentData = {
          uid: response.data.user.uid,
          email: response.data.user.email,
          nombre: response.data.user.nombre,
          apellido: response.data.user.apellido,
          role: response.data.user.role,
          registrationTime: new Date().toISOString(),
        };

        localStorage.setItem("studentData", JSON.stringify(studentData));
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error("Error de conexión. Verifica tu conexión a internet.");
    }
  }


  async googleLogin() {
    try {
      const googleProvider = new GoogleAuthProvider();
      const auth = getAuth();

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userExists = await this.userExists(user.uid);
      if (!userExists) {
        await this.logout();
        throw new Error("El usuario no está registrado");
      }

      const idToken = await user.getIdToken();
      return { idToken, user };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async googleRegister(firstName: string, lastName: string, dni: string, acceptTerms: boolean): Promise<void> {
    const googleProvider = new GoogleAuthProvider();
    const auth = getAuth();

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    const userExists = await this.userExists(user.uid);
    if (userExists) {
      await this.logout();
      throw new Error("El usuario ya está registrado");
    }

    try {
      const response = await api.post("/auth/google-register", {
        idToken,
        email: user.email,
        nombre: firstName,
        apellido: lastName,
        dni: dni,
        aceptaTerminos: acceptTerms,
      });

      const studentData = {
        uid: user.uid,
        email: user.email,
        nombre: firstName,
        apellido: lastName,
        role: "student",
        registrationTime: new Date().toISOString(),
      };

      localStorage.setItem("studentData", JSON.stringify(studentData));

      return response.data;
    } catch (error: any) {
      console.error("Error en googleLogin: ", error.response?.data?.error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  // Iniciar sesión
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/login", credentials);

      if (response.data.customToken) {
        await signInWithCustomToken(auth, response.data.customToken);
      }

      if (response.data.user) {
        const studentData = {
          uid: response.data.user.uid,
          email: response.data.user.email,
          nombre: response.data.user.nombre,
          apellido: response.data.user.apellido,
          role: response.data.user.role,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem("studentData", JSON.stringify(studentData));
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error("Error de conexión. Verifica tu conexión a internet.");
    }
  }

  async getUserById(uid: string): Promise<UserProfile> {
    try {
      const response = await api.get(`/auth/user/${uid}`);
      console.log(response.data)
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Error al obtener el usuario");
    }
  }

  async userExists(uid: string): Promise<boolean> {
    try {
      await api.get(`/auth/user/${uid}`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      // Si es otro tipo de error (500, 401, etc.), lo lanzamos
      throw new Error(error.response?.data?.error || "Error al verificar el usuario");
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      // Validar si el usuario existe en la db
      await api.get(`/auth/check-email/${email}`);

      const result = await sendPasswordResetEmail(auth, email, {
        url: `${FRONTEND_URL}/recuperar-contrasena`,
      });
      console.log("result", result);
      
    } catch (error: any) {
      const customError = new Error(error.response?.data?.error || "Error al enviar email de recuperación");
      (customError as any).exists = error.response?.data?.exists || false;
      
      throw customError;
    }
  }

  async changePassword(oobCode: string, password: string): Promise<void> {
    try {
      await confirmPasswordReset(auth, oobCode, password);
    } catch (error: any) {
      throw new Error(error.message || "Error al cambiar contraseña");
    }
  }

  // Obtener perfil del usuario
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.logout();
        throw new Error(
          "Sesión expirada. Por favor, inicia sesión nuevamente."
        );
      }
      throw new Error(
        error.response?.data?.error || "Error al obtener el perfil"
      );
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem("studentData");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  async getToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  getStudentDataFromStorage(): any {
    try {
      const studentData = localStorage.getItem("studentData");
      return studentData ? JSON.parse(studentData) : null;
    } catch (error) {
      console.error("Error al obtener datos del estudiante:", error);
      return null;
    }
  }

  updateStudentDataInStorage(data: any): void {
    try {
      const existingData = this.getStudentDataFromStorage();
      const updatedData = { ...existingData, ...data };
      localStorage.setItem("studentData", JSON.stringify(updatedData));
    } catch (error) {
      console.error("Error al actualizar datos del estudiante:", error);
    }
  }
}

const authService = new AuthService();
export default authService;
