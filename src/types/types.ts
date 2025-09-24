export type ProductType = "ON_DEMAND" | "ASYNC" | "VIVO" | "EBOOK";
// src/main.tsx o src/index.tsx
localStorage.setItem("adminToken", "eyJhbGciOiJSUzI1NiIsImtpZCI6ImUzZWU3ZTAyOGUzODg1YTM0NWNlMDcwNTVmODQ2ODYyMjU1YTcwNDYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRmVkZXJpY28gSGVycmVyYSIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9pbmVlLWFkbWluIiwiYXVkIjoiaW5lZS1hZG1pbiIsImF1dGhfdGltZSI6MTc1NzY5OTA2NiwidXNlcl9pZCI6Ilg1R2d6WU9LSmJZODVQcjNFRHEwckhHQ05mbjIiLCJzdWIiOiJYNUdnellPS0piWTg1UHIzRURxMHJIR0NOZm4yIiwiaWF0IjoxNzU3Njk5MDY2LCJleHAiOjE3NTc3MDI2NjYsImVtYWlsIjoiZmVkZS5qdWFuLmhlcnJlcmFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiZmVkZS5qdWFuLmhlcnJlcmFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.K9_9zmqWDfqIjSzM0ir_fG60SA-lAiqtAM_BoNhGGvFw4t1GkwqlUBZyptSwGMu7JCDDHPtq59GP8BRHlliWwVohFFls1tZBcpZty9sTOptuq7J_VyKiCpz-ZJgPKeA-_ulhhTeLb71t-cA3DOJs3h1o5xbKhlctGwBFK--CeZoqN4BOpo3afnQXtc3GdHWsb5bEqUJh-4-pLf6PEX8LTeKVjdBOEoNWXAemx1bexQJQ-_h722DXL3gpxZCMwtMKjP2GP5h_oiIKaomaz5fD7_CbTZWAHUFXLIRrynFqq57mft7WnhcnvJ8MjL-xkQu6VJorT-V53Ve335y8TBUY-g");

export interface Module {
  id: string;
  titulo: string;
  descripcion: string;
  id_materia: string;
  tipo_contenido: 'VIDEO' | 'PDF' | 'QUIZ' | 'DOCX' | 'IMAGE';
  bibliografia: string;
  url_miniatura: string;
  url_contenido: string;
}

export interface Degree {
  id: string;
  id_curso: string;
  modulos: string[];
  nombre: string;
}

export interface Course {
  id: string;
  titulo: string;
  descripcion: string;
  image: string; 
  estado: 'activo' | 'inactivo';
  materias: string[];
  precio: number;
}


export interface Student {
  id: string;
  name: string;
  email: string;
  apellido: string;
  fechaActualizacion: string;
  fechaRegistro: string;
  activo: boolean;
  role: [
    { admin: boolean },
    { student: boolean },
  ]
}
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalProducts: number;
  totalRevenue: number;
  popularProducts: Degree[];
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

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  role: string;
  fechaRegistro: string;
  aceptaTerminos: boolean;
  ruta_aprendizaje: string | null;
}


export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
      uid: string;
      email: string;
      nombre: string;
      apellido: string;
      role: string;
  };
  customToken?: string;
}