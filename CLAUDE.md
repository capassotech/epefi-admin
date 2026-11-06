# epefi-admin (panel de administración)

React 19 + Vite + TS, react-router v7, Tailwind v4, shadcn/Radix, sonner, lucide-react.

Las reglas generales de UI están en `../CLAUDE.md`.

## Comandos

- Verificar con `npx tsc -b` y `npx eslint <archivos>`.
- Hay errores de lint viejos (`any`, un `useWatch` condicional, `_id`/`_moduleIds` sin usar). No arreglarlos salvo que se pida.

## Componentes comunes
- `DetailLayout`, `ProfileCard`, `SectionCard` (en `src/components/common/DetailLayout.tsx`; el título es opcional y sin título ni acción no se muestra el header).
- `SortableHeader`, con la prop `trailing` para el `FilterMenuButton`.
- `MobileListControls`, `IconAction`.
- `SearchableSelect` (`src/components/common/SearchableSelect.tsx`, Popover + cmdk) para los selects con buscador.
- En mobile, las listas se ven como filas compactas con acciones con ícono, por ejemplo `StudentsList`: checkbox, ícono de rol, nombre, "email · N cursos" y las acciones.

## Tema oscuro
- El botón está abajo en el menú lateral (`src/components/admin/Sidebar.tsx`). Estado en `src/context/ThemeContext.tsx`; por defecto, claro.
- No se usan variantes `dark:`: las clases fijas (`bg-white`, `text-gray-*`, `bg-red-50`...) funcionan porque `src/index.css` reasigna la paleta de Tailwind bajo `.dark`.
- Al usar un color o tono que todavía no esté reasignado, agregarlo ahí. Lo mismo para un fondo fuerte nuevo con texto blanco (`bg-*-600/700`), que se restaura en ese mismo bloque.
- Para mostrar el logo usar `BrandLogo` (`src/components/common/BrandLogo.tsx`).

## Crear examen — `src/pages/CreateExam.tsx`
- La configuración y las preguntas van en secciones separadas, una card por pregunta. La pregunta nueva se resalta.
- No se puede agregar una pregunta si alguna anterior está incompleta: sale un toast de error (`getQuestionContentError`).
- Los settings tienen un tooltip `?` en el título (`SettingTitle`). No hay hints debajo de los campos.
- El curso se elige con `SearchableSelect`.

## Exámenes realizados — `src/pages/CompletedExams.tsx`
- Se ordena por alumno, curso, examen, nota y fecha (`sortBy`/`sortDirection` en `src/service/completedExams.ts` y en el backend).
- Filtros en los headers. En mobile, los controles de orden van en `MobileListControls`.
- Búsqueda por alumno, curso o examen.

## Materias dentro de un curso — `src/components/product/SubjectCreation.tsx`
- Para agregar una existente: `SearchableSelect` + "Agregar". Usa `getAllMateriasList()` (`src/service/courses.ts`) porque el endpoint es paginado.
- Las altas y bajas quedan **pendientes** (caja "Cambios sin guardar" con la opción "Descartar"). Se aplican recién con "Guardar cambios".
  - `SubjectCreationHandle { hasPendingChanges, savePendingChanges }` se expone por la prop `handleRef`.
  - `EditProduct` y `CreateProduct` siempre montan el componente (oculto en la otra pestaña) y llaman `savePendingChanges()` antes de guardar o finalizar.
  - Si hay cambios pendientes, se avisa con `beforeunload`.
- Desasignar pide confirmación. Con `showUnassign` no se muestra el ícono de ojo.
- Editar una materia confirma, guarda lo pendiente y navega a `/subjects/:id` con el estado `fromCourse`.
  - `src/utils/fromCourse.ts` (`readFromCourse`, `fromCourseState`, `courseBreadcrumbs`) arma el breadcrumb y el regreso a `?tab=materias`.
  - Lo usan SubjectDetail, SubjectForm y ModuleForm.
- El `onSubmit` de EditProduct conserva las materias actuales del curso. `?tab=materias` abre directamente el paso de materias.
- `SubjectModal` usa el estilo compacto: header chico, FormField/Input y footer gris.

## Ideas ofrecidas, no implementadas
- Que crear una materia nueva desde un curso también espere a "Guardar cambios".
