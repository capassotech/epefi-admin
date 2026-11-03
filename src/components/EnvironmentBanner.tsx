import { AlertTriangle } from "lucide-react";

/**
 * "strip": franja fina arriba de la página (login, recuperar contraseña).
 * "pill": etiqueta chica dentro de la barra superior del panel, donde el sidebar fijo impide usar la franja.
 */
const EnvironmentBanner = ({ variant = "strip" }: { variant?: "strip" | "pill" }) => {
  // Detectar si estamos en QA
  const isQA = import.meta.env.VITE_FIREBASE_PROJECT_ID === "epefi-admin-qa";

  // No mostrar si es producción
  if (!isQA) {
    return null;
  }

  if (variant === "pill") {
    return (
      <span
        role="status"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800"
        title="Estás en el entorno de pruebas: los cambios no afectan a producción"
      >
        <AlertTriangle className="w-3 h-3" />
        <span className="hidden sm:inline">ENTORNO DE PRUEBAS</span>
        <span className="sm:hidden">PRUEBAS</span>
      </span>
    );
  }

  // Franja fina dentro del flujo (no flotante): empuja el contenido en lugar de taparlo
  return (
    <div
      role="status"
      className="flex h-6 w-full items-center justify-center gap-1.5 bg-amber-400 text-[11px] font-semibold tracking-wide text-amber-950"
    >
      <AlertTriangle className="w-3 h-3" />
      <span>ENTORNO PARA PRUEBAS</span>
    </div>
  );
};

export default EnvironmentBanner;
