import axios from "axios";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCustomToken,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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
      // Intentar verificar el email en el backend si el endpoint existe
      try {
        await api.get(`/auth/check-email/${email}`);
      } catch (checkError: any) {
        // Si el endpoint no existe (404) o hay otro error, continuamos con Firebase
        // Firebase validará si el email existe
        if (checkError.response?.status !== 404) {
          // Si es un error diferente a 404, podría ser que el email no existe
          const customError = new Error(
            checkError.response?.data?.error || "El email no está registrado"
          );
          (customError as any).exists = checkError.response?.data?.exists || false;
          throw customError;
        }
        // Si es 404, el endpoint no existe, continuamos con Firebase
      }

      // Enviar email de recuperación a través de Firebase
      await sendPasswordResetEmail(auth, email, {
        url: `${FRONTEND_URL}/recuperar-contrasena`,
      });
    } catch (error: any) {
      // Si el error ya es un Error personalizado, lo relanzamos
      if (error.message && error.exists !== undefined) {
        throw error;
      }
      
      // Manejar errores de Firebase
      let errorMessage = "Error al enviar email de recuperación";
      let exists = true;

      if (error.code === "auth/user-not-found") {
        errorMessage = "Este email no está registrado";
        exists = false;
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El formato del email es inválido";
        exists = false;
      } else if (error.message) {
        errorMessage = error.message;
      }

      const customError = new Error(errorMessage);
      (customError as any).exists = exists;
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

  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No hay usuario autenticado");
      }

      // Reautenticar con la contraseña actual
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Actualizar la contraseña
      await updatePassword(user, newPassword);
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        throw new Error("La contraseña actual es incorrecta");
      } else if (error.code === "auth/weak-password") {
        throw new Error("La nueva contraseña es muy débil");
      } else if (error.code === "auth/requires-recent-login") {
        throw new Error("Por favor, vuelve a iniciar sesión antes de cambiar tu contraseña");
      }
      throw new Error(error.message || "Error al actualizar la contraseña");
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
