import type { TourStep } from '@/hooks/useTour';

export const dashboardTourSteps: TourStep[] = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Menú de navegación',
      description: 'Desde aquí puedes acceder a todas las secciones del panel: Dashboard, Usuarios, Cursos, Materias y tu Perfil.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: 'Estadísticas',
      description: 'Aquí puedes ver un resumen rápido de los estudiantes y cursos en tu plataforma. Haz clic en las tarjetas para ir a cada sección.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="recent-courses"]',
    popover: {
      title: 'Últimos cursos',
      description: 'Esta sección muestra los cursos más recientes. Puedes hacer clic en cualquier curso para ver sus detalles.',
      side: 'top',
      align: 'start',
    },
  },
];

export const productsTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-filter"]',
    popover: {
      title: 'Búsqueda y filtros',
      description: 'Usa la barra de búsqueda para encontrar cursos por título o descripción. Los filtros te permiten ordenar por estado, precio, fecha, etc.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="create-course"]',
    popover: {
      title: 'Crear nuevo curso',
      description: 'Haz clic aquí para crear un nuevo curso. Podrás agregar información general, materias, módulos y más.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="view-toggle"]',
    popover: {
      title: 'Cambiar vista',
      description: 'Alterna entre vista de tarjetas y vista de lista para ver los cursos de la forma que prefieras.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="courses-list"]',
    popover: {
      title: 'Lista de cursos',
      description: 'Aquí verás todos tus cursos. Puedes hacer clic en cualquier curso para ver sus detalles, editarlo o eliminarlo.',
      side: 'top',
      align: 'start',
    },
  },
];

export const studentsTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-filter"]',
    popover: {
      title: 'Búsqueda y filtros',
      description: 'Busca usuarios por nombre, apellido, email o DNI. Filtra por estado (activo/inactivo) y rol (estudiante/administrador).',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="create-user"]',
    popover: {
      title: 'Crear nuevo usuario',
      description: 'Haz clic aquí para crear un nuevo usuario. Podrás asignar roles y cursos después de crearlo.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="students-list"]',
    popover: {
      title: 'Lista de usuarios',
      description: 'Aquí verás todos los usuarios registrados. Puedes hacer clic en cualquier usuario para ver sus detalles, editarlo o asignarle cursos.',
      side: 'top',
      align: 'start',
    },
  },
];

export const subjectsTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-filter"]',
    popover: {
      title: 'Búsqueda y filtros',
      description: 'Busca materias por nombre y ordénalas según tus preferencias.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="create-course"]',
    popover: {
      title: 'Crear Nueva Materia',
      description: 'Haz clic aquí para crear una nueva materia. Podrás asociarla a cursos y agregar módulos.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="view-toggle"]',
    popover: {
      title: 'Cambiar Vista',
      description: 'Alterna entre vista de tarjetas y vista de lista para ver las materias de la forma que prefieras.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="subjects-list"]',
    popover: {
      title: 'Lista de Materias',
      description: 'Aquí verás todas tus materias. Puedes hacer clic en cualquier materia para editarla, agregar módulos o eliminarla.',
      side: 'top',
      align: 'start',
    },
  },
];

export const profileTourSteps: TourStep[] = [
  {
    element: '[data-tour="profile-info"]',
    popover: {
      title: 'Información Personal',
      description: 'Aquí puedes editar tu nombre, apellido, email y DNI. Recuerda guardar los cambios después de editarlos.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="change-password"]',
    popover: {
      title: 'Cambiar Contraseña',
      description: 'Haz clic aquí para cambiar tu contraseña. Necesitarás ingresar tu contraseña actual y la nueva contraseña.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="save-button"]',
    popover: {
      title: 'Guardar Cambios',
      description: 'Después de editar tu información, haz clic aquí para guardar los cambios.',
      side: 'top',
      align: 'end',
    },
  },
];

