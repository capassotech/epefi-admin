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
import { getFirebaseErrorMessage } from "../utils/errorMessages";

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
    let response: any = null;
    
    try {
      response = await api.post("/auth/register", userData);

      // Intentar usar el customToken si está disponible, pero no fallar si no funciona
      if (response.data.customToken) {
        try {
          await signInWithCustomToken(auth, response.data.customToken);
          console.log("✅ Autenticado con customToken");
        } catch (firebaseError: any) {
          console.warn("⚠️ Error al autenticar con customToken:", firebaseError.code);
          // Si el customToken falla pero el usuario fue creado en el backend, continuar
          // El usuario podrá hacer login después con email/password
          if (firebaseError.code === "auth/custom-token-mismatch" || 
              firebaseError.code === "auth/invalid-custom-token") {
            console.log("ℹ️ El usuario fue creado en el backend, pero el customToken no es válido.");
            console.log("ℹ️ El usuario podrá iniciar sesión con email/password después.");
            // Retornar éxito parcial
            return {
              user: response.data.user || null,
              message: "Usuario creado exitosamente. Por favor, inicia sesión con tu email y contraseña.",
              customTokenError: true
            } as any;
          } else {
            // Para otros errores de Firebase, relanzar el error
            throw firebaseError;
          }
        }
      }

      // Guardar datos del usuario si están disponibles
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
      // Si el error es del backend (response.data), manejarlo
      if (error.response?.data) {
        const backendError = error.response.data;
        if (backendError.error || backendError.message) {
          const errorMessage = backendError.error || backendError.message;
          throw { ...backendError, message: errorMessage };
        }
        throw backendError;
      }
      
      // Si es un error de Firebase del customToken y tenemos respuesta del backend
      if ((error.code === "auth/custom-token-mismatch" || 
           error.code === "auth/invalid-custom-token") && 
          response?.data) {
        // El usuario fue creado en el backend, pero el customToken falló
        // Retornar éxito parcial para que el usuario pueda hacer login después
        return {
          user: response.data.user || null,
          message: "Usuario creado exitosamente. Por favor, inicia sesión con tu email y contraseña.",
          customTokenError: true
        } as any;
      }
      
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage || "Error de conexión. Verifica tu conexión a internet.");
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
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage);
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
      if (error.response?.data?.error) {
        throw { ...error.response.data, message: error.response.data.error };
      }
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage);
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

      // Si el error viene del backend, mantener su estructura
      if (error.response?.data) {
        // Si el error del backend tiene un mensaje, crear un error con ese mensaje
        const backendError = error.response.data;
        if (backendError.error || backendError.message) {
          const errorMessage = backendError.error || backendError.message;
          throw { ...backendError, message: errorMessage };
        }
        throw backendError;
      }

      // Si es un error de Firebase, usar el helper
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage);
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
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage);
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
      const errorMessage = error.response?.data?.error || getFirebaseErrorMessage(error) || "Error al verificar el usuario";
      throw new Error(errorMessage);
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
      const errorMessage = getFirebaseErrorMessage(error);
      let exists = true;

      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        exists = false;
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
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage || "Error al cambiar contraseña");
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
      const errorMessage = getFirebaseErrorMessage(error);
      throw new Error(errorMessage || "Error al actualizar la contraseña");
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
      const errorMessage = error.response?.data?.error || getFirebaseErrorMessage(error) || "Error al obtener el perfil";
      throw new Error(errorMessage);
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
