import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../config/firebase-client";
import authService from "@/service/authService";
import type { UserProfile } from "../types/types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  googleRegister: (
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ) => Promise<any>;
  googleLogin: () => Promise<any>;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (oobCode: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!firebaseUser && !!user;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔄 Auth state changed:", firebaseUser?.email);
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // ✅ Solo cargar del localStorage
        const storedData = localStorage.getItem("studentData");

        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            console.log("✅ Usuario cargado:", parsedData);
            setUser(parsedData);
          } catch (error) {
            console.error("❌ Error parseando localStorage:", error);
            setUser(null);
          }
        } else {
          console.log("⚠️ No hay datos en localStorage");
          setUser(null);
        }
      } else {
        console.log("👤 No hay usuario autenticado");
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await authService.login({ email, password });

      // Esperar para que se guarde en localStorage
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Cargar del localStorage
      const storedData = localStorage.getItem("studentData");
      if (storedData) {
        const userData = JSON.parse(storedData);
        setUser(userData);
        console.log("✅ Usuario autenticado en context:", userData);
      }

      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);

      const response = await authService.register({
        email: userData.email,
        password: userData.password,
        nombre: userData.firstName,
        apellido: userData.lastName,
        dni: userData.dni,
        aceptaTerminos: userData.acceptTerms,
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      const storedData = localStorage.getItem("studentData");
      if (storedData) {
        setUser(JSON.parse(storedData));
      }

      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const googleRegister = async (
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ) => {
    try {
      setIsLoading(true);

      const response = await authService.googleRegister(
        firstName,
        lastName,
        dni,
        acceptTerms
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      const storedData = localStorage.getItem("studentData");
      if (storedData) {
        setUser(JSON.parse(storedData));
      }

      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const googleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await authService.googleLogin();

      await new Promise((resolve) => setTimeout(resolve, 150));

      const storedData = localStorage.getItem("studentData");
      if (storedData) {
        setUser(JSON.parse(storedData));
      }

      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 Iniciando logout...");
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem("studentData");
      console.log("✅ Logout exitoso");
    } catch (error) {
      console.error("❌ Error durante logout:", error);
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem("studentData");
    }
  };

  const refreshUser = async () => {
    try {
      if (firebaseUser) {
        const storedData = localStorage.getItem("studentData");
        if (storedData) {
          setUser(JSON.parse(storedData));
          console.log("🔄 Usuario refrescado");
        }
      }
    } catch (error) {
      console.error("Error al refrescar usuario:", error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
      console.log("Email de recuperación enviado");
    } catch (error: any) {
      console.error("Error al recuperar contraseña:", error);
      throw error;
    }
  };

  const changePassword = async (oobCode: string, password: string) => {
    try {
      await authService.changePassword(oobCode, password);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    googleRegister,
    googleLogin,
    forgotPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
