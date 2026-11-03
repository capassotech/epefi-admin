import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IconActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto del tooltip y del aria-label */
  label: string;
  children: ReactNode;
}

/**
 * Botón compacto de solo ícono con tooltip.
 * Reenvía props y ref, así funciona como hijo de un `DialogTrigger asChild`.
 * Requiere un `TooltipProvider` arriba en el árbol.
 */
export const IconAction = forwardRef<HTMLButtonElement, IconActionProps>(
  ({ label, children, className, disabled, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        disabled={disabled}
        className={cn(
          "grid place-items-center w-8 h-8 rounded-md text-gray-500 transition-colors cursor-pointer",
          "hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          "disabled:opacity-40 disabled:pointer-events-none",
          "[&_svg]:w-4 [&_svg]:h-4",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Un botón deshabilitado no recibe eventos: el span permite mostrar igual el tooltip */}
          {disabled ? <span tabIndex={0} className="inline-flex">{button}</span> : button}
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
);
IconAction.displayName = "IconAction";
