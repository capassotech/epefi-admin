import type {
  Student,
  DashboardStats,
  CourseProgress,
  ContentStats,
  Course,
  Module,
  Degree,
} from "@/types/types";

// Mock data para módulos
export const mockModules: Module[] = [
  {
    id: "modulo-1",
    titulo: "Introducción a la Moldería",
    descripcion: "Conceptos básicos de moldería y herramientas fundamentales",
    id_materia: "materia-molderia-basica",
    tipo_contenido: "video",
    bibliografia: "Manual de Moldería Básica - Capítulo 1",
    url_miniatura: "https://http2.mlstatic.com/D_NQ_NP_766761-MLA82625997088_032025-O.webp",
    url_contenido: "https://www.youtube.com/embed/k6GFz1kw1bY?si=lEf81Qfu7UpPEP58"
  },
  {
    id: "modulo-2",
    titulo: "Patronaje Base",
    descripcion: "Creación de patrones base para cuerpo y manga",
    id_materia: "materia-patronaje",
    tipo_contenido: "video",
    bibliografia: "Técnicas de Patronaje - Capítulo 3",
    url_miniatura: "https://patterncos.com/wp-content/uploads/2018/06/Manga_sastre_Tutorial_01-1024x683.png",
    url_contenido: "https://www.youtube.com/embed/mvCttGLNwE0?si=TWYd9d3vjGH9Jx9d"
  },
  {
    id: "modulo-3",
    titulo: "Moldería Específica de Campera",
    descripcion: "Técnicas específicas para camperas tipo parka",
    id_materia: "materia-molderia-especifica",
    tipo_contenido: "video",
    bibliografia: "Confección de Prendas Exteriores - Capítulo 5",
    url_miniatura: "https://i.pinimg.com/564x/47/92/49/47924957309ea96cee07ea9f525bad67.jpg",
    url_contenido: "https://www.youtube.com/embed/ZYuizK01p-U?si=Wb3V1qokJReRB7fU"
  },
  {
    id: "modulo-4",
    titulo: "Armado y Confección",
    descripcion: "Proceso completo de armado de la prenda",
    id_materia: "materia-confeccion",
    tipo_contenido: "video",
    bibliografia: "Técnicas de Confección Avanzada",
    url_miniatura: "https://www.localesbambaci.com.ar/cdn/shop/files/11MRUB2213-SUNDAYPARKA-NEGRO_2x_905f8935-47b3-44c6-b973-b9ef7f099690_480x480.webp?v=1684275467",
    url_contenido: "https://www.youtube.com/embed/f7MpCD_BXH8?si=U38KnMb_-vtyjQRQ"
  },
  {
    id: "modulo-5",
    titulo: "Fundamentos de Emprendimiento",
    descripcion: "Conceptos básicos para iniciar un negocio",
    id_materia: "materia-emprendimiento",
    tipo_contenido: "video",
    bibliografia: "Guía del Emprendedor - Capítulo 1",
    url_miniatura: "https://i.ytimg.com/vi/xrv2K3p6sfM/maxresdefault.jpg",
    url_contenido: "https://www.youtube.com/embed/video-negocio-1"
  },
  {
    id: "modulo-6",
    titulo: "Marketing Digital Básico",
    descripcion: "Estrategias fundamentales de marketing digital",
    id_materia: "materia-marketing",
    tipo_contenido: "video",
    bibliografia: "Marketing Digital para Empresas",
    url_miniatura: "https://www.aticma.org.ar/wp-content/uploads/2021/04/Portadas-de-WordPres-3-1024x614.png",
    url_contenido: "https://www.youtube.com/embed/video-marketing-1"
  },
  {
    id: "modulo-7",
    titulo: "Gestión Financiera Básica",
    descripcion: "Fundamentos de gestión financiera empresarial",
    id_materia: "materia-finanzas",
    tipo_contenido: "video",
    bibliografia: "Manual de Finanzas para Empresas",
    url_miniatura: "https://ag-utn.com.ar/wp-content/uploads/2024/09/Campana-UTN-2_14C-scaled.jpg",
    url_contenido: "https://www.youtube.com/embed/video-finanzas-1"
  }
];

