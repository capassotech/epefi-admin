import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePageHeaderValue } from "@/context/PageHeaderContext";
import { TourButton } from "@/components/tour/TourButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenuButton } from "./MobileMenuButton";
import EnvironmentBanner from "@/components/EnvironmentBanner";
import { BrandLogo } from "@/components/common/BrandLogo";

interface AdminTopbarProps {
  onOpenMobileMenu: () => void;
}

export function AdminTopbar({ onOpenMobileMenu }: AdminTopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { title, tourSteps, breadcrumbs } = usePageHeaderValue();
  const crumbs = breadcrumbs ?? [];

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
      <div className="flex items-center gap-1.5 min-w-0">
        {isMobile && (
          <MobileMenuButton onClick={onOpenMobileMenu} className="lg:flex -ml-2 mr-1 p-1.5 text-gray-500" />
        )}

        {title ? (
          <nav aria-label="Ruta de navegación" className="min-w-0">
            <ol className="flex items-center gap-1.5 min-w-0 text-sm">
              {crumbs.map((crumb, index) => (
                <li
                  key={`${crumb.to}-${index}`}
                  // En mobile solo se muestra la sección inmediatamente anterior
                  className={cn(
                    "items-center gap-1.5 min-w-0 shrink",
                    index === crumbs.length - 1 ? "flex" : "hidden sm:flex"
                  )}
                >
                  <Link
                    to={crumb.to}
                    className="max-w-[180px] truncate text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-300" aria-hidden="true" />
                </li>
              ))}
              <li className="min-w-0">
                <h1 className="font-medium text-gray-700 truncate" aria-current="page">
                  {title}
                </h1>
              </li>
            </ol>
          </nav>
        ) : (
          isMobile && <BrandLogo className="h-5 w-auto opacity-80" />
        )}

        {tourSteps && <TourButton steps={tourSteps} className="shrink-0" />}
      </div>

      <div className="flex items-center gap-1">
        <EnvironmentBanner variant="pill" />
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
