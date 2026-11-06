import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

// La misma clave se lee en index.html para aplicar el tema antes del primer pintado
const STORAGE_KEY = "epefi-admin-theme";

const readStoredTheme = (): Theme => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin acceso al storage el tema vale solo para esta sesión
    }
    setTheme(next);
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return context;
}
