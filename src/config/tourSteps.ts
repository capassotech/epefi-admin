import type { TourStep } from '@/hooks/useTour';

export const dashboardTourSteps: TourStep[] = [
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Menú principal',
      description:
        'Desde acá entrás a todas las partes del sistema: cursos, usuarios, materias y exámenes.',
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
    element: '[data-tour="pending-corrections"]',
    popover: {
      title: 'Para corregir',
      description:
        'Los exámenes con preguntas de desarrollo que esperan tu corrección. Empiezan por los que llevan más tiempo esperando.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="exam-performance"]',
    popover: {
      title: 'Rendimiento',
      description:
        'Cómo les está yendo a los alumnos: porcentaje de aprobación, nota promedio y cuántos exámenes se rindieron en el último mes.',
      side: 'left',
      align: 'start',
    },
  },
];

export const examsTourSteps: TourStep[] = [
  {
    element: '[data-tour="search-filter"]',
    popover: {
      title: 'Buscar exámenes',
      description: 'Buscá un examen por su título. Debajo vas a ver los filtros que tengas aplicados.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="view-completed"]',
    popover: {
      title: 'Exámenes realizados',
      description: 'Acá ves los exámenes que ya rindieron los alumnos y corregís los que tienen preguntas de desarrollo.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="exams-list"]',
    popover: {
      title: 'Lista de exámenes',
      description:
        'Tocá "Título" para ordenar o "Formación" para filtrar. Con los íconos editás, ves los intentos por alumno o eliminás, y con el interruptor habilitás o deshabilitás el examen.',
      side: 'top',
      align: 'start',
    },
  },
];

export const completedExamsTourSteps: TourStep[] = [
  {
    element: '[data-tour="completed-search"]',
    popover: {
      title: 'Buscar alumno',
      description: 'Escribí el nombre de un alumno para ver solo sus exámenes.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="completed-export"]',
    popover: {
      title: 'Exportar',
      description: 'Descargá en CSV o Excel los resultados que estás viendo, con los filtros aplicados.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="completed-list"]',
    popover: {
      title: 'Resultados',
      description:
        'Arriba están los exámenes por corregir y debajo los ya corregidos. Filtrá por formación o examen desde los encabezados y tocá una fila para ver el detalle o corregir.',
      side: 'top',
      align: 'start',
    },
  },
];

export const studentDetailTourSteps: TourStep[] = [
  {
    element: '[data-tour="detail-aside"]',
    popover: {
      title: 'Ficha del alumno',
      description: 'Sus datos, cuántos cursos tiene, cuántos módulos tiene habilitados y su avance general. Desde acá podés editarlo o eliminarlo.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="student-assign"]',
    popover: {
      title: 'Asignar cursos',
      description: 'Agregale o quitale cursos a este alumno.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="student-courses"]',
    popover: {
      title: 'Cursos y módulos',
      description:
        'Desplegá un curso y una materia para ver su avance. Con el interruptor de cada módulo lo habilitás o deshabilitás solo para este alumno, útil cuando paga mes a mes.',
      side: 'left',
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
        'Usá este buscador para encontrar un curso por nombre.',
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
    element: '[data-tour="courses-list"]',
    popover: {
      title: 'Lista de cursos',
      description:
        'Acá están todos los cursos. Tocá los encabezados para ordenar o filtrar, y entrá a uno para editarlo o ver los detalles.',
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
  {
    element: '[data-tour="view-student-details"]',
    popover: {
      title: 'Ver detalles del alumno',
      description:
        'Este botón te lleva a la pantalla de detalles del estudiante, donde podés ver todos sus cursos, materias y módulos asignados. Desde ahí podés habilitar o deshabilitar cada módulo individualmente, lo cual es útil cuando los estudiantes pagan mes a mes y necesitás controlar qué contenido pueden ver según su plan de pago.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="edit-student"]',
    popover: {
      title: 'Editar usuario',
      description:
        'Desde acá podés modificar los datos personales del estudiante: nombre, apellido, email, DNI y otros datos de su perfil.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="assign-courses"]',
    popover: {
      title: 'Asignar cursos',
      description:
        'Este botón te permite asignar o quitar cursos al estudiante. Podés seleccionar múltiples cursos y el sistema los asignará automáticamente.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="toggle-student-status"]',
    popover: {
      title: 'Habilitar/Deshabilitar usuario',
      description:
        'Con este switch podés activar o desactivar el acceso del estudiante al sistema. Si lo deshabilitás, el estudiante no podrá acceder a ningún curso ni contenido hasta que lo vuelvas a habilitar.',
      side: 'left',
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
    element: '[data-tour="subjects-list"]',
    popover: {
      title: 'Lista de materias',
      description:
        'Acá están todas las materias. Tocá los encabezados para ordenar o filtrar, y entrá a una para editarla o agregar contenido.',
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
