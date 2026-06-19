import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarLayoutContextValue = {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
};

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

export function SidebarLayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(256);

  return (
    <SidebarLayoutContext.Provider value={{ sidebarWidth, setSidebarWidth }}>
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext);
  return ctx ?? { sidebarWidth: 0, setSidebarWidth: () => {} };
}
