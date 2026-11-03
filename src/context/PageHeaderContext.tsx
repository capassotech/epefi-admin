import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TourStep } from "@/hooks/useTour";

export type PageHeader = {
  title?: string;
  /** Pasos del tutorial de la página; si se omite no se muestra el ícono de ayuda */
  tourSteps?: TourStep[];
  /** Ruta a la que vuelve la flecha del topbar, o -1 para volver en el historial */
  backTo?: string | -1;
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

/** Declara el título (y opcionalmente tutorial y "volver") que muestra el menú superior */
export function usePageHeader({ title, tourSteps, backTo }: PageHeader) {
  const setHeader = useContext(SetPageHeaderContext);

  useEffect(() => {
    setHeader({ title, tourSteps, backTo });
  }, [setHeader, title, tourSteps, backTo]);

  useEffect(() => () => setHeader({}), [setHeader]);
}
