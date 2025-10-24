import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMenuButtonProps {
  onClick: () => void;
  className?: string;
}

export function MobileMenuButton({ onClick, className }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors",
        className
      )}
      aria-label="Abrir menú"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
