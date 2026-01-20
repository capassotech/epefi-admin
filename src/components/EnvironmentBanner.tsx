import { AlertTriangle } from "lucide-react";

const EnvironmentBanner = () => {
  // Detectar si estamos en QA
  const isQA = import.meta.env.VITE_FIREBASE_PROJECT_ID === "epefi-admin-qa";

  // No mostrar si es producción
  if (!isQA) {
    return null;
  }

  return (
    <div className="fixed top-2 right-2 z-50 bg-yellow-500 text-black px-3 py-1.5 rounded-md font-bold text-xs shadow-lg">
      <div className="flex items-center justify-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        <span>ENTORNO PARA PRUEBAS</span>
      </div>
    </div>
  );
};

export default EnvironmentBanner;

