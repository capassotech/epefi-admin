import axios from "axios";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCustomToken,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../../config/firebase-client";
import type {
  RegisterData,
  LoginData,
  AuthResponse,
  UserProfile,
} from "../types/types";
import { safeSetItem, safeGetItem, safeRemoveItem } from "../utils/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com";

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

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

        safeSetItem("studentData", studentData);
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

  async googleRegister(
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ): Promise<void> {
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
        role: response.data.user?.role || { admin: false, student: true },
        registrationTime: new Date().toISOString(),
      };

      localStorage.setItem("studentData", JSON.stringify(studentData));

      return response.data;
    } catch (error: any) {
      console.error("Error en googleRegister: ", error.response?.data?.error);
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/login", credentials);

      if (response.data.user) {
        try {
          await this.authenticateWithFirebase(
            credentials.email,
            credentials.password
          );
          console.log("✅ Firebase autenticado");
        } catch (firebaseError) {
          console.warn("⚠️ Error en Firebase, pero backend OK:", firebaseError);
          throw firebaseError;
        }

        const studentData = {
          uid: response.data.user.uid,
          email: response.data.user.email,
          nombre: response.data.user.nombre,
          apellido: response.data.user.apellido,
          dni: response.data.user.dni,
          role: response.data.user.role,
          emailVerificado: response.data.user.emailVerificado || false,
          activo: response.data.user.activo || true,
          loginTime: new Date().toISOString(),
        };

        if (!safeSetItem("studentData", studentData)) {
          console.warn("⚠️ No se pudieron guardar los datos en localStorage debido a falta de espacio");
        } else {
          console.log("💾 Datos guardados:", studentData);
        }
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Error en login:", error);

      if (error.response?.data) {
        throw error.response.data;
      }
      throw new Error(error.message || "Error al iniciar sesión");
    }
  }

  private async authenticateWithFirebase(
    email: string,
    password: string
  ): Promise<void> {
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("✅ Firebase auth exitoso:", userCredential.user.uid);
    } catch (error: any) {
      console.error("❌ Firebase auth falló:", error.code);

      if (error.code === "auth/invalid-credential") {
        throw new Error("Credenciales inválidas");
      }

      if (error.code === "auth/user-not-found") {
        throw new Error("Usuario no encontrado");
      }

      throw new Error("Error al autenticar con Firebase");
    }
  }

  async getUserById(uid: string): Promise<UserProfile> {
    try {
      const response = await api.get(`/auth/user/${uid}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Error al obtener el usuario"
      );
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
      throw new Error(
        error.response?.data?.error || "Error al verificar el usuario"
      );
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await api.get(`/auth/check-email/${email}`);

      await sendPasswordResetEmail(auth, email, {
        url: `${FRONTEND_URL}/recuperar-contrasena`,
      });
    } catch (error: any) {
      const customError = new Error(
        error.response?.data?.error || "Error al enviar email de recuperación"
      );
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

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get("/users/me");

      return response.data.user || response.data;
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

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      safeRemoveItem("studentData");
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
    return safeGetItem("studentData");
  }

  updateStudentDataInStorage(data: any): void {
    const existingData = this.getStudentDataFromStorage() || {};
    const updatedData = { ...existingData, ...data };
    if (!safeSetItem("studentData", updatedData)) {
      console.error("Error al actualizar datos del estudiante: espacio de almacenamiento agotado");
    }
  }
}

const authService = new AuthService();
export default authService;
