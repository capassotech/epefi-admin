export type ProductType = "ON_DEMAND" | "ASYNC" | "VIVO" | "EBOOK";

// Tipo para Timestamp de Firestore
export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface Module {
  id: string;
  titulo: string;
  descripcion: string;
  id_materia: string;
  tipo_contenido: "VIDEO" | "PDF" | "QUIZ" | "DOCX" | "IMAGE";
  bibliografia: string;
  url_miniatura: string;
  url_contenido: string;
}

export interface Subject {
  id: string;
  id_cursos: string[];
  modulos: string[];
  nombre: string;
}

export interface Course {
  id: string;
  titulo: string;
  descripcion: string;
  image: string;
  estado: "activo" | "inactivo";
  materias: string[];
  precio: number;
}

export interface Student {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  role: {
    admin: boolean;
    student: boolean;
  };
  fechaRegistro: FirestoreTimestamp;
  fechaActualizacion?: FirestoreTimestamp;
  fechaUltimoAcceso?: FirestoreTimestamp;
  activo: boolean;
  emailVerificado?: boolean;
  cursos_asignados?: string[] | string;
  fechaCreacion?: FirestoreTimestamp;
}

// ✅ NUEVA INTERFAZ USER
export interface User {
  id: string;
  uid: string;
  email: string;
  name?: string;
  nombre?: string;
  apellido?: string;
  photoURL?: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  fechaRegistro?: FirestoreTimestamp | string;
  fechaActualizacion?: FirestoreTimestamp | string;
}

export interface DashboardStats {
  totalStudents: number;
  popularProducts: Subject[];
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  activeUsers: number;
}

export interface ContentItemProps {
  content: Module;
  onToggleComplete: (contentId: string) => void;
  onContentClick: (content: Module) => void;
}

export interface ModuleFormData {
  id: string;
  titulo: string;
  descripcion: string;
  contents: ModuleFormData[];
}

export interface ContentItemFormData {
  id?: string;
  type: "VIDEO" | "PDF" | "QUIZ" | "DOCX" | "IMAGE";
  title: string;
  description: string;
  url: string;
  order: number;
  thumbnail?: string;
  duration?: string;
  completed: boolean;
  topics?: string;
}

export interface CourseProgress {
  courseId: string;
  studentId: string;
  completedModules: string[];
  completedContents: string[];
  totalProgress: number;
  lastAccessedContent?: string;
  lastAccessedDate: string;
}

export interface ContentStats {
  contentId: string;
  viewCount: number;
  completionRate: number;
  averageTimeSpent: number;
  lastViewed: string;
}

export interface ModuleStats {
  moduleId: string;
  contents: ContentStats[];
  completionRate: number;
  averageTimeToComplete: number;
}

export interface ContentFilter {
  type?: Module["tipo_contenido"];
  completed?: boolean;
  topics?: string[];
  duration?: {
    min?: number;
    max?: number;
  };
}

export interface CourseFilter {
  type?: ProductType;
  level?: string;
  profesor?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  isActive?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni: string;
  aceptaTerminos: boolean;
}

export interface CreateUserFormData extends RegisterData {
  confirmPassword: string;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
}

// ✅ UserProfile corregido para coincidir con el backend
export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  role: {
    admin: boolean;
    student: boolean;
  };
  fechaRegistro: FirestoreTimestamp | string; // Acepta ambos formatos
  fechaActualizacion?: FirestoreTimestamp | string;
  fechaUltimoAcceso?: FirestoreTimestamp | string;
  aceptaTerminos: boolean;
  emailVerificado?: boolean;
  activo?: boolean;
  ruta_aprendizaje?: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: UserProfile; // ✅ Usar UserProfile completo
  customToken?: string;
}