// Mock data para cursos
export const mockCourses: Course[] = [
  {
    id: "curso-1",
    titulo: "Moldería y Confección de Campera Tipo Parka",
    descripcion: "Curso completo de moldería base y específica. Paso a paso de corte y armado. Asistencia personalizada. Teoría y práctica en PDF y videos. Certificado de asistencia.",
    image: "/ejemplo-curso.png",
    estado: "activo",
    materias: ["materia-molderia-basica", "materia-patronaje", "materia-molderia-especifica", "materia-confeccion"],
    precio: 189000
  },
  {
    id: "curso-2", 
    titulo: "Cómo Iniciar tu Propio Negocio desde Cero",
    descripcion: "Descubre paso a paso cómo validar tu idea de negocio, crear un MVP, buscar financiamiento y lanzar tu producto al mercado.",
    image: "https://i.ytimg.com/vi/xrv2K3p6sfM/maxresdefault.jpg",
    estado: "activo",
    materias: ["materia-emprendimiento"],
    precio: 59000
  },
  {
    id: "curso-3",
    titulo: "Marketing Digital Estratégico", 
    descripcion: "Estrategias avanzadas de marketing digital y growth hacking para hacer crecer tu negocio.",
    image: "https://www.aticma.org.ar/wp-content/uploads/2021/04/Portadas-de-WordPres-3-1024x614.png",
    estado: "activo",
    materias: ["materia-marketing"],
    precio: 45000
  },
  {
    id: "curso-4",
    titulo: "Gestión Financiera para Pequeñas Empresas",
    descripcion: "Aprende a controlar las finanzas de tu empresa, hacer proyecciones realistas y optimizar costos para crecer de forma sostenible.",
    image: "https://ag-utn.com.ar/wp-content/uploads/2024/09/Campana-UTN-2_14C-scaled.jpg",
    estado: "activo",
    materias: ["materia-finanzas"],
    precio: 35000
  }
];

// Mock data para grados/titulaciones
export const mockDegrees: Degree[] = [
  {
    id: "grado-1",
    id_curso: "curso-1", 
    modulos: ["modulo-1", "modulo-2", "modulo-3", "modulo-4"],
    nombre: "Especialización en Moldería y Confección"
  },
  {
    id: "grado-2",
    id_curso: "curso-2",
    modulos: ["modulo-5"],
    nombre: "Certificación en Emprendimiento Digital"
  },
  {
    id: "grado-3", 
    id_curso: "curso-3",
    modulos: ["modulo-6"],
    nombre: "Certificación en Marketing Digital"
  },
  {
    id: "grado-4",
    id_curso: "curso-4", 
    modulos: ["modulo-7"],
    nombre: "Certificación en Gestión Financiera"
  }
];

// Alias para compatibilidad
export const mockProducts: Course[] = mockCourses;

// Mock data para estudiantes (actualizado con nueva estructura)
export const mockStudents: Student[] = [
  {
    id: "1",
    name: "María",
    email: "maria.gonzalez@email.com",
    apellido: "González",
    fechaActualizacion: "2024-05-30T00:00:00Z",
    fechaRegistro: "2024-03-01T00:00:00Z",
    activo: true,
    role: [
      { admin: false },
      { student: true }
    ]
  },
  {
    id: "2",
    name: "Roberto",
    email: "roberto.silva@email.com", 
    apellido: "Silva",
    fechaActualizacion: "2024-05-25T00:00:00Z",
    fechaRegistro: "2024-04-20T00:00:00Z",
    activo: true,
    role: [
      { admin: false },
      { student: true }
    ]
  },
  {
    id: "3",
    name: "Ana",
    email: "ana.martinez@email.com",
    apellido: "Martínez",
    fechaActualizacion: "2024-05-28T00:00:00Z", 
    fechaRegistro: "2024-02-15T00:00:00Z",
    activo: true,
    role: [
      { admin: false },
      { student: true }
    ]
  }
];

// Mock data para progreso de cursos
export const mockCourseProgress: CourseProgress[] = [
  {
    courseId: "curso-1",
    studentId: "1",
    completedModules: ["modulo-1"],
    completedContents: ["modulo-1"],
    totalProgress: 25,
    lastAccessedContent: "modulo-2",
    lastAccessedDate: "2024-05-30T00:00:00Z",
  },
];

// Mock data para estadísticas de contenido
export const mockContentStats: ContentStats[] = [
  {
    contentId: "modulo-1",
    viewCount: 45,
    completionRate: 89,
    averageTimeSpent: 18,
    lastViewed: "2024-05-30T00:00:00Z",
  },
];

// Mock data para estadísticas del dashboard
export const mockDashboardStats: DashboardStats = {
  totalStudents: mockStudents.length,
  totalUsers: mockStudents.length,
  totalProducts: mockCourses.length,
  totalRevenue: mockCourses.reduce((sum, c) => sum + c.precio, 0),
  activeUsers: mockStudents.filter((s) => s.activo).length,
  popularProducts: mockCourses.slice(0, 3),
};