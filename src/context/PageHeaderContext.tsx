import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TourStep } from "@/hooks/useTour";

export type Breadcrumb = { label: string; to: string };

export type PageHeader = {
  title?: string;
  /** Pasos del tutorial de la página; si se omite no se muestra el ícono de ayuda */
  tourSteps?: TourStep[];
  /** Secciones padre que se muestran antes del título (ej: Exámenes › Editar examen) */
  breadcrumbs?: Breadcrumb[];
};

const PageHeaderContext = createContext<PageHeader>({});
const SetPageHeaderContext = createContext<(header: PageHeader) => void>(() => {});

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeader>({});

  return (
    <SetPageHeaderContext.Provider value={setHeader}>
      <PageHeaderContext.Provider value={header}>{children}</PageHeaderContext.Provider>
    </SetPageHeaderContext.Provider>
  );
}

export function usePageHeaderValue() {
  return useContext(PageHeaderContext);
}

/** Declara el título (y opcionalmente tutorial y breadcrumb) que muestra el menú superior */
export function usePageHeader({ title, tourSteps, breadcrumbs }: PageHeader) {
  const setHeader = useContext(SetPageHeaderContext);
  // Los breadcrumbs suelen llegar como array nuevo en cada render: se comparan por contenido
  const breadcrumbsKey = JSON.stringify(breadcrumbs ?? []);

  useEffect(() => {
    setHeader({ title, tourSteps, breadcrumbs: JSON.parse(breadcrumbsKey) as Breadcrumb[] });
  }, [setHeader, title, tourSteps, breadcrumbsKey]);

  useEffect(() => () => setHeader({}), [setHeader]);
}
