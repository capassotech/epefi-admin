import type { TourStep } from '@/hooks/useTour';

export const dashboardTourSteps: TourStep[] = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Menú principal',
      description:
        'Desde acá entrás a todas las partes del sistema: cursos, usuarios, materias y tu perfil.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: 'Resumen general',
      description:
        'Acá ves un resumen rápido de lo más importante. Si tocás una tarjeta, vas directo a esa sección.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="recent-courses"]',
    popover: {
      title: 'Cursos recientes',
      description:
        'Estos son los últimos cursos creados. Tocá uno para ver la información.',
      side: 'top',
      align: 'start',
    },
  },
];

export const productsTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-filter"]',
    popover: {
      title: 'Buscar cursos',
      description:
        'Usá este buscador para encontrar un curso por nombre. También podés ordenar la lista.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="create-course"]',
    popover: {
      title: 'Nuevo curso',
      description:
        'Desde acá creás un curso nuevo y cargás toda la información.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="view-toggle"]',
    popover: {
      title: 'Cómo se muestran',
      description:
        'Podés cambiar cómo se ven los cursos: en tarjetas o en lista.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="courses-list"]',
    popover: {
      title: 'Lista de cursos',
      description:
        'Acá están todos los cursos. Entrá a uno para editarlo o ver los detalles.',
      side: 'top',
      align: 'start',
    },
  },
];

export const studentsTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-filter"]',
    popover: {
      title: 'Buscar usuarios',
      description:
        'Buscá personas por nombre, apellido o email.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="create-user"]',
    popover: {
      title: 'Nuevo usuario',
      description:
        'Desde acá podés crear un usuario nuevo en el sistema.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="students-list"]',
    popover: {
      title: 'Lista de usuarios',
      description:
        'Acá ves todas las personas cargadas. Entrá a una para ver o cambiar sus datos.',
      side: 'top',
      align: 'start',
    },
  },
];

export const subjectsTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-filter"]',
    popover: {
      title: 'Buscar materias',
      description:
        'Usá el buscador para encontrar una materia.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="create-course"]',
    popover: {
      title: 'Nueva materia',
      description:
        'Desde acá podés crear una materia nueva.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="view-toggle"]',
    popover: {
      title: 'Forma de verlas',
      description:
        'Elegí si querés ver las materias en tarjetas o en lista.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="subjects-list"]',
    popover: {
      title: 'Lista de materias',
      description:
        'Acá están todas las materias. Entrá a una para editarla o agregar contenido.',
      side: 'top',
      align: 'start',
    },
  },
];

export const profileTourSteps: TourStep[] = [
  {
    element: '[data-tour="profile-info"]',
    popover: {
      title: 'Tus datos',
      description:
        'Acá podés cambiar tus datos personales.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="change-password"]',
    popover: {
      title: 'Contraseña',
      description:
        'Desde acá podés cambiar tu contraseña.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="save-button"]',
    popover: {
      title: 'Guardar',
      description:
        'Cuando termines, tocá acá para guardar los cambios.',
      side: 'top',
      align: 'end',
    },
  },
];
