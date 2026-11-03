import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Campo de formulario compacto: etiqueta chica con ícono, control y error debajo */
export function FormField({
  id,
  label,
  icon,
  error,
  required = true,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  icon?: ReactNode;
  error?: string;
  required?: boolean;
  /** Texto de ayuda gris debajo del control (se oculta si hay error) */
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-gray-400"
      >
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="whitespace-pre-line text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}
