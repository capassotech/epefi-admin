import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenuButton } from "./MobileMenuButton";

interface AdminTopbarProps {
  onOpenMobileMenu: () => void;
}

export function AdminTopbar({ onOpenMobileMenu }: AdminTopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const userFullName = user ? `${user.nombre} ${user.apellido}` : "Cargando...";
  const initials = user
    ? `${user.nombre?.[0] ?? ""}${user.apellido?.[0] ?? ""}`.toUpperCase()
    : "";
  const isProfileActive = location.pathname === "/profile";

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 flex items-center justify-between gap-4 px-4 lg:px-8 bg-gray-50/80 backdrop-blur-md border-b border-gray-200/70">
      <div className="flex items-center gap-2 min-w-0">
        {isMobile && (
          <>
            <MobileMenuButton onClick={onOpenMobileMenu} className="lg:flex -ml-2 p-1.5 text-gray-500" />
            <img src="/logoNegro.png" alt="EPEFI" className="h-5 w-auto opacity-80" />
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Link
          to="/profile"
          className={cn(
            "group flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-sm transition-colors",
            isProfileActive ? "bg-gray-200/70" : "hover:bg-gray-200/50"
          )}
          aria-label="Ir a mi perfil"
        >
          <span className="grid place-items-center w-7 h-7 rounded-full bg-[#7a1a3a]/10 text-[#7a1a3a] text-[11px] font-semibold">
            {initials}
          </span>
          <span className="hidden sm:block max-w-[180px] truncate text-gray-600 group-hover:text-gray-900 transition-colors">
            {userFullName}
          </span>
        </Link>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Cerrar sesión</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
