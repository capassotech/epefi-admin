import type { TourStep } from '@/hooks/useTour';

// Pantallas de detalle y formularios: comparten ficha lateral, contenido y pie de acciones
const asideStep = (title: string, description: string): TourStep => ({
  element: '[data-tour="detail-aside"]',
  popover: { title, description, side: 'right', align: 'start' },
});
const mainStep = (title: string, description: string): TourStep => ({
  element: '[data-tour="detail-main"]',
  popover: { title, description, side: 'left', align: 'start' },
});
const actionsStep = (title: string, description: string): TourStep => ({
  element: '[data-tour="detail-actions"]',
  popover: { title, description, side: 'right', align: 'end' },
});

export const productDetailTourSteps: TourStep[] = [
  asideStep(
    'Ficha del curso',
    'Portada, estado, precio, período de dictado y los documentos del curso (plan de estudios y fechas de exámenes). Tocá la portada para verla grande.'
  ),
  mainStep(
    'Descripción y materias',
    'Desplegá una materia para ver sus módulos. Desde ahí podés editarlos, eliminarlos y decidir si están habilitados por defecto para los alumnos.'
  ),
  actionsStep('Editar curso', 'Cambiá los datos del curso, su portada, fechas, documentos o las materias que lo componen.'),
];

export const subjectDetailTourSteps: TourStep[] = [
  asideStep('Ficha de la materia', 'Su estado, los cursos a los que pertenece y cuántos módulos tiene.'),
  mainStep(
    'Módulos',
    'Creá, editá o eliminá módulos. El interruptor define si cada módulo está habilitado por defecto; si algunos alumnos lo tienen deshabilitado, lo vas a ver indicado.'
  ),
  actionsStep('Editar o eliminar', 'Cambiá el nombre de la materia o eliminala junto con sus módulos.'),
];

export const examAttemptsTourSteps: TourStep[] = [
  asideStep(
    'Intentos para todos',
    'Definí cuántas veces puede rendir este examen cada alumno. Se aplica a todos los que no tengan un límite propio.'
  ),
  mainStep(
    'Intentos por alumno',
    'Mirá cuántos intentos usó cada alumno. Podés darle un máximo distinto a uno en particular y guardarlo, o volverlo al límite general.'
  ),
  actionsStep('Editar examen', 'Volvé a la configuración y las preguntas del examen.'),
];

export const completedExamDetailTourSteps: TourStep[] = [
  asideStep('Resultado', 'El alumno, el examen, la fecha, el intento y el resultado: nota, puntos y porcentaje de aciertos.'),
  mainStep(
    'Preguntas y respuestas',
    'Cada pregunta con la respuesta del alumno y la correcta. En las de desarrollo, asignás el puntaje y podés dejar un comentario.'
  ),
  actionsStep('Guardar corrección', 'Cuando termines de corregir, guardá para calcular la nota final o publicala para que el alumno la vea.'),
];

const courseFormSteps = (isNew: boolean): TourStep[] => [
  asideStep(
    'Vista previa y pasos',
    'Mirá cómo va quedando el curso, habilitalo u ocultalo para los alumnos y movete entre los pasos: información general y materias.'
  ),
  mainStep(
    isNew ? 'Datos del curso' : 'Editar los datos',
    'Completá título, descripción, precio, portada, fechas de dictado y los documentos. En el paso "Materias" asociás o creás las materias del curso.'
  ),
  actionsStep(
    isNew ? 'Crear y continuar' : 'Guardar',
    isNew
      ? 'Primero se crea el curso y después podés agregarle materias. Al terminar, finalizá el curso.'
      : 'Guardá los cambios de cada paso. También podés eliminar el curso desde acá.'
  ),
];
export const createProductTourSteps = courseFormSteps(true);
export const editProductTourSteps = courseFormSteps(false);

export const examFormTourSteps: TourStep[] = [
  {
    element: '[data-tour="exam-config"]',
    popover: {
      title: 'Configuración',
      description: 'Título, curso, duración, nota de aprobación e intentos. También si exige completar el curso y si la nota se publica a mano.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="exam-questions"]',
    popover: {
      title: 'Preguntas',
      description:
        'Elegí el tipo de cada pregunta (opción múltiple o desarrollo), marcá la respuesta correcta con el círculo y asigná puntos. Entre todas deben sumar 100; "Distribuir equitativamente" los reparte por vos.',
      side: 'top',
      align: 'start',
    },
  },
  asideStep('Resumen', 'Cantidad de preguntas, puntos totales (en rojo si no suman 100) y cuántas son de desarrollo.'),
  actionsStep('Guardar', 'Guardá el examen o agregá más preguntas. Si algo falta, te llevamos directo al campo a completar.'),
];

export const studentFormTourSteps: TourStep[] = [
  mainStep(
    'Datos del usuario',
    'Nombre, apellido, DNI y rol. Al crear un usuario también definís su email (con confirmación) y una contraseña inicial que cumpla los requisitos.'
  ),
  actionsStep('Guardar', 'Guardá los cambios. Al crear un usuario se abre su detalle para que le asignes cursos.'),
];

export const subjectFormTourSteps: TourStep[] = [
  mainStep('Nombre de la materia', 'Las materias se asocian a los cursos desde la edición de cada curso.'),
  actionsStep('Guardar', 'Al crear la materia se abre su detalle para que le agregues módulos.'),
];

export const moduleFormTourSteps: TourStep[] = [
  mainStep(
    'Contenido del módulo',
    'Título, descripción, bibliografía, documentos y videos. Podés ponerle nombre a cada archivo y reordenarlos arrastrándolos.'
  ),
  actionsStep('Guardar', 'Los archivos se suben al guardar; esperá a que termine antes de salir.'),
];

export const createModuleTourSteps: TourStep[] = [
  asideStep('Materia', 'La materia a la que le estás cargando módulos y cuántos tiene.'),
  mainStep('Módulos', 'Los módulos de la materia: editalos, eliminalos o elegí si están habilitados por defecto.'),
  actionsStep('Acciones', 'Creá un módulo nuevo. Si la materia es nueva, finalizá para guardarla con sus módulos.'),
];

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
        'Tocá "Título" para ordenar o "Curso" para filtrar. Con los íconos editás, ves los intentos por alumno o eliminás, y con el interruptor habilitás o deshabilitás el examen.',
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
        'Arriba están los exámenes por corregir y debajo los ya corregidos. Filtrá por curso o examen desde los encabezados y tocá una fila para ver el detalle o corregir.',
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
