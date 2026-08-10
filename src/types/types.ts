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
  tipo_contenido: "video" | "pdf" | "imagen" | "contenido_extra" | "evaluacion";
  bibliografia: string;
  url_miniatura: string;
  url_archivo: string;
  url_video: string[];
  /** Nombres personalizados para archivos, separados por ||| en el mismo orden que url_archivo */
  nombres_archivos?: string;
  /** Nombres personalizados para videos, separados por ||| en el mismo orden que url_video */
  nombres_videos?: string;
}

export interface Subject {
  id: string;
  id_cursos: string[];
  modulos: string[];
  nombre: string;
  imagen?: string;
  activo?: boolean;
  estado?: "activo" | "inactivo"; // Mantener para compatibilidad, pero usar activo del backend
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
  estado: "activo" | "inactivo";
  materias: string[];
  precio: number;
  fechaInicioDictado?: string; // Formato: YYYY-MM-DD
  fechaFinDictado?: string; // Formato: YYYY-MM-DD
  planDeEstudiosUrl?: string;
  fechasDeExamenesUrl?: string;
  planDeEstudiosActualizado?: string;
  fechasDeExamenesActualizado?: string;
}

export interface StudentDB {
  id: string;
  uid?: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  role: {
    admin: boolean;
    student: boolean;
  };
  emailVerificado: boolean;
  cursos_asignados: string[];
  activo?: boolean;
  fechaRegistro: FirestoreTimestamp;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  apellido: string;
  fechaActualizacion: string;
  fechaRegistro: string;
  activo: boolean;
  role: Array<{
    admin?: boolean;
    student?: boolean;
  }>;
}


export interface DashboardStats {
  totalStudents: number;
  popularProducts: Course[];
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  activeUsers: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
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
  type: "video" | "pdf" | "evaluacion" | "imagen" | "contenido_extra";
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

export interface CreateUserResponse {
  success: boolean;
  message: string;
  /** true si el backend indica que el email ya está en uso (crear usuario). */
  emailAlreadyInUse?: boolean;
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


// Este es el type del Student
export interface CreateUserFormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  dni: string;
  role: {
    admin: boolean;
    student: boolean;
  };
  emailVerificado: boolean;
  cursos_asignados: string[];
  activo?: boolean;
}

export interface ExamenRespuesta {
  id: string;
  texto: string;
  esCorrecta: boolean;
}

export interface ExamenPregunta {
  id: string;
  texto: string;
  puntos?: number;
  respuestas: ExamenRespuesta[];
}

export interface ExamenCreatePayload {
  titulo: string;
  idFormacion: string;
  preguntas: ExamenPregunta[];
}

export interface Examen extends ExamenCreatePayload {
  id: string;
}

/** Registro en colección examenes_realizados (listado admin). */
export interface ExamenRealizado {
  id: string;
  idUsuario?: string;
  idAlumno?: string;
  idExamen: string;
  idFormacion: string;
  nota: number;
  aprobado: boolean;
  fechaRealizacion?: FirestoreTimestamp | string | number;
  nombreAlumno?: string;
  nombre?: string;
  apellido?: string;
  tituloExamen?: string;
  tituloFormacion?: string;
}

/** Pregunta en detalle de examen realizado (incluye selección del alumno). */
export interface ExamenRealizadoPreguntaDetalle {
  id: string;
  texto: string;
  puntos?: number;
  puntosObtenidos?: number;
  acertada?: boolean;
  respuestas: ExamenRespuesta[];
  respuestasSeleccionadas?: string[];
  idsRespuestasSeleccionadas?: string[];
}

export interface ExamenRealizadoDetalle extends ExamenRealizado {
  preguntas?: ExamenRealizadoPreguntaDetalle[];
  intentoNumero?: number;
  totalIntentos?: number;
  porcentajeAciertos?: number;
  puntosObtenidos?: number;
}